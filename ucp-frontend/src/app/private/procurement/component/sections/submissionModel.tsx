import { CardContent, CardHeader, CardTitle, Card } from "@/app/TdrSt/dashboard/ui/card";
import { UseFormReturn } from "react-hook-form";
import { ProcurementFormValues } from "../../../../../types/procurement";

interface Props {
  form: UseFormReturn<ProcurementFormValues>;
}

export function SubmissionModelSection({ form }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Modèle de soumission</CardTitle>
      </CardHeader>

      <CardContent>
        <input
          type="file"
          accept=".docx"
          onChange={(e) => {
            if (!e.target.files || e.target.files.length === 0) return;
            form.setValue("submission_model", e.target.files[0]);
          }}
        />
        {form.getValues("submission_model") && (
          <div>{form.getValues("submission_model")!.name}</div>
        )}
      </CardContent>
    </Card>
  );
}