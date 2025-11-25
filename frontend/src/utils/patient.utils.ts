/**
 * Patient-related utility functions
 */

import { DNAResultStatus } from "@/components/constants/patient";

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

/**
 * Maps DNA result status to display text
 * @param status - DNA result status string
 * @returns Object with display text for the status
 */
export function getDNAStatusDisplay(status: string): { text: string } {
  const statusMap: Record<string, string> = {
    [DNAResultStatus.PENDING]: "Pending",
    [DNAResultStatus.KIT_RECEIVED]: "Kit received",
    [DNAResultStatus.QC_FAILED]: "QC failed",
    [DNAResultStatus.QC_PASSED]: "QC passed",
    [DNAResultStatus.DNA_EXTRACTION_2ND_FAILED]: "DNA extraction 2nd failed",
    [DNAResultStatus.DNA_EXTRACTION_FAILED]: "DNA extraction failed",
    [DNAResultStatus.DNA_EXTRACTION_2ND_ACCEPTED]: "DNA extraction 2nd accepted",
    [DNAResultStatus.DNA_EXTRACTION_ACCEPTED]: "DNA extraction accepted",
    [DNAResultStatus.GENOTYPING_2ND_FAILED]: "Genotyping 2nd failed",
    [DNAResultStatus.GENOTYPING_FAILED]: "Genotyping failed",
    [DNAResultStatus.GENOTYPING_2ND_ACCEPTED]: "Genotyping 2nd accepted",
    [DNAResultStatus.GENOTYPING_ACCEPTED]: "Genotyping accepted",
    [DNAResultStatus.HOLD]: "Hold",
    [DNAResultStatus.PROCESS]: "Processing",
    [DNAResultStatus.CANCEL]: "Cancelled",
    [DNAResultStatus.DISCARD]: "Discard",
  };

  return {
    text: statusMap[status] || "Unknown",
  };
}


