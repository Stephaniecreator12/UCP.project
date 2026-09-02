"use client";

import React, { useRef, useEffect } from "react";
import { ColumnConfig } from "@/types/grid";
import { FRENCH_DATE_INPUT_PROPS } from "@/lib/date";

interface GridCellProps {
  column: ColumnConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  onConfirm?: (value: unknown) => boolean | void;
  onValidationMessage?: (message: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
  minDate?: string;
  maxDate?: string;
}

function MultiSelectCell({
  column,
  value,
  onChange,
  onConfirm,
}: {
  column: ColumnConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  onConfirm?: (value: unknown) => boolean | void;
}) {
  const [open, setOpen] = React.useState(false);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  const selectedValues: string[] = Array.isArray(value)
    ? (value as unknown[]).map(String)
    : typeof value === "string" && value
      ? value.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const toggleValue = (code: string) => {
    const next = selectedValues.includes(code)
      ? selectedValues.filter((v) => v !== code)
      : [...selectedValues, code];
    onChange(next);
    if (onConfirm) onConfirm(next);
  };

  const getLabel = (code: string) =>
    column.options?.find((o) => o.value === code)?.label ?? code;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full min-h-[24px] px-2 py-0.5 text-left text-[0.8rem] rounded-md border transition-all ${
          selectedValues.length
            ? "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50"
            : "border-slate-200 bg-transparent text-[#98a0ab] hover:bg-slate-50"
        }`}
      >
        {selectedValues.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {selectedValues.map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-px text-[0.7rem] font-medium text-emerald-700"
              >
                {getLabel(v)}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleValue(v);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      toggleValue(v);
                    }
                  }}
                  className="ml-0.5 cursor-pointer text-emerald-500 hover:text-emerald-700"
                >
                  x
                </span>
              </span>
            ))}
          </span>
        ) : (
          <span>Sélectionner...</span>
        )}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 min-w-[180px] max-h-[200px] overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {column.options?.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[0.8rem] text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(opt.value)}
                onChange={() => toggleValue(opt.value)}
                className="w-3.5 h-3.5 rounded text-emerald-600 border-slate-300 focus:ring-transparent"
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GridCell({
  column,
  value,
  onChange,
  onBlur,
  onConfirm,
  onKeyDown,
  autoFocus = false,
  minDate,
  maxDate,
}: GridCellProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);
  const [draftDate, setDraftDate] = React.useState<string>(typeof value === "string" ? value : "");
  const inputValue = typeof value === "string" || typeof value === "number" ? value : "";


 const baseInputClasses = "w-full bg-transparent border-none focus:ring-2 focus:ring-emerald-500/30 rounded-md px-2 py-0 transition-all outline-none text-[0.875rem] min-h-[24px]";
  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  if (column.type === "toggle" && column.options) {
    return (
      <div className="flex gap-1 p-1">
        {column.options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              className={`px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider rounded-md transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
              onClick={() => {
                onChange(opt.value);
                if (onConfirm) onConfirm(opt.value);
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

  if (column.type === "multi_select" && column.options) {
    return (
      <MultiSelectCell
        column={column}
        value={value}
        onChange={onChange}
        onConfirm={onConfirm}
      />
    );
  }

  if (column.type === "select" && column.options) {
    const normalizedValue = value ? String(value) : "";
    const placeholderLabel = column.placeholder || "Sélectionner";

    return (
      <select
        ref={inputRef as React.Ref<HTMLSelectElement>}
        value={normalizedValue}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val);
          if (onConfirm) onConfirm(val);
        }}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={`${baseInputClasses} ${
          !normalizedValue ? "!text-[#98a0ab] non-italic" : "!text-slate-700"
        }`}
      >
        <option value="" disabled hidden>
          {placeholderLabel}
        </option>
        {column.options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            title={opt.description}
            className="text-slate-700 not-italic"
          >
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (column.type === "checkbox") {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <input
          ref={inputRef as React.Ref<HTMLInputElement>}
          type="checkbox"
          checked={value === true || value === "true" || value === 1}
          onChange={(e) => onChange(e.target.checked)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
        />
      </div>
    );
  }

  if (column.type === "number") {
    return (
      <input
        ref={inputRef as React.Ref<HTMLInputElement>}
        type="number"
        value={typeof inputValue === "number" ? inputValue : String(inputValue)}
        onChange={(e) => onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={column.placeholder || "0"}
        className={`${baseInputClasses} text-right font-mono text-slate-700`}
        step="0.01"
      />
    );
  }

  if (column.type === "date") {
  return (
    <div className="relative flex items-center group w-full">
      <input
        ref={inputRef as React.Ref<HTMLInputElement>}
        type="date"
        {...FRENCH_DATE_INPUT_PROPS}
        value={draftDate}
        min={minDate}
        max={maxDate}
        onChange={(e) => {
  const nextValue = e.target.value;
  setDraftDate(nextValue);
  onChange(nextValue); // commit immédiat dans la row (sans validation stricte)
          }}
          onBlur={(e) => {
            const nextValue = e.target.value;
            let accepted = true;

            // Validation stricte au blur (ordre des dates, etc.)
            if (onConfirm) accepted = onConfirm(nextValue) !== false;

            if (!accepted) setDraftDate(typeof value === "string" ? value : "");
            onBlur();
          }}
        onKeyDown={onKeyDown}
        className={`${baseInputClasses} text-slate-700 pr-7 appearance-none`}
      />
      <button
        type="button"
        className="absolute right-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-emerald-50 hover:text-emerald-500"
        onClick={() => (inputRef.current as HTMLInputElement)?.showPicker?.()}
        aria-label="Ouvrir le calendrier"
      >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      );
    }

  if (column.type === "textarea") {
    return (
      <textarea
        ref={inputRef as React.Ref<HTMLTextAreaElement>}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={column.placeholder || "Texte libre..."}
        className={`${baseInputClasses} text-slate-700 resize-none min-h-[38px] py-2`}
        rows={1}
      />
    );
  }

  return (
    <input
      ref={inputRef as React.Ref<HTMLInputElement>}
      type="text"
      value={typeof value === "string" ? value : value == null ? "" : String(value)}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder={column.placeholder || "Saisir..."}
      className={`${baseInputClasses} text-slate-700`}
    />
  );
}
