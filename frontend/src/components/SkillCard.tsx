import { Download, Tag } from 'lucide-react'

interface Skill {
  id: string
  name: string
  slug: string
  description: string
  author_name: string
  download_count: number
  latest_version: string
  created_at: string
}

interface SkillCardProps {
  skill: Skill
  onClick?: () => void
}

export function SkillCard({ skill, onClick }: SkillCardProps) {
  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k'
    }
    return String(count)
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN')
  }

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
            {skill.name}
          </h3>
        </div>

        {/* Description */}
        {skill.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
            {skill.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
          <div className="flex items-center space-x-3">
            {/* Version */}
            <span className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full">
              <Tag className="w-3 h-3" />
              <span>v{skill.latest_version}</span>
            </span>

            {/* Downloads */}
            <span className="flex items-center space-x-1">
              <Download className="w-3 h-3" />
              <span>{formatCount(skill.download_count)}</span>
            </span>
          </div>

          {/* Date */}
          <span>{formatDate(skill.created_at)}</span>
        </div>

        {/* Author */}
        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
          作者: {skill.author_name}
        </div>
      </div>
    </div>
  )
}
