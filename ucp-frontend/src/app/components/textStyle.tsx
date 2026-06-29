<<<<<<< HEAD
export function TextLabel({text} : {text:string | undefined}){
    return(
    <span className="text-md font-medium leading-none">
        {text}
        </span>
    )
}
export function TextTitle({text} : {text:string | undefined}){
    return(
    <span className="text-lg font-semibold leading-none">
        {text}
        </span>
    )
}
=======
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
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
