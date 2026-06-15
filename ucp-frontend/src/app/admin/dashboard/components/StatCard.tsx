import { ReactNode } from "react";

type Props = {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
};

export default function StatCard({ title, value, description, icon }: Props) {
  return (
    <div className="bg-white border border-slate-200/80 border-l-[3px] border-l-emerald-500  rounded-xl p-6 shadow-xs flex justify-between items-start transition-all duration-200 hover:shadow-sm">
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {title}
        </p>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </h2>
        {description && (
          <p className="text-xs text-slate-400 font-medium">
            {description}
          </p>
        )}
      </div>
      
      {icon && (
        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg shadow-3xs">
          {icon}
        </div>
      )}
    </div>
  );
}