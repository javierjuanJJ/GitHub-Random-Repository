import { useId } from 'react'
import { LANGUAGES } from '../data/languages'

interface LanguageSelectProps {
  value: string
  onChange: (language: string) => void
  disabled: boolean
}

export function LanguageSelect({ value, onChange, disabled }: LanguageSelectProps) {
  const selectId = useId()

  return (
    <div className="select-field">
      <label className="select-label" htmlFor={selectId}>
        Programming language
      </label>
      <select
        id={selectId}
        className="language-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="" disabled>
          Select a Language
        </option>
        {LANGUAGES.map((language) => (
          <option key={language.name} value={language.name}>
            {language.name}
          </option>
        ))}
      </select>
    </div>
  )
}
