import { useState } from 'react'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  isSearching?: boolean
}

export function SearchBar({ 
  onSearch, 
  placeholder = '搜索技能...',
  value: controlledValue,
  onChange: controlledOnChange,
  isSearching = false
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState('')
  
  const value = controlledValue !== undefined ? controlledValue : internalValue
  const setValue = controlledOnChange || setInternalValue

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(value)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isSearching}
        className="flex-1"
      />
      <Button type="submit" disabled={isSearching}>
        {isSearching ? '搜索中...' : '搜索'}
      </Button>
    </form>
  )
}
