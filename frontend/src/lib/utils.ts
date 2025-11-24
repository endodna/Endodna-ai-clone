import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatAddress = (address?: PatientAddressDetails | null) => {
  if (!address) return "Address";
  return [address.street, address.street2, address.city, address.state, address.zipCode, address.country]
      .filter(Boolean)
      .join(", ");
};