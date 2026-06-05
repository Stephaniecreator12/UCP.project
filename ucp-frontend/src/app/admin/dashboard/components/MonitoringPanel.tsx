import {
    MonitoringData,
    AlertItem,
    InvisibleFolder
} from "@/types/adminDashboard";
export default function MonitoringPanel({ data }: { data: MonitoringData | null}) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow p-5">

      <h3 className="font-semibold mb-4">
        Alertes UCP
      </h3>

      <div className="mb-6">
        <h4 className="font-medium text-red-500">
          Date limite &lt; 48h
        </h4>

        {data.alerts.map((item: AlertItem) => (
          <div
            key={item.id}
            className="p-2 border rounded mt-2"
          >
            {item.title}
          </div>
        ))}
      </div>

      <div>
        <h4 className="font-medium text-orange-500">
          Aucun accès depuis 7 jours
        </h4>

        {data.invisible_folders.map((item: InvisibleFolder) => (
          <div
            key={item.id}
            className="p-2 border rounded mt-2"
          >
            {item.title}
          </div>
        ))}
      </div>
    </div>
  );
}