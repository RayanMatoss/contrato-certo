import { supabaseServer } from '@/lib/db/supabaseServer';
import type {
  Tender,
  TenderWithRelations,
  TenderSearchResult,
  TenderSearchParams,
  TenderItem,
  TenderDoc,
  TenderUpdate,
} from '../domain/types';

/** Linha do DB para tender (snake_case) */
interface TenderDbRow {
  id: string;
  source: string;
  source_id: string;
  source_url?: string | null;
  orgao?: string | null;
  unidade?: string | null;
  uf?: string | null;
  municipio?: string | null;
  modalidade?: string | null;
  numero?: string | null;
  ano?: number | null;
  objeto: string;
  status?: string | null;
  data_publicacao?: string | null;
  data_abertura?: string | null;
  valor_estimado?: number | string | null;
  raw_payload?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/** Linha do DB para tender_item */
interface TenderItemDbRow {
  id: string;
  tender_id: string;
  item_num?: number | null;
  descricao: string;
  unidade?: string | null;
  quantidade?: number | string | null;
  valor_unitario?: number | string | null;
  valor_total?: number | string | null;
  created_at: string;
}

/** Linha do DB para tender_doc */
interface TenderDocDbRow {
  id: string;
  tender_id: string;
  doc_type?: string | null;
  title?: string | null;
  url: string;
  file_hash?: string | null;
  created_at: string;
}

/** Linha do DB para tender_update */
interface TenderUpdateDbRow {
  id: string;
  tender_id: string;
  event_type: string;
  event_date?: string | null;
  payload?: Record<string, unknown> | null;
  created_at: string;
}

export class TenderRepository {
  /**
   * Busca licitações usando a função RPC search_tenders ou fallback para query SQL
   */
  async searchTenders(params: TenderSearchParams): Promise<TenderSearchResult> {
    const {
      q,
      uf,
      municipio,
      modalidade,
      status,
      dateFrom,
      dateTo,
      minVal,
      maxVal,
      page = 1,
      pageSize = 20,
    } = params;

    const offset = (page - 1) * pageSize;

    try {
      // Tentar usar a função RPC primeiro (cast: search_tenders existe na migration, tipos podem não estar regenerados)
      const rpcParams = {
        q: q || null,
        p_uf: uf || null,
        p_municipio: municipio || null,
        p_modalidade: modalidade || null,
        p_status: status || null,
        p_date_from: dateFrom || null,
        p_date_to: dateTo || null,
        p_min_val: minVal || null,
        p_max_val: maxVal || null,
        p_limit: pageSize,
        p_offset: offset,
      };
      const { data: rpcData, error: rpcError } = await (supabaseServer.rpc as (name: string, params: Record<string, unknown>) => ReturnType<typeof supabaseServer.rpc>)(
        'search_tenders',
        rpcParams
      );

      if (!rpcError && rpcData) {
        // Buscar total usando count_tenders (cast: ver comentário acima)
        const countParams = {
          q: q || null,
          p_uf: uf || null,
          p_municipio: municipio || null,
          p_modalidade: modalidade || null,
          p_status: status || null,
          p_date_from: dateFrom || null,
          p_date_to: dateTo || null,
          p_min_val: minVal || null,
          p_max_val: maxVal || null,
        };
        const { data: totalData } = await (supabaseServer.rpc as (name: string, params: Record<string, unknown>) => ReturnType<typeof supabaseServer.rpc>)(
          'count_tenders',
          countParams
        );

        const tenders = this.mapRpcResultsToTenders(rpcData);
        return {
          data: tenders,
          total: totalData || undefined,
          page,
          pageSize,
        };
      }

      // Fallback: query SQL direta
      return this.searchTendersFallback(params);
    } catch (error) {
      console.error('Error in searchTenders RPC:', error);
      return this.searchTendersFallback(params);
    }
  }

  /**
   * Fallback: busca usando query SQL direta quando RPC não está disponível
   */
  private async searchTendersFallback(
    params: TenderSearchParams
  ): Promise<TenderSearchResult> {
    const {
      q,
      uf,
      municipio,
      modalidade,
      status,
      dateFrom,
      dateTo,
      minVal,
      maxVal,
      page = 1,
      pageSize = 20,
    } = params;

    const offset = (page - 1) * pageSize;

    let query = supabaseServer
      .from('tenders' as never)
      .select('*', { count: 'exact' });

    // Busca full-text
    if (q && q.trim()) {
      // Usar websearch_to_tsquery via RPC ou filtro simples
      query = query.or(
        `objeto.ilike.%${q}%,orgao.ilike.%${q}%,municipio.ilike.%${q}%,modalidade.ilike.%${q}%`
      );
    }

    // Filtros
    if (uf) query = query.eq('uf', uf);
    if (municipio) query = query.ilike('municipio', `%${municipio}%`);
    if (modalidade) query = query.ilike('modalidade', `%${modalidade}%`);
    if (status) query = query.eq('status', status);
    if (dateFrom) query = query.gte('data_publicacao', dateFrom);
    if (dateTo) query = query.lte('data_publicacao', dateTo);
    if (minVal !== undefined) query = query.gte('valor_estimado', minVal);
    if (maxVal !== undefined) query = query.lte('valor_estimado', maxVal);

    // Ordenação
    if (q && q.trim()) {
      // Ordenar por relevância aproximada (data_publicacao como proxy)
      query = query.order('data_publicacao', { ascending: false, nullsFirst: false });
    } else {
      query = query.order('data_publicacao', { ascending: false, nullsFirst: false });
    }

    query = query.order('created_at', { ascending: false });
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: this.mapDbRowsToTenders(data || []),
      total: count || undefined,
      page,
      pageSize,
    };
  }

  /**
   * Busca uma licitação completa por ID (com items, docs, updates)
   */
  async getTenderById(id: string): Promise<TenderWithRelations | null> {
    const { data: tender, error: tenderError } = await supabaseServer
      .from('tenders' as never)
      .select('*')
      .eq('id', id)
      .single();

    if (tenderError || !tender) {
      return null;
    }

    // Buscar items, docs e updates em paralelo
    const [itemsResult, docsResult, updatesResult] = await Promise.all([
      supabaseServer
        .from('tender_items' as never)
        .select('*')
        .eq('tender_id', id)
        .order('item_num', { ascending: true }),
      supabaseServer
        .from('tender_docs' as never)
        .select('*')
        .eq('tender_id', id)
        .order('created_at', { ascending: false }),
      supabaseServer
        .from('tender_updates' as never)
        .select('*')
        .eq('tender_id', id)
        .order('event_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }),
    ]);

    return {
      ...this.mapDbRowToTender(tender),
      items: (itemsResult.data || []).map(this.mapDbRowToTenderItem),
      docs: (docsResult.data || []).map(this.mapDbRowToTenderDoc),
      updates: (updatesResult.data || []).map(this.mapDbRowToTenderUpdate),
    };
  }

  /**
   * Mapeia resultados da RPC para Tender[]
   */
  private mapRpcResultsToTenders(rows: unknown[]): Tender[] {
    return (rows as TenderDbRow[]).map((row) => ({
      id: row.id,
      source: row.source,
      sourceId: row.source_id,
      sourceUrl: row.source_url || undefined,
      orgao: row.orgao || undefined,
      unidade: row.unidade || undefined,
      uf: row.uf || undefined,
      municipio: row.municipio || undefined,
      modalidade: row.modalidade || undefined,
      numero: row.numero || undefined,
      ano: row.ano || undefined,
      objeto: row.objeto,
      status: row.status || undefined,
      dataPublicacao: row.data_publicacao || undefined,
      dataAbertura: row.data_abertura || undefined,
      valorEstimado: row.valor_estimado ? Number(row.valor_estimado) : undefined,
      rawPayload: row.raw_payload || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Mapeia linhas do DB para Tender[]
   */
  private mapDbRowsToTenders(rows: unknown[]): Tender[] {
    return (rows as TenderDbRow[]).map((row) => this.mapDbRowToTender(row));
  }

  /**
   * Mapeia uma linha do DB para Tender
   */
  private mapDbRowToTender(row: TenderDbRow): Tender {
    return {
      id: row.id,
      source: row.source,
      sourceId: row.source_id,
      sourceUrl: row.source_url || undefined,
      orgao: row.orgao || undefined,
      unidade: row.unidade || undefined,
      uf: row.uf || undefined,
      municipio: row.municipio || undefined,
      modalidade: row.modalidade || undefined,
      numero: row.numero || undefined,
      ano: row.ano || undefined,
      objeto: row.objeto,
      status: row.status || undefined,
      dataPublicacao: row.data_publicacao || undefined,
      dataAbertura: row.data_abertura || undefined,
      valorEstimado: row.valor_estimado ? Number(row.valor_estimado) : undefined,
      rawPayload: row.raw_payload || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Mapeia linha do DB para TenderItem
   */
  private mapDbRowToTenderItem(row: TenderItemDbRow): TenderItem {
    return {
      id: row.id,
      tenderId: row.tender_id,
      itemNum: row.item_num || undefined,
      descricao: row.descricao,
      unidade: row.unidade || undefined,
      quantidade: row.quantidade ? Number(row.quantidade) : undefined,
      valorUnitario: row.valor_unitario ? Number(row.valor_unitario) : undefined,
      valorTotal: row.valor_total ? Number(row.valor_total) : undefined,
      createdAt: row.created_at,
    };
  }

  /**
   * Mapeia linha do DB para TenderDoc
   */
  private mapDbRowToTenderDoc(row: TenderDocDbRow): TenderDoc {
    return {
      id: row.id,
      tenderId: row.tender_id,
      docType: row.doc_type || undefined,
      title: row.title || undefined,
      url: row.url,
      fileHash: row.file_hash || undefined,
      createdAt: row.created_at,
    };
  }

  /**
   * Mapeia linha do DB para TenderUpdate
   */
  private mapDbRowToTenderUpdate(row: TenderUpdateDbRow): TenderUpdate {
    return {
      id: row.id,
      tenderId: row.tender_id,
      eventType: row.event_type,
      eventDate: row.event_date || undefined,
      payload: row.payload || undefined,
      createdAt: row.created_at,
    };
  }
}

export const tenderRepository = new TenderRepository();
