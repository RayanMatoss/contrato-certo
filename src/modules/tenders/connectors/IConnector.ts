import type { RawTenderPayload, NormalizedTender, IngestionState } from '../domain/types';

/**
 * Interface para conectores de fontes de dados de licitações
 */
export interface IConnector {
  /**
   * Nome único do conector (ex: 'pncp', 'portal_x')
   */
  name: string;

  /**
   * Descobre novos registros ou atualizações desde o último cursor
   * Retorna lista de referências (ids/urls) ou diretamente itens completos
   */
  discover(state?: IngestionState): Promise<RawTenderPayload[]>;

  /**
   * Busca detalhes completos de um registro específico
   */
  fetchOne(ref: string): Promise<RawTenderPayload | null>;

  /**
   * Normaliza dados brutos para o formato padrão do sistema
   */
  normalize(raw: RawTenderPayload): NormalizedTender;

  /**
   * Calcula o próximo cursor baseado no estado anterior e nos resultados obtidos
   */
  nextCursor(prevState: IngestionState | undefined, results: RawTenderPayload[]): IngestionState;
}
