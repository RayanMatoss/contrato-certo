// Domain types para o módulo de licitações (tenders)

export interface Tender {
  id: string;
  source: string;
  sourceId: string;
  sourceUrl?: string;
  orgao?: string;
  unidade?: string;
  uf?: string;
  municipio?: string;
  modalidade?: string;
  numero?: string;
  ano?: number;
  objeto: string;
  status?: string;
  dataPublicacao?: string; // ISO date string
  dataAbertura?: string; // ISO timestamp string
  valorEstimado?: number;
  rawPayload?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TenderItem {
  id: string;
  tenderId: string;
  itemNum?: number;
  descricao: string;
  unidade?: string;
  quantidade?: number;
  valorUnitario?: number;
  valorTotal?: number;
  createdAt: string;
}

export interface TenderDoc {
  id: string;
  tenderId: string;
  docType?: string;
  title?: string;
  url: string;
  fileHash?: string;
  createdAt: string;
}

export interface TenderUpdate {
  id: string;
  tenderId: string;
  eventType: string;
  eventDate?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface TenderWithRelations extends Tender {
  items: TenderItem[];
  docs: TenderDoc[];
  updates: TenderUpdate[];
}

export interface TenderSearchParams {
  q?: string;
  uf?: string;
  municipio?: string;
  modalidade?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  minVal?: number;
  maxVal?: number;
  page?: number;
  pageSize?: number;
}

export interface TenderSearchResult {
  data: Tender[];
  total?: number;
  page: number;
  pageSize: number;
}

export interface IngestionState {
  source: string;
  cursor?: string;
  lastRun?: string;
  updatedAt: string;
}

// Raw payload de um conector (antes da normalização)
export interface RawTenderPayload {
  sourceId: string;
  sourceUrl?: string;
  orgao?: string;
  unidade?: string;
  uf?: string;
  municipio?: string;
  modalidade?: string;
  numero?: string;
  ano?: number;
  objeto: string;
  status?: string;
  dataPublicacao?: string;
  dataAbertura?: string;
  valorEstimado?: number;
  items?: Array<{
    itemNum?: number;
    descricao: string;
    unidade?: string;
    quantidade?: number;
    valorUnitario?: number;
    valorTotal?: number;
  }>;
  docs?: Array<{
    docType?: string;
    title?: string;
    url: string;
    fileHash?: string;
  }>;
  updates?: Array<{
    eventType: string;
    eventDate?: string;
    payload?: Record<string, unknown>;
  }>;
  rawPayload?: Record<string, unknown>;
}

// Resultado normalizado de um conector
export interface NormalizedTender {
  tender: Omit<Tender, 'id' | 'createdAt' | 'updatedAt'>;
  items: Omit<TenderItem, 'id' | 'tenderId' | 'createdAt'>[];
  docs: Omit<TenderDoc, 'id' | 'tenderId' | 'createdAt'>[];
  updates: Omit<TenderUpdate, 'id' | 'tenderId' | 'createdAt'>[];
}
