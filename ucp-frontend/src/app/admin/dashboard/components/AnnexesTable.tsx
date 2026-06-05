import {
    AnnexeRatio
} from "@/types/adminDashboard";
export default function AnnexesTable({ data }: { data: AnnexeRatio[] }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">

      <h3 className="font-semibold mb-4">
        Annexes téléchargées
      </h3>

      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th>Annexe</th>
            <th>Downloads</th>
            <th>Ratio</th>
          </tr>
        </thead>

        <tbody>
          {data.slice(0, 10).map((item: AnnexeRatio) => (
            <tr
              key={item.annexe_name}
              className="border-b"
            >
              <td>{item.annexe_name}</td>

              <td>{item.total_downloads}</td>

              <td>
                {item.download_rate_percentage}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}