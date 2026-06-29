type TextBlockProps = {
  text?: string | null;
  children?: React.ReactNode;
};

export function TextTitle({ text, children }: TextBlockProps) {
  return (
    <p className="text-sm font-semibold text-slate-700">
      {text ?? children}
    </p>
  );
}

export function TextLabel({ text, children }: TextBlockProps) {
  return (
    <span className="text-sm text-slate-600">
      {text ?? children}
    </span>
  );
}
