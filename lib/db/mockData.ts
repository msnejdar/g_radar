// lib/db/mockData.ts

export interface GeneraliProduct {
  id: string;
  code: string;
  name: string;
  category: 'Majetek' | 'Auto' | 'Život' | 'Odpovědnost' | 'Podnikání';
  description: string;
  key_benefits: string[];
  target_audience: string;
  created_at: string;
}

export interface PublicEvent {
  id: string;
  title: string;
  content: string;
  source_url?: string;
  region: string;
  category: 'Počasí' | 'Výstavba' | 'Krimi' | 'Hasiči' | 'Podnikání';
  published_at: string;
  created_at: string;
  guid?: string;
  is_real_event?: boolean;
}

export interface AcquisitionRecommendation {
  id: string;
  event_id: string;
  product_id: string;
  agent_id?: string;
  why_opportunity: string;
  call_script: string;
  status: 'new' | 'called' | 'scheduled';
  feedback?: 'positive' | 'negative' | 'none';
  created_at: string;
  updated_at: string;
  
  // Joined fields for ease of UI consumption
  event?: PublicEvent;
  product?: GeneraliProduct;
}

// 1. Seed Products
export const mockProducts: GeneraliProduct[] = [
  {
    id: 'prod-domov-klasik',
    code: 'DOMOV_KLASIK',
    name: 'Pojištění domova a stavby',
    category: 'Majetek',
    description: 'Komplexní pojištění rodinného domu, bytu, chaty nebo domácnosti. Kryje živelní škody, krádeže i odpovědnost za škody.',
    key_benefits: [
      'Krytí všech standardních živelních rizik v základní ceně.',
      'Pojištění odpovědnosti z držby nemovitosti s celosvětovým krytím.',
      'Asistenční služby 24/7 pro případ havárie (instalatér, zámečník atd.).',
      'Možnost připojištění zahradní architektury nebo bazénu.'
    ],
    target_audience: 'Majitelé rodinných domů, bytů v osobním vlastnictví a rekreačních objektů.',
    created_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'prod-auto-complex',
    code: 'AUTO_COMPLEX',
    name: 'Pojištění vozidel (POV + HAV)',
    category: 'Auto',
    description: 'Povinné ručení a havarijní pojištění s volitelnými připojištěními na míru (skla, střet se zvěří, vandalismus, odtah).',
    key_benefits: [
      'Limit plnění povinného ručení až do výše 150 mil. Kč.',
      'Garance mobility - zapůjčení náhradního vozidla zdarma při nehodě.',
      'Připojištění střetu se zvěří a poškození kabelů hlodavci bez vlivu na bonus.',
      'Rychlá likvidace škod přes mobilní aplikaci.'
    ],
    target_audience: 'Aktivní řidiči, majitelé nových i ojetých osobních automobilů.',
    created_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'prod-zivot-profit',
    code: 'ZIVOT_PROFIT',
    name: 'Životní pojištění a ochrana příjmu',
    category: 'Život',
    description: 'Flexibilní pojištění, které chrání klienta a jeho rodinu při ztrátě příjmu, vážné nemoci, invaliditě nebo úrazu.',
    key_benefits: [
      'Výplata peněz přímo na účet pro pokrytí životních nákladů při neschopnosti.',
      'Krytí více než 60 závažných onemocnění včetně rakoviny a infarktu.',
      'Možnost daňových úlev (odpočet ze základu daně).',
      'Bonus za věrnost a zdravý životní styl.'
    ],
    target_audience: 'Živitelé rodiny, lidé s hypotékou nebo vysokými finančními závazky a OSVČ.',
    created_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'prod-odpovednost-bex',
    code: 'ODPOVEDNOST_BEX',
    name: 'Pojištění odpovědnosti v běžném životě',
    category: 'Odpovědnost',
    description: 'Pojištění pro případ, že vy, vaše děti nebo domácí mazlíčci způsobíte někomu jinému škodu na zdraví či majetku.',
    key_benefits: [
      'Vztahuje se na škody způsobené při sportu (lyžování, cyklistika atd.).',
      'Kryje škody způsobené domácími zvířaty (např. pokousání psem).',
      'Platnost po celé Evropě a v zámoří.',
      'Nízké pojistné s vysokými limity plnění.'
    ],
    target_audience: 'Rodiny s dětmi, majitelé psů a koček, aktivní sportovci.',
    created_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'prod-podnikatel-pro',
    code: 'PODNIKATEL_PRO',
    name: 'Pojištění podnikatelů a živnostníků',
    category: 'Podnikání',
    description: 'Ochrana majetku firmy, zásob, strojů a pojištění provozní odpovědnosti za škody způsobené třetím osobám.',
    key_benefits: [
      'Pojištění přerušení provozu (krytí fixních nákladů při nucené odstávce).',
      'Krytí profesní odpovědnosti na míru pro řemeslníky, lékaře, IT atd.',
      'Pojištění elektroniky a přenosných zařízení i mimo provozovnu.',
      'Jednoduché sjednání bez složitého oceňování pro malé živnostníky.'
    ],
    target_audience: 'Drobní živnostníci, řemeslníci, majitelé obchodů, restaurací a menších kanceláří.',
    created_at: new Date('2026-01-01').toISOString()
  }
];

// 2. Initial Mock Events
export const mockEvents: PublicEvent[] = [
  {
    id: 'event-1',
    title: 'Hlášena silná krupobití na Turnovsku s rizikem škod na střechách',
    content: 'Český hydrometeorologický ústav vydal výstrahu před silnými bouřkami doprovázenými krupobitím o velikosti kolem 2 cm. Očekávají se škody na střešních krytinách, oknech a automobilech. Hasiči v regionu Turnov a Liberec již evidují první výjezdy k zatopeným sklepům a poškozeným střechám.',
    source_url: 'https://www.chmi.cz/vystrahy',
    region: 'Liberecký kraj',
    category: 'Počasí',
    published_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'event-2',
    title: 'Nová vlna krádeží drahých elektrokol v Pardubicích',
    content: 'Policie ČR v Pardubickém kraji upozorňuje na zvýšenou aktivitu organizovaných skupin zaměřených na krádeže elektrokol ze sklepů a garáží bytových domů. Za poslední týden bylo nahlášeno 8 případů s celkovou škodou přesahující půl milionu korun.',
    source_url: 'https://www.policie.cz/zpravodajstvi',
    region: 'Pardubický kraj',
    category: 'Krimi',
    published_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(), // 6 hours ago
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  },
  {
    id: 'event-3',
    title: 'Zahájena výstavba 45 rodinných domů v lokalitě Chýně u Prahy',
    content: 'Developer zahájil zemní práce na projektu "Zahrady Chýně", který v první etapě přinese 45 nízkoenergetických rodinných domů a řadovek. Plánované dokončení hrubé stavby je na konci letošního roku. Stavební ruch v oblasti se výrazně zvýší.',
    source_url: 'https://www.chyne.cz/rozvoj',
    region: 'Středočeský kraj',
    category: 'Výstavba',
    published_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1 day ago
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'event-4',
    title: 'Požár truhlárny v Plzni způsobil škodu za 3 miliony korun',
    content: 'Pět jednotek hasičů zasahovalo u nočního požáru výrobní haly a skladu řeziva truhlářské firmy v průmyslové zóně Plzeň-Bory. Příčinou byla pravděpodobně technická závada na elektroinstalaci odsávání. Výroba byla kompletně ochromena.',
    source_url: 'https://www.hzscr.cz/clanek/plzensky-kraj',
    region: 'Plzeňský kraj',
    category: 'Hasiči',
    published_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), // 1.5 days ago
    created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
  }
];

// 3. Initial Mock Recommendations
export const mockRecommendations: AcquisitionRecommendation[] = [
  {
    id: 'rec-1',
    event_id: 'event-1',
    product_id: 'prod-domov-klasik',
    why_opportunity: 'Silné krupobití na Turnovsku přímo poškodilo nemovitosti v oblasti. Lidé mají čerstvé obavy ze škod na střechách, fasádách a zahradách. Je to ideální chvíle pro oslovení majitelů domů v regionu, kteří buď nemají pojištění vůbec, nebo mají staré smlouvy bez dostatečných limitů a krytí proti krupobití (podpojištění).',
    call_script: '„Dobrý den, pane Nováku, volám z Generali České pojišťovny. Sleduji situaci s včerejší krupobitní bouřkou u vás na Turnovsku a chci se zeptat, zda u vás doma proběhlo všechno v pořádku? ... Reagujeme na to tím, že s klienty v regionu proaktivně procházíme nastavení pojistek, aby v případě škod na střeše nebo fasádě měli jistotu plné výplaty. Rád bych se s vámi krátce spojil a prověřil, zda máte krytá všechna rizika a správně nastavenou hodnotu nemovitosti, abyste zbytečně nepřeplácel nebo nebyl podpojištěn.“',
    status: 'new',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'rec-2',
    event_id: 'event-2',
    product_id: 'prod-odpovednost-bex',
    why_opportunity: 'Vlna krádeží elektrokol v Pardubicích vyvolává obavy mezi cyklisty. Lidé často netuší, že standardní pojištění domácnosti mívá pro kola ve sklepě velmi nízké limity (např. jen 10-20 tis. Kč). Generali nabízí speciální připojištění sportovní výbavy s krytím po celé ČR a vysokými limity na krádež i mimo domov, což je nyní extrémně silný prodejní argument.',
    call_script: '„Dobrý den, paní Dvořáková, tady je Jan Novotný z Generali. Volám vám, protože v Pardubicích teď policie řeší sérii krádeží elektrokol ze sklepů. Vím, že rádi jezdíte na kole, a chtěl jsem se zeptat, zda máte své elektro/kolo pojištěné na jeho plnou hodnotu? Běžné pojistky domácností totiž sklepy kryjí jen minimálně. U nás teď máme možnost připojistit kola na plnou cenu s platností i při krádeži venku u restaurace nebo z nosiče na autě. Můžeme na to rychle mrknout a kolo vám do stávající pojistky přidat?“',
    status: 'new',
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  },
  {
    id: 'rec-3',
    event_id: 'event-3',
    product_id: 'prod-domov-klasik',
    why_opportunity: 'Zahájení stavby 45 rodinných domů v Chýni znamená 45 budoucích majitelů nemovitostí, kteří budou potřebovat pojištění rozestavěné stavby a následně hotového domu. Pojištění stavby vyžadují banky pro čerpání hypotéky. Rychlé oslovení stavebníků nebo kupujících v této fázi nám dává obrovskou výhodu před konkurencí.',
    call_script: '„Dobrý den, pane Kučero, zaznamenal jsem, že se rozbíhá nová výstavba rodinných domů v Chýni, kde stavíte/kupujete dům. Gratuluji k tomuto kroku! Hádám, že pro čerpání hypotéky budete brzy potřebovat pojištění rozestavěné stavby, které vyžaduje banka? U Generali máme speciální tarif pro novostavby se slevou až 30 %, kde pojištění stavby automaticky a bezplatně přechází v pojištění zkolaudovaného domu. Rád vám připravím nezávaznou kalkulaci do e-mailu, abyste měl vše připravené pro banku.“',
    status: 'new',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'rec-4',
    event_id: 'event-4',
    product_id: 'prod-podnikatel-pro',
    why_opportunity: 'Požár velké truhlárny v Plzni je tragická událost, která však lokálním podnikatelům připomíná reálné riziko zničení provozovny a přerušení podnikání. Pro truhláře, zámečníky a další drobné výrobce v Plzni a okolí je to impuls k revizi jejich pojistek, zejména krytí přerušení provozu (které hradí fixní náklady a ušlý zisk při odstávce).',
    call_script: '„Dobrý den, pane Marku, volám vám jako zástupce Generali pro Plzeňsko. Určitě jste slyšel o nočním požáru truhlárny na Borech, což je pro každého řemeslníka noční můra. Chci se s vámi spojit a prověřit, jak máte zabezpečenou vaši dílnu vy. Nejde jen o samotné stroje, ale hlavně o krytí tzv. přerušení provozu - abyste v případě výpadku měl z čeho platit nájem a zaměstnance. Pojďme se na to u kávy podívat, revize vás nic nestojí a může zachránit firmu.“',
    status: 'called',
    created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
  }
];

// Helper to simulate store operations in-memory/localStorage
class MockDBStore {
  private key = 'g_radar_mock_db';

  private getStore() {
    if (typeof window === 'undefined') {
      // Server-side: return static mock collections
      return {
        products: mockProducts,
        events: mockEvents,
        recommendations: mockRecommendations
      };
    }

    try {
      const stored = localStorage.getItem(this.key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading from localStorage', e);
    }

    const initial = {
      products: mockProducts,
      events: mockEvents,
      recommendations: mockRecommendations
    };
    this.saveStore(initial);
    return initial;
  }

  private saveStore(store: any) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.key, JSON.stringify(store));
      } catch (e) {
        console.error('Error writing to localStorage', e);
      }
    }
  }

  getProducts(): GeneraliProduct[] {
    return this.getStore().products;
  }

  getEvents(): PublicEvent[] {
    return this.getStore().events;
  }

  getRecommendations(): AcquisitionRecommendation[] {
    const store = this.getStore();
    return store.recommendations.map((rec: any) => {
      const event = store.events.find((e: any) => e.id === rec.event_id);
      const product = store.products.find((p: any) => p.id === rec.product_id);
      return { ...rec, event, product };
    }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  updateRecommendationStatus(id: string, status: 'new' | 'called' | 'scheduled'): AcquisitionRecommendation | null {
    const store = this.getStore();
    const index = store.recommendations.findIndex((r: any) => r.id === id);
    if (index === -1) return null;

    store.recommendations[index].status = status;
    store.recommendations[index].updated_at = new Date().toISOString();
    this.saveStore(store);

    return this.getRecommendations().find(r => r.id === id) || null;
  }

  updateRecommendationFeedback(id: string, feedback: 'positive' | 'negative' | 'none'): AcquisitionRecommendation | null {
    const store = this.getStore();
    const index = store.recommendations.findIndex((r: any) => r.id === id);
    if (index === -1) return null;

    store.recommendations[index].feedback = feedback;
    store.recommendations[index].updated_at = new Date().toISOString();
    this.saveStore(store);

    return this.getRecommendations().find(r => r.id === id) || null;
  }

  addRecommendation(rec: Omit<AcquisitionRecommendation, 'id' | 'created_at' | 'updated_at' | 'feedback'> & { feedback?: 'positive' | 'negative' | 'none' }): AcquisitionRecommendation {
    const store = this.getStore();
    const newRec: AcquisitionRecommendation = {
      feedback: 'none',
      ...rec,
      id: `rec-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.recommendations.push(newRec);
    this.saveStore(store);
    return newRec;
  }

  addEvent(event: Omit<PublicEvent, 'id' | 'created_at' | 'is_real_event'> & { is_real_event?: boolean }): PublicEvent {
    const store = this.getStore();
    const newEvent: PublicEvent = {
      is_real_event: false,
      ...event,
      id: `event-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };
    store.events.push(newEvent);
    this.saveStore(store);
    return newEvent;
  }

  resetStore() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.key);
    }
  }
}

export const mockDB = new MockDBStore();
