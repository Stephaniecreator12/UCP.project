"use client";
import React from 'react';
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';
interface UpdateMarketButtonProps {
  marketId: string;
}

export const UpdateMarketButton: React.FC<UpdateMarketButtonProps> = ({ marketId }) => {
  const router = useRouter();
  const groups: string[] = JSON.parse(Cookies.get("groups") ?? "[]");
  const showButton = groups.length > 0 && !groups.includes("PUBLIC");

  return (
    <>
    { showButton &&
    (<button
      onClick={() => router.replace(`/personnel/procurement/${marketId}/update`)}
      className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-gray-300 hover:bg-slate-50 rounded-lg shadow-sm transition-all duration-200 text-center"
    >
      Modifier le marché
    </button>
)}
</>
  );
};