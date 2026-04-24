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
        className={`${baseInputClasses} text-slate-700 pr-8 appearance-none`}
      />
      <button
        type="button"
        className="absolute right-2 text-slate-400 hover:text-emerald-600"
        onClick={() => (inputRef.current as HTMLInputElement)?.showPicker?.()}
      >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

