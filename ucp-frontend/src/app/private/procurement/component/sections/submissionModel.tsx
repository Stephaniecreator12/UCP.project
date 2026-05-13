import { CardContent, CardHeader, CardTitle, Card } from "@/app/TdrSt/dashboard/ui/card";
import { UseFormReturn, useWatch } from "react-hook-form";
import { ProcurementFormValues } from "../../../../../types/procurement";
import { X } from "lucide-react";

interface Props {
  form: UseFormReturn<ProcurementFormValues>;
}

export function SubmissionModelSection({ form }: Props) {
  const files = useWatch({
    control: form.control,
    name: "submission_model",
  });

  const removeFile = () => {
    form.setValue("submission_model", undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };
  const {
    register,
    formState: { errors },
  } = form;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Modèle de soumission</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4">
          {!files && (
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
        </div>
      </CardContent>
    </Card>
  );
}
