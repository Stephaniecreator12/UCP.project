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
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M14.8 5.2l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12.2 7.8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M4.8 19.2l7.6-7.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M4.4 15.6l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (item === "goods-services") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="4" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    <aside className="sticky top-[82px] self-start rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-3 shadow-[var(--shadow)] max-[1150px]:static">
      <div className="px-2 pb-2">
        <div
          className="h-[3px] rounded-full bg-[linear-gradient(90deg,var(--green),#67d89f)]"
          aria-hidden="true"
        />
      </div>

      <nav className="grid gap-2">
        {MENU_ITEMS.map((item: MenuItemType) => {
          const config = TABLE_CONFIGS[item];
          const isActive = activeMenu === item;

          return (
            <button
              key={item}
              className={`grid grid-cols-[18px_1fr] items-center gap-2 rounded-[10px] border px-3 py-2 text-left transition ${
                isActive
                  ? "border-[color-mix(in_srgb,var(--green)_55%,white)] bg-[color-mix(in_srgb,var(--green-soft)_72%,white)] font-bold text-[#0e7f47]"
                  : "border-[var(--line)] bg-white text-[#34414f] hover:bg-slate-50"
              }`}
              onClick={() => onMenuSelect(item)}
              title={config.label}
            >
              <span className="h-[18px] w-[18px] [&_svg]:h-[18px] [&_svg]:w-[18px]">
                {renderMenuIcon(item)}
              </span>
              <span>{config.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
