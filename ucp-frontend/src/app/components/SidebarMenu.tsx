"use client";

import React from "react";
import Image from "next/image";
import { MenuItemType } from "@/types/grid";
import { MENU_ITEMS, TABLE_CONFIGS } from "@/config/tableConfigs";

interface SidebarMenuProps {
  activeMenu: MenuItemType;
  onMenuSelect: (menu: MenuItemType) => void;
}

function MenuIcon({ item }: { item: MenuItemType }) {
  if (item === "works") {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M5 6l3-3 4.5 4.5-3 3L5 6zm9.5 9.5 3-3L22 17l-3 3-4.5-4.5zM10 9l5 5m-8 5 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (item === "goods-services") {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M3 8.5A2.5 2.5 0 0 1 5.5 6H10l1.8 2H18.5A2.5 2.5 0 0 1 21 10.5V17a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8.5z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M7 13h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="7.5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.8 19c.9-3.1 2.9-4.9 6.2-4.9s5.3 1.8 6.2 4.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M13.7 12.3 15 9.8l1.3 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function SidebarMenu({
  activeMenu,
  onMenuSelect,
}: SidebarMenuProps) {
  return (
    <aside className="sidebar-menu">
      <div className="sidebar-glow" aria-hidden="true" />

      <div className="sidebar-header">
        <div className="brand-logo" aria-hidden="true">
          <Image
            src="/ucp-sante-logo.svg"
            alt="Logo UCP Sante"
            width={210}
            height={120}
            className="brand-logo-image"
            priority
          />
        </div>
        <div className="sidebar-brand-text">
          <h2 className="sidebar-title">UCP</h2>
          <p className="sidebar-subtitle">Unite de coordination de projet</p>
          <p className="sidebar-subtitle sidebar-subtitle-small">
            Passation de marches
          </p>
        </div>
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
              <span className="menu-icon">
                <MenuIcon item={item} />
              </span>
              <span className="menu-label">{config.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-status-dot" />
      </div>
    </aside>
  );
}
