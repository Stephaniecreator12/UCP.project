"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { label: "Accueil", href: "/" },
  { label: "Login", href: "/login" },
  { label: "Passation", href: "/passation" },
  { label: "Dashboard", href: "/dashboard" },
];

export default function TopRightSidebar() {
  const pathname = usePathname();

  return (
    <aside className="top-right-ucp-sidebar" aria-label="Navigation rapide UCP">
      <div className="top-right-ucp-brand">
        <div className="top-right-ucp-logo-wrap" aria-hidden="true">
          <Image
            src="/ucp-sante-logo.svg"
            alt="Logo UCP"
            width={40}
            height={40}
            className="top-right-ucp-logo"
            priority
          />
        </div>
        <div className="top-right-ucp-brand-text">
          <strong>UCP</strong>
          <span>Passation</span>
        </div>
      </div>
      <nav className="top-right-ucp-nav">
        {ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`top-right-ucp-link${isActive ? " is-active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Link href="/login" className="top-right-ucp-cta">
        Consultation
      </Link>
    </aside>
  );
}
