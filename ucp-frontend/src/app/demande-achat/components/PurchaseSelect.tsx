"use client";

import {
  KeyboardEvent,
  useId,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export type PurchaseSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type PurchaseSelectProps = {
  value: string;
  options: PurchaseSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
  optionClassName?: string;
  ariaLabel?: string;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

const DEFAULT_MENU_MAX_HEIGHT = 280;
const DEFAULT_HORIZONTAL_MARGIN = 12;

export default function PurchaseSelect({
  value,
  options,
  onChange,
  placeholder = "Sélectionner...",
  id,
  disabled = false,
  className = "",
  menuClassName = "",
  optionClassName = "",
  ariaLabel,
}: PurchaseSelectProps) {
  const generatedId = useId();
  const buttonId = id ?? generatedId;
  const listboxId = `${buttonId}-listbox`;
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;
  const isBrowser = typeof document !== "undefined";

  const getInitialHighlightIndex = () => {
    if (selectedIndex >= 0) return selectedIndex;
    return options.findIndex((option) => !option.disabled);
  };

  const openMenu = (index = getInitialHighlightIndex()) => {
    setHighlightedIndex(index);
    setOpen(true);
  };

  const updateMenuPosition = () => {
    if (!buttonRef.current || typeof window === "undefined") return;

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const availableBelow = viewportHeight - rect.bottom - 12;
    const availableAbove = rect.top - 12;
    const shouldOpenAbove =
      availableBelow < Math.min(DEFAULT_MENU_MAX_HEIGHT, 180) &&
      availableAbove > availableBelow;
    const maxHeight = Math.max(
      140,
      Math.min(
        DEFAULT_MENU_MAX_HEIGHT,
        shouldOpenAbove ? availableAbove : availableBelow,
      ),
    );
    const top = shouldOpenAbove
      ? Math.max(12, rect.top - maxHeight - 6)
      : rect.bottom + 6;
    const width = rect.width;
    const left = Math.min(
      Math.max(DEFAULT_HORIZONTAL_MARGIN, rect.left),
      viewportWidth - width - DEFAULT_HORIZONTAL_MARGIN,
    );

    setMenuPosition({ top, left, width, maxHeight });
  };

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    const handleWindowUpdate = () => updateMenuPosition();

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleWindowUpdate);
    window.addEventListener("scroll", handleWindowUpdate, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleWindowUpdate);
      window.removeEventListener("scroll", handleWindowUpdate, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open || highlightedIndex < 0 || !menuRef.current) return;

    const optionElement = menuRef.current.querySelector<HTMLElement>(
      `[data-option-index="${highlightedIndex}"]`,
    );
    optionElement?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  const selectOption = (option: PurchaseSelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const handleButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenu();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(selectedIndex >= 0 ? selectedIndex : Math.max(options.length - 1, 0));
    }
  };

  const handleListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((previous) =>
        previous < options.length - 1 ? previous + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((previous) =>
        previous > 0 ? previous - 1 : options.length - 1,
      );
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[highlightedIndex];
      if (option) {
        selectOption(option);
      }
      return;
    }

    if (event.key === "Tab") {
      setOpen(false);
    }
  };

  const menu =
    isBrowser && open && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            role="listbox"
            id={listboxId}
            tabIndex={-1}
            onKeyDown={handleListKeyDown}
            className={`fixed z-[220] overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-[0_18px_50px_rgba(15,23,42,0.14)] ${menuClassName}`}
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              maxHeight: menuPosition.maxHeight,
              zoom: 0.8,
            }}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <button
                  key={`${option.value}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-option-index={index}
                  disabled={option.disabled}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(option)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    option.disabled
                      ? "cursor-not-allowed text-slate-300"
                      : isSelected
                        ? "bg-slate-200 text-slate-900"
                        : isHighlighted
                          ? "bg-slate-100 text-slate-800"
                          : "text-slate-700"
                  } ${optionClassName}`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected ? (
                    <Check className="h-4 w-4 shrink-0 text-slate-600" />
                  ) : null}
                </button>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (open) {
            setOpen(false);
            return;
          }
          openMenu();
        }}
        onKeyDown={handleButtonKeyDown}
        className={`flex items-center justify-between gap-3 text-left ${className}`}
      >
        <span
          className={`min-w-0 truncate ${
            selectedOption ? "text-current" : "text-slate-400"
          }`}
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {menu}
    </>
  );
}
