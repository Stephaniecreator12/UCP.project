<<<<<<< HEAD
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getServerFileName = (url: string) => {
    return url.substring(url.lastIndexOf("/") + 1);
  };
=======
type ClassValue = string | false | null | undefined;

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
