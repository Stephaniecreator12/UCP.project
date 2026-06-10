"use client";
import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import { deleteMarketById } from '@/services/procurement';

interface DeleteMarketButtonProps {
  marketId: string;
  marketTitle: string;
}

export const DeleteMarketButton: React.FC<DeleteMarketButtonProps> = ({ marketId, marketTitle }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
  setIsDeleting(true);
  setApiError(null);

  const result = await deleteMarketById(marketId);

  if (!result.error) {
    setShowConfirmModal(false);
    router.replace('/procurement'); 
  } else {
    let finalMessage = "Impossible de supprimer ce marché.";

    if (typeof result.message === 'string') {
      finalMessage = result.message;
    } else if (result.message && typeof result.message === 'object') {
      finalMessage = Object.values(result.message).flat().join(', ') || finalMessage;
    }

    setApiError(finalMessage);
    setIsDeleting(false);
  }
};

  return (
    <>
      <button
        onClick={() => setShowConfirmModal(true)}
        className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-transparent rounded-lg transition-all duration-200"
      >
        Supprimer
      </button>

      {apiError && (
        <p className="text-xs text-red-600 font-medium mt-1 bg-red-50 p-2 rounded border border-red-100 absolute transform translate-y-12">
          ⚠️ {apiError}
        </p>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4 border border-gray-100">
            
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600 text-xl font-bold mb-4">
              ⚠️
            </div>

            <h3 className="text-lg font-bold text-gray-900">Supprimer définitivement ?</h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Vous êtes sur le point de supprimer le marché <span className="font-semibold text-gray-800">{marketTitle}</span>. 
              Cette action effacera toutes les données associées et est **irréversible**.
            </p>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                disabled={isDeleting}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Suppression...
                  </>
                ) : (
                  "Confirmer la suppression"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};