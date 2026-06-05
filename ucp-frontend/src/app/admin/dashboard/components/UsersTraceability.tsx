import {
    UserTraceability
} from "@/types/adminDashboard";
export default function UsersTraceability({ users }: { users: UserTraceability[] }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">

      <h3 className="font-semibold mb-4">
        Traçabilité des entreprises
      </h3>

      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead>
            <tr className="border-b">
              <th>Entreprise</th>
              <th>Création</th>
              <th>Dernière connexion</th>
              <th>DAO consultés</th>
              <th>DAO téléchargés</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user: UserTraceability) => (
              <tr
                key={user.user}
                className="border-b"
              >
                <td>{user.user}</td>

                <td>
                  {new Date(
                    user.creation_date
                  ).toLocaleDateString()}
                </td>

                <td>
                  {user.lastLogin
                    ? new Date(
                        user.lastLogin
                      ).toLocaleDateString()
                    : "-"}
                </td>

                <td>
                  {user.consultations.length}
                </td>

                <td>
                  {user.download.length}
                </td>
              </tr>
            ))}
          </tbody>

        </table>

      </div>
    </div>
  );
}