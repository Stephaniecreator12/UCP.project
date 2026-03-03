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
  onConfirm?: (value: unknown) => boolean | void; // Return false to reject value
  onValidationMessage?: (message: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
  minDate?: string;
  maxDate?: string;
}

export default function GridCell({
  column,
  value,
  onChange,
  onBlur,
  onConfirm,
  onValidationMessage,
  onKeyDown,
  autoFocus = false,
  minDate,
  maxDate,
}: GridCellProps) {
  // // Reference pour focus l'input
  const inputRef = useRef<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >(null);
  const [draftDate, setDraftDate] = React.useState<string>(
    typeof value === "string" ? value : ""
  );
  const inputValue =
    typeof value === "string" || typeof value === "number" ? value : "";

  // Quand autoFocus=true, on focus automatiquement l'input
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Nettoyer les tooltips au démontage
  useEffect(() => {
    return () => {
      const tooltips = ['select-option-tooltip', 'dynamic-tooltip'];
      tooltips.forEach(id => {
        const tooltip = document.getElementById(id);
        if (tooltip) {
          tooltip.remove();
        }
      });
    };
  }, []);

  // Gestionnaire de tooltips unifié et optimisé
  const handleOptionHover = (event: React.MouseEvent, description?: string) => {
    if (!description) return;
    
    // Supprimer tous les tooltips existants d'abord
    const existingTooltips = ['select-option-tooltip', 'dynamic-tooltip'];
    existingTooltips.forEach(id => {
      const tooltip = document.getElementById(id);
      if (tooltip) tooltip.remove();
    });
    
    const tooltip = document.createElement('div');
    tooltip.id = 'select-option-tooltip';
    tooltip.textContent = description;
    tooltip.style.cssText = `
      position: absolute;
      background: #1f2937;
      color: white;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 500;
      z-index: 10001;
      max-width: 200px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      border: 1px solid #374151;
      pointer-events: none;
      transition: opacity 0.1s ease;
      line-height: 1.2;
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = event.currentTarget.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width + 5}px`;
    tooltip.style.top = `${rect.top}px`;
    tooltip.style.opacity = '1';
  };

  const handleOptionLeave = () => {
    const tooltip = document.getElementById('select-option-tooltip');
    if (tooltip) {
      tooltip.style.opacity = '0';
      setTimeout(() => tooltip.remove(), 100);
    }
  };

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
        value={String(inputValue)}
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
          <option 
            key={opt.value} 
            value={opt.value}
            title={opt.description}
            onMouseEnter={(e) => opt.description ? handleOptionHover(e, opt.description) : undefined}
            onMouseLeave={handleOptionLeave}
          >
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
        value={typeof inputValue === "number" ? inputValue : String(inputValue)}
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
      <div className="cell-date-wrap">
        <input
          ref={inputRef as React.Ref<HTMLInputElement>}
          type="date"
          lang="fr-FR"
          value={draftDate}
          min={minDate}
          max={maxDate}
          onChange={(e) => {
            setDraftDate(e.target.value);
          }}
          onBlur={(e) => {
            const input = e.currentTarget;
            const nextValue = input.value;

            if (input.validity.rangeUnderflow && minDate) {
              onValidationMessage?.(
                `La date saisie est inférieure à la limite autorisée (${minDate}). Veuillez saisir une date supérieure ou égale.`
              );
              setDraftDate(typeof value === "string" ? value : "");
              requestAnimationFrame(() => {
                const dateInput = inputRef.current as
                  | (HTMLInputElement & { showPicker?: () => void })
                  | null;
                if (!dateInput) return;
                dateInput.focus();
                if (typeof dateInput.showPicker === "function") {
                  dateInput.showPicker();
                }
              });
              onBlur();
              return;
            }

            if (input.validity.rangeOverflow && maxDate) {
              onValidationMessage?.(
                `La date saisie est supérieure à la limite autorisée (${maxDate}). Veuillez saisir une date inférieure ou égale.`
              );
              setDraftDate(typeof value === "string" ? value : "");
              requestAnimationFrame(() => {
                const dateInput = inputRef.current as
                  | (HTMLInputElement & { showPicker?: () => void })
                  | null;
                if (!dateInput) return;
                dateInput.focus();
                if (typeof dateInput.showPicker === "function") {
                  dateInput.showPicker();
                }
              });
              onBlur();
              return;
            }

            let accepted = true;
            if (onConfirm) {
              const result = onConfirm(nextValue);
              accepted = result !== false;
            } else {
              onChange(nextValue);
            }

            if (!accepted) {
              setDraftDate(typeof value === "string" ? value : "");
              requestAnimationFrame(() => {
                const dateInput = inputRef.current as
                  | (HTMLInputElement & { showPicker?: () => void })
                  | null;
                if (!dateInput) return;
                dateInput.focus();
                if (typeof dateInput.showPicker === "function") {
                  dateInput.showPicker();
                }
              });
            }
            onBlur();
          }}
          onKeyDown={onKeyDown}
          className="cell-input cell-date"
        />
        <button
          type="button"
          className="cell-date-trigger"
          aria-label="Ouvrir le calendrier"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const dateInput = inputRef.current as
              | (HTMLInputElement & { showPicker?: () => void })
              | null;
            if (!dateInput) return;
            if (typeof dateInput.showPicker === "function") {
              dateInput.showPicker();
            } else {
              dateInput.focus();
            }
          }}
        >
          <span className="cell-date-trigger-icon" aria-hidden="true" />
        </button>
      </div>
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
