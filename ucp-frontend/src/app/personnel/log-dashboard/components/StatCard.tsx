import { ReactNode } from "react";

type Props = {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
};

export default function StatCard({ title, value, description, icon }: Props) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
        {title}
      </div>
      <div className="mt-4 text-4xl font-black text-slate-900 tracking-tight">
        {value}
      </div>
      {description && (
        <div className="mt-2 text-xs font-medium text-slate-500">
          {description}
        </div>
      )}
      
      {icon && (
        <div className="absolute right-5 top-5 p-2.5 bg-slate-50/80 border border-slate-100 rounded-xl">
          {icon}
        </div>
      )}
    </div>
  );
}