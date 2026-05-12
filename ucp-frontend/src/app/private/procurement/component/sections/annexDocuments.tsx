import { CardContent, CardHeader, CardTitle, Card } from "@/app/TdrSt/dashboard/ui/card";
import { UseFormReturn } from "react-hook-form";
import { ProcurementFormValues } from "../../../../../types/procurement";

interface Props {
  form: UseFormReturn<ProcurementFormValues>;
}

export function AnnexSection({ form }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Annexes</CardTitle>
      </CardHeader>

      <CardContent>
        <input
          type="file"
          multiple
          onChange={(e) => {
            if (!e.target.files) return;

            const currentFiles =
              form.getValues("annexFiles") || [];

            const newFiles = Array.from(e.target.files);

            form.setValue(
              "annexFiles",
              [...currentFiles, ...newFiles]
            );
          }}
        />
        <p className="text-sm text-muted-foreground mt-2">
          Maximum 5 fichiers
        </p>

        {form.getValues("annexFiles")?.map((file, index) => (
          <div key={index}>{file.name}</div>
        ))}
      </CardContent>
    </Card>
  );
}