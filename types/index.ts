export type ContractType =
  | 'mandat_exclusivitate'
  | 'mediere_vanzare'
  | 'mediere_inchiriere'
  | 'antecontract_vanzare'

export type PropertyType =
  | 'apartament'
  | 'casa'
  | 'teren'
  | 'spatiu_comercial'
  | 'spatiu_industrial'

export type ContractStatus =
  | 'draft'
  | 'trimis_client'
  | 'semnat_client'
  | 'semnat_ambele'
  | 'finalizat'

export type DealRoomStatus =
  | 'activ'
  | 'oferta_acceptata'
  | 'inchis'

export type OfferStatus =
  | 'in_asteptare'
  | 'acceptata'
  | 'respinsa'

export interface ClientData {
  nume: string
  prenume: string
  serie_buletin: string
  nr_buletin: string
  cnp: string
  adresa_domiciliu: string
  telefon: string
  email: string
}

export interface PropertyData {
  tip_proprietate: PropertyType
  adresa: string
  suprafata_construita?: number
  suprafata_utila?: number
  suprafata_teren?: number
  nr_cadastral?: string
  nr_carte_funciara?: string
  etaj?: string
  nr_camere?: number
  an_constructie?: number
}

export interface Contract {
  id: string
  agent_id: string
  tip_contract: ContractType
  client_data: ClientData
  property_data: PropertyData
  derogari?: string
  status: ContractStatus
  pdf_url?: string
  client_token?: string
  agent_token?: string
  client_semnat_la?: string
  agent_semnat_la?: string
  client_semnatura?: string
  agent_semnatura?: string
  created_at: string
  updated_at: string
}

export interface DealRoom {
  id: string
  contract_id: string
  agent_id: string
  tip_proprietate: PropertyType
  adresa_scurta: string
  status: DealRoomStatus
  owner_token?: string
  created_at: string
  updated_at: string
  documente?: DealRoomDocument[]
  cumparatori?: Buyer[]
  oferte?: Offer[]
}

export interface DealRoomDocument {
  id: string
  dealroom_id: string
  nume: string
  url: string
  tip: string
  uploaded_at: string
}

export interface Buyer {
  id: string
  dealroom_id: string
  nume: string
  prenume: string
  telefon: string
  email?: string
  token: string
  added_at: string
}

export interface Offer {
  id: string
  dealroom_id: string
  buyer_id: string
  suma: number
  mesaj?: string
  status: OfferStatus
  created_at: string
}

export interface Agent {
  id: string
  email: string
  nume?: string
  prenume?: string
  telefon?: string
  created_at: string
}

export interface ACPRequest {
  tip_proprietate: PropertyType
  judet: string
  localitate: string
  suprafata_mp: number
  nr_camere?: number
  an_constructie?: number
  etaj?: string
  observatii?: string
}

export interface ACPResult {
  pret_minim: number
  pret_maxim: number
  pret_median: number
  pret_mediu: number
  pret_mp_mediu: number
  proprietati_comparabile: ComparableProperty[]
  analiza_text: string
  recomandare_pret: number
  factori_pozitivi: string[]
  factori_negativi: string[]
}

export interface ComparableProperty {
  adresa: string
  pret: number
  suprafata: number
  pret_mp: number
  nr_camere?: number
  an_constructie?: number
  sursa: string
  data_listare: string
}
