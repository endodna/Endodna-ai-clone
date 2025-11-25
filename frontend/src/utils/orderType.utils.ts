/**
 * Order type utility functions
 */

/**
 * Formats order type enum value to readable display text
 * Converts "ACTIVATE_COLLECTION_KIT" to "Activate Collection Kit"
 * @param orderType - Order type in UPPER_SNAKE_CASE format
 * @returns Formatted order type string
 */
export function formatOrderTypeDisplay(orderType: string): string {
  return orderType
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Order types that require an address
 * This can be extended or made dynamic based on constants from API
 */
const ORDER_TYPES_REQUIRING_ADDRESS = [
  "SHIP_DIRECTLY_TO_PATIENT",
  "PATIENT_SELF_PURCHASE",
] as const;

/**
 * Order types that skip step 2 (confirmation step)
 */
const ORDER_TYPES_SKIPPING_STEP2 = [
  "PATIENT_SELF_PURCHASE",
] as const;

/**
 * Order types that show shipping address in step 2
 */
const ORDER_TYPES_SHOWING_SHIPPING = [
  "SHIP_DIRECTLY_TO_PATIENT",
] as const;

/**
 * Checks if an order type requires an address
 * @param orderType - The order type to check
 * @returns true if the order type requires an address
 */
export function requiresAddress(orderType: string): boolean {
  return ORDER_TYPES_REQUIRING_ADDRESS.includes(orderType as any);
}

/**
 * Checks if an order type should skip step 2 (confirmation)
 * @param orderType - The order type to check
 * @returns true if step 2 should be skipped
 */
export function shouldSkipStep2(orderType: string): boolean {
  return ORDER_TYPES_SKIPPING_STEP2.includes(orderType as any);
}

/**
 * Checks if an order type should show shipping address in step 2
 * @param orderType - The order type to check
 * @returns true if shipping address should be shown
 */
export function shouldShowShippingAddress(orderType: string): boolean {
  return ORDER_TYPES_SHOWING_SHIPPING.includes(orderType as any);
}

