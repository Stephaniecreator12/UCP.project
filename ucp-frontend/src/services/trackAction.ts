import { TrackActionFormValue } from "@/types/trackAction";
import { api } from "./config";
export async function trackUserAction(data: TrackActionFormValue,token: string) {
  try {
    const response = await api.post(`/logs/track`,JSON.stringify({
        dossier_id: data.dossierId,
        user_id: String(data.userId),
        action_type: data.actionType,
        annexe_name: data.annexeName,
      }), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, 
      },
    });

    return response.data
  } catch (error) {
    console.error("Erreur réseau lors du traçage :", error);
  }
}