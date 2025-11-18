/**
 * Date utility functions
 */

/**
 * Formats date to MM/DD/YYYY format
 * @param date - Date string, Date object, null, or undefined
 * @returns Formatted date string in MM/DD/YYYY format, or empty string if invalid
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    if (Number.isNaN(dateObj.getTime())) {
      return "";
    }
    
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const year = dateObj.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch {
    return "";
  }
}

/**
 * Calculates age from date of birth
 * @param dateOfBirth - Date string or Date object
 * @returns Age in years or null if invalid
 */
export function calculateAge(
  dateOfBirth: string | Date | null | undefined,
): number | null {
  if (!dateOfBirth) return null;
  try {
    const dob = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
    if (Number.isNaN(dob.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}
