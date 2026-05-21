import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card'
import { Button } from '../../shared/ui/button'
import { Skill } from '../../api/simple-client'

// 技能关联配置接口
export interface SkillAssociation {
  skillId: string
  skillName: string
  skillSlug: string
  config: {
    order: number
    isRequired: boolean
    isEnabled: boolean
    contextDescription: string
    usageTips: string
    estimatedTime: string
  }
}

// 场景地图接口
export interface ScenarioMap {
  id: string
  name: string
  description: string
  icon: string
  color: string
  skills: SkillAssociation[]
  workflow: WorkflowStep[]
  createdAt: string
  updatedAt: string
  isPublic: boolean
}

// 精选集接口
export interface Collection {
  id: string
  name: string
  description: string
  coverImage: string
  icon: string
  color: string
  skills: SkillAssociation[]
  tags: string[]
  createdAt: string
  updatedAt: string
  createdBy: string
  createdByName: string
  isPublic: boolean
  playCount: number
  likeCount: number
}

// 工作流步骤
export interface WorkflowStep {
  id: string
  title: string
  description: string
  skillId?: string
  icon: string
}

// 角色学习路径
export interface RolePath {
  id: string
  name: string
  icon: string
  description: string
  steps: PathStep[]
}

export interface PathStep {
  order: number
  title: string
  description: string
  icon: string
}

// 快速入门资源
export interface QuickResource {
  id: string
  title: string
  type: 'video' | 'document' | 'demo'
  url: string
  icon: string
  description: string
}

// 标准文档
export interface StandardDocument {
  id: string
  title: string
  version: string
  type: 'specification' | 'guide' | 'checklist'
  icon: string
  description: string
  sections?: DocSection[]
  downloadUrl?: string
  fileName?: string
  items?: ChecklistItem[]
}

export interface DocSection {
  title: string
  content: string
}

export interface ChecklistItem {
  id: string
  text: string
  required: boolean
}

// 模板
export interface SkillTemplate {
  id: string
  name: string
  description: string
  icon: string
  downloadUrl: string
}

// API 函数
const API_BASE = '/api'

export async function getQuickstartConfig() {
  const res = await fetch(`${API_BASE}/quickstart/config`)
  return res.json()
}

export async function getScenarios() {
  const res = await fetch(`${API_BASE}/scenarios`)
  return res.json()
}

export async function getCollections() {
  const res = await fetch(`${API_BASE}/collections`)
  return res.json()
}

export async function createScenario(data: Partial<ScenarioMap>) {
  const res = await fetch(`${API_BASE}/scenarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function updateScenario(scenarioId: string, data: Partial<ScenarioMap>) {
  const res = await fetch(`${API_BASE}/scenarios/${scenarioId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function deleteScenario(scenarioId: string) {
  const res = await fetch(`${API_BASE}/scenarios/${scenarioId}`, {
    method: 'DELETE',
  })
  return res.json()
}

export async function updateScenarioSkills(scenarioId: string, skills: SkillAssociation[]) {
  const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skills }),
  })
  return res.json()
}

export async function reorderScenarioSkills(scenarioId: string, skillOrders: { skill_id: string; order: number }[]) {
  const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/skills/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skill_orders: skillOrders }),
  })
  return res.json()
}

export async function createCollection(data: Partial<Collection>) {
  const res = await fetch(`${API_BASE}/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function updateCollection(collectionId: string, data: Partial<Collection>) {
  const res = await fetch(`${API_BASE}/collections/${collectionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function deleteCollection(collectionId: string) {
  const res = await fetch(`${API_BASE}/collections/${collectionId}`, {
    method: 'DELETE',
  })
  return res.json()
}

export async function updateCollectionSkills(collectionId: string, skills: SkillAssociation[]) {
  const res = await fetch(`${API_BASE}/collections/${collectionId}/skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skills }),
  })
  return res.json()
}

export async function incrementCollectionPlay(collectionId: string) {
  const res = await fetch(`${API_BASE}/collections/${collectionId}/play`, {
    method: 'POST',
  })
  return res.json()
}

// 技能选择器组件
export function SkillSelector({ 
  selectedSkills, 
  onChange, 
  availableSkills 
}: { 
  selectedSkills: SkillAssociation[]
  onChange: (skills: SkillAssociation[]) => void
  availableSkills: Skill[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredSkills = availableSkills.filter(skill => 
    skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (skill.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleToggleSkill = (skill: Skill) => {
    const exists = selectedSkills.find(s => s.skillId === skill.id)
    if (exists) {
      onChange(selectedSkills.filter(s => s.skillId !== skill.id))
    } else {
      onChange([...selectedSkills, {
        skillId: skill.id,
        skillName: skill.name,
        skillSlug: skill.slug,
        config: {
          order: selectedSkills.length + 1,
          isRequired: true,
          isEnabled: true,
          contextDescription: '',
          usageTips: '',
          estimatedTime: '',
        }
      }])
    }
  }

  return (
    <div className="relative">
      <div 
        className="border rounded-lg p-3 cursor-pointer bg-white hover:border-gray-400 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedSkills.length === 0 ? (
          <span className="text-gray-400">点击选择技能...</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map(skill => (
              <span key={skill.skillId} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                {skill.skillName}
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleSkill(availableSkills.find(s => s.id === skill.skillId)!)
                  }}
                  className="hover:text-blue-900"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-auto">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="搜索技能..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="p-2">
            {filteredSkills.map(skill => {
              const isSelected = selectedSkills.some(s => s.skillId === skill.id)
              return (
                <div
                  key={skill.id}
                  className={`px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2 ${
                    isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleSkill(skill)
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => {}}
                    className="rounded"
                  />
                  <span className="flex-1">{skill.name}</span>
                  <span className="text-xs text-gray-400">{skill.author_name}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// 关联配置弹窗
export function SkillAssociationConfig({
  skill,
  onSave,
  onClose,
}: {
  skill: SkillAssociation
  onSave: (config: SkillAssociation['config']) => void
  onClose: () => void
}) {
  const [config, setConfig] = useState(skill.config)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <CardTitle>配置关联 - {skill.skillName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">执行顺序</label>
            <input
              type="number"
              value={config.order}
              onChange={(e) => setConfig({ ...config, order: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.isRequired}
              onChange={(e) => setConfig({ ...config, isRequired: e.target.checked })}
              className="rounded"
            />
            <label className="text-sm">必需步骤</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.isEnabled}
              onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
              className="rounded"
            />
            <label className="text-sm">启用</label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">场景描述</label>
            <textarea
              value={config.contextDescription}
              onChange={(e) => setConfig({ ...config, contextDescription: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="描述此技能在该场景中的作用..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">使用提示</label>
            <textarea
              value={config.usageTips}
              onChange={(e) => setConfig({ ...config, usageTips: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="提供使用此技能的建议..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">预计耗时</label>
            <input
              type="text"
              value={config.estimatedTime}
              onChange={(e) => setConfig({ ...config, estimatedTime: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="例如：5分钟"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button onClick={() => onSave(config)}>保存</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
