import type { IConnector } from './IConnector';
import type {
  RawTenderPayload,
  NormalizedTender,
  IngestionState,
} from '../domain/types';

/**
 * Conector para Portal Nacional de Contratações Públicas (PNCP)
 * 
 * TODO: Implementar integração real quando PNCP_ENABLED=true
 * - Endpoint base: PNCP_BASE_URL (ex: https://pncp.gov.br/api)
 * - Autenticação: Token API (se necessário)
 * - Paginação: Usar cursor/offset conforme API do PNCP
 * - Rate limiting: Respeitar limites da API
 */
export class PNCPConnector implements IConnector {
  name = 'pncp';
  private baseUrl: string;
  private enabled: boolean;

  constructor() {
    this.baseUrl = process.env.PNCP_BASE_URL || 'https://pncp.gov.br/api';
    this.enabled = process.env.PNCP_ENABLED === 'true';
  }

  async discover(_state?: IngestionState): Promise<RawTenderPayload[]> {
    if (!this.enabled) {
      // Modo stub: retornar array vazio ou dados mock para desenvolvimento
      console.log('[PNCP] Modo stub ativo - retornando array vazio');
      return [];
    }

    // TODO: Implementar chamada real à API do PNCP
    // Exemplo de estrutura esperada:
    /*
    const cursor = state?.cursor || '0';
    const url = `${this.baseUrl}/licitacoes?cursor=${cursor}&limit=100`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.PNCP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`PNCP API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return this.mapPNCPResponseToRawPayload(data.items);
    */

    throw new Error('PNCP integration not implemented yet. Set PNCP_ENABLED=false to use stub mode.');
  }

  async fetchOne(_ref: string): Promise<RawTenderPayload | null> {
    if (!this.enabled) {
      console.log('[PNCP] Modo stub - fetchOne retornando null');
      return null;
    }

    // TODO: Implementar busca de detalhes de uma licitação específica
    /*
    const url = `${this.baseUrl}/licitacoes/${ref}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.PNCP_API_TOKEN}`,
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return this.mapPNCPResponseToRawPayload(data);
    */

    throw new Error('PNCP fetchOne not implemented yet.');
  }

  normalize(raw: RawTenderPayload): NormalizedTender {
    return {
      tender: {
        source: this.name,
        sourceId: raw.sourceId,
        sourceUrl: raw.sourceUrl,
        orgao: raw.orgao,
        unidade: raw.unidade,
        uf: raw.uf,
        municipio: raw.municipio,
        modalidade: raw.modalidade,
        numero: raw.numero,
        ano: raw.ano,
        objeto: raw.objeto,
        status: raw.status,
        dataPublicacao: raw.dataPublicacao,
        dataAbertura: raw.dataAbertura,
        valorEstimado: raw.valorEstimado,
        rawPayload: raw.rawPayload,
      },
      items: (raw.items || []).map((item) => ({
        itemNum: item.itemNum,
        descricao: item.descricao,
        unidade: item.unidade,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        valorTotal: item.valorTotal,
      })),
      docs: (raw.docs || []).map((doc) => ({
        docType: doc.docType,
        title: doc.title,
        url: doc.url,
        fileHash: doc.fileHash,
      })),
      updates: (raw.updates || []).map((update) => ({
        eventType: update.eventType,
        eventDate: update.eventDate,
        payload: update.payload,
      })),
    };
  }

  nextCursor(prevState: IngestionState | undefined, results: RawTenderPayload[]): IngestionState {
    // TODO: Implementar lógica de cursor baseada na API do PNCP
    // Exemplo: usar timestamp da última licitação ou offset numérico
    const lastResult = results[results.length - 1];
    const newCursor = lastResult
      ? `${lastResult.sourceId}:${lastResult.dataPublicacao || Date.now()}`
      : prevState?.cursor || '0';

    return {
      source: this.name,
      cursor: newCursor,
      lastRun: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Helper para mapear resposta da API PNCP para RawTenderPayload
   * TODO: Implementar quando a estrutura da API for conhecida
   */
  private mapPNCPResponseToRawPayload(_data: Record<string, unknown>): RawTenderPayload {
    // Placeholder - implementar mapeamento real
    throw new Error('mapPNCPResponseToRawPayload not implemented');
  }
}
