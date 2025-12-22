
export const zones = [
  { label: 'Matam', value: 'Matam' },
  { label: 'Kaloum', value: 'Kaloum' },
  { label: 'Dixinn', value: 'Dixinn' },
  { label: 'Ratoma', value: 'Ratoma' },
  { label: 'Matoto', value: 'Matoto' },
]
export const userRole = [
  { label: 'manager', value: 'manager' },

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
  { label: 'Maison', value: 'Maison' },
  { label: 'Appartement', value: 'Appartement' },
  { label: 'Bureaux', value: 'Bureaux' },


]
export const offerType = [
  { label: 'Vente', value: 'Vente' },
  { label: 'Location', value: 'Location' },
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



