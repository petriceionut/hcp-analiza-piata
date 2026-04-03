import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ContractType, PropertyType } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export const CONTRACT_TYPES: Record<ContractType, string> = {
  mandat_exclusivitate: 'Contract de Mandat Exclusivitate',
  mediere_vanzare: 'Contract de Mediere V\u00e2nzare',
  mediere_inchiriere: 'Contract de Mediere \u00cenchiriere',
  antecontract_vanzare: 'Antecontract de V\u00e2nzare-Cump\u0103rare',
}

export const PROPERTY_TYPES: Record<PropertyType, string> = {
  apartament: 'Apartament',
  casa: 'Cas\u0103',
  teren: 'Teren',
  spatiu_comercial: 'Spa\u021biu Comercial',
  spatiu_industrial: 'Spa\u021biu Industrial',
}

export const PROPERTY_ICONS: Record<PropertyType, string> = {
  apartament: '\ud83c\udfe2',
  casa: '\ud83c\udfe0',
  teren: '\ud83c\udf3f',
  spatiu_comercial: '\ud83c\udfea',
  spatiu_industrial: '\ud83c\udfed',
}

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  draft: 'Ciorn\u0103',
  trimis_client: 'Trimis clientului',
  vizualizat_client: 'Vizualizat de client',
  semnat_client: 'Semnat de client',
  semnat_ambele: 'Semnat de ambele p\u0103r\u021bi',
  finalizat: 'Finalizat',
}

export const CONTRACT_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  trimis_client: 'bg-yellow-100 text-yellow-700',
  vizualizat_client: 'bg-orange-100 text-orange-700',
  semnat_client: 'bg-blue-100 text-blue-700',
  semnat_ambele: 'bg-green-100 text-green-700',
  finalizat: 'bg-green-100 text-green-700',
}

export const DEALROOM_STATUS_LABELS: Record<string, string> = {
  activ: 'Activ',
  oferta_acceptata: 'Ofert\u0103 Acceptat\u0103',
  inchis: '\u00cenchis',
}

export function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Extracts date of birth from a Romanian CNP (13-digit personal ID).
 * Digit 1: 1/2 = 1900s, 3/4 = 1800s, 5/6 = 2000s (male/female pairs).
 * Digits 2-3: year, 4-5: month, 6-7: day.
 * Returns ISO date string YYYY-MM-DD or null if invalid.
 */
export function extractDateOfBirthFromCNP(cnp: string): string | null {
  if (!cnp || cnp.length !== 13 || !/^\d{13}$/.test(cnp)) return null

  const s = parseInt(cnp[0], 10)
  const yy = cnp.substring(1, 3)
  const mm = cnp.substring(3, 5)
  const dd = cnp.substring(5, 7)

  let century: string
  if (s === 1 || s === 2) century = '19'
  else if (s === 3 || s === 4) century = '18'
  else if (s === 5 || s === 6) century = '20'
  else return null // 7/8 = residents/foreigners, 9 = other — no reliable birth year

  const isoDate = `${century}${yy}-${mm}-${dd}`
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return null
  // Verify date parts didn't overflow (e.g. Feb 30)
  if (
    d.getFullYear() !== parseInt(`${century}${yy}`, 10) ||
    d.getMonth() + 1 !== parseInt(mm, 10) ||
    d.getDate() !== parseInt(dd, 10)
  ) return null

  return isoDate
}
