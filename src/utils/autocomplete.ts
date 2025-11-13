// Utility for managing frequently used words/autocomplete suggestions

const STORAGE_PREFIX = 'autocomplete_'

export function getSuggestions(fieldName: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${fieldName}`)
    if (!stored) return []
    const items = JSON.parse(stored) as string[]
    return items.filter(Boolean).slice(0, 10) // Keep top 10
  } catch {
    return []
  }
}

export function addSuggestion(fieldName: string, value: string): void {
  if (typeof window === 'undefined' || !value?.trim()) return
  try {
    const current = getSuggestions(fieldName)
    const trimmed = value.trim()
    // Remove if exists, then add to front
    const filtered = current.filter(v => v.toLowerCase() !== trimmed.toLowerCase())
    const updated = [trimmed, ...filtered].slice(0, 10) // Keep top 10
    localStorage.setItem(`${STORAGE_PREFIX}${fieldName}`, JSON.stringify(updated))
  } catch {
    // Ignore errors
  }
}

export function clearSuggestions(fieldName: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${fieldName}`)
  } catch {
    // Ignore errors
  }
}

