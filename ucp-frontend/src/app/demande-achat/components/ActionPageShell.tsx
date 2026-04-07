"use client";

import Link from "next/link";
import { ReactNode } from "react";

export function ActionPageShell({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  headerActions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
  headerActions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <section className="mb-5 overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(145deg,#ffffff_0%,#f7fbf9_48%,#eff5f1_100%)] shadow-[0_30px_80px_-50px_rgba(15,23,42,0.5)]">
        <div className="h-1 bg-[linear-gradient(90deg,#0f9f63_0%,#35b27f_46%,#d7f1e6_100%)]" />
        <div className="flex flex-wrap items-start justify-between gap-5 px-5 py-6 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-700">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={backHref}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {backLabel}
            </Link>
            {headerActions}
          </div>
        </div>
      </section>

      {children}
    </div>
  );
}

export function ActionField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export function ActionInfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function ActionChecklist({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {title}
      </p>
      <div className="mt-3 space-y-2.5">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
              ✓
            </span>
            <span className="text-sm leading-6 text-slate-700">{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function InlineMessage({
  tone,
  text,
}: {
  tone: "success" | "error";
  text: string;
}) {
  return (
    <div
      className={`mb-4 rounded-[26px] border px-5 py-4 shadow-sm ${
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      {text}
    </div>
  );
}

export function LoadingCard({ text }: { text: string }) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white px-5 py-6 text-slate-500 shadow-sm">
      {text}
    </div>
  );
}
