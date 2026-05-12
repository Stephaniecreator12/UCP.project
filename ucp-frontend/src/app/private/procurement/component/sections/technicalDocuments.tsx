import { CardContent, CardHeader, CardTitle, Card } from "@/app/TdrSt/dashboard/ui/card";
import { UseFormReturn } from "react-hook-form";
import { ProcurementFormValues } from "../../../../../types/procurement";

interface Props {
  form: UseFormReturn<ProcurementFormValues>;
}

export function TechnicalDocumentsSection({ form }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dossier technique</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={(e) => {
            if (!e.target.files) return;

            const currentFiles =
              form.getValues("technicalFiles") || [];

            const newFiles = Array.from(e.target.files);

            form.setValue(
              "technicalFiles",
              [...currentFiles, ...newFiles]
            );
          }}
        />

        <div className="space-y-2">
          {form.getValues("technicalFiles")?.map((file, index) => (
            <div key={index}>{file.name}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}