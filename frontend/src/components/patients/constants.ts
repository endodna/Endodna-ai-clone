/**
 * Static filter values for patient list filters
 */

export const PHYSICIAN_OPTIONS = [
  { value: "all", label: "All Physicians" },
  { value: "5f7ffdf5-174e-4263-a399-f934290ec28b", label: "Dr. Sam Ade" },
  { value: "doctor-2", label: "Dr. Kaufmann" },
  { value: "doctor-3", label: "Dr. David Lee" },
  { value: "doctor-4", label: "Dr. Michael Thompson" },
] as const;

export const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "invite", label: "Invite Pending" },
  { value: "labs", label: "Labs Pending" },
  { value: "dna", label: "DNA Ready" },
] as const;

