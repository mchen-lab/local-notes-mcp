/**
 * Frontend Configuration Constants
 * 
 * These values control the frontend behavior.
 * Modify these values to adjust polling frequency, debounce timing, etc.
 */

// Polling Configuration
export const POLL_INTERVAL_MS = 10000;       // How often to check for updated notes (10 seconds)
export const POLL_INTERVAL_SLOW_MS = 60000;  // Slow polling when window unfocused (60 seconds)
export const POLL_LOOKBACK_MS = 15000;       // Time window for "updated since" query (15 seconds)

// UI Configuration
export const SEARCH_DEBOUNCE_MS = 250;       // Delay before search filter applies (250ms)
