/**
 * Debounced function that delays invoking the function until after
 * the specified delay has elapsed since the last time it was invoked.
 * 
 * @param fnCall - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced version of the function
 */
export default function debounce <Args extends unknown[]> (
    fnCall: (...args: Args) => unknown,
    delay: number
  ): (...args: Args) => void {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
  
    return (...args) => {
      clearTimeout(timeoutId)
  
      timeoutId = setTimeout(() => {
        fnCall(...args)
      }, delay)
    }
  }
  