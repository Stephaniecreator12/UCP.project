/**
 * Formulaire pour créer ou modifier un procurement
 */
"use client";

import { useState } from "react";
import { createProcurement } from "@/services/api";
import type { Procurement } from "@/services/api";

export default function ProcurementForm() {
  const [formData, setFormData] = useState<Procurement>({
    ref_number: "",
    title: "",
    tracking_code: "",
    estimated_amount: 0,
    method: "open",
    approach: "review",
    review_notes: "",
    pricing_type: "forfait",
    reference_time: 0,
    ami: false,
    restricted_list: false,
    request_for_proposal: false,
    date_invitation: "",
    date_opening_submissions: "",
    date_opening_financial: "",
    date_contract_signed: "",
    date_mission_end: "",
    status: "draft",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else if (type === "number") {
      setFormData({
        ...formData,
        [name]: parseFloat(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createProcurement(formData);

    if (result) {
      setMessage("✅ Procurement créé avec succès!");
      // Réinitialiser le formulaire
      setFormData({
        ref_number: "",
        title: "",
        tracking_code: "",
        estimated_amount: 0,
        method: "open",
        approach: "review",
        review_notes: "",
        pricing_type: "forfait",
        reference_time: 0,
        ami: false,
        restricted_list: false,
        request_for_proposal: false,
        date_invitation: "",
        date_opening_submissions: "",
        date_opening_financial: "",
        date_contract_signed: "",
        date_mission_end: "",
        status: "draft",
      });
    } else {
      setMessage("❌ Erreur lors de la création");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Créer un Nouveau Procurement
      </h1>

      {message && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded text-blue-800">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type of Procurement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de Marché *
          </label>
          <select
            name="type"
            value={formData.type || "Travaux"}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Travaux">Travaux</option>
            <option value="Biens">Biens</option>
            <option value="Consultance">Consultance</option>
          </select>
        </div>

        {/* Ref Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de Référence *
          </label>
          <input
            type="text"
            name="ref_number"
            value={formData.ref_number}
            onChange={handleChange}
            required
            placeholder="Ex: REF-2026-001"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre / AGMO / DIRECTION *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Titre du procurement"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Tracking Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Code de Suivi
          </label>
          <input
            type="text"
            name="tracking_code"
            value={formData.tracking_code}
            onChange={handleChange}
            placeholder="Code de suivi"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Estimated Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Montant Estimatif ($)
          </label>
          <input
            type="number"
            name="estimated_amount"
            value={formData.estimated_amount}
            onChange={handleChange}
            step="0.01"
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Méthode *
          </label>
          <select
            name="method"
            value={formData.method}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="open">Appel d'offres ouvert</option>
            <option value="restricted">Appel d'offres restreint</option>
            <option value="rfp">Demande de proposition</option>
            <option value="direct">Gré à gré</option>
          </select>
        </div>

        {/* Approach */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Approche *
          </label>
          <select
            name="approach"
            value={formData.approach}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="review">Revue</option>
            <option value="forfait">Forfait</option>
            <option value="time_based">Temps passé</option>
          </select>
        </div>

        {/* Review Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes de Revue
          </label>
          <textarea
            name="review_notes"
            value={formData.review_notes}
            onChange={handleChange}
            placeholder="Notes..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Pricing Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de Tarification *
          </label>
          <select
            name="pricing_type"
            value={formData.pricing_type}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="forfait">Forfait</option>
            <option value="review">Revue</option>
            <option value="time_based">Temps passé</option>
          </select>
        </div>

        {/* Reference Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Temps de Référence (heures/jours)
          </label>
          <input
            type="number"
            name="reference_time"
            value={formData.reference_time}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Checkboxes */}
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="ami"
              checked={formData.ami}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              AMI (Appel à manifestation d'intérêt)
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="restricted_list"
              checked={formData.restricted_list}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Liste restreinte</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="request_for_proposal"
              checked={formData.request_for_proposal}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Demande de proposition (RFP)
            </span>
          </label>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date d'Invitation
            </label>
            <input
              type="date"
              name="date_invitation"
              value={formData.date_invitation}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Ouverture Plis (Technique)
            </label>
            <input
              type="date"
              name="date_opening_submissions"
              value={formData.date_opening_submissions}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Ouverture Plis Financiers
            </label>
            <input
              type="date"
              name="date_opening_financial"
              value={formData.date_opening_financial}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Signature Contrat
            </label>
            <input
              type="date"
              name="date_contract_signed"
              value={formData.date_contract_signed}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            {loading ? "En cours..." : "Créer le Procurement"}
          </button>
        </div>
      </form>
    </div>
  );
}
