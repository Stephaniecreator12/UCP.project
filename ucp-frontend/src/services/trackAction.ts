import { TrackActionFormValue } from "@/types/trackAction";
export async function trackUserAction(data: TrackActionFormValue,token: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/logs/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, 
      },
      body: JSON.stringify({
        dossier_id: data.dossierId,
        user_id: String(data.userId),
        action_type: data.actionType,
        annexe_name: data.annexeName,
      }),
    });

    if (!response.ok) {
      console.error("Échec de l'enregistrement du log", await response.text());
    }
  } catch (error) {
    console.error("Erreur réseau lors du traçage :", error);
  }
}