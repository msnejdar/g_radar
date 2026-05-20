// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateLeads } from '@/lib/services/leads';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recommendationId = searchParams.get('recommendation_id');
    const region = searchParams.get('region') || '';
    const title = searchParams.get('title') || '';
    const content = searchParams.get('content') || '';
    const productName = searchParams.get('product_name') || '';
    const productCode = searchParams.get('product_code') || '';

    if (!recommendationId) {
      return NextResponse.json(
        { success: false, error: 'Missing recommendation_id parameter.' },
        { status: 400 }
      );
    }

    // Try to get authenticated user from Supabase session
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    let user = null;
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
    } catch (e) {
      // Ignore auth check error, treat as unauthenticated
      console.log('API check auth error, treating as unauthenticated:', e);
    }

    // PRODUCTION MODE: User is logged in, query/write to database
    if (user) {
      try {
        const { data: existingLeads, error: fetchError } = await supabase
          .from('real_leads')
          .select('*')
          .eq('recommendation_id', recommendationId)
          .eq('user_id', user.id);

        if (fetchError) throw fetchError;

        if (existingLeads && existingLeads.length > 0) {
          return NextResponse.json({ success: true, data: existingLeads, mode: 'production' });
        }

        // None exist, generate and save them
        const generated = await generateLeads(title, content, region, productName, productCode);
        const leadsToInsert = generated.map(l => ({
          recommendation_id: recommendationId,
          user_id: user!.id,
          name: l.name,
          contact_person: l.contact_person,
          phone: l.phone,
          website: l.website,
          address: l.address,
          why_target: l.why_target,
          status: 'new'
        }));

        const { data: insertedLeads, error: insertError } = await supabase
          .from('real_leads')
          .insert(leadsToInsert)
          .select('*');

        if (insertError) throw insertError;

        return NextResponse.json({ success: true, data: insertedLeads || generated, mode: 'production' });
      } catch (dbError: any) {
        console.error('Supabase DB error, falling back to live generation:', dbError);
        // Fallback if database operation failed
      }
    }

    // DEMO MODE: Unauthenticated user, return live generated data directly without saving
    const generated = await generateLeads(title, content, region, productName, productCode);
    return NextResponse.json({ success: true, data: generated, mode: 'demo' });

  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing lead ID or status.' },
        { status: 400 }
      );
    }

    // Try to get authenticated user
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    let user = null;
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
    } catch (e) {
      // Ignore
    }

    // PRODUCTION MODE: Save changes to DB
    if (user) {
      try {
        const { data, error } = await supabase
          .from('real_leads')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json({ success: true, data, mode: 'production' });
      } catch (dbError: any) {
        console.error('Supabase PATCH lead error:', dbError);
      }
    }

    // DEMO MODE: Unauthenticated, just return success
    return NextResponse.json({ success: true, data: { id, status }, mode: 'demo' });
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
