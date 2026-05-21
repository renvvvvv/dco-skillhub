import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card'
import { Button } from '../../shared/ui/button'
import { Collection, SkillAssociation, SkillSelector, SkillAssociationConfig } from './quickstart-api'
import { Skill } from '../../api/simple-client'

interface CollectionsTabProps {
  collections: Collection[]
  availableSkills: Skill[]
  onCreateCollection: (data: Partial<Collection>) => void
  onUpdateCollection: (id: string, data: Partial<Collection>) => void
  onDeleteCollection: (id: string) => void
  onUpdateSkills: (collectionId: string, skills: SkillAssociation[]) => void
  onPlayCollection: (collectionId: string) => void
}

export function CollectionsTab({
  collections,
  availableSkills,
  onCreateCollection,
  // onUpdateCollection,
  onDeleteCollection,
  onUpdateSkills,
  onPlayCollection,
}: CollectionsTabProps) {
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingSkill, setEditingSkill] = useState<SkillAssociation | null>(null)
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    icon: '⭐',
    color: '#F59E0B',
    tags: [] as string[],
  })
  const [tagInput, setTagInput] = useState('')

  const handleCreate = () => {
    if (!newCollection.name.trim()) return
    onCreateCollection(newCollection)
    setIsCreating(false)
    setNewCollection({ name: '', description: '', icon: '⭐', color: '#F59E0B', tags: [] })
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !newCollection.tags.includes(tagInput.trim())) {
      setNewCollection({ ...newCollection, tags: [...newCollection.tags, tagInput.trim()] })
      setTagInput('')
    }
  }

  const handleUpdateSkills = (collectionId: string, skills: SkillAssociation[]) => {
    onUpdateSkills(collectionId, skills)
    if (selectedCollection?.id === collectionId) {
      setSelectedCollection({ ...selectedCollection, skills })
    }
  }

  return (
    <div className="space-y-6">
      {/* 精选集列表 */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">精选集 ({collections.length})</h3>
        <Button onClick={() => setIsCreating(true)} size="sm">
          + 新建精选集
        </Button>
      </div>

      {isCreating && (
        <Card className="border-dashed border-2">
          <CardContent className="p-4 space-y-3">
            <input
              placeholder="精选集名称"
              value={newCollection.name}
              onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <textarea
              placeholder="精选集描述"
              value={newCollection.description}
              onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
            />
            <div className="flex gap-2">
              <input
                placeholder="添加标签"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <Button variant="outline" size="sm" onClick={handleAddTag}>添加</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {newCollection.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-1">
                  {tag}
                  <button
                    onClick={() => setNewCollection({
                      ...newCollection,
                      tags: newCollection.tags.filter(t => t !== tag)
                    })}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>取消</Button>
              <Button size="sm" onClick={handleCreate}>创建</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map(collection => (
          <Card
            key={collection.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedCollection?.id === collection.id ? 'ring-2 ring-yellow-500' : ''
            }`}
            onClick={() => setSelectedCollection(selectedCollection?.id === collection.id ? null : collection)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="text-3xl">{collection.icon}</div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onPlayCollection(collection.id)
                    }}
                    className="p-1 text-gray-400 hover:text-green-500 rounded"
                    title="使用"
                  >
                    ▶️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteCollection(collection.id)
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 mt-2">{collection.name}</h4>
              <p className="text-sm text-gray-500 mt-1">{collection.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {collection.tags?.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                <span>▶ {collection.playCount || 0} 次使用</span>
                <span>⭐ {collection.likeCount || 0} 收藏</span>
                <span>📦 {collection.skills?.length || 0} 个技能</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 精选集详情 */}
      {selectedCollection && (
        <Card className="overflow-hidden">
          <CardHeader 
            className="text-white"
            style={{ backgroundColor: selectedCollection.color }}
          >
            <CardTitle className="flex items-center gap-2">
              <span>{selectedCollection.icon}</span>
              <span>{selectedCollection.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <p className="text-gray-600">{selectedCollection.description}</p>
            
            <div className="flex flex-wrap gap-2">
              {selectedCollection.tags?.map(tag => (
                <span key={tag} className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                  {tag}
                </span>
              ))}
            </div>

            {/* 技能关联 */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">精选技能</h4>
              <SkillSelector
                selectedSkills={selectedCollection.skills || []}
                onChange={(skills) => handleUpdateSkills(selectedCollection.id, skills)}
                availableSkills={availableSkills}
              />
              
              {/* 已关联技能列表 */}
              {(selectedCollection.skills || []).length > 0 && (
                <div className="mt-4 space-y-2">
                  {(selectedCollection.skills || [])
                    .sort((a, b) => (a.config?.order || 0) - (b.config?.order || 0))
                    .map((skill, index) => (
                    <div
                      key={skill.skillId}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="w-6 h-6 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="flex-1 font-medium">{skill.skillName}</span>
                      {skill.config?.estimatedTime && (
                        <span className="text-xs text-gray-500">⏱ {skill.config.estimatedTime}</span>
                      )}
                      <button
                        onClick={() => setEditingSkill(skill)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        配置
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button 
              className="w-full"
              onClick={() => onPlayCollection(selectedCollection.id)}
            >
              ▶ 开始使用此精选集
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 关联配置弹窗 */}
      {editingSkill && (
        <SkillAssociationConfig
          skill={editingSkill}
          onSave={(config) => {
            const updatedSkills = (selectedCollection?.skills || []).map(s =>
              s.skillId === editingSkill.skillId ? { ...s, config } : s
            )
            if (selectedCollection) {
              handleUpdateSkills(selectedCollection.id, updatedSkills)
            }
            setEditingSkill(null)
          }}
          onClose={() => setEditingSkill(null)}
        />
      )}
    </div>
  )
}
