/**
 * Formats status string to a readable format
 * @param status - Status string in UPPER_SNAKE_CASE format
 * @returns Formatted status string with proper capitalization
 */
export function formatStatusText(status: string): string {
  if (!status) return "";
  
  return status
    .split("_")
    .join(" ")
    .toLowerCase();
}
