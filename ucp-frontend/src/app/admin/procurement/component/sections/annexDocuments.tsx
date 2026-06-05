import { CardContent, CardHeader, CardTitle, Card } from "@/app/TdrSt/dashboard/ui/card";
import { UseFormReturn, useWatch } from "react-hook-form";
import { ProcurementFormValues } from "../../../../../types/procurement";
import { X } from "lucide-react";

interface Props {
  form: UseFormReturn<ProcurementFormValues>;
}

export function AnnexSection({ form }: Props) {
  const files = useWatch({
      control: form.control,
      name: "annexFiles",
      defaultValue: [],
    });
  
    const removeFile = (indexToRemove: number) => {
      if(files){
        const updatedFiles = files.filter((_, index) => index !== indexToRemove);
        form.setValue("annexFiles", updatedFiles, {
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