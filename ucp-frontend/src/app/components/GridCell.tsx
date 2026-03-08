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
  const inputClass =
    "min-h-[34px] w-full rounded-[9px] border border-[var(--line)] bg-white px-[0.56rem] py-[0.42rem] text-[0.82rem] text-[#243242] outline-none transition focus:border-[#67bb91] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--green)_18%,white)]";
  const toggleBaseClass =
    "min-h-[30px] rounded-lg border border-[var(--line-strong)] px-[0.56rem] py-[0.34rem] text-[0.75rem] font-bold";

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
      <div className="inline-flex gap-1">
        {column.options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              className={`${toggleBaseClass} ${
                isActive
                  ? "border-[color-mix(in_srgb,var(--green-strong)_62%,white)] bg-[linear-gradient(180deg,#15ba66,var(--green-strong))] text-white"
                  : "bg-white text-[#2f3d4c]"
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
        className={inputClass}
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
        className="h-4 w-4 rounded border-[var(--line)] text-[var(--green)]"
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
        className={inputClass}
        step="0.01"
      />
    );
  }

  // CAS 4: Date (DATE)
  if (column.type === "date") {
    return (
      <div className="relative">
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
          className={`${inputClass} pr-8`}
        />
        <button
          type="button"
          className="absolute right-[0.45rem] top-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent"
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
          <span
            className="block h-[15px] w-[15px] rounded-[4px] border-2 border-t-[6px] border-[#7b8b99]"
            aria-hidden="true"
          />
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
        className={inputClass}
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
      className={inputClass}
    />
  );
}
