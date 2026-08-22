/**
 * Dutch copy, keyed to the `data-i18n` / `data-i18n-attr` attributes in
 * `app/index.html`.
 *
 * Only Dutch lives here. English is read out of the markup at boot (see
 * `lang.ts`), so there is exactly one place to edit an English string and
 * it is the HTML itself.
 *
 * Values are written straight into `innerHTML`, so any entry that replaces
 * a node the animation modules split — the hero title, the transition
 * statement, the about title — has to keep the same span structure as the
 * markup it replaces, or the reveal has nothing to animate.
 */
export const NL: Record<string, string> = {
  /* ---- head ------------------------------------------------------- */
  'meta.title': 'Kain Mckancy La Reine — Creative Developer uit Amsterdam',
  'meta.og.title': 'Kain Mckancy La Reine — Creative Developer uit Amsterdam',
  'meta.description':
    'Portfolio van Kain Mckancy La Reine, creative developer uit Amsterdam die filmische, motion-gedreven websites bouwt met React, GSAP en Three.js. Bekijk live klantwerk: TuinToppersPro, Wildcore Retreats, KM.dev, TJEZ Photography en La Reine Coaching.',
  'meta.og.description':
    'Filmische, motion-gedreven websites — gebouwd met React, GSAP en Three.js. Live klantwerk voor TuinToppersPro, Wildcore Retreats, KM.dev, TJEZ Photography en La Reine Coaching.',

  /* ---- preloader -------------------------------------------------- */
  'pre.loading': 'De ervaring wordt geladen',
  'pre.crafted': 'Gemaakt in <span class="em">Amsterdam</span>',

  /* ---- nav -------------------------------------------------------- */
  'nav.about': 'Over mij',
  'nav.skills': 'Expertise',
  'nav.work': 'Werk',
  'nav.gallery': 'Galerij',
  'nav.contact': 'Contact',
  'nav.theme': 'Donkere modus aan of uit',
  'nav.menu': 'Menu openen',
  'nav.menu.close': 'Menu sluiten',
  'lang.to.nl': 'Schakel over naar Nederlands',
  'lang.to.en': 'Switch to English',

  /* ---- hero ------------------------------------------------------- */
  'hero.title':
    '<span class="line"><span class="word">Niet</span> <span class="word">zomaar</span></span>\n' +
    '<span class="line"><span class="word it" style="color:var(--orange);">websites.</span></span>\n' +
    '<span class="line"><span class="word">Digitale</span> <span class="word">ervaringen</span></span>\n' +
    '<span class="line"><span class="word it" style="color:var(--orange);">in beweging.</span></span>',
  'hero.cta.work': 'Bekijk het werk',
  'hero.lbl.role': 'Rol',
  'hero.lbl.based': 'Standplaats',
  'hero.lbl.studied': 'Opleiding',
  'hero.lbl.status': 'Status',
  'hero.val.status': 'Beschikbaar <span class="it">2026</span>',

  /* ---- chapters --------------------------------------------------- */
  'chapter.02': 'Hoofdstuk 02 — Oorsprong',
  'chapter.03': 'Hoofdstuk 03 — Vakmanschap',
  'chapter.04': 'Hoofdstuk 04 — Geselecteerd werk',
  'chapter.05': 'Hoofdstuk 05 — Visuele notities',
  'chapter.06': 'Hoofdstuk 06 — Transmissie',

  /* ---- transition ------------------------------------------------- */
  'trans.title':
    '<span class="line"><span class="word">Ik maak</span></span>\n' +
    '<span class="line"><span class="word">websites</span></span>\n' +
    '<span class="line"><span class="word it">die bewegen.</span></span>',
  'trans.credit':
    '<span class="arrow">↘</span><span>Scroll mijn <span class="em">wereld in.</span></span>',

  /* ---- about ------------------------------------------------------ */
  'about.title':
    'Een developer<br><span class="it" style="color:var(--orange);">uit Nederland.</span>',
  'about.profile': 'Profiel',
  'about.p1':
    'Ik ben <strong>Kain Mckancy La Reine</strong>, een enthousiaste en creatieve developer uit Nederland. Ik ben 22 en heb een diepe passie voor design, code, film en kunst. Ik zoek creativiteit op in meeslepende digitale ervaringen, visuele verhalen en moderne esthetiek waarin techniek en emotie samenkomen.',
  'about.p2':
    'Film speelt een grote rol in hoe ik naar creativiteit kijk. De sfeer, het ritme, het licht en de emotionele lading van films bepalen sterk hoe ik interfaces ontwerp en interactieve ervaringen bouw. Mode, architectuur, muziek en andere culturen inspireren me voortdurend — die inspiratie vertaal ik naar unieke digitale werelden.',
  'about.p3':
    'Ik heb onlangs mijn opleiding afgerond aan <strong>Bit Academy in Amsterdam</strong>, waar ik me specialiseerde in softwareontwikkeling en uitgroeide tot full stack developer. In die periode heb ik zowel mijn technische als mijn creatieve kant versterkt: moderne, schaalbare en sterk interactieve digitale ervaringen bouwen, terwijl ik mezelf bleef uitdagen om te groeien als developer én ontwerper.',
  'about.p4':
    'Naast development experimenteer ik graag met motion design, filmische interacties en futuristische webervaringen. Een groot deel van mijn vrije tijd gaat op aan websites bouwen, visuele concepten aanscherpen en nieuwe ideeën verkennen die de grens tussen design, motion en techniek opzoeken.',
  'about.quote':
    'Mijn doel is niet om simpelweg websites te maken, maar om meeslepende digitale ervaringen te bouwen die blijven hangen — door verhaal, interactie en filmische beweging.',

  /* ---- KM.dev founder block --------------------------------------- */
  'km.photo.alt':
    'Kain Mckancy La Reine viert de officiële oprichting van KM.dev bij de Kamer van Koophandel (KVK)',
  'km.eyebrow': 'Oprichter — KM.dev',
  'km.title':
    'Brand systems bouwen <span class="it" style="color:var(--orange);">onder mijn eigen naam.</span>',
  'km.p1':
    'In 2026 richtte ik <strong>KM.dev</strong> op, een kleine brand-system studio gebouwd op alles wat ik leerde van TuinToppersPro, Wildcore Retreats en TJEZ Photography — strategie, identiteit en een werkende website, geleverd als één systeem voor een vaste prijs in plaats van drie losse opleveringen.',
  'km.p2':
    'Hetzelfde gevoel loopt door dit hele portfolio: een merk hoort in elke pixel doordacht aan te voelen, niet in elkaar gezet uit een template. Bij KM.dev bouw ik dat voor andere ondernemers, van de eerste schets tot de site live gaat.',
  'km.cta': 'Bekijk KM.dev ↗',

  /* ---- craft ------------------------------------------------------ */
  'craft.title':
    'Wat ik meebreng<br><span class="it" style="color:var(--orange);">naar een project.</span>',
  'craft.lede':
    'Design, motion en code, van begin tot eind — bij KM.dev bundel ik dat tot één systeem met een vaste prijs, voor ondernemers die liever geen drie freelancers tegelijk aansturen.',
  'craft.1.copy':
    'Interfaces gevormd door film — ritme, licht en sfeer vertaald naar layout, typografie en kleur.',
  'craft.2.copy':
    'GSAP-gedreven interactie die zijn plek verdient — elke overgang vertelt een stuk van het verhaal, niets beweegt zomaar.',
  'craft.3.copy':
    'Full-stack bouwen in React en TypeScript, opgeleverd met moderne tooling — snel, toegankelijk en gemaakt om écht live te gaan.',
  'craft.4.copy':
    'Strategie, identiteit en website als één pakket — via KM.dev, met een vaste prijs en klaar voor productie.',
  'craft.5.copy':
    'Woorden met dezelfde toon als het ontwerp — helder, zelfverzekerd en geschreven om te converteren.',
  'craft.5.quote':
    'Niet zomaar websites.<br><span class="it" style="color:var(--orange);">Digitale ervaringen in beweging.</span>',
  'craft.6.label': 'Livegang',
  'craft.6.title': 'Livegang<span style="color:var(--orange);">.</span>',
  'craft.6.copy':
    'Van Figma-bestand tot live domein — SEO, toegankelijkheid en performance vanaf dag één ingebakken.',
  'craft.deployed': '<span class="d"></span>Live in productie',
  'meter.a11y': 'Toegankelijkheid',

  /* ---- shared tags ------------------------------------------------ */
  'tag.typesystems': 'Typografie',
  'tag.positioning': 'Positionering',
  'tag.identity': 'Identiteit',
  'tag.conversion': 'Conversie',
  'tag.beforeafter': 'Voor / Na',
  'tag.booking': 'Boeken',
  'tag.bookingform': 'Boekingsformulier',
  'tag.brandstrategy': 'Merkstrategie',
  'tag.editorialtype': 'Redactionele typografie',

  /* ---- selected work ---------------------------------------------- */
  'work.title': 'Live werk,<br><span class="it">geen concepten.</span>',
  'work.lede':
    'Vijf projecten opgeleverd tussen 2024 en 2026 — één scherm per project, rechtstreeks van het live domein.',
  'work.hint': 'Scroll — de stapel bouwt zichzelf',
  'work.opensite': 'Open site',
  'work.status.new': '<i class="pw-live"></i>Nieuw',

  'work.01.kicker': 'Lokaal bedrijf — Tuinonderhoud',
  'work.01.lede':
    'Een merk voor tuinonderhoud en reinigen onder hoge druk in Flevoland. Vaste prijzen, abonnementen en een voor/na-slider die het werk in één oogopslag verkoopt.',
  'work.01.aria': 'Open TuinToppersPro in een nieuw tabblad',
  'work.01.capk': 'Landingspagina',

  'work.02.kicker': 'Reizen — Trailrun retreat',
  'work.02.lede':
    'Een trailrun- en hike-retreat in de Spaanse Sierra Calderona. Redactioneel ritme, echte routecijfers en een villa rond één idee: niet presteren — ervaren.',
  'work.02.aria': 'Open Wildcore Retreats in een nieuw tabblad',

  'work.03.kicker': 'Brand system — Mijn eigen studio',
  'work.03.lede':
    'Mijn eigen studio — strategie, identiteit en website als één systeem met een vaste prijs, voor ondernemers die klaar zijn om op te schalen. Cases voor Wildcore, TuinToppersPro en dit portfolio.',
  'work.03.aria': 'Open KM.dev in een nieuw tabblad',
  'work.03.capt': 'Strategie &amp; identiteit<em>.</em>',

  'work.04.kicker': 'Fotografie — Portfolio',
  'work.04.lede':
    'Een portfolio voor fotograaf Chesron Salakory — portret, corporate, lifestyle en architectuur. Beeld eerst, op een bijna zwart canvas, zodat het werk spreekt.',
  'work.04.aria': 'Open TJEZ Photography in een nieuw tabblad',
  'work.04.capk': 'Architectuur',
  'work.04.capt': 'Lijnen en licht<em>.</em>',

  'work.05.kicker': 'Coaching — Stemactivatie',
  'work.05.lede':
    'Een warme, redactionele site voor stemcoach Phaedra La Reine. Serif display-typografie, een zacht crèmekleurig canvas en één duidelijke eerste stap: “Plan je eerste stap”.',
  'work.05.aria': 'Open La Reine Coaching in een nieuw tabblad',
  'work.05.capt': 'Gebruik je stem<em>.</em>',

  /* ---- gallery ---------------------------------------------------- */
  'gal.title': 'Zwevende<br><span class="it" style="color:var(--orange);">galerij.</span>',
  'gal.lede':
    'Elk scherm dat ik opleverde en elk gezicht erachter — drijvend, kantelend, levend.',
  'gal.01': 'Zelf<span class="em">portret</span>',
  'gal.04': 'Dag <span class="em">één</span>',
  'gal.08': 'Voor &amp; <span class="em">na</span>',
  'gal.09': 'Vier <span class="em">weekenden</span>',
  'gal.10': 'Portret · <span class="em">No.2</span>',

  /* ---- contact ---------------------------------------------------- */
  'contact.title':
    'Laten we iets<br><span class="it" style="color:var(--orange);">onvergetelijks bouwen.</span>',
  'contact.lede':
    'Vertel me over je project, je wereld, je idee. Ik reageer op elk bericht.',
  'contact.lbl.email': 'E-mail',
  'contact.lbl.phone': 'Telefoon',
  'contact.form.title': 'Stuur een bericht',
  'contact.field.name': 'Je naam',
  'contact.field.email': 'Je e-mailadres',
  'contact.field.project.label': 'Project of idee',
  'contact.field.project': 'Project · Idee',
  'contact.field.message.label': 'Je bericht',
  'contact.field.message': 'Vertel me alles...',
  'contact.submit': 'Verstuur bericht →',
  'footer.end': 'Einde transmissie',
  'fab.email': 'Mail me',

  /* ---- runtime-only (no markup to harvest) ------------------------ */
  'form.status.ok': 'Bericht ontvangen. Ik neem contact met je op.',
  'form.status.error': 'Er ging iets mis — mail me gerust rechtstreeks.',
  'form.subject': 'Projectaanvraag',
  'form.subject.fallback': 'Nieuw idee',
};
