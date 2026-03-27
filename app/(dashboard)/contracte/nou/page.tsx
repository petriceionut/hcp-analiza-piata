import ContractWizard from '@/components/contracte/ContractWizard'

export default function NouContractPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Contract nou</h1>
        <p className="text-slate-500 mt-1">Completeaza pasii de mai jos pentru a genera contractul</p>
      </div>
      <ContractWizard />
    </div>
  )
}
