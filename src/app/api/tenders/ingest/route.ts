import { NextRequest, NextResponse } from 'next/server';
import { PNCPConnector } from '@/modules/tenders/connectors/PNCPConnector';
import { ingestionService } from '@/modules/tenders/services/IngestionService';

/**
 * Endpoint protegido para disparar ingestão de licitações
 * Requer header INGEST_SECRET para autenticação
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('x-ingest-secret');
    const expectedSecret = process.env.INGEST_SECRET;

    if (!expectedSecret) {
      return NextResponse.json(
        { error: 'INGEST_SECRET not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Obter source da query string
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get('source') || 'pncp';

    // Selecionar conector
    let connector;
    switch (source) {
      case 'pncp':
        connector = new PNCPConnector();
        break;
      default:
        return NextResponse.json(
          { error: `Unknown source: ${source}` },
          { status: 400 }
        );
    }

    // Executar ingestão
    const result = await ingestionService.ingest(connector);

    return NextResponse.json(
      {
        success: true,
        source,
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/tenders/ingest:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
