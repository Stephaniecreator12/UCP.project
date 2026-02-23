"use client";

import React from "react";
import Image from "next/image";
import { MenuItemType } from "@/types/grid";
import { MENU_ITEMS, TABLE_CONFIGS } from "@/config/tableConfigs";


// Les props qu'on reçoit
interface SidebarMenuProps {
  activeMenu: MenuItemType;
  onMenuSelect: (menu: MenuItemType) => void;
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
              <span className="menu-icon">{config.icon}</span>
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