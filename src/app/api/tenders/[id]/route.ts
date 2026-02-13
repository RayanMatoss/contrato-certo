import { NextRequest, NextResponse } from 'next/server';
import { tenderRepository } from '@/modules/tenders/repositories/tenderRepository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Tender ID is required' },
        { status: 400 }
      );
    }

    const tender = await tenderRepository.getTenderById(id);

    if (!tender) {
      return NextResponse.json(
        { error: 'Tender not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tender, { status: 200 });
  } catch (error) {
    console.error('Error in /api/tenders/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
