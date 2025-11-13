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
    
    if (isNaN(dateObj.getTime())) {
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

