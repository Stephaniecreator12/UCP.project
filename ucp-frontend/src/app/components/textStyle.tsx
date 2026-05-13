import { ReactNode } from "react"
export default function TextLabel({children} : {children:ReactNode}){
    return(
    <span className="text-sm font-medium leading-none">
        {children}
        </span>
    )
}