import { CardContent, CardHeader, CardTitle, Card } from "@/app/TdrSt/dashboard/ui/card";
import { UseFormReturn, useWatch } from "react-hook-form";
import { ProcurementFormValues, TechnicalDocument } from "../../../../../types/procurement";
import { X, FileText } from "lucide-react";
import { getServerFileName } from "@/lib/utils";
import { useState,useEffect } from "react";
interface Props {
  form: UseFormReturn<ProcurementFormValues>;
  initialDocuments?: TechnicalDocument[];
}

export function TechnicalDocumentsSection({ form, initialDocuments }: Props) {
  const [serverDocs, setServerDocs] = useState<TechnicalDocument[]>(initialDocuments || []);
  const files = useWatch({
    control: form.control,
    name: "technicalFiles",
    defaultValue: [],
  });
  const removeServerFile = (idToRemove: number) => {
    setServerDocs((prev) => prev.filter((doc) => doc.id !== idToRemove));
  };
  const removeLocalFile = (indexToRemove: number) => {
    const updatedFiles = (files || []).filter((_, index) => index !== indexToRemove);
    form.setValue("technicalFiles", updatedFiles, { shouldDirty: true, shouldValidate: true });
  };
  const {
    register,
    formState: { errors },
  } = form;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dossier technique</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4">
          <label
            htmlFor="technical-file-upload"
            className="cursor-pointer inline-flex items-center w-fit text-sm"
          >
            Ajouter des fichiers (.pdf)
          </label>
          <input
          id="technical-file-upload"
            type="file"
            accept=".pdf"
            multiple
            className="hidden cursor-pointer w-full text-sm text-slate-500
              file:rounded-full file:border-0
              file:text-sm file:font-semibold"
            onChange={(e) => {
              if (!e.target.files) return;
              const newFiles = Array.from(e.target.files);
                form.setValue("technicalFiles", [...(files||[]), ...newFiles], {
                shouldDirty: true,
                });
                e.target.value = "";
              }
            }
          />
          {errors.technicalFiles && (
            <p className="text-red-500 text-xs mt-1">{errors.technicalFiles.message}</p>
          )}
          <div className="space-y-2">
            {serverDocs.map((doc) => (
              <div key={`server-tech-${doc.id}`} className="flex items-center justify-between p-2 bg-slate-50 rounded-md border">
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
              <div key={`local-tech-${file.name}-${index}`} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 text-blue-900 rounded-md">
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