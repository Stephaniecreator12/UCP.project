export function FileCard({
  name,
  version
}: {
  name: string;
  version: number;
}) {
  return (
    <div className="border border-slate-200/80 rounded-xl p-4 flex items-center justify-between bg-white shadow-xs">
      <div>
        <p className="font-semibold text-slate-900 text-sm">
          {name}
        </p>
        <p className="text-xs font-medium text-slate-400 mt-0.5">
          Version v{version}
        </p>
      </div>

      <button className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-3xs transition-all duration-150">
        Télécharger
      </button>
    </div>
  );
}