
export const zones = [
  { label: 'Matam', value: 'Matam' },
  { label: 'Kaloum', value: 'Kaloum' },
  { label: 'Dixinn', value: 'Dixinn' },
  { label: 'Ratoma', value: 'Ratoma' },
  { label: 'Matoto', value: 'Matoto' },
]
export const userRole = [
  { label: 'manager', value: 'manager' },
  { label: 'admin', value: 'admin' },

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
export const houseType = [
  { value: 'house', label: 'Maison' },
  { value: 'apartment', label: 'Appartement' },
  { value: 'studio', label: 'Studio' },
  { value: 'villa', label: 'Villa' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'building', label: 'Immeuble' },
  { value: 'shop', label: 'Magasin' },
  { value: 'office', label: 'Bureau' },
  { value: 'warehouse', label: 'Entrepôt' },
]

export const offerType = [
  { value: 'rent', label: 'Louer' },
  { value: 'buy', label: 'Vendre' },
  { value: 'bail', label: 'Bail' },
]

export const commodites = [
  { label: 'Terrasse', value: 'Terrasse' },
  { label: 'Jardin', value: 'Jardin' },
  { label: 'Picine', value: 'Picine' },
  { label: "Balcon", value: 'Balcon' },
  { label: 'Autre', value: 'Autre' },

]

export const furnishingOptions = [
  { label: 'non-meublé', value: 'non-meublé' },
  { label: 'meublé', value: 'meublé' },
  { label: 'semi-meublé', value: 'semi-meublé' },
]

export const currencyOptions = [
  { label: 'GNF', value: 'GNF' },
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
]

export const townOptions = [
  { label: 'Conakry', value: 'conakry' }
]







export const getCategoriesOptions = (categories) => {
  return categories.map(category => {
    return { label: category.name, value: category.id }
  })
}

export const towns = {

  "Kaloum": [
    { label: "Almamya", value: "Almamya" },
    { label: "Boulbinet", value: "Boulbinet" },
    { label: "Coronthie", value: "Coronthie" },
    { label: "kaloum", value: "Kaloum" },
    { label: "Kouléwondy", value: "Kouléwondy" },
    { label: "Manquepas", value: "Manquepas" },
    { label: "Sandervalia", value: "Sandervalia" },
    { label: "Sans-fil", value: "Sans-fil" },
    { label: "Témitaye", value: "Témitaye" },
    { label: "Tombo", value: "Tombo" },
  ]
  ,

  "Dixinn": [
    { label: "Belle-vues", value: "Belle-vues" },
    { label: "Camayenne", value: "Camayenne" },
    { label: "Cameroun", value: "Cameroun" },
    { label: "Dixinn", value: "Dixinn" },
    { label: "Hafia", value: "Hafia" },
    { label: "Kénien", value: "Kénien" },
    { label: "Landréah", label: "Landréah" },
    { label: "Minière", value: "Minière" },
  ]
  ,

  "Matoto": [
    { label: "Béanzin", value: "Béanzin" },
    { label: "Camp Alpha Yaya Diallo", value: "Camp Alpha Yaya Diallo" },
    { label: "Cité de l'air", value: "Cité de l'air" },
    { label: "Dabompa", value: "Dabompa" },
    { label: "Dabondy", value: "Dabondy" },
    { label: "Dar-es-salam", value: "Dar-es-salam" },
    { label: "Gbéssia", value: "Gbéssia" },
    { label: "Kissosso", value: "Kissosso" },
    { label: "Matoto", value: "Matoto" },
    { label: "Enta", value: "Enta" },
    { label: "Aviation", value: "Aviation" }
  ]
  ,

  "Ratoma": [
    { label: "Cobaya-Fossidè", value: "Fossidè" },
    { label: "Hamdalaye", value: "Hamdalaye" },
    { label: "Kaporo", value: "Kaporo" },
    {
      label: "Kipé", value: "Kipé"
    },
    { label: "Cosa", value: "Cosa", },
    { label: "Koloma", value: "Koloma" },
    { label: "Lambandji", value: "Lambandji" },
    { label: "Nongo", value: "Nongo" },
    { label: "Ratoma", value: "Ratoma" },
    { label: "demoudoula", value: "demoula" },
    { label: "Bomboli", value: "Bomboli" },
    { label: "Simanbossia", value: "Simanbossia" },
    { label: "Simbaya", value: "Simbaya" },
    { label: "Sonfonia", value: "Sonfonia" },
    { label: "Taouyah", value: "Taouyah" },
    { label: "Wanindara", value: "Wanindara" },
    { label: "Yattayah", value: "Yattayah" },
  ]
  ,

  "Matam": [
    { label: "Boussoura", value: "Boussoura" },
    { label: "Carrière", value: "Carrière" },
    { label: "Domino", value: "Domino" },
    { label: "Hermakönon", value: "Hermakönon" },
    { label: "Coléah", value: "Coléah" },
    { label: "Imprimerie", value: "Imprimerie" },
    { label: "Lanséboudji", value: "Lanséboudji" },
    { label: "Madina", value: "Madina" },
    { label: "Mafanco", value: "Mafanco" },
    { label: "Touguiwondy", value: "Touguiwondy" }
  ]
  ,

  "Coyah": [
    { label: "Coyah-Centre", value: "Coyah-Centre" },
    { label: "Kouriah", value: "Kouriah" },
    { label: "Manéah", value: "Manéah" },
    { label: "Wonkifong", value: "Wonkifong" }
  ]

}

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

export const QUARTIER_TYPES = [
  { label: "Résidentiel", value: "résidentiel" },
  { label: "Commercial", value: "commercial" },
  { label: "Administratif", value: "administratif" },
  { label: "Industriel", value: "industriel" },
  { label: "Mixte", value: "mixte" },
  { label: "Touristique", value: "touristique" },
  { label: "Militaire", value: "militaire" },
]

export const CONAKRY_QUARTIERS = {
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

/** Retourne les quartiers d'une commune donnée */
export const getQuartiersByCommune = (communeValue) => {
  return CONAKRY_QUARTIERS[communeValue] || []
}


