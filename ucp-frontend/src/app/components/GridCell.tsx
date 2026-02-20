//Ce composant affiche le bon type de champ dans une cellule (texte, date, select, checkbox, etc.)
//  selon column.type.
"use client";

import React, { useRef, useEffect } from "react";
import { ColumnConfig } from "@/types/grid";

// Les props qu'on reçoit
interface GridCellProps {
  column: ColumnConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  onConfirm?: (value: unknown) => void; // New prop for immediate save
  onKeyDown: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
}

export default function GridCell({
  column,
  value,
  onChange,
  onBlur,
  onConfirm,
  onKeyDown,
  autoFocus = false,
}: GridCellProps) {
  // // Reference pour focus l'input
  const inputRef = useRef<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >(null);

  // Quand autoFocus=true, on focus automatiquement l'input
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // CAS 0: Boutons de bascule (TOGGLE) - ex: Prévu / Réel
  if (column.type === "toggle" && column.options) {
    return (
      <div className="d-inline-flex gap-1">
        {column.options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              className={`btn btn-sm ${
                isActive ? "btn-primary" : "btn-outline-secondary"
              }`}
              onClick={() => {
                onChange(opt.value);
                if (onConfirm) onConfirm(opt.value); // Immediate save
              }}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  // CAS 1: Liste deroulante (SELECT)
  if (column.type === "select" && column.options) {
    return (
      <select
        ref={inputRef as React.Ref<HTMLSelectElement>}
        value={value ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val);
          if (onConfirm) onConfirm(val); // Immediate save on selection
        }}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className="cell-input cell-select"
      >
        {column.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  // CAS 2: Case a cocher (CHECKBOX)
  if (column.type === "checkbox") {
    return (
      <input
        ref={inputRef as React.Ref<HTMLInputElement>}
        type="checkbox"
        checked={value === true || value === "true" || value === 1}
        onChange={(e) => onChange(e.target.checked)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className="cell-input cell-checkbox"
      />
    );
  }

  // CAS 3: Nombre (NUMBER)
  if (column.type === "number") {
    return (
      <input
        ref={inputRef as React.Ref<HTMLInputElement>}
        type="number"
        value={typeof value === "number" ? value : (value ?? "")}
        onChange={(e) =>
          onChange(e.target.value === "" ? "" : parseFloat(e.target.value))
        }
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={column.placeholder || "0"}
        className="cell-input cell-number"
        step="0.01"
      />
    );
  }

  // CAS 4: Date (DATE)
  if (column.type === "date") {
    return (
      <input
        ref={inputRef as React.Ref<HTMLInputElement>}
        type="date"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className="cell-input cell-date"
      />
    );
  }

  // CAS 5: Texte long (TEXTAREA)
  if (column.type === "textarea") {
    return (
      <textarea
        ref={inputRef as React.Ref<HTMLTextAreaElement>}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={column.placeholder || "Texte libre..."}
        className="cell-input cell-textarea"
        rows={1}
      />
    );
  }

  // CAS PAR DEFAUT: Texte simple (TEXT)
  return (
    <input
      ref={inputRef as React.Ref<HTMLInputElement>}
      type="text"
      value={
        typeof value === "string" ? value : value == null ? "" : String(value)
      }
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder={column.placeholder || "Texte..."}
      className="cell-input cell-text"
    />
  );
}
