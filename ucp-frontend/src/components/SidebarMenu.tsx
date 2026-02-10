"use client";

import React from "react";
import { MenuItemType } from "@/types/grid";
import { MENU_ITEMS, TABLE_CONFIGS } from "@/config/tableConfigs";
import "./SidebarMenu.css";

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
      {/* En-tete du sidebar */}
      <div className="sidebar-header">
        <h2 className="sidebar-title">e-Proc UCP</h2>
        <p className="sidebar-subtitle">Gestion des Procurements</p>
      </div>

      {/* Navigation avec les 3 menus */}
      <nav className="sidebar-nav">
        {MENU_ITEMS.map((item: MenuItemType) => {
          // Recuperer la config du menu (label, icon, etc)
          const config = TABLE_CONFIGS[item];

          return (
            <button
              key={item}
              className={`sidebar-menu-item ${activeMenu === item ? "active" : ""}`}
              onClick={() => onMenuSelect(item)}
              title={config.label}
            >
              {/* Afficher l'icone */}
              <span className="menu-icon">{config.icon}</span>
              {/* Afficher le texte du menu */}
              <span className="menu-label">{config.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer du sidebar */}
      <div className="sidebar-footer">
        <p className="sidebar-version">v1.0.0</p>
      </div>
    </aside>
  );
}
