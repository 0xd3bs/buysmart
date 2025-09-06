import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(hours: number): string {
  if (hours < 24) {
    return `${Math.round(hours)}h`
  }

  const days = hours / 24
  if (days < 30) {
    return `${Math.round(days)}d`
  }

  const months = days / 30.44 // Average days per month
  if (months < 12) {
    return `${Math.round(months)}mo`
  }

  const years = months / 12
  if (years < 10) {
    return `${years.toFixed(1)}y`
  }

  return `${Math.round(years)}y`
}

// Format date with proper UTC handling
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date"
    }
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC"
    })
  } catch {
    return "Invalid Date"
  }
}

// Format date and time with proper UTC handling
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date"
    }
    
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC"
    })
  } catch {
    return "Invalid Date"
  }
}

// Convert local datetime to UTC ISO string
export function localToUTC(localDateTime: string): string {
  try {
    const date = new Date(localDateTime)
    return date.toISOString()
  } catch {
    return new Date().toISOString()
  }
}