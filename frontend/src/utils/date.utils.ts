/**
 * Date utility functions
 */

/**
 * Formats a date using Intl.DateTimeFormat options inferred from tokens.
 * @param date - Date string, Date object, or undefined
 * @param formatString - String containing tokens (yyyy, MMM, dd, HH, etc.)
 * @param locale - Optional locale passed to Intl.DateTimeFormat
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | undefined | null,
  formatString = "MM/DD/YYYY",
  locale?: string,
): string {
  if (!date) {
    return "";
  }

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) {
    throw new Error("Invalid date");
  }

  const uppercaseTokens: Record<string, string> = {
    YYYY: String(dateObj.getFullYear()),
    YY: String(dateObj.getFullYear()).slice(-2),
    MM: String(dateObj.getMonth() + 1).padStart(2, "0"),
    M: String(dateObj.getMonth() + 1),
    DD: String(dateObj.getDate()).padStart(2, "0"),
    D: String(dateObj.getDate()),
  };

  const uppercasePattern = /(YYYY|YY|MM|M|DD|D)/g;
  if (uppercasePattern.test(formatString)) {
    return formatString.replace(
      uppercasePattern,
      (token) => uppercaseTokens[token] ?? token,
    );
  }

  const tokenMap: Record<string, Intl.DateTimeFormatOptions> = {
    yyyy: { year: "numeric" },
    yy: { year: "2-digit" },
    MMMM: { month: "long" },
    MMM: { month: "short" },
    MM: { month: "2-digit" },
    M: { month: "numeric" },
    dd: { day: "2-digit" },
    d: { day: "numeric" },
    HH: { hour: "2-digit", hour12: false },
    H: { hour: "numeric", hour12: false },
    hh: { hour: "2-digit", hour12: true },
    h: { hour: "numeric", hour12: true },
    mm: { minute: "2-digit" },
    m: { minute: "numeric" },
    ss: { second: "2-digit" },
    s: { second: "numeric" },
  };

  const options: Intl.DateTimeFormatOptions = {};

  for (const token of Object.keys(tokenMap)) {
    if (formatString.includes(token)) {
      Object.assign(options, tokenMap[token]);
    }
  }

  const formatter = new Intl.DateTimeFormat(locale, options);
  return formatter.format(dateObj);
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
