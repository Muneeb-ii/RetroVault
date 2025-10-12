// Utility functions for handling Firestore Timestamps in React components

/**
 * Convert a Firestore Timestamp or Date to a readable string
 * @param {Object|Date|string} timestamp - Firestore Timestamp, Date, or string
 * @param {string} format - Format type ('date', 'time', 'datetime', 'locale')
 * @returns {string} Formatted timestamp string
 */
export const formatTimestamp = (timestamp, format = 'locale') => {
  if (!timestamp) return 'Never'
  
  try {
    let date
    
    // Handle Firestore Timestamp objects
    if (timestamp && typeof timestamp === 'object' && timestamp.toDate) {
      date = timestamp.toDate()
    }
    // Handle regular Date objects
    else if (timestamp instanceof Date) {
      date = timestamp
    }
    // Handle ISO strings
    else if (typeof timestamp === 'string') {
      date = new Date(timestamp)
    }
    // Handle objects with seconds and nanoseconds (Firestore Timestamp structure)
    else if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000)
    }
    else {
      return 'Invalid date'
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }
    
    // Format based on requested format
    switch (format) {
      case 'date':
        return date.toLocaleDateString()
      case 'time':
        return date.toLocaleTimeString()
      case 'datetime':
        return date.toLocaleString()
      case 'locale':
      default:
        return date.toLocaleString()
    }
  } catch (error) {
    console.error('Error formatting timestamp:', error, timestamp)
    return 'Invalid date'
  }
}

/**
 * Convert a Firestore Timestamp to a JavaScript Date
 * @param {Object|Date|string} timestamp - Firestore Timestamp, Date, or string
 * @returns {Date|null} JavaScript Date object or null if invalid
 */
export const toDate = (timestamp) => {
  if (!timestamp) return null
  
  try {
    // Handle Firestore Timestamp objects
    if (timestamp && typeof timestamp === 'object' && timestamp.toDate) {
      return timestamp.toDate()
    }
    // Handle regular Date objects
    if (timestamp instanceof Date) {
      return timestamp
    }
    // Handle ISO strings
    if (typeof timestamp === 'string') {
      return new Date(timestamp)
    }
    // Handle objects with seconds and nanoseconds (Firestore Timestamp structure)
    if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000)
    }
    
    return null
  } catch (error) {
    console.error('Error converting timestamp to date:', error, timestamp)
    return null
  }
}

/**
 * Check if a value is a Firestore Timestamp object
 * @param {any} value - Value to check
 * @returns {boolean} True if it's a Firestore Timestamp
 */
export const isFirestoreTimestamp = (value) => {
  return value && 
    typeof value === 'object' && 
    (value.toDate || (value.seconds && value.nanoseconds))
}

/**
 * Safely render a timestamp in React components
 * @param {Object|Date|string} timestamp - Timestamp to render
 * @param {string} fallback - Fallback text if timestamp is invalid
 * @returns {string} Safe string for React rendering
 */
export const safeTimestamp = (timestamp, fallback = 'Never') => {
  const formatted = formatTimestamp(timestamp)
  return formatted === 'Invalid date' ? fallback : formatted
}
