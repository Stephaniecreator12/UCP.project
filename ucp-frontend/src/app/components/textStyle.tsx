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