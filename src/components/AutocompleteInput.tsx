import { useState, useRef, useEffect } from 'react'
import { getSuggestions } from '../utils/autocomplete'

type AutocompleteInputProps = {
  fieldName: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'tel' | 'email' | 'number'
  className?: string
  required?: boolean
  autoComplete?: string
}

export default function AutocompleteInput({
  fieldName,
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
  required = false,
  autoComplete,
}: AutocompleteInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const suggestions = getSuggestions(fieldName)
    if (value.trim() && suggestions.length > 0) {
      const filtered = suggestions.filter(s =>
        s.toLowerCase().includes(value.toLowerCase()) && s !== value
      )
      setFilteredSuggestions(filtered.slice(0, 5)) // Show max 5 suggestions
      setShowSuggestions(filtered.length > 0)
    } else {
      setFilteredSuggestions([])
      setShowSuggestions(false)
    }
  }, [value, fieldName])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleBlur = () => {
    // Delay hiding to allow click on suggestion
    setTimeout(() => setShowSuggestions(false), 200)
  }

  const handleChange = (newValue: string) => {
    onChange(newValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && filteredSuggestions.length > 0 && showSuggestions && !isTextarea) {
      e.preventDefault()
      handleSelect(filteredSuggestions[0])
    }
  }

  // Use textarea for notes field, input for others
  const isTextarea = fieldName === 'notes'
  
  return (
    <div ref={containerRef} className="relative">
      {isTextarea ? (
        <textarea
          ref={inputRef as any}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (filteredSuggestions.length > 0) setShowSuggestions(true)
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          required={required}
          rows={3}
        />
      ) : (
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (filteredSuggestions.length > 0) setShowSuggestions(true)
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          required={required}
          autoComplete={autoComplete || (fieldName === 'brand' ? 'organization' : fieldName === 'type' ? 'off' : 'on')}
          inputMode={type === 'tel' || type === 'number' ? 'numeric' : 'text'}
          autoCorrect="on"
          autoCapitalize="words"
          spellCheck="true"
        />
      )}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-neutral-300 bg-white shadow-lg">
          {filteredSuggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 first:rounded-t-md last:rounded-b-md"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

