import { Card, CardHeader, CardTitle, CardContent } from "../card";
import { UseFormReturn, useWatch } from "react-hook-form";
import { AnnexDocument, ProcurementFormValues } from "../../../../../types/procurement";
import { X, FileText, UploadCloud } from "lucide-react";
import { getServerFileName } from "@/lib/utils";
import { useState } from "react";

interface Props {
  form: UseFormReturn<ProcurementFormValues>;
  initialDocuments?: AnnexDocument[];
}

export function AnnexSection({ form, initialDocuments }: Props) {
  const [serverDocs, setServerDocs] = useState<AnnexDocument[]>(initialDocuments || []);
  
  const files = useWatch({
    control: form.control,
    name: "annexFiles",
    defaultValue: [],
  });

  const totalFilesCount = serverDocs.length + (files || []).length;
  const limit = 5;
  const remainingSlots = limit - totalFilesCount;

  const removeLocalFile = (indexToRemove: number) => {
    const updatedFiles = (files || []).filter((_, index) => index !== indexToRemove);
    form.setValue("annexFiles", updatedFiles, { shouldDirty: true, shouldValidate: true });
  };

  const removeServerFile = (idToRemove: number) => {
    setServerDocs((prev) => prev.filter((doc) => doc.id !== idToRemove));

    const current = form.getValues("deletedAnnexIds") || [];

    form.setValue("deletedAnnexIds", [...current, idToRemove], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };
  const {
    register,
    formState: { errors },
  } = form;
  return (
    <Card className="shadow-xs border border-slate-200/80 rounded-xl overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
        <CardTitle className="text-base font-bold text-slate-900 tracking-tight">Dossier annexes</CardTitle>
      </CardHeader>

      <CardContent className="p-2 space-y-5">
        <div className="flex flex-col gap-4">
          <label
            htmlFor="annex-file-upload"
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border shadow-3xs transition-all duration-150 w-fit ${files && files.length >= 5
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 cursor-pointer"
              }`}
          >
            <UploadCloud size={16} className={files && files.length >= 5 ? "text-slate-400" : "text-slate-500"} />
            Ajouter des fichiers {files && files.length > 0 && `(${files.length}/5)`}
          </label>
          <input
            id="annex-file-upload"
            disabled={files && files.length >= 5}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (!e.target.files) return;

              const currentFiles = files || [];
              const incomingFiles = Array.from(e.target.files);
              const limit = 5;
              const remainingSlots = limit - currentFiles.length;

              if (remainingSlots <= 0) {
                alert("Vous avez déjà atteint la limite de 5 fichiers.");
                e.target.value = "";
                return;
              }
              const allowedNewFiles = incomingFiles.slice(0, remainingSlots);

              form.setValue("annexFiles", [...currentFiles, ...allowedNewFiles], {
                shouldDirty: true,
                shouldValidate: true,
              });

              e.target.value = "";
            }}
          />
          {errors.annexFiles && (
            <p className="text-red-600 font-medium text-xs mt-1">⚠️ {errors.annexFiles.message}</p>
          )}
          <div className="space-y-2.5">
            {serverDocs.map((doc) => (
              <div key={`server-annex-${doc.id}`} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 shadow-3xs rounded-lg">
                <div className="flex items-center gap-2.5 text-sm truncate max-w-[80%]">
                  <FileText size={16} className="text-slate-400 flex-shrink-0" />
                  <a href={doc.file} target="_blank" rel="noreferrer" className="underline truncate font-medium text-slate-700 hover:text-slate-900">
                    {getServerFileName(doc.file)}
                  </a>
                  <span className="text-[11px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-md font-bold tracking-wide">Actuel</span>
                </div>
                <button type="button" onClick={() => removeServerFile(doc.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                  <X size={16} />
                </button>
              </div>
            ))}
            {(files || []).map((file: File, index: number) => (
              <div key={`local-annex-${file.name}-${index}`} className="flex items-center justify-between p-3 bg-blue-50/60 border border-blue-100 text-blue-900 rounded-lg shadow-3xs">
                <div className="flex items-center gap-2.5 text-sm truncate max-w-[80%]">
                  <FileText size={16} className="text-blue-500 flex-shrink-0" />
                  <span className="truncate font-medium text-blue-900">{file.name}</span>
                  <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-bold tracking-wide">Nouveau</span>
                </div>
                <button type="button" onClick={() => removeLocalFile(index)} className="text-blue-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}