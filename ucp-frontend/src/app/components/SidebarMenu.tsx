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
  className="h-[calc(85vh-15px)] w-[200px] flex flex-col border border-[#d9dee3] rounded-[14px] bg-white shadow-[0_18px_36px_-30px_rgba(34,44,52,0.5)] p-4 max-[1150px]:static"
>      <div className="p-2 mb-2">
        <div className="h-[3px] rounded-full bg-gradient-to-r from-[#0ea85b] to-[#67d89f]" aria-hidden="true" />
      </div>

      <nav className="grid gap-[0.45rem] mt-2">
        {MENU_ITEMS.map((item: MenuItemType) => {
          const config = TABLE_CONFIGS[item];
          const isActive = activeMenu === item;

          return (
            <button
              key={item}
              className={`text-[0.85rem] grid grid-cols-[18px_1fr] items-center gap-[0.6rem] border rounded-[10px] py-[0.6rem] px-[0.7rem] text-left cursor-pointer transition-colors ${
                isActive
                  ? "border-[#76cba0] bg-[#eaf9f0] text-[#0e7f47] font-bold"
                  : "border-[#d9dee3] bg-white text-[#34414f]"
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