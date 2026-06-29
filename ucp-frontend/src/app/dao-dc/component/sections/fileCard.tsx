export function FileCard({
  name,
  version
}: {
  name: string;
  version: number;
}) {
  return (
    <div className="border rounded-lg p-4 flex items-center justify-between">

      <div>
        <p className="font-medium">
          {name}
        </p>

        <p className="text-sm text-muted-foreground">
          Version v{version}
        </p>
      </div>

      <button className="btn">
        Télécharger
      </button>

    </div>
  );
}