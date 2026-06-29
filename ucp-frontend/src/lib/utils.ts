import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const getServerFileName = (url: string) => {
    return url.substring(url.lastIndexOf("/") + 1);
  };
type ClassValue = string | false | null | undefined;

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}
