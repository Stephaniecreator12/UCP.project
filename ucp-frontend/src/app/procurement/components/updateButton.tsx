"use client";
import React from 'react';
import { useRouter } from "next/navigation";
import { useAccess } from '@/context/accessContext';
interface UpdateMarketButtonProps {
  marketId: string;
}

export const UpdateMarketButton: React.FC<UpdateMarketButtonProps> = ({ marketId }) => {
  const router = useRouter();
  const {accessType} = useAccess()

  return (
    <>
    { accessType == "private"&&
    (<button
      onClick={() => router.replace(`/admin/procurement/${marketId}/update`)}
      className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-gray-300 hover:bg-slate-50 rounded-lg shadow-sm transition-all duration-200 text-center"
    >
      Modifier le marché
    </button>
)}
</>
  );
};