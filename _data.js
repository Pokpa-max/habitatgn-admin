
export const zones = [
  { label: 'Matam', value: 'Matam' },
  { label: 'Kaloum', value: 'Kaloum' },
  { label: 'Dixinn', value: 'Dixinn' },
  { label: 'Ratoma', value: 'Ratoma' },
  { label: 'Matoto', value: 'Matoto' },
]
export const userRole = [
  { label: 'Gestionnaire / Manager', value: 'manager' },
  { label: 'Administrateur', value: 'admin' },
  { label: 'Agent Immobilier', value: 'agent' },
  { label: 'Ouvrier / Artisan', value: 'worker' },
]

export const quartier = [
  { label: 'Koulewondy', value: 'Koulewondy' },
  { label: 'Donka', value: 'Donka' },
  { label: 'Camayenne', value: 'Camayenne' },
  { label: 'BelleVue', value: 'BelleVue' },
  { label: 'Dixinn', value: 'Dixinn' },
  { label: 'Madina', value: 'Madina' },
  { label: 'Kipé', value: 'Kipé' },
  { label: 'Ratoma', value: 'Ratoma' },
  { label: 'Cosa', value: 'Cosa' },
  { label: 'Bambeto', value: 'Bambeto' },
]
export const currencyOptions = [
  { label: 'GNF', value: 'GNF' },
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
]

export const CONAKRY_COMMUNES = [
  { label: "Kaloum", value: "kaloum" },
  { label: "Dixinn", value: "dixinn" },
  { label: "Matam", value: "matam" },
  { label: "Ratoma", value: "ratoma" },
  { label: "Matoto", value: "matoto" },
  { label: "Lambanyi", value: "lambanyi" },
  { label: "Sonfonia", value: "sonfonia" },
  { label: "Gbessia", value: "gbessia" },
  { label: "Tombolia", value: "tombolia" },
  { label: "Kagbelen", value: "kagbelen" },
  { label: "Sanoyah", value: "sanoyah" },
  { label: "Manéah", value: "maneah" },
  { label: "Kassa", value: "kassa" },
]

const CONAKRY_QUARTIERS = {
  kaloum: [
    { label: "Almamya", value: "almamya", type: "commercial" },
    { label: "Boulbinet", value: "boulbinet", type: "résidentiel" },
    { label: "Coronthie", value: "coronthie", type: "commercial" },
    { label: "Kaloum", value: "kaloum", type: "administratif" },
    { label: "Kouléwondy", value: "koulewondy", type: "commercial" },
    { label: "Manquepas", value: "manquepas", type: "résidentiel" },
    { label: "Sandervalia", value: "sandervalia", type: "administratif" },
    { label: "Sans-fil", value: "sans-fil", type: "résidentiel" },
    { label: "Témitaye", value: "temitaye", type: "résidentiel" },
    { label: "Tombo", value: "tombo", type: "commercial" },
  ],

  dixinn: [
    { label: "Belle-Vue", value: "belle-vue", type: "résidentiel" },
    { label: "Camayenne", value: "camayenne", type: "résidentiel" },
    { label: "Cameroun", value: "cameroun", type: "résidentiel" },
    { label: "Dixinn", value: "dixinn", type: "mixte" },
    { label: "Hafia", value: "hafia", type: "résidentiel" },
    { label: "Kénien", value: "kenien", type: "résidentiel" },
    { label: "Landréah", value: "landreah", type: "résidentiel" },
    { label: "Minière", value: "miniere", type: "résidentiel" },
  ],

  matam: [
    { label: "Boussoura", value: "boussoura", type: "résidentiel" },
    { label: "Carrière", value: "carriere", type: "industriel" },
    { label: "Coléah", value: "coleah", type: "résidentiel" },
    { label: "Domino", value: "domino", type: "résidentiel" },
    { label: "Hermakönon", value: "hermakonon", type: "résidentiel" },
    { label: "Imprimerie", value: "imprimerie", type: "commercial" },
    { label: "Lanséboudji", value: "lanseboudji", type: "résidentiel" },
    { label: "Madina", value: "madina", type: "commercial" },
    { label: "Mafanco", value: "mafanco", type: "résidentiel" },
    { label: "Touguiwondy", value: "touguiwondy", type: "résidentiel" },
  ],

  ratoma: [
    { label: "Bambeto", value: "bambeto", type: "résidentiel" },
    { label: "Bomboli", value: "bomboli", type: "résidentiel" },
    { label: "Cobaya-Fossidè", value: "cobaya-fosside", type: "résidentiel" },
    { label: "Cosa", value: "cosa", type: "mixte" },
    { label: "Demoudoula", value: "demoudoula", type: "résidentiel" },
    { label: "Hamdalaye", value: "hamdalaye", type: "commercial" },
    { label: "Kaporo", value: "kaporo", type: "résidentiel" },
    { label: "Kipé", value: "kipe", type: "résidentiel" },
    { label: "Koloma", value: "koloma", type: "résidentiel" },
    { label: "Lambandji", value: "lambandji", type: "résidentiel" },
    { label: "Nongo", value: "nongo", type: "résidentiel" },
    { label: "Ratoma", value: "ratoma", type: "mixte" },
    { label: "Simanbossia", value: "simanbossia", type: "résidentiel" },
    { label: "Simbaya", value: "simbaya", type: "industriel" },
    { label: "Taouyah", value: "taouyah", type: "commercial" },
    { label: "Wanindara", value: "wanindara", type: "résidentiel" },
    { label: "Yattayah", value: "yattayah", type: "résidentiel" },
  ],

  matoto: [
    { label: "Aviation", value: "aviation", type: "industriel" },
    { label: "Béanzin", value: "beanzin", type: "résidentiel" },
    { label: "Camp Alpha Yaya Diallo", value: "camp-alpha-yaya", type: "militaire" },
    { label: "Cité de l'Air", value: "cite-de-lair", type: "résidentiel" },
    { label: "Dabompa", value: "dabompa", type: "résidentiel" },
    { label: "Dabondy", value: "dabondy", type: "résidentiel" },
    { label: "Dar-es-salam", value: "dar-es-salam", type: "résidentiel" },
    { label: "Enta", value: "enta", type: "résidentiel" },
    { label: "Gbéssia", value: "gbessia", type: "industriel" },
    { label: "Kissosso", value: "kissosso", type: "résidentiel" },
    { label: "Matoto", value: "matoto", type: "mixte" },
  ],

  lambanyi: [
    { label: "Gbonía", value: "gbonia", type: "résidentiel" },
    { label: "Lambanyi", value: "lambanyi", type: "résidentiel" },
    { label: "Tanéné", value: "tanene", type: "résidentiel" },
    { label: "Yimbaya", value: "yimbaya", type: "résidentiel" },
  ],

  sonfonia: [
    { label: "Gbessia-Port", value: "gbessia-port", type: "industriel" },
    { label: "Sonfonia", value: "sonfonia", type: "résidentiel" },
    { label: "Sonfonia-Gare", value: "sonfonia-gare", type: "commercial" },
    { label: "Yimbaya", value: "yimbaya-sonfonia", type: "résidentiel" },
  ],

  gbessia: [
    { label: "Bonfi", value: "bonfi", type: "commercial" },
    { label: "Gbessia", value: "gbessia-centre", type: "commercial" },
    { label: "Gbessia-Port", value: "gbessia-port", type: "industriel" },
    { label: "Matam-Gare", value: "matam-gare", type: "commercial" },
  ],

  tombolia: [
    { label: "Khabitayah", value: "khabitayah", type: "résidentiel" },
    { label: "Tombolia", value: "tombolia", type: "résidentiel" },
    { label: "Tombolia-Centre", value: "tombolia-centre", type: "mixte" },
  ],

  kagbelen: [
    { label: "Kagbelen", value: "kagbelen-centre", type: "résidentiel" },
    { label: "Kagbelen-Gare", value: "kagbelen-gare", type: "commercial" },
    { label: "Wonkifong", value: "wonkifong", type: "résidentiel" },
  ],

  sanoyah: [
    { label: "Sanoyah", value: "sanoyah-centre", type: "résidentiel" },
    { label: "Sanoyah-Marché", value: "sanoyah-marche", type: "commercial" },
    { label: "Tankounou", value: "tankounou", type: "résidentiel" },
  ],

  maneah: [
    { label: "Manéah-Centre", value: "maneah-centre", type: "résidentiel" },
    { label: "Manéah-Marché", value: "maneah-marche", type: "commercial" },
    { label: "Soronkoni", value: "soronkoni", type: "résidentiel" },
  ],

  kassa: [
    { label: "Île de Kassa", value: "ile-de-kassa", type: "touristique" },
    { label: "Kassa-Village", value: "kassa-village", type: "résidentiel" },
  ],
}

// Les listes ci-dessous reprennent à l'identique les constantes du site public
// (habitatgnweb/src/lib/constants/communes.ts, devenir-agent/page.tsx,
// devenir-ouvrier/page.tsx) pour que les comptes créés depuis l'admin aient
// exactement la même forme que ceux créés par les utilisateurs eux-mêmes.

export const REGIONS = [
  { name: 'Conakry', communes: CONAKRY_COMMUNES },
  {
    name: 'Boke',
    communes: [
      { label: 'Boké', value: 'boke' },
      { label: 'Fria', value: 'fria' },
      { label: 'Kamsar', value: 'kamsar' },
    ],
  },
  {
    name: 'Kindia',
    communes: [
      { label: 'Kindia', value: 'kindia' },
      { label: 'Coyah', value: 'coyah' },
      { label: 'Dubréka', value: 'dubreka' },
    ],
  },
  {
    name: 'Mamou',
    communes: [
      { label: 'Mamou', value: 'mamou' },
      { label: 'Pita', value: 'pita' },
      { label: 'Dalaba', value: 'dalaba' },
    ],
  },
  { name: 'Labe', communes: [{ label: 'Labé', value: 'labe' }] },
  {
    name: 'Faranah',
    communes: [
      { label: 'Faranah', value: 'faranah' },
      { label: 'Kissidougou', value: 'kissidougou' },
    ],
  },
  {
    name: 'Kankan',
    communes: [
      { label: 'Kankan', value: 'kankan' },
      { label: 'Siguiri', value: 'siguiri' },
    ],
  },
  {
    name: "N'Zerekore",
    communes: [
      { label: "N'Zérékoré", value: 'nzerekore' },
      { label: 'Macenta', value: 'macenta' },
      { label: 'Guéckédou', value: 'gueckedou' },
    ],
  },
]

// Groupes {label, options} pour un sélecteur multi-commune (ouvrier) — même
// forme que LOCATION_GROUPS côté site public.
const LOCATION_GROUPS = REGIONS.map((r) => ({
  label: r.name === 'Conakry' ? 'Conakry (Communes)' : r.name,
  options: r.communes,
}))

// Liste plate, toutes régions confondues — pour un sélecteur commune unique (agent).
export const ALL_COMMUNES = LOCATION_GROUPS.flatMap((group) => group.options)

export const AGENT_PROPERTY_TYPES = [
  { label: 'Location', value: 'location' },
  { label: 'Location journalière', value: 'journaliere' },
  { label: 'Vente', value: 'vente' },
  { label: 'Terrain', value: 'terrain' },
]

export const WORKER_SPECIALTIES = [
  { value: 'plomberie', label: 'Plomberie' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'peinture', label: 'Peinture' },
  { value: 'menuiserie', label: 'Menuiserie' },
  { value: 'maconnerie', label: 'Maçonnerie' },
  { value: 'climatisation', label: 'Climatisation' },
  { value: 'nettoyage', label: 'Nettoyage' },
  { value: 'jardinage', label: 'Jardinage' },
  { value: 'carrelage', label: 'Carrelage' },
  { value: 'serrurerie', label: 'Serrurerie' },
  { value: 'autre', label: 'Autre' },
]

export const WORKER_PRICE_RANGES = [
  'Moins de 50 000 GNF',
  '50 000 - 100 000 GNF',
  '100 000 - 200 000 GNF',
  '200 000 - 500 000 GNF',
  'Plus de 500 000 GNF',
  'Sur devis',
]

