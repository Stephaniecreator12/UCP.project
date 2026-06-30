import { Card, CardHeader, CardTitle, CardContent } from "../card";
import { UseFormReturn, useWatch } from "react-hook-form";
import { ProcurementFormValues } from "../../../../../types/procurement";
import { X, FileText, UploadCloud } from "lucide-react";
import { getServerFileName } from "@/lib/utils";
import { useState, useEffect } from "react";
interface Props {
  form: UseFormReturn<ProcurementFormValues>;
  initialFileUrl?: string;
}

export function SubmissionModelSection({ form,initialFileUrl }: Props) {
  const [serverFileUrl, setServerFileUrl] = useState<string | undefined>(initialFileUrl);
  const files = useWatch({
    control: form.control,
    name: "submission_model",
  });
  useEffect(() => {
    setServerFileUrl(initialFileUrl);
  }, [initialFileUrl]);

  const removeFile = () => {
    form.setValue("submission_model", undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setServerFileUrl(undefined);
  };
  const {
    register,
    formState: { errors },
  } = form;
  const showUploadButton = !files && !serverFileUrl;
  return (
    <Card className="shadow-xs border border-slate-200/80 rounded-xl overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
        <CardTitle className="text-base font-bold text-slate-900 tracking-tight">Modèle de soumission</CardTitle>
      </CardHeader>

      <CardContent className="p-2">
        <div className="flex flex-col gap-4">
          {showUploadButton && (
            <label
              htmlFor="submission-upload"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-3xs transition-all duration-150 cursor-pointer w-fit"
            >
              <UploadCloud size={16} className="text-slate-500" />
              Ajouter un fichier (.docx)
            </label>
          )}

          <input
            id="submission-upload"
            type="file"
            accept=".docx"
            className="hidden"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (!selectedFile) return;

              form.setValue("submission_model", selectedFile, {
                shouldDirty: true,
                shouldValidate: true,
              });

              e.target.value = "";
            }}
          />
          {errors.submission_model && (
            <p className="text-red-600 font-medium text-xs">⚠️ {errors.submission_model.message}</p>
          )}
          <div className="space-y-2">
            {files && (
              <div className="flex items-center justify-between p-3 bg-blue-50/60 border border-blue-100 text-blue-900 rounded-lg shadow-3xs">
                <div className="flex items-center gap-2.5 text-sm truncate max-w-[80%]">
                  <FileText size={16} className="text-blue-500 flex-shrink-0" />
                  <span className="truncate font-medium">{files.name}</span>
                  <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-bold tracking-wide">Nouveau</span>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-blue-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          {!files && serverFileUrl && (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 shadow-3xs rounded-lg">
                <div className="flex items-center gap-2.5 text-sm truncate max-w-[80%]">
                  <FileText size={16} className="text-slate-400 flex-shrink-0" />
                  <a 
                    href={serverFileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="truncate underline font-medium text-slate-700 hover:text-slate-900"
                  >
                    {getServerFileName(serverFileUrl)}
                  </a>
                  <span className="text-[11px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-md font-bold tracking-wide">Actuel</span>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
