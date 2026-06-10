import { CardContent, CardHeader, CardTitle, Card } from "@/app/TdrSt/dashboard/ui/card";
import { UseFormReturn, useWatch } from "react-hook-form";
import { AnnexDocument, ProcurementFormValues } from "../../../../../types/procurement";
import { X, FileText } from "lucide-react";
import { getServerFileName } from "@/lib/utils";
import { useState,useEffect } from "react";

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
  };
    const {
      register,
      formState: { errors },
    } = form;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dossier annexes</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4">
          <label
            htmlFor="annex-file-upload"
            className={`${
              files && files.length >= 5 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "cursor-pointer "
            }`}
          >
            Ajouter des fichiers {files && files.length > 0 && `(${files.length}/5)`}
          </label>
          <input
          id="annex-file-upload"
          disabled={files && files.length >= 5}
            type="file"
            multiple
            className="hidden cursor-pointer w-full text-sm text-slate-500
              file:rounded-full file:border-0
              file:text-sm file:font-semibold"
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
            <p className="text-red-500 text-xs mt-1">{errors.annexFiles.message}</p>
          )}
          <div className="space-y-2">
            {serverDocs.map((doc) => (
              <div key={`server-annex-${doc.id}`} className="flex items-center justify-between p-2 bg-slate-50 rounded-md border">
                <div className="flex items-center gap-2 text-sm truncate max-w-[80%]">
                  <FileText size={16} className="text-slate-400 flex-shrink-0" />
                  <a href={doc.file} target="_blank" rel="noreferrer" className="underline truncate hover:text-slate-600">
                    {getServerFileName(doc.file)}
                  </a>
                  <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">Actuel</span>
                </div>
                <button type="button" onClick={() => removeServerFile(doc.id)} className="text-red-500 hover:bg-red-50 p-1 rounded-full">
                  <X size={16} />
                </button>
              </div>
            ))}
            {(files || []).map((file: File, index: number) => (
              <div key={`local-annex-${file.name}-${index}`} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 text-blue-900 rounded-md">
                <div className="flex items-center gap-2 text-sm truncate max-w-[80%]">
                  <FileText size={16} className="text-blue-500 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-xs bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded font-medium">Nouveau</span>
                </div>
                <button type="button" onClick={() => removeLocalFile(index)} className="text-red-500 hover:bg-red-50 p-1 rounded-full">
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