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
 * Converts height from cm to feet and inches
 * @param heightCm - Height in centimeters
 * @returns Object with feet and inches, or null if invalid
 */
export function cmToFeetInches(heightCm: number | null | undefined): { feet: number; inches: number } | null {
  if (!heightCm || heightCm <= 0) return null;

  const totalInches = heightCm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12); // round to whole inch

  return { feet, inches };
}

/**
 * Formats height as "X cm"
 * @param heightCm - Height in centimeters
 * @returns Formatted string or null
 */
export function formatHeight(heightCm: number | null | undefined): string | null {
  if (!heightCm || heightCm <= 0) return null;

  return `${heightCm} cm`;
}

/**
 * Converts feet and inches to centimeters
 * @param feet - Feet component
 * @param inches - Inches component
 * @returns Height in centimeters
 */
export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches * 2.54);
}

/**
 * Converts weight from kg to lbs
 * @param weightKg - Weight in kilograms
 * @returns Weight in pounds, or null if invalid
 */
export function kgToLbs(weightKg: number | null | undefined): number | null {
  if (!weightKg || weightKg <= 0) return null;

  // Convert kg to lbs 
  return Math.round(weightKg * 2.2046226218);
}

/**
 * Formats weight as "X.X kg"
 * @param weightKg - Weight in kilograms
 * @returns Formatted string or null
 */
export function formatWeight(weightKg: number | null | undefined): string | null {
  if (!weightKg || weightKg <= 0) return null;

  return `${weightKg} kg`;
}

/**
 * Converts pounds to kilograms
 * @param lbs - Weight in pounds
 * @returns Weight in kilograms (rounded to integer)
 */
export function lbsToKg(lbs: number): number {
  // Convert lbs to kg using
  return Math.round(lbs / 2.2046226218);
}

/**
 * Gets BMI category based on BMI value
 * @param bmi - BMI value
 * @returns BMI category string
 */
export function getBMICategory(bmi: number | null | undefined): string {
  if (!bmi || bmi <= 0) return "";

  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

/**
 * Formats BMI with category
 * @param bmi - BMI value
 * @returns Formatted string like "29.8 - Overweight" or null
 */
export function formatBMI(bmi: number | null | undefined): string | null {
  if (!bmi || bmi <= 0) return null;

  const roundedBMI = Math.round(bmi * 10) / 10;
  const category = getBMICategory(roundedBMI);

  return `${roundedBMI} - ${category}`;
}