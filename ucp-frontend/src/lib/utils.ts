import { clsx, type ClassValue } from "clsx";

export const getServerFileName = (url: string) => {
  return url.substring(url.lastIndexOf("/") + 1);
};

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
