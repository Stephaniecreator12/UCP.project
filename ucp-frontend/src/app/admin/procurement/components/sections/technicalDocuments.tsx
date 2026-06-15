import { Card, CardHeader, CardTitle, CardContent } from "../card";
import { UseFormReturn, useWatch } from "react-hook-form";
import { ProcurementFormValues, TechnicalDocument } from "../../../../../types/procurement";
import { X, FileText,UploadCloud } from "lucide-react";
import { getServerFileName } from "@/lib/utils";
import { useState } from "react";
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
    <Card className="shadow-xs border border-slate-200/80 rounded-xl overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
        <CardTitle className="text-base font-bold text-slate-900 tracking-tight">Dossier technique</CardTitle>
      </CardHeader>

      <CardContent className="p-2 space-y-5">
        <div className="flex flex-col gap-4">
          <label
            htmlFor="technical-file-upload"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-3xs transition-all duration-150 cursor-pointer w-fit"
          >
            <UploadCloud size={16} className="text-slate-500" />
            Ajouter des fichiers (.pdf)
          </label>
          <input
          id="technical-file-upload"
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
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
            <p className="text-red-600 font-medium text-xs">⚠️ {errors.technicalFiles.message}</p>
          )}
          <div className="space-y-2.5">
            {serverDocs.map((doc) => (
              <div key={`server-tech-${doc.id}`} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 shadow-3xs rounded-lg">
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
              <div key={`local-tech-${file.name}-${index}`} className="flex items-center justify-between p-3 bg-blue-50/60 border border-blue-100 text-blue-900 rounded-lg shadow-3xs">
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