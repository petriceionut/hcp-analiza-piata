import { WizardData } from './ContractWizard'
import { CONTRACT_TYPES, PROPERTY_TYPES } from '@/lib/utils'

interface Props {
  data: WizardData
  agentName?: string
  showSignatures?: boolean
  clientSignature?: string
  agentSignature?: string
}

export default function ContractPreviewContent({
  data,
  agentName,
  showSignatures,
  clientSignature,
  agentSignature,
}: Props) {
  const today = new Date().toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const client = data.clientData
  const property = data.propertyData
  const tipContract = data.tipContract

  return (
    <div className="contract-preview font-serif text-sm leading-relaxed">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-lg font-bold uppercase tracking-wide mb-1">
          {tipContract && CONTRACT_TYPES[tipContract]}
        </h1>
        <p className="text-gray-500 text-xs">
          Nr. ___ / {today}
        </p>
      </div>

      {/* Parties */}
      <div className="mb-6">
        <h2 className="font-bold uppercase text-xs tracking-widest text-gray-500 mb-3 border-b border-gray-200 pb-1">
          Partile contractante
        </h2>

        <p className="mb-3">
          <strong>Agentul imobiliar</strong>: {agentName || 'HCP Imobiliare SRL'}, in calitate de
          {tipContract === 'mandat_exclusivitate' ? ' mandatar' : ' mediator'}, denumit in continuare
          <strong> &quot;Agentul&quot;</strong>,
        </p>

        <p>
          <strong>si</strong>
        </p>

        <p className="mt-3">
          <strong>Clientul</strong>:{' '}
          {client?.prenume} {client?.nume}, cetatean roman, domiciliat in{' '}
          {client?.adresa_domiciliu}, identificat cu CI/BI seria{' '}
          {client?.serie_buletin} nr. {client?.nr_buletin}, CNP{' '}
          {client?.cnp}, telefon {client?.telefon}, email {client?.email},
          denumit in continuare <strong>&quot;Clientul&quot;</strong>,
        </p>
      </div>

      {/* Property */}
      <div className="mb-6">
        <h2 className="font-bold uppercase text-xs tracking-widest text-gray-500 mb-3 border-b border-gray-200 pb-1">
          Obiectul contractului
        </h2>
        <p>
          Obiectul prezentului contract il reprezinta{' '}
          {tipContract === 'mediere_inchiriere' ? 'inchirierea' : 'vanzarea'} imobilului de tip{' '}
          <strong>{property?.tip_proprietate && PROPERTY_TYPES[property.tip_proprietate]}</strong>,
          situat la adresa: <strong>{property?.adresa}</strong>
          {property?.nr_cadastral ? `, numar cadastral ${property.nr_cadastral}` : ''}
          {property?.nr_carte_funciara ? `, inscris in CF nr. ${property.nr_carte_funciara}` : ''}.
        </p>

        {(property?.suprafata_construita || property?.suprafata_utila || property?.suprafata_teren) && (
          <p className="mt-2">
            Imobilul are urmatoarele suprafete:{' '}
            {property.suprafata_construita && `suprafata construita ${property.suprafata_construita} mp`}
            {property.suprafata_construita && property.suprafata_utila && ', '}
            {property.suprafata_utila && `suprafata utila ${property.suprafata_utila} mp`}
            {(property.suprafata_construita || property.suprafata_utila) && property.suprafata_teren && ', '}
            {property.suprafata_teren && `suprafata teren ${property.suprafata_teren} mp`}.
          </p>
        )}
      </div>

      {/* Standard clauses */}
      <div className="mb-6">
        <h2 className="font-bold uppercase text-xs tracking-widest text-gray-500 mb-3 border-b border-gray-200 pb-1">
          Clauzele contractului
        </h2>

        {tipContract === 'mandat_exclusivitate' && (
          <>
            <p className="mb-2">
              <strong>Art. 1.</strong> Clientul acorda Agentului mandat exclusiv pentru comercializarea
              proprietatii descrise mai sus, pe o perioada de 90 de zile calendaristice de la data
              semnarii prezentului contract.
            </p>
            <p className="mb-2">
              <strong>Art. 2.</strong> Agentul se obliga sa depuna toate diligentele necesare pentru
              identificarea potentialilor cumparatori/chiriasi si sa prezinte proprietatea in conditii optime.
            </p>
            <p className="mb-2">
              <strong>Art. 3.</strong> Comisionul agentului va fi stabilit conform anexei la prezentul
              contract si va fi platit la data incheierii tranzactiei.
            </p>
            <p className="mb-2">
              <strong>Art. 4.</strong> Pe durata mandatului exclusiv, Clientul nu va putea incheia contracte
              de intermediere sau mandat cu alti agenti imobiliari.
            </p>
          </>
        )}

        {tipContract === 'mediere_vanzare' && (
          <>
            <p className="mb-2">
              <strong>Art. 1.</strong> Agentul se obliga sa identifice cumparatori pentru proprietatea
              descrisa la obiectul contractului, sa organizeze vizionari si sa intermedieze negocierile
              dintre parti.
            </p>
            <p className="mb-2">
              <strong>Art. 2.</strong> Dreptul la comision al Agentului se naste la data incheierii
              contractului de vanzare-cumparare intre Vanzator si Cumparatorul adus de Agent.
            </p>
            <p className="mb-2">
              <strong>Art. 3.</strong> Prezentul contract de mediere nu este exclusiv, Clientul avand
              dreptul de a colabora cu mai multi mediatori imobiliari.
            </p>
          </>
        )}

        {tipContract === 'mediere_inchiriere' && (
          <>
            <p className="mb-2">
              <strong>Art. 1.</strong> Agentul se obliga sa identifice chiriasi pentru proprietatea
              descrisa, sa organizeze vizionari si sa intermedieze negocierile privind contractul de inchiriere.
            </p>
            <p className="mb-2">
              <strong>Art. 2.</strong> Dreptul la comision al Agentului se naste la data semnarii
              contractului de inchiriere intre Proprietar si Chirias.
            </p>
            <p className="mb-2">
              <strong>Art. 3.</strong> Comisionul agentului este egal cu valoarea unei chirii lunare,
              suportat in mod egal de catre Proprietar si Chirias, daca nu se convine altfel.
            </p>
          </>
        )}

        {tipContract === 'antecontract_vanzare' && (
          <>
            <p className="mb-2">
              <strong>Art. 1.</strong> Partile convin ca Vanzatorul se obliga sa vanda, iar Cumparatorul
              sa cumpere imobilul descris la obiectul contractului, la pretul si in conditiile stabilite
              prin prezentul antecontract.
            </p>
            <p className="mb-2">
              <strong>Art. 2.</strong> Cumparatorul va achita un avans in valoare de _____ EUR, reprezentand
              ___% din pretul de vanzare, in termen de 5 zile lucratoare de la semnarea prezentului antecontract.
            </p>
            <p className="mb-2">
              <strong>Art. 3.</strong> Contractul de vanzare-cumparare autentic va fi incheiat in termen
              de 60 de zile calendaristice de la data semnarii prezentului antecontract.
            </p>
            <p className="mb-2">
              <strong>Art. 4.</strong> In cazul nerespectarii obligatiei de vanzare de catre Vanzator,
              acesta va restitui Cumparatorului dublul avansului primit.
            </p>
          </>
        )}
      </div>

      {/* Derogations */}
      {data.derogari && (
        <div className="mb-6">
          <h2 className="font-bold uppercase text-xs tracking-widest text-gray-500 mb-3 border-b border-gray-200 pb-1">
            Derogari si clauze speciale
          </h2>
          <p className="whitespace-pre-line">{data.derogari}</p>
        </div>
      )}

      {/* General provisions */}
      <div className="mb-6">
        <h2 className="font-bold uppercase text-xs tracking-widest text-gray-500 mb-3 border-b border-gray-200 pb-1">
          Dispozitii finale
        </h2>
        <p className="mb-2">
          Prezentul contract a fost incheiat in 2 (doua) exemplare, cate unul pentru fiecare parte,
          avand aceeasi valoare juridica.
        </p>
        <p>
          Eventualele litigii decurgand din sau in legatura cu prezentul contract vor fi solutionate
          pe cale amiabila sau, in caz de esec, de instanta judecatoreasca competenta.
        </p>
      </div>

      {/* Signatures */}
      <div className="mt-10 grid grid-cols-2 gap-8">
        <div>
          <p className="font-bold text-center mb-2">AGENT</p>
          <p className="text-center text-xs text-gray-500 mb-4">{agentName || 'HCP Imobiliare SRL'}</p>
          {showSignatures && agentSignature ? (
            <div className="border border-gray-300 rounded h-20 flex items-center justify-center">
              <img src={agentSignature} alt="Semnatura agent" className="max-h-16 max-w-full" />
            </div>
          ) : (
            <div className="border-b-2 border-gray-400 mt-12" />
          )}
          <p className="text-center text-xs text-gray-400 mt-1">Data: {today}</p>
        </div>

        <div>
          <p className="font-bold text-center mb-2">CLIENT</p>
          <p className="text-center text-xs text-gray-500 mb-4">
            {client?.prenume} {client?.nume}
          </p>
          {showSignatures && clientSignature ? (
            <div className="border border-gray-300 rounded h-20 flex items-center justify-center">
              <img src={clientSignature} alt="Semnatura client" className="max-h-16 max-w-full" />
            </div>
          ) : (
            <div className="border-b-2 border-gray-400 mt-12" />
          )}
          <p className="text-center text-xs text-gray-400 mt-1">Data: {today}</p>
        </div>
      </div>
    </div>
  )
}
