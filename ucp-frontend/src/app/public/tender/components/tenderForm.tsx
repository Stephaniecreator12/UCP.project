"use client";
import { useState } from "react";
import { createTender} from "@/services/procurement";
export default function TenderForm() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors('');

    const formElement = e.currentTarget;
    const formData = new FormData(formElement);

    const selectedFunding = Array.from(formData.getAll("funding_sources"));
    formData.delete("funding_sources");
    formData.append("funding_sources", JSON.stringify(selectedFunding));

    try {
      await createTender(formData);
      alert("Appel d'offre créé avec succès !");
    } catch (err) {
      setErrors("Erreur lors de l'affichage du formulaire");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="title" placeholder="Intitulé du marché" required className="border p-2 w-full" />
      
      <select name="procedure_type" className="border p-2 w-full">
        <option value="AOI">AOI (International)</option>
        <option value="DC">DC (Cotation)</option>
      </select>

      {/* Section B: Financement (Checkboxes) */}
      <div className="flex gap-4">
        <label><input type="checkbox" name="funding_sources" value="Fonds Mondial" /> Fonds Mondial</label>
        <label><input type="checkbox" name="funding_sources" value="Banque Mondiale" /> Banque Mondiale</label>
      </div>

      <div>
        <label>Date limite de dépôt</label>
        <input type="datetime-local" name="submission_deadline" required className="border p-2 w-full" />
        {errors && (
          <p className="text-red-500 text-sm">{errors}</p>
        )}
      </div>

      <div>
        <label>Modèle de soumission (DOCX)</label>
        <input type="file" name="submission_template" accept=".docx" className="w-full" />
      </div>

      <div>
        <label>Documents techniques (PDF - Multiple)</label>
        <input type="file" name="uploaded_documents" multiple accept=".pdf" className="w-full" />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="bg-blue-600 text-white p-2 rounded disabled:bg-gray-400"
      >
        {loading ? "Envoi en cours..." : "Publier l'Appel d'Offre"}
      </button>
    </form>
  );
}