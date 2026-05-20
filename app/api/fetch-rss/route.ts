import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { mockDB } from '@/lib/db/mockData';
import { createRecommendationForEvent } from '@/lib/services/monitoring';

export const dynamic = 'force-dynamic';

const RSS_FEEDS = [
  {
    name: 'iDNES Krajské zprávy (Středočeský kraj)',
    url: 'https://servis.idnes.cz/rss.aspx?c=stredocechy'
  },
  {
    name: 'Deník.cz Střední Čechy',
    url: 'https://www.denik.cz/rss/stredocesky-kraj.html'
  }
];

interface ClassificationResult {
  is_insurable_risk: boolean;
  extracted_region: string;
  risk_type: string;
}

// Local fallback classifier when Gemini API is unavailable or fails
function classifyEventLocalFallback(title: string, content: string): ClassificationResult {
  const text = (title + ' ' + content).toLowerCase();
  
  // Guess region - default to Středočeský kraj since RSS feeds are for Střední Čechy
  let region = 'Středočeský kraj';
  if (text.includes('praha')) {
    region = 'Praha';
  } else if (text.includes('liberec') || text.includes('turnov') || text.includes('jablonec')) {
    region = 'Liberecký kraj';
  } else if (text.includes('brno') || text.includes('znojmo') || text.includes('hodonín')) {
    region = 'Jihomoravský kraj';
  }
  
  if (text.includes('požár') || text.includes('oheň') || text.includes('plamen') || text.includes('hasič')) {
    return { is_insurable_risk: true, extracted_region: region, risk_type: 'Pozar' };
  }
  if (text.includes('nehod') || text.includes('srážk') || text.includes('havár') || text.includes('bouračk')) {
    return { is_insurable_risk: true, extracted_region: region, risk_type: 'Autonehoda' };
  }
  if (
    text.includes('kroup') || 
    text.includes('vichřic') || 
    text.includes('bouřk') || 
    text.includes('příval') || 
    text.includes('záplav') || 
    text.includes('povodeň') || 
    text.includes('ledovk') || 
    text.includes('náled') || 
    text.includes('mráz')
  ) {
    return { is_insurable_risk: true, extracted_region: region, risk_type: 'Zivel' };
  }
  if (text.includes('krádež') || text.includes('zloděj') || text.includes('vloupán') || text.includes('vykrad')) {
    return { is_insurable_risk: true, extracted_region: region, risk_type: 'Kradez' };
  }
  if (text.includes('výstavba') || text.includes('stavba') || text.includes('rekonstruk') || text.includes('kolauda')) {
    return { is_insurable_risk: true, extracted_region: region, risk_type: 'Vystavba' };
  }
  if (text.includes('otevření') && (text.includes('firmy') || text.includes('provozovn') || text.includes('restaurac'))) {
    return { is_insurable_risk: true, extracted_region: region, risk_type: 'Akvizice-Firmy' };
  }

  return { is_insurable_risk: false, extracted_region: region, risk_type: 'None' };
}

// Call Gemini API to classify the news item
async function classifyEventWithGemini(title: string, content: string): Promise<ClassificationResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('Gemini API key is missing. Using local fallback classifier.');
    return classifyEventLocalFallback(title, content);
  }

  const prompt = `Jsi analytik rizik pro pojišťovnu G-Radar. Analyzuj následující titulek a perex zprávy z českých médií. Rozhodni, zda tato událost představuje reálné, pojistitelné riziko nebo obchodní příležitost pro pojišťovnu (např. požár, krádež, živelná pohroma, ledovka, krupobití, havárie, otevření nové firmy, rekonstrukce budov). Politiku, sport, běžnou kriminalitu mimo majetek nebo bulvár striktně ignoruj.
Tvým výstupem musí být POUZE validní JSON v tomto formátu, nic jiného nepřidávej:
{
  "is_insurable_risk": boolean,
  "extracted_region": "Název kraje nebo okresu v ČR",
  "risk_type": "krátké označení (např. Pozar, Zivel, Akvizice-Firmy, Autonehoda)"
}

Zpráva k analýze:
Titulek: ${title}
Perex: ${content}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          }
        }),
        signal: AbortSignal.timeout(8000)
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('Gemini returned an empty candidate list');
    }

    const parsed = JSON.parse(responseText.trim());
    return {
      is_insurable_risk: !!parsed.is_insurable_risk,
      extracted_region: parsed.extracted_region || 'Středočeský kraj',
      risk_type: parsed.risk_type || 'None'
    };
  } catch (error) {
    console.error('Error calling Gemini for classification:', error);
    return classifyEventLocalFallback(title, content);
  }
}

// Maps risk_type and text to the 5 product codes and event category
function getProductAndCategoryForRisk(riskType: string, title: string, content: string): { productCode: string, eventCategory: 'Počasí' | 'Výstavba' | 'Krimi' | 'Hasiči' | 'Podnikání' } {
  const risk = (riskType || '').toLowerCase();
  const text = (title + ' ' + content).toLowerCase();

  if (risk.includes('pozar') || risk.includes('fire')) {
    if (text.includes('truhlár') || text.includes('firm') || text.includes('hala') || text.includes('sklad') || text.includes('provoz')) {
      return { productCode: 'PODNIKATEL_PRO', eventCategory: 'Hasiči' };
    }
    return { productCode: 'DOMOV_KLASIK', eventCategory: 'Hasiči' };
  }
  if (
    risk.includes('zivel') || 
    risk.includes('weather') || 
    risk.includes('krup') || 
    risk.includes('dest') || 
    risk.includes('povoden') || 
    risk.includes('vichr')
  ) {
    return { productCode: 'DOMOV_KLASIK', eventCategory: 'Počasí' };
  }
  if (risk.includes('akvizice') || risk.includes('firm') || risk.includes('podnik')) {
    return { productCode: 'PODNIKATEL_PRO', eventCategory: 'Podnikání' };
  }
  if (risk.includes('autonehoda') || risk.includes('auto') || risk.includes('crash') || risk.includes('doprav')) {
    return { productCode: 'AUTO_COMPLEX', eventCategory: 'Počasí' };
  }
  if (risk.includes('kradez') || risk.includes('vloup') || risk.includes('theft')) {
    if (text.includes('kolo') || text.includes('elektrokolo')) {
      return { productCode: 'ODPOVEDNOST_BEX', eventCategory: 'Krimi' };
    }
    return { productCode: 'DOMOV_KLASIK', eventCategory: 'Krimi' };
  }
  if (risk.includes('vystavba') || risk.includes('rekonstrukce') || text.includes('stav') || text.includes('parcel')) {
    return { productCode: 'DOMOV_KLASIK', eventCategory: 'Výstavba' };
  }
  if (text.includes('cyklo') || text.includes('lyz') || text.includes('pes')) {
    return { productCode: 'ODPOVEDNOST_BEX', eventCategory: 'Výstavba' };
  }
  return { productCode: 'DOMOV_KLASIK', eventCategory: 'Počasí' };
}

export async function GET() {
  const parser = new Parser();
  const processedEvents: any[] = [];
  const skippedEvents: string[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`Fetching RSS Feed: ${feed.name} (${feed.url})`);
      const parsedFeed = await parser.parseURL(feed.url);
      
      for (const item of parsedFeed.items) {
        const title = item.title || '';
        const link = item.link || '';
        const content = item.contentSnippet || item.content || '';
        const guid = item.guid || item.id || link;
        const publishedAt = item.isoDate || item.pubDate || new Date().toISOString();

        if (!title) continue;

        // Check if event already exists in database
        let isDuplicate = false;
        if (isSupabaseConfigured && supabase) {
          // Safe two-step lookup to avoid PostgREST query parsing errors with RSS links
          const { data: guidData } = await supabase
            .from('public_events')
            .select('id')
            .eq('guid', guid)
            .limit(1);

          if (guidData && guidData.length > 0) {
            isDuplicate = true;
          } else {
            const { data: urlData } = await supabase
              .from('public_events')
              .select('id')
              .eq('source_url', link)
              .limit(1);
            if (urlData && urlData.length > 0) {
              isDuplicate = true;
            }
          }
        } else {
          // Local Mock database duplicate check
          const existing = mockDB.getEvents().find(e => e.guid === guid || e.source_url === link);
          if (existing) {
            isDuplicate = true;
          }
        }

        if (isDuplicate) {
          skippedEvents.push(title);
          continue;
        }

        // Run Gemini 2.5 Flash / fallback classification
        const classification = await classifyEventWithGemini(title, content);

        if (!classification.is_insurable_risk) {
          console.log(`Skipping non-insurable event: "${title}" (${classification.risk_type})`);
          continue;
        }

        // Map to G-Radar insurance product and category
        const { productCode, eventCategory } = getProductAndCategoryForRisk(
          classification.risk_type,
          title,
          content
        );

        let savedEventId = '';
        let savedEvent: any = null;

        if (isSupabaseConfigured && supabase) {
          const { data: eventData, error: evErr } = await supabase
            .from('public_events')
            .insert({
              title,
              content,
              source_url: link,
              region: classification.extracted_region,
              category: eventCategory,
              published_at: publishedAt,
              guid,
              is_real_event: true
            })
            .select()
            .single();

          if (evErr) {
            console.error('Failed to save public event to Supabase:', evErr);
            continue;
          }
          savedEventId = eventData.id;
          savedEvent = eventData;
        } else {
          // Local Mock DB save
          const newEvent = mockDB.addEvent({
            title,
            content,
            source_url: link,
            region: classification.extracted_region,
            category: eventCategory,
            published_at: publishedAt,
            guid,
            is_real_event: true
          });
          savedEventId = newEvent.id;
          savedEvent = newEvent;
        }

        // Generate sales recommendation using AI/fallback and write to database
        try {
          const recommendation = await createRecommendationForEvent(
            savedEventId,
            title,
            content,
            classification.extracted_region,
            productCode
          );
          processedEvents.push({
            event: savedEvent,
            recommendation
          });
          console.log(`Successfully processed insurable event: "${title}" -> recommended ${productCode}`);
        } catch (recErr) {
          console.error(`Failed to generate recommendation for event "${title}":`, recErr);
        }
      }
    } catch (feedErr) {
      console.error(`Failed to fetch or parse RSS feed ${feed.name}:`, feedErr);
    }
  }

  return NextResponse.json({
    success: true,
    processed_count: processedEvents.length,
    processed_events: processedEvents,
    skipped_duplicates_count: skippedEvents.length,
    skipped_duplicates: skippedEvents
  });
}
