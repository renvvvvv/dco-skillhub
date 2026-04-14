import { useState } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  initialQuery?: string
  onSearch: (query: string) => void
}

export function SearchBar({ initialQuery = '', onSearch }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  const handleClear = () => {
    setQuery('')
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center bg-white border rounded-lg shadow-sm">
        <div className="pl-4">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索技能..."
          className="flex-1 px-4 py-3 outline-none text-gray-900"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 font-medium"
        >
          搜索
        </button>
      </div>
    </form>
  )
}
