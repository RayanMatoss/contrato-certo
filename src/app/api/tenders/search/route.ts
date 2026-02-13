import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { tenderRepository } from '@/modules/tenders/repositories/tenderRepository';

const searchParamsSchema = z.object({
  q: z.string().optional(),
  uf: z.string().optional(),
  municipio: z.string().optional(),
  modalidade: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minVal: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  maxVal: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  pageSize: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = searchParamsSchema.parse({
      q: searchParams.get('q') || undefined,
      uf: searchParams.get('uf') || undefined,
      municipio: searchParams.get('municipio') || undefined,
      modalidade: searchParams.get('modalidade') || undefined,
      status: searchParams.get('status') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      minVal: searchParams.get('minVal') || undefined,
      maxVal: searchParams.get('maxVal') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
    });

    const result = await tenderRepository.searchTenders(params);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in /api/tenders/search:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
