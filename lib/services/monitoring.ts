// lib/services/monitoring.ts
import { mockDB } from '../db/mockData';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { generateRecommendation } from './ai';

export interface EventTemplate {
  title: string;
  content: string;
  category: 'Počasí' | 'Výstavba' | 'Krimi' | 'Hasiči' | 'Podnikání';
  productCode: string;
  regionOptions: string[];
  sourceUrl: string;
}

const EVENT_TEMPLATES: EventTemplate[] = [
  {
    title: 'Přívalové deště a zatopené sklepy v regionu [REGION]',
    content: 'Prudká bouřka s přívalovými srážkami způsobila včera odpoledne v obcích na území [REGION] lokální záplavy. Hasiči odčerpávali vodu z desítek zatopených sklepů a garáží. Poškozeno bylo také několik zaparkovaných aut padlými větvemi. Škody se odhadují na miliony korun.',
    category: 'Počasí',
    productCode: 'DOMOV_KLASIK',
    regionOptions: ['Liberecký kraj', 'Jihočeský kraj', 'Královéhradecký kraj', 'Kraj Vysočina'],
    sourceUrl: 'https://www.chmi.cz/aktuality'
  },
  {
    title: 'Schválen nový územní plán: Vznikne zóna pro 120 parcel v kraji [REGION]',
    content: 'Zastupitelstvo schválilo změnu územního plánu, která otevírá cestu k masivní výstavbě rodinných domů v atraktivní příměstské lokalitě v rámci [REGION]. Infrastruktura a zasíťování pozemků začne ještě letos v létě. Očekává se velký zájem stavebníků o hypotéky a pojištění staveb.',
    category: 'Výstavba',
    productCode: 'DOMOV_KLASIK',
    regionOptions: ['Středočeský kraj', 'Jihomoravský kraj', 'Plzeňský kraj', 'Moravskoslezský kraj'],
    sourceUrl: 'https://www.stavebni-forum.cz'
  },
  {
    title: 'Nárůst vloupání do rekreačních chat před sezónou na území [REGION]',
    content: 'Policie ČR v rámci [REGION] varuje majitele chat a chalup před organizovaným gangem zlodějů. Během uplynulého víkendu bylo vykradeno 12 chat. Pachatelé se zaměřují na drahé nářadí, zahradní techniku a alkohol. Policie doporučuje instalaci zabezpečení a revizi pojistných smluv.',
    category: 'Krimi',
    productCode: 'DOMOV_KLASIK',
    regionOptions: ['Středočeský kraj', 'Jihočeský kraj', 'Liberecký kraj', 'Ústecký kraj'],
    sourceUrl: 'https://www.policie.cz/preventivni-rady'
  },
  {
    title: 'Ledovka na silnicích v kraji [REGION] způsobila desítky nehod',
    content: 'Ranní mrznoucí déšť proměnil silnice v [REGION] v ledovku. Dopravní policie eviduje od ranních hodin přes 30 nehod, včetně hromadné srážky na hlavním tahu. Dva lidé utrpěli středně těžká zranění. Silničáři varují, že namrzat mohou i chemicky ošetřené úseky.',
    category: 'Počasí',
    productCode: 'AUTO_COMPLEX',
    regionOptions: ['Kraj Vysočina', 'Královéhradecký kraj', 'Karlovarský kraj', 'Pardubický kraj'],
    sourceUrl: 'https://www.dopravniinfo.cz'
  },
  {
    title: 'Série nehod se zvěří na silnicích: Policie v [REGION] nabádá k opatrnosti',
    content: 'Podzimní migrace zvěře plní silnice rizikem. Pouze za uplynulé 3 dny došlo na území [REGION] k 15 střetům vozidel se srnčí a divočáky. Průměrná škoda na vozidle při střetu se zvěří přesahuje 65 tisíc korun. Hasiči připomínají nutnost asistence pro odtah nepojízdných vozidel.',
    category: 'Počasí',
    productCode: 'AUTO_COMPLEX',
    regionOptions: ['Středočeský kraj', 'Jihočeský kraj', 'Plzeňský kraj', 'Kraj Vysočina'],
    sourceUrl: 'https://www.policie.cz/dopravni-zpravodajstvi'
  },
  {
    title: 'Nový dotační program na zateplení a fotovoltaiku pro rodiny v [REGION]',
    content: 'Ministerstvo životního prostředí spouští regionální výzvy pro dotace na instalaci tepelných čerpadel a solárních panelů na rodinné domy v [REGION]. Majitelé mohou získat až 200 000 Kč. Změny na domech (fotovoltaika na střeše) však vyžadují aktualizaci pojistných smluv, aby nedošlo k podpojištění.',
    category: 'Výstavba',
    productCode: 'DOMOV_KLASIK',
    regionOptions: ['Moravskoslezský kraj', 'Ústecký kraj', 'Olomoucký kraj', 'Zlínský kraj'],
    sourceUrl: 'https://www.novazelenausporam.cz'
  },
  {
    title: 'Podnikatelský inkubátor v [REGION] rozšiřuje kapacitu pro startupy a řemeslníky',
    content: 'Městský úřad v rámci rozvoje podnikání v [REGION] otevírá nové sdílené dílny a kanceláře pro začínající podnikatele a řemeslníky. Nájemné bude dotované. Živnostníci však musí doložit pojištění profesní odpovědnosti za škody způsobené při výkonu práce, což je podmínkou pro přidělení prostoru.',
    category: 'Podnikání',
    productCode: 'PODNIKATEL_PRO',
    regionOptions: ['Jihomoravský kraj', 'Plzeňský kraj', 'Pardubický kraj', 'Moravskoslezský kraj'],
    sourceUrl: 'https://www.businessinfo.cz'
  },
  {
    title: 'Vzniká nová cyklostezka na území [REGION]: Hlásí se tisíce nových cyklistů',
    content: 'Kraj [REGION] slavnostně otevřel novou cyklomagistrálu spojující turistická centra. Očekává se masivní nárůst cykloturistiky. S tím roste i počet kolizí a zranění na cyklostezkách a také krádeží vybavení. Zástupci připomínají důležitost pojištění odpovědnosti za škody na zdraví třetích osob.',
    category: 'Výstavba',
    productCode: 'ODPOVEDNOST_BEX',
    regionOptions: ['Jihočeský kraj', 'Jihomoravský kraj', 'Královéhradecký kraj', 'Zlínský kraj'],
    sourceUrl: 'https://www.kudyznudy.cz'
  }
];

export async function simulateNewEvent(): Promise<any> {
  // 1. Choose a random template
  const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
  
  // 2. Choose a random region for that template
  const region = template.regionOptions[Math.floor(Math.random() * template.regionOptions.length)];
  
  // 3. Format placeholders
  const title = template.title.replace('[REGION]', region);
  const content = template.content.replace('[REGION]', region);
  
  const publishedAt = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      // Fetch product to get product_id
      const { data: productData, error: prodErr } = await supabase
        .from('generali_products')
        .select('id, code')
        .eq('code', template.productCode)
        .single();
        
      if (prodErr || !productData) {
        throw new Error(`Product not found in Supabase: ${template.productCode}`);
      }

      // Insert public event
      const { data: eventData, error: evErr } = await supabase
        .from('public_events')
        .insert({
          title,
          content,
          source_url: template.sourceUrl,
          region,
          category: template.category,
          published_at: publishedAt
        })
        .select()
        .single();

      if (evErr || !eventData) {
        throw evErr || new Error('Failed to insert event in Supabase');
      }

      // Generate recommendation (AI or Template)
      const aiResponse = await generateRecommendation({
        eventTitle: title,
        eventContent: content,
        productName: template.productCode, // will resolve inside AI generator
        region
      }, template.productCode);

      // Insert recommendation
      const { data: recData, error: recErr } = await supabase
        .from('acquisition_recommendations')
        .insert({
          event_id: eventData.id,
          product_id: productData.id,
          why_opportunity: aiResponse.whyOpportunity,
          call_script: aiResponse.callScript,
          status: 'new'
        })
        .select('*, event:public_events(*), product:generali_products(*)')
        .single();

      if (recErr) throw recErr;
      return recData;

    } catch (err) {
      console.error('Error simulating event on Supabase, falling back to mockDB:', err);
      // Fallback to mockDB on failure
    }
  }

  // --- MOCK DB FALLBACK ---
  // Get product
  const products = mockDB.getProducts();
  const product = products.find(p => p.code === template.productCode);
  if (!product) {
    throw new Error(`Mock product not found: ${template.productCode}`);
  }

  // Create event
  const newEvent = mockDB.addEvent({
    title,
    content,
    source_url: template.sourceUrl,
    region,
    category: template.category,
    published_at: publishedAt
  });

  // Generate recommendation (AI or Template)
  const aiResponse = await generateRecommendation({
    eventTitle: title,
    eventContent: content,
    productName: product.name,
    region
  }, template.productCode);

  // Add recommendation
  const newRec = mockDB.addRecommendation({
    event_id: newEvent.id,
    product_id: product.id,
    why_opportunity: aiResponse.whyOpportunity,
    call_script: aiResponse.callScript,
    status: 'new'
  });

  // Attach joins manually for immediate UI response
  newRec.event = newEvent;
  newRec.product = product;

  return newRec;
}
