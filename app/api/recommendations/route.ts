// app/api/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mockDB } from '@/lib/db/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('acquisition_recommendations')
        .select(`
          id,
          event_id,
          product_id,
          agent_id,
          why_opportunity,
          call_script,
          status,
          feedback,
          created_at,
          updated_at,
          event:public_events(*),
          product:generali_products(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      console.error('Supabase get recommendations error, using mockDB fallback:', error);
    }
  }

  // Fallback to mockDB
  const recommendations = mockDB.getRecommendations();
  return NextResponse.json({ success: true, data: recommendations });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, feedback } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing recommendation ID.' },
        { status: 400 }
      );
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (status !== undefined) updateData.status = status;
    if (feedback !== undefined) updateData.feedback = feedback;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('acquisition_recommendations')
          .update(updateData)
          .eq('id', id)
          .select(`
            id,
            event_id,
            product_id,
            agent_id,
            why_opportunity,
            call_script,
            status,
            feedback,
            created_at,
            updated_at,
            event:public_events(*),
            product:generali_products(*)
          `)
          .single();

        if (error) throw error;
        return NextResponse.json({ success: true, data });
      } catch (error: any) {
        console.error('Supabase update status error, using mockDB fallback:', error);
      }
    }

    // Fallback to mockDB
    let updated: any = null;
    if (status !== undefined) {
      updated = mockDB.updateRecommendationStatus(id, status);
    }
    if (feedback !== undefined) {
      updated = mockDB.updateRecommendationFeedback(id, feedback);
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Recommendation not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Update status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
