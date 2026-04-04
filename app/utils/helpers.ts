/**
 * AutoPark AI - Utility Helpers
 */

/**
 * Generate a unique ID (cross-platform compatible)
 * Uses a simple timestamp + random approach since crypto.randomUUID is not available in React Native
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if a point is within a radius of a center point
 */
export function isWithinRadius(
  centerLat: number,
  centerLon: number,
  pointLat: number,
  pointLon: number,
  radiusMeters: number,
): boolean {
  const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
  return distance <= radiusMeters;
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = "GBP",
): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/**
 * Format time ago from date
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Sleep function for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a random string for testing/demo purposes
 */
export function randomString(length: number = 10): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate license plate format (UK format)
 */
export function isValidUKLicensePlate(plate: string): boolean {
  // UK license plate regex (simplified)
  const ukPlateRegex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]{0,3}$/i;
  return ukPlateRegex.test(plate.replace(/\s/g, ""));
}

/**
 * Parse PaybyPhone deep link URL
 */
export function parsePaybyPhoneUrl(url: string): {
  zoneCode?: string;
  locationId?: string;
} | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "paybyphone:") return null;

    const zoneCode = parsed.pathname
      ? parsed.pathname.replace("/", "")
      : undefined;
    const locationId = parsed.searchParams.get("location") || undefined;

    return { zoneCode, locationId };
  } catch {
    return null;
  }
}

/**
 * Create PaybyPhone deep link URL
 */
export function createPaybyPhoneUrl(
  zoneCode: string,
  locationId?: string,
): string {
  let url = `paybyphone://zone/${zoneCode}`;
  if (locationId) {
    url += `?location=${locationId}`;
  }
  return url;
}

/**
 * Get time of day category for AI context
 */
export function getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

/**
 * Get day type for AI context
 */
export function getDayType(): "weekday" | "weekend" {
  const day = new Date().getDay();
  return day === 0 || day === 6 ? "weekend" : "weekday";
}
