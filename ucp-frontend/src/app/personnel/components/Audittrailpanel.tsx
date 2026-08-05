"use client";

import { useEffect, useState } from "react";

import { auditTrailService, type AuditTrail } from "../../../services/evaluations/Index";

const ACTION_LABELS: Record<AuditTrail["action"], { label: string; classes: string }> = {
  CREATE: { label: "Création", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  UPDATE: { label: "Modification", classes: "bg-blue-50 text-blue-700 border-blue-200" },
  DELETE: { label: "Suppression", classes: "bg-red-50 text-red-700 border-red-200" },
};

export default function AuditTrailPanel({
  contentType,
  objectId,
}: {
  contentType: string;
  objectId: number;
}) {
  const [entries, setEntries] = useState<AuditTrail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    auditTrailService.listForObject(contentType, objectId).then((data) => {
      if (!cancelled) {
        setEntries(data.results);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [contentType, objectId]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Piste d&apos;audit</h3>

      {loading ? (
        <p className="text-sm text-gray-400">Chargement…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Aucune action enregistrée.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => {
            const style = ACTION_LABELS[entry.action];
            return (
              <li key={entry.id} className="flex items-start gap-3 text-sm">
                <span
                  className={`mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${style.classes}`}
                >
                  {style.label}
                </span>
                <div>
                  <p className="text-gray-700">
                    <span className="font-medium">
                      {entry.external_user_label || entry.external_user_id}
                    </span>{" "}
                    · {new Date(entry.timestamp).toLocaleString("fr-FR")}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}