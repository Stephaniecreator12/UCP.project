"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type MenuLink = {
  label: string;
  href: string;
  match: (pathname: string) => boolean;
};

const LINKS: MenuLink[] = [
  { label: "PPM", href: "/formulaire", match: (pathname) => pathname === "/formulaire" }, 
  { label: "Dashboard", href: "/dashboard", match: (pathname) => pathname === "/dashboard" },
  { label: "TdR / ST", href: "/TdrSt", match: (pathname) => pathname === "/TdrSt" },
];

export default function Menu({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const buttonId = useId();
  const menuId = `${buttonId}-menu`;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number } | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const showAuthenticatedActions = pathname !== "/login";
  const canPortal = typeof document !== "undefined";

  const measureMenuPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    setMenuPos({
      left: rect.left,
      top: rect.bottom,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    measureMenuPosition();
  }, [open, measureMenuPosition]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      const root = rootRef.current;
      const menu = menuRef.current;
      const clickedInsideRoot = !!root && root.contains(event.target);
      const clickedInsideMenu = !!menu && menu.contains(event.target);
      if (!clickedInsideRoot && !clickedInsideMenu) setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const onReposition = () => measureMenuPosition();

    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, { capture: true });
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, measureMenuPosition]);

  const handleMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setOpen(false);
    }, 200);
    setHoverTimeout(timeout);
  };

  const handleMenuMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
  };

  const handleMenuMouseLeave = () => {
    setOpen(false);
  };

  if (!showAuthenticatedActions) return null;

  return (
    <div 
      ref={rootRef} 
      className={`relative inline-flex ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        id={buttonId}
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="group relative inline-flex h-[36px] items-center justify-start bg-transparent px-2 text-[0.8rem] font-bold uppercase tracking-[0.22em] text-slate-400 transition-colors hover:text-slate-500 font-['Gadugi'] "
      >
        <span className="relative z-10 leading-none flex items-center gap-2.5 ">
          Menu
          <svg 
            className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${open ? "" : "rotate-180"}`}
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>

        {/* Decoration */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-[30px] h-px w-[80px] bg-slate-300/80"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-[105px] top-[2px] h-px w-[35px] origin-left rotate-[130deg] bg-slate-300/80"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-[1px] h-px w-[105px] bg-slate-300/80"
        />
      </button>

      {open && canPortal && menuPos && createPortal(
        <div
          id={menuId}
          ref={menuRef}
          role="menu"
          aria-labelledby={buttonId}
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
          className="fixed  w-[200px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ left: menuPos.left, top: menuPos.top + 8 }}
        >
          <div className="py-1">
            {LINKS.map((item) => {
              const isActive = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  className={`block px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-gray-100 text-gray-900 font-medium"
                      : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
