// app/api/simulate-events/route.ts
import { NextResponse } from 'next/server';
import { simulateNewEvent } from '@/lib/services/monitoring';

export async function GET() {
  try {
    const newRecommendation = await simulateNewEvent();
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

export async function POST() {
  try {
    const newRecommendation = await simulateNewEvent();
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
