/**
 * Page pour créer un nouveau procurement
 */
import ProcurementForm from "@/components/ProcurementForm";

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">e-Proc UCP</h1>
            <p className="text-sm text-gray-600">
              Système de Gestion des Procurements
            </p>
          </div>
        </div>
      </nav>
      <ProcurementForm />
    </main>
  );
}
