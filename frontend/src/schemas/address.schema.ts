import { z } from "zod";

export const addressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  country: z.string().min(1, "Country is required"),
});

export const patientAddressSchema = z.object({
  address: addressSchema,
  isPrimary: z.boolean().optional().default(false),
});

export type AddressFormValues = z.infer<typeof addressSchema>;
export type PatientAddressFormValues = z.infer<typeof patientAddressSchema>;

