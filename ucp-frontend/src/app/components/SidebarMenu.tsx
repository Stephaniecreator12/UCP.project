"use client";

import React from "react";
import { MenuItemType } from "@/types/grid";
import { MENU_ITEMS, TABLE_CONFIGS } from "@/config/tableConfigs";


// Les props qu'on reçoit
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
    <aside className="sidebar-menu">
      <div className="sidebar-glow" aria-hidden="true" />

      <div className="sidebar-header">
        <div className="sidebar-header-line" aria-hidden="true" />
      </div>

      <nav className="sidebar-nav">
        {MENU_ITEMS.map((item: MenuItemType) => {
          const config = TABLE_CONFIGS[item];

          return (
            <button
              key={item}
              className={`sidebar-menu-item ${activeMenu === item ? "active" : ""}`}
              onClick={() => onMenuSelect(item)}
              title={config.label}
            >
              <span className="menu-icon">{renderMenuIcon(item)}</span>
              <span className="menu-label">{config.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
