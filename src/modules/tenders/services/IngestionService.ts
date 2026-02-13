import { supabaseServer } from '@/lib/db/supabaseServer';
import type { IConnector } from '../connectors/IConnector';
import type { NormalizedTender, IngestionState } from '../domain/types';

export interface IngestionResult {
  inserted: number;
  updated: number;
  errors: number;
  newState: IngestionState;
}

/**
 * Serviço de ingestão de licitações
 * Coordena a descoberta, normalização e persistência de dados de conectores
 */
export class IngestionService {
  /**
   * Executa ingestão completa de uma fonte
   */
  async ingest(connector: IConnector): Promise<IngestionResult> {
    // Buscar estado atual
    const currentState = await this.getIngestionState(connector.name);

    // Descobrir novos registros
    const rawPayloads = await connector.discover(currentState);

    if (rawPayloads.length === 0) {
      console.log(`[Ingestion] Nenhum registro encontrado para ${connector.name}`);
      return {
        inserted: 0,
        updated: 0,
        errors: 0,
        newState: currentState || {
          source: connector.name,
          cursor: undefined,
          lastRun: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    }

    console.log(`[Ingestion] Processando ${rawPayloads.length} registros de ${connector.name}`);

    let inserted = 0;
    let updated = 0;
    let errors = 0;

    // Processar cada registro
    for (const raw of rawPayloads) {
      try {
        const normalized = connector.normalize(raw);
        const result = await this.upsertTender(normalized);
        if (result.inserted) inserted++;
        if (result.updated) updated++;
      } catch (error) {
        console.error(`[Ingestion] Erro ao processar registro ${raw.sourceId}:`, error);
        errors++;
      }
    }

    // Atualizar estado de ingestão
    const newState = connector.nextCursor(currentState, rawPayloads);
    await this.updateIngestionState(newState);

    console.log(
      `[Ingestion] Concluído: ${inserted} inseridos, ${updated} atualizados, ${errors} erros`
    );

    return {
      inserted,
      updated,
      errors,
      newState,
    };
  }

  /**
   * Busca estado de ingestão atual
   */
  private async getIngestionState(source: string): Promise<IngestionState | undefined> {
    const { data, error } = await supabaseServer
      .from('ingestion_state' as never)
      .select('*')
      .eq('source', source)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, que é OK
      throw error;
    }

    const row = data as { source: string; cursor: string | null; last_run: string | null; updated_at: string } | null;
    if (!row) return undefined;

    return {
      source: row.source,
      cursor: row.cursor || undefined,
      lastRun: row.last_run || undefined,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Atualiza estado de ingestão
   */
  private async updateIngestionState(state: IngestionState): Promise<void> {
    const { error } = await supabaseServer
      .from('ingestion_state' as never)
      .upsert(
        {
          source: state.source,
          cursor: state.cursor || null,
          last_run: state.lastRun || null,
          updated_at: state.updatedAt,
        } as never,
        { onConflict: 'source' }
      );

    if (error) throw error;
  }

  /**
   * Faz UPSERT de uma licitação normalizada
   * Estratégia: ao reprocessar, remove items/docs/updates antigos e reinsere
   */
  private async upsertTender(normalized: NormalizedTender): Promise<{ inserted: boolean; updated: boolean }> {
    const { tender, items, docs, updates } = normalized;

    // Verificar se já existe (cast: tabela tenders fora do tipo gerado do Supabase)
    const { data } = await supabaseServer
      .from('tenders' as never)
      .select('id')
      .eq('source', tender.source)
      .eq('source_id', tender.sourceId)
      .single();

    const existing = data as { id: string } | null;
    const isUpdate = existing != null;
    const tenderId = existing !== null ? existing.id : undefined;

    // UPSERT do tender principal
    const tenderData: {
      source: string;
      source_id: string;
      source_url: string | null;
      orgao: string | null;
      unidade: string | null;
      uf: string | null;
      municipio: string | null;
      modalidade: string | null;
      numero: string | null;
      ano: number | null;
      objeto: string;
      status: string | null;
      data_publicacao: string | null;
      data_abertura: string | null;
      valor_estimado: number | null;
      raw_payload: Record<string, unknown> | null;
    } = {
      source: tender.source,
      source_id: tender.sourceId,
      source_url: tender.sourceUrl || null,
      orgao: tender.orgao || null,
      unidade: tender.unidade || null,
      uf: tender.uf || null,
      municipio: tender.municipio || null,
      modalidade: tender.modalidade || null,
      numero: tender.numero || null,
      ano: tender.ano || null,
      objeto: tender.objeto,
      status: tender.status || null,
      data_publicacao: tender.dataPublicacao || null,
      data_abertura: tender.dataAbertura || null,
      valor_estimado: tender.valorEstimado || null,
      raw_payload: tender.rawPayload || null,
    };

    let finalTenderId: string;

    if (isUpdate && tenderId) {
      // Atualizar
      const { data, error } = await supabaseServer
        .from('tenders' as never)
        .update(tenderData as never)
        .eq('id', tenderId)
        .select('id')
        .single();

      if (error) throw error;
      const updated = data as { id: string } | null;
      if (!updated) throw new Error('Tender update returned no data');
      finalTenderId = updated.id;

      // Remover relacionamentos antigos
      await Promise.all([
        supabaseServer.from('tender_items' as never).delete().eq('tender_id', finalTenderId),
        supabaseServer.from('tender_docs' as never).delete().eq('tender_id', finalTenderId),
        supabaseServer.from('tender_updates' as never).delete().eq('tender_id', finalTenderId),
      ]);
    } else {
      // Inserir
      const { data, error } = await supabaseServer
        .from('tenders' as never)
        .insert(tenderData as never)
        .select('id')
        .single();

      if (error) throw error;
      const inserted = data as { id: string } | null;
      if (!inserted) throw new Error('Tender insert returned no data');
      finalTenderId = inserted.id;
    }

    // Inserir items
    if (items.length > 0) {
      const { error } = await supabaseServer.from('tender_items' as never).insert(
        items.map((item) => ({
          tender_id: finalTenderId,
          item_num: item.itemNum || null,
          descricao: item.descricao,
          unidade: item.unidade || null,
          quantidade: item.quantidade || null,
          valor_unitario: item.valorUnitario || null,
          valor_total: item.valorTotal || null,
        })) as never
      );
      if (error) throw error;
    }

    // Inserir docs
    if (docs.length > 0) {
      const { error } = await supabaseServer.from('tender_docs' as never).insert(
        docs.map((doc) => ({
          tender_id: finalTenderId,
          doc_type: doc.docType || null,
          title: doc.title || null,
          url: doc.url,
          file_hash: doc.fileHash || null,
        })) as never
      );
      if (error) throw error;
    }

    // Inserir updates
    if (updates.length > 0) {
      const { error } = await supabaseServer.from('tender_updates' as never).insert(
        updates.map((update) => ({
          tender_id: finalTenderId,
          event_type: update.eventType,
          event_date: update.eventDate || null,
          payload: update.payload || null,
        })) as never
      );
      if (error) throw error;
    }

    return {
      inserted: !isUpdate,
      updated: isUpdate,
    };
  }
}

export const ingestionService = new IngestionService();
