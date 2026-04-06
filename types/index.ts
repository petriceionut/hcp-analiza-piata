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
  | 'vizualizat_client'
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
  signwell_document_id?: string
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

export interface DealRoomClient {
  id: string
  dealroom_id: string
  nume: string
  prenume: string
  telefon: string
  email: string
  data_vizionare: string | null
  ora_vizionare: string | null
  created_at: string
}

export interface DocumentScanat {
  id: string
  dealroom_id: string
  agent_id: string
  file_url: string
  file_name: string
  nr_pagini: number
  created_at: string
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

export type ACPStare = 'Renovata' | 'Stare buna' | 'Necesita renovare'
export type ACPTip = 'Apartament' | 'Casa/Vila' | 'Teren' | 'Spatiu Comercial'

export interface ACPSubiect {
  tip: ACPTip
  adresa: string
  // common
  suprafata: number
  an_constructie?: number
  stare?: ACPStare
  pret_solicitat?: number        // EUR
  // Apartament + Spatiu Comercial
  etaj?: string
  // Apartament + Casa/Vila
  nr_camere?: number
  // Casa/Vila
  suprafata_teren?: number
  nr_etaje?: number
  // Teren
  deschidere_strada?: number
  clasificare?: 'Intravilan' | 'Extravilan'
  // Casa/Vila + Teren
  utilitati?: string[]
}

export interface ACPComparabila {
  adresa: string
  suprafata: number
  nr_camere?: number
  etaj?: string
  stare?: ACPStare
  pret_cerut: number             // EUR
  link_anunt?: string
}

export interface ACPAnalysisResult {
  pret_recomandat_min: number
  pret_recomandat_max: number
  pret_recomandat: number
  analiza: string
  observatii_comparabile: string[]
}
