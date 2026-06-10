import { CardContent, CardHeader, CardTitle, Card } from "@/app/TdrSt/dashboard/ui/card";
import { UseFormReturn, useWatch } from "react-hook-form";
import { ProcurementFormValues } from "../../../../../types/procurement";
import { X, FileText } from "lucide-react";
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
    <Card>
      <CardHeader>
        <CardTitle>Modèle de soumission</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4">
          {showUploadButton && (
            <label
              htmlFor="submission-upload"            >
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
            <p className="text-red-500 text-xs mt-1">{errors.submission_model.message}</p>
          )}
          <div className="space-y-2">
            {files && (
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-md border">
                <span className="text-sm truncate max-w-[80%]">
                  {files.name}
                </span>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          {!files && serverFileUrl && (
              <div className="flex items-center justify-between p-2 bg-slate-50 text-slate-800 rounded-md border border-slate-200">
                <div className="flex items-center gap-2 text-sm truncate max-w-[80%]">
                  <FileText size={16} className="text-slate-400 flex-shrink-0" />
                  <a 
                    href={serverFileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="truncate underline hover:text-slate-600"
                  >
                    {getServerFileName(serverFileUrl)}
                  </a>
                  <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">Actuel</span>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors"
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
