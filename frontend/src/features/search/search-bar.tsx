import { useState } from 'react'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'

interface SearchFilters {
  author?: string
  department?: string
  tag?: string
}

interface SearchBarProps {
  onSearch: (query: string, filters?: SearchFilters) => void
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  isSearching?: boolean
  showFilters?: boolean
  availableTags?: string[]
}

export function SearchBar({ 
  onSearch, 
  placeholder = '搜索技能名称、描述、作者或部门...',
  value: controlledValue,
  onChange: controlledOnChange,
  isSearching = false,
  showFilters = true,
  availableTags = []
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState('')
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({})
  
  const value = controlledValue !== undefined ? controlledValue : internalValue
  const setValue = controlledOnChange || setInternalValue

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(value, filters)
  }

  const hasActiveFilters = filters.author || filters.department || filters.tag

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isSearching}
            className="w-full"
          />
          {hasActiveFilters && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
              已筛选
            </span>
          )}
        </div>
        {showFilters && (
          <Button 
            type="button" 
            variant="outline"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={hasActiveFilters ? 'border-blue-300 text-blue-600' : ''}
          >
            筛选 {hasActiveFilters ? '●' : ''}
          </Button>
        )}
        <Button type="submit" disabled={isSearching}>
          {isSearching ? '搜索中...' : '搜索'}
        </Button>
      </form>

      {showFilterPanel && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">作者</label>
              <Input
                type="text"
                placeholder="输入作者名"
                value={filters.author || ''}
                onChange={(e) => setFilters(f => ({ ...f, author: e.target.value }))}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">部门</label>
              <Input
                type="text"
                placeholder="输入部门名"
                value={filters.department || ''}
                onChange={(e) => setFilters(f => ({ ...f, department: e.target.value }))}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">标签</label>
              {availableTags.length > 0 ? (
                <select
                  value={filters.tag || ''}
                  onChange={(e) => setFilters(f => ({ ...f, tag: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">全部标签</option>
                  {availableTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              ) : (
                <Input
                  type="text"
                  placeholder="输入标签"
                  value={filters.tag || ''}
                  onChange={(e) => setFilters(f => ({ ...f, tag: e.target.value }))}
                  className="text-sm"
                />
              )}
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setFilters({})}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                清除筛选
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
