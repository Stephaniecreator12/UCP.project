import { CardContent, CardHeader, CardTitle, Card } from "@/app/TdrSt/dashboard/ui/card";
import { UseFormReturn, useWatch } from "react-hook-form";
import { ProcurementFormValues } from "../../../../../types/procurement";
import { X } from "lucide-react";
interface Props {
  form: UseFormReturn<ProcurementFormValues>;
}

export function TechnicalDocumentsSection({ form }: Props) {
  const files = useWatch({
    control: form.control,
    name: "technicalFiles",
    defaultValue: [],
  });

  const removeFile = (indexToRemove: number) => {
    if(files){
      const updatedFiles = files.filter((_, index) => index !== indexToRemove);
      form.setValue("technicalFiles", updatedFiles, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    
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
            {files && files.map((file: File, index: number) => (
              <div 
                key={`${file.name}-${index}`} 
                className="flex items-center justify-between p-2 bg-slate-50 rounded-md border"
              >
                <span className="text-sm truncate max-w-[80%]">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors"
                  title="Supprimer"
                >
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