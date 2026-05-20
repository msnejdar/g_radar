// lib/services/ai.ts

export interface RecommendationRequest {
  eventTitle: string;
  eventContent: string;
  productName: string;
  region: string;
}

export interface RecommendationResponse {
  whyOpportunity: string;
  callScript: string;
}

export async function generateRecommendation(
  req: RecommendationRequest,
  productCode: string
): Promise<RecommendationResponse> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `Jsi seniorní obchodní trenér a AI agent pojišťovny Generali. Tvým úkolem je pomoci obchodnímu zástupci v terénu oslovit potenciálního klienta.
Na základě veřejné události (zpráva z regionu) a produktu Generali vygeneruj doporučení skládající se ze dvou částí v českém jazyce:
1. "Proč je to příležitost" - vysvětli obchodní kontext, proč má smysl klienta v této oblasti oslovit právě teď, jaké obavy událost vyvolává a co jim produkt řeší.
2. "Script pro hovor" - navrhni konkrétní, úderný a přirozený telefonní scénář pro obchodníka, který začíná empatií k události a končí výzvou k akci (schůzka nebo revize stávajících smluv).

Vstupní událost:
Název zprávy: ${req.eventTitle}
Obsah zprávy: ${req.eventContent}
Region: ${req.region}

Generali Produkt:
Kód: ${productCode}
Název: ${req.productName}

Odpověz striktně ve formátu JSON s následující strukturou (nepoužívej žádný markdown obal kromě čistého JSONu, nepiš žádné řeči okolo):
{
  "whyOpportunity": "text s vysvětlením proč je to příležitost...",
  "callScript": "text s telefonním scénářem uvozeným uvozovkami..."
}`;

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
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (response.ok) {
        const json = await response.json();
        const textResponse = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResponse) {
          const parsed = JSON.parse(textResponse);
          if (parsed.whyOpportunity && parsed.callScript) {
            return {
              whyOpportunity: parsed.whyOpportunity,
              callScript: parsed.callScript,
            };
          }
        }
      } else {
        console.error('Gemini API call failed, status:', response.status);
      }
    } catch (error) {
      console.error('Error generating recommendation with Gemini API:', error);
    }
  }

  // --- Czech Localized High-Fidelity Fallback Generator ---
  return generateFallbackRecommendation(req, productCode);
}

function generateFallbackRecommendation(
  req: RecommendationRequest,
  productCode: string
): RecommendationResponse {
  const { eventTitle, region } = req;
  const t = eventTitle.toLowerCase();

  if (productCode === 'DOMOV_KLASIK') {
    if (t.includes('krupobit') || t.includes('dešt') || t.includes('bouřk') || t.includes('povod')) {
      return {
        whyOpportunity: `Silný živelný incident (přívalové srážky/krupobití) přímo zasáhl majetek lidí v regionu ${region}. Místní obyvatelé mají čerstvou negativní zkušenost a pociťují obavy o bezpečí svých domovů. Mnoho z nich má staré pojistné smlouvy s nedostatečnými limity nebo s úplným vyloučením některých živelních rizik. Kvůli prudkému růstu cen stavebních materiálů v posledních letech navíc drtivé většině nemovitostí hrozí tzv. podpojištění (v případě škody dostanou jen zlomek reálné ceny opravy). Toto je ideální čas nabídnout jim komplexní revizi a aktualizaci pojištění nemovitosti a domácnosti.`,
        callScript: `„Dobrý den, pane Nováku, volám z Generali České pojišťovny. Sleduji aktuální zprávy o škodách po včerejším krupobití u vás v regionu a chtěl jsem se v první řadě zeptat, zda jste vy i váš dům v pořádku a neutrpěl jste nějaké škody? ... Chápu. V souvislosti s tím teď proaktivně kontaktujeme naše klienty a majitele domů v okolí. Mnoho lidí má starší smlouvy s limity, které by dnes při poškození střechy nebo zateplení nepokryly ani polovinu nákladů na opravu. Rád bych se s vámi krátce spojil a prověřil, zda máte vše správně nastavené, abyste v případě další bouřky neriskoval vlastní peníze. Hodil by se vám rychlý hovor zítra dopoledne?“`
      };
    }
    
    if (t.includes('výstavba') || t.includes('územní') || t.includes('parcel') || t.includes('domů')) {
      return {
        whyOpportunity: `Zahájení nové stavební činnosti v regionu ${region} představuje desítky nových klientů. Každý stavebník, který staví rodinný dům (zejména pokud čerpá hypotéku), musí mít ze zákona a požadavků banky sjednané pojištění rozestavěné stavby. Generali nabízí specifické pojištění staveb, které chrání nejen rozestavěnou budovu, ale i stavební materiál, nářadí a stroje na staveništi před krádeží a živly. Navíc po kolaudaci smlouva plynule a bez papírování přechází do standardního pojištění domu se slevou až 30 % za novostavbu.`,
        callScript: `„Dobrý den, paní Dvořáková, tady je Jan Novotný z Generali. Zaznamenal jsem, že se rozjíždí nová výstavba rodinných domů ve vaší lokalitě, kde stavíte/kupujete pozemek. Gratuluji vám k tomuto velkému kroku! Chtěl jsem se zeptat, v jaké fázi financování se nacházíte? Banky totiž pro uvolnění peněz z hypotéky vyžadují pojištění rozestavěné stavby. U nás v Generali máme speciální program pro novostavby s 30% slevou, který kryje i stavební materiál a nářadí přímo na staveništi. Rád vám připravím rychlou kalkulaci, kterou můžete rovnou předložit bance. Kdy vám mohu poslat návrh?“`
      };
    }

    if (t.includes('vloupán') || t.includes('krádež') || t.includes('chat') || t.includes('zloděj')) {
      return {
        whyOpportunity: `Vlna vloupání do rekreačních objektů a garáží v regionu ${region} vyvolává u chatařů a chalupářů obavy ze ztráty majetku. Lidé často ve svých chatách uchovávají drahé zahradní nářadí, sekačky, elektrocentrály nebo sportovní vybavení (kola), ale jejich pojistky mívají pro tyto vedlejší objekty velmi nízké limity plnění (často jen do 20 000 Kč). Revize zabezpečení a navýšení limitů pro vedlejší stavby a krádeže je vysoce aktuální téma, které klienti rádi vyřeší před odjezdem na sezónu.`,
        callScript: `„Dobrý den, pane Dvořáku, volám z Generali. Policie v posledních dnech varuje před sérií vloupání do rekreačních chat u vás v regionu. Vím, že tam vlastníte chatu, a chtěl jsem se zeptat, zda máte svůj objekt dostatečně chráněn a zda máte v pořádku pojistku? Lidé často netuší, že standardní pojistky mají na odcizené nářadí nebo dražší vybavení ze sklepa a kůlny velmi nízké limity. Rád se s vámi spojím, projdeme vaše stávající limity a navrhnu vám úpravu, která vám zajistí klidný spánek, i když na chatě zrovna nejste. Vyhovuje vám středa odpoledne?“`
      };
    }

    if (t.includes('dotační') || t.includes('zateplení') || t.includes('fotovoltaik') || t.includes('solár')) {
      return {
        whyOpportunity: `Masivní instalace fotovoltaických elektráren (FVE) a zateplování domů v regionu ${region} dramaticky mění hodnotu nemovitostí. Instalace solárních panelů zvýší hodnotu domu o 300 až 500 tisíc Kč. Pokud klient neohlásí tuto změnu pojišťovně a neaktualizuje smlouvu, jeho dům se stane podpojištěným a pojišťovna mu v případě požáru nebo krupobití zkrátí plnění. FVE navíc představuje nová specifická rizika (přepětí v síti, poškození krupobitím, technická závada), která je nutné do smlouvy správně zahrnout a pojistit.`,
        callScript: `„Dobrý den, pane Novotný, tady je Jan Novotný z Generali. Volám vám v souvislosti s novým programem dotací na fotovoltaiku a zateplení domů. Pokud uvažujete o instalaci solárních panelů nebo jste je již realizoval, je kriticky důležité aktualizovat vaši pojistnou smlouvu. Solární panely zvyšují hodnotu domu o statisíce a přinášejí nová rizika jako přepětí nebo poškození kroupami. Bez aktualizace smlouvy by vám hrozilo velké zkrácení plnění při jakékoliv škodě na domě. Rád vám spočítám, jak panely do pojistky bezpečně a výhodně zahrnout. Můžeme na to krátce kouknout zítra?“`
      };
    }
  }

  if (productCode === 'AUTO_COMPLEX') {
    if (t.includes('ledovka') || t.includes('nehod') || t.includes('silnic')) {
      return {
        whyOpportunity: `Aktuální vlna dopravních nehod způsobená ledovkou a sněžením v regionu ${region} je pro řidiče silným varováním. Mnozí mají pouze povinné ručení a nemají krytá vlastní rizika havárie na namrzlé vozovce, střetu se svodidly nebo nárazu do stromu. Klíčovým prodejním argumentem v tomto počasí jsou nadstandardní asistenční služby Generali (např. odtah nepojízdného auta bez limitu kilometrů v ČR, zapůjčení náhradního vozidla) a rychlé připojištění havárie (Kasko) nebo skel.`,
        callScript: `„Dobrý den, paní Svobodová, volám z Generali. Dnes ráno byla v našem kraji hlášena extrémní ledovka a desítky dopravních nehod. Chci se zeptat, zda v těchto dnech aktivně jezdíte autem a zda máte v pojistce sjednané dostatečné asistenční služby? Pokud totiž na náledí dostanete smyk a auto poškodíte, bez havarijního pojištění nebo asistence zaplatíte odtah i opravu sami. U Generali teď nabízíme bezplatné navýšení asistenčních limitů k povinnému ručení. Rád vám ukážu, jak můžete své auto na zimu lépe ochránit. Podíváme se na to?“`
      };
    }

    if (t.includes('zvěří') || t.includes('střet') || t.includes('nehod')) {
      return {
        whyOpportunity: `Statistiky nehod se zvěří v regionu ${region} ukazují, že jde o jedno z nejčastějších rizik na českých silnicích, zejména na podzim a na jaře. Průměrná škoda na vozidle po střetu se srnou či divočákem přesahuje 65 000 Kč a povinné ručení ji nijak nekryje. Generali nabízí samostatné připojištění střetu se zvěří k povinnému ručení za velmi příznivou cenu, které navíc nemá žádný vliv na vaše nahromaděné bonusy za jízdu bez nehod.`,
        callScript: `„Dobrý den, pane Horáku, tady je Jan Novotný z Generali. Volám vám v souvislosti s varováním policie před zvýšeným počtem střetů se zvěří u nás v regionu. Chci se zeptat, zda máte na svém autě toto riziko připojištěné? Lidé si často myslí, že srážku se zvěří zaplatí povinné ručení, ale to kryje jen škody způsobené ostatním. U Generali máme skvělé připojištění střetu se zvěří, které stojí jen pár stovek ročně a ochrání vás před statisícovými výdaji na opravu. Můžu vám poslat rychlou kalkulaci do e-mailu?“`
      };
    }
  }

  if (productCode === 'PODNIKATEL_PRO') {
    return {
      whyOpportunity: `Zprávy o závažných haváriích a požárech provozoven v regionu ${region} jsou pro podnikatele a živnostníky impulsem k zamyšlení nad ochranou jejich podnikání. Většina podnikatelů má pojištěný pouze majetek (budovu, stroje), ale zcela opomíjí pojištění přerušení provozu. Když po požáru nebo záplavě nemohou 3 měsíce vyrábět, nemají z čeho platit nájmy, leasingy ani mzdy klíčových zaměstnanců, což vede k likvidaci firmy. Pojištění odpovědnosti za škodu z provozu je navíc nutnou podmínkou pro řadu zakázek.`,
      callScript: `„Dobrý den, pane Marku, volám z Generali. Sledoval jsem zprávy o nočním požáru truhlárny v našem regionu a jako zástupce pojišťovny pro podnikatele vím, jak likvidační taková událost může být. Chci se zeptat, jak máte zajištěnou kontinuitu vašeho podnikání vy? Pokud byste musel kvůli havárii na měsíc zavřít dílnu/provozovnu, máte kryté fixní náklady a mzdy zaměstnanců? U Generali nabízíme pojištění přerušení provozu, které vás v takové situaci podrží finančně nad vodou. Rád bych se s vámi krátce sešel a nezávazně prověřil zabezpečení vaší firmy.“`
    };
  }

  if (productCode === 'ODPOVEDNOST_BEX') {
    return {
      whyOpportunity: `Otevření nových rekreačních zón a cyklostezek v regionu ${region} masivně zvyšuje koncentraci cyklistů a koloběžkářů, což přináší zvýšené riziko nehod a srážek. Podle občanského zákoníku odpovídá viník nehody za veškerou škodu na majetku i zdraví (včetně ušlého zisku, bolestného a nákladů na léčbu), které mohou jít do milionů korun. Pojištění odpovědnosti v běžném životě (tzv. pojistka na blbost) kryje celou rodinu i domácí mazlíčky celosvětově při sportu, rekreačních aktivitách i běžném provozu za zanedbatelné pojistné.`,
      callScript: `„Dobrý den, paní Králová, tady je Jan Novotný z Generali. Volám vám v souvislosti s otevřením nové cyklostezky u nás v kraji a výrazným nárůstem kolizí cyklistů. Vím, že s rodinou rádi sportujete, a chtěl jsem se zeptat, zda máte sjednané pojištění odpovědnosti pro případ, že byste vy nebo děti někomu nechtěně způsobili škodu? Srážka na kole s chodcem dnes může kvůli odškodnému na zdraví stát i miliony korun. Naše pojištění odpovědnosti kryje celou rodinu celosvětově za pár korun měsíčně. Pojďme se podívat, zda ho už nemáte v rámci jiné smlouvy, nebo ho rychle sjednáme.“`
    };
  }

  // Generic fallback if no specific rule matches
  return {
    whyOpportunity: `Veřejná událost "${eventTitle}" v regionu ${region} vytváří bezprostřední potřebu finančního zabezpečení rizik. Místní obyvatelé a firmy jsou vnímavější vůči hrozbám poškození majetku, zdraví nebo podnikání. Nabídka produktu ${req.productName} v této souvislosti ukazuje proaktivní přístup poradce, který přináší řešení reálného a aktuálního problému klienta přímo v jeho okolí.`,
    callScript: `„Dobrý den, volám z Generali České pojišťovny. Určitě jste zaznamenal aktuální události týkající se ${eventTitle} v našem regionu. V souvislosti s tím pomáháme našim klientům v okolí prověřit, zda mají správně zajištěná rizika spojená s tímto tématem. Rád bych se s vámi na chvíli spojil a nezávazně zkontroloval vaši stávající ochranu, abychom měli jistotu, že jste v bezpečí. Kdy se vám to hodí?“`
  };
}
