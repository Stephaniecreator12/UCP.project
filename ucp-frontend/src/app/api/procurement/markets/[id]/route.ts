import { NextRequest, NextResponse } from "next/server";
import { getMarketById } from "@/services/procurement";
import { getme } from "@/services/profile";
import { trackUserAction } from "@/services/trackAction";
import { TrackActionFormValue } from "@/types/trackAction";
import { cookies } from "next/headers";
interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams 
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const { id } = resolvedParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const accessTyê = cookieStore.get("access_type")?.value;
  const 
  if (!token) {
    return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
  }
  let user;
  if()
try {
  const result = await getme();
  if (!result.error) {
    user = result.data;
  } else {
    console.error("Erreur de récupération profil :", result.message);
  }
} catch (err) {
  console.error("Erreur crash profil :", err);
}

if (!user) {
  console.warn("Impossible de tracer l'action : Utilisateur non authentifié.");
  return; 
}

const dossierId = id.toString();
const userId = user.id.toString(); 
const actionType = "DOWNLOAD_DAO";

const data: TrackActionFormValue = {
  dossierId,
  userId,
  actionType,
};

try {
  await trackUserAction(data,token);
} catch (err) {
  console.error("Erreur lors de l'enregistrement du log :", err);
}
  
    
  if (!id || id === "undefined") {
    return NextResponse.json(
      { message: "Identifiant du marché manquant." },
      { status: 400 }
    );
  }

  try {
    const result = await getMarketById(id); 

    if (result.error || !result.data) {
      return NextResponse.json(
        { message: `Marché introuvable pour l'ID : ${id}` },
        { status: 404 }
      );
    }

    const market = result.data;
    const fileUrl = market.submission_model;

    if (!fileUrl) {
      return NextResponse.json(
        { message: "Aucun document de DAO disponible pour ce marché." },
        { status: 404 }
      );
    }

    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error("Impossible de récupérer le fichier distant.");
    }

    const blob = await fileResponse.blob();
    const filename = fileUrl.split("/").pop() || `DAO-${id}.docx`;

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("Erreur proxy lors du téléchargement:", error);
    return NextResponse.json(
      { message: "Erreur serveur lors du téléchargement." },
      { status: 500 }
    );
  }
}