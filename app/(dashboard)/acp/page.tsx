import ACPClient from '@/components/acp/ACPClient'

export default function ACPPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Analiza Comparativa de Piata</h1>
        <p className="text-slate-500 mt-1">
          Genereaza rapoarte comparative profesionale cu ajutorul AI
        </p>
      </div>
      <ACPClient />
    </div>
  )
}
