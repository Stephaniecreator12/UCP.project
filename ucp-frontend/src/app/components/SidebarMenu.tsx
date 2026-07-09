"use client";

import React from "react";
import { MenuItemType } from "@/types/grid";
import { MENU_ITEMS, TABLE_CONFIGS } from "@/config/tableConfigs";

interface SidebarMenuProps {
  activeMenu: MenuItemType;
  onMenuSelect: (menu: MenuItemType) => void;
}

const renderMenuIcon = (item: MenuItemType) => {
  if (item === "works") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[18px] h-[18px]">
        <path d="M14.8 5.2l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12.2 7.8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M4.8 19.2l7.6-7.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M4.4 15.6l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (item === "goods-services") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[18px] h-[18px]">
        <rect x="4" y="5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="4" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[18px] h-[18px]">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 19.2a6.5 6.5 0 0113 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
};

export default function SidebarMenu({
  activeMenu,
  onMenuSelect,
}: SidebarMenuProps) {
  return (
<aside 
  className="flex w-[200px] flex-col rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.12)] max-[1150px]:static max-[1150px]:w-full min-[1151px]:h-[calc(100vh-15px)]"
>      <div className="p-2 mb-2">
        <div className="h-[3px] rounded-full bg-gradient-to-r from-emerald-500 to-green-400" aria-hidden="true" />
      </div>

      <nav className="grid gap-[0.45rem] mt-2">
        {MENU_ITEMS.map((item: MenuItemType) => {
          const config = TABLE_CONFIGS[item];
          const isActive = activeMenu === item;

          return (
            <button
              key={item}
              className={`text-[0.85rem] grid grid-cols-[18px_1fr] items-center gap-[0.6rem] border rounded-xl py-[0.6rem] px-[0.7rem] text-left cursor-pointer transition-all ${
                isActive
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-bold shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100/50 hover:text-slate-900 hover:border-slate-300"
              }`}
              onClick={() => onMenuSelect(item)}
              title={config.label}
            >
              <span>{renderMenuIcon(item)}</span>
              <span>{config.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
