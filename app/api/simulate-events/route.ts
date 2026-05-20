// app/api/simulate-events/route.ts
import { NextResponse } from 'next/server';
import { simulateNewEvent } from '@/lib/services/monitoring';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const preferredRegion = searchParams.get('region') || undefined;
    const newRecommendation = await simulateNewEvent(preferredRegion);
    return NextResponse.json({
      success: true,
      message: 'Simulated new event and created recommendation.',
      data: newRecommendation,
    });
  } catch (error: any) {
    console.error('Simulation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let preferredRegion = undefined;
    try {
      const { searchParams } = new URL(request.url);
      preferredRegion = searchParams.get('region') || undefined;
      
      if (!preferredRegion) {
        const body = await request.json();
        preferredRegion = body.region || undefined;
      }
    } catch (e) {
      // Body may be empty or not JSON
    }

    const newRecommendation = await simulateNewEvent(preferredRegion);
    return NextResponse.json({
      success: true,
      data: newRecommendation,
    });
  } catch (error: any) {
    console.error('Simulation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

