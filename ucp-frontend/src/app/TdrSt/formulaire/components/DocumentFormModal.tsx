"use client";

import { TdrStDocument, TdrStFormState, makeEmptyForm } from "../hooks/useTdrStData";

type DocumentFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<boolean>;
  form: TdrStFormState;
  setForm: (form: TdrStFormState) => void;
  activeDoc: TdrStDocument | null;
  isReadOnly: boolean;
  loading: boolean;
  title?: string;
};

export function DocumentFormModal({
  isOpen,
  onClose,
  onSave,
  form,
  setForm,
  activeDoc,
  isReadOnly,
  loading,
  title,
}: DocumentFormModalProps) {
  if (!isOpen) return null;

  const handleSave = async () => {
    const success = await onSave();
    if (success) onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-6">
        <div className="relative w-full max-w-4xl">
          <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 ${isReadOnly ? "opacity-75" : ""}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {title || (activeDoc ? "Détail du document" : "Nouveau brouillon")}
              </h2>
              <button
                type="button"
                className="rounded-full bg-white/90 px-2.5 py-1 text-sm font-semibold text-slate-700 shadow transition hover:bg-white"
                onClick={onClose}
              >
                ×
              </button>
            </div>

            {/* Form fields - simplified for brevity, you can reuse your existing form JSX */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium">Unité technique *</span>
                <input
                  disabled={isReadOnly}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={form.unite_technique}
                  onChange={(e) => setForm({ ...form, unite_technique: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium">Type de document *</span>
                <select
                  disabled={isReadOnly}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={form.type_document}
                  onChange={(e) => setForm({ ...form, type_document: e.target.value as "TDR" | "ST" })}
                >
                  <option value="TDR">TDR</option>
                  <option value="ST">ST</option>
                </select>
              </label>
            </div>

            {/* Add more form fields as needed */}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-50"
                onClick={handleSave}
                disabled={loading || isReadOnly}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}