import { ChevronDown } from "lucide-react"

interface SelectFieldProps {
  value:       string
  onChange:    (v: string) => void
  options:     { value: string; label: string }[]
  placeholder?: string
  disabled?:   boolean
}

export function SelectField({ value, onChange, options, placeholder, disabled }: SelectFieldProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none bg-zinc-900 border border-zinc-800 focus:border-violet-500/60
                   rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none transition-all pr-9
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
    </div>
  )
}
