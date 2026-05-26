import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card'
import { Button } from '../../shared/ui/button'
import { ScenarioMap, SkillAssociation, SkillSelector, SkillAssociationConfig } from './quickstart-api'
import { Skill } from '../../api/simple-client'

interface ScenarioMapTabProps {
  scenarios: ScenarioMap[]
  availableSkills: Skill[]
  onCreateScenario: (data: Partial<ScenarioMap>) => void
  onUpdateScenario: (id: string, data: Partial<ScenarioMap>) => void
  onDeleteScenario: (id: string) => void
  onUpdateSkills: (scenarioId: string, skills: SkillAssociation[]) => void
}

export function ScenarioMapTab({
  scenarios,
  availableSkills,
  onCreateScenario,
  // onUpdateScenario,
  onDeleteScenario,
  onUpdateSkills,
}: ScenarioMapTabProps) {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioMap | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingSkill, setEditingSkill] = useState<SkillAssociation | null>(null)
  const [newScenario, setNewScenario] = useState({
    name: '',
    description: '',
    icon: '🗺️',
    color: '#3B82F6',
  })

  const handleCreate = () => {
    if (!newScenario.name.trim()) return
    onCreateScenario(newScenario)
    setIsCreating(false)
    setNewScenario({ name: '', description: '', icon: '🗺️', color: '#3B82F6' })
  }

  const handleUpdateSkills = (scenarioId: string, skills: SkillAssociation[]) => {
    onUpdateSkills(scenarioId, skills)
    if (selectedScenario?.id === scenarioId) {
      setSelectedScenario({ ...selectedScenario, skills })
    }
  }

  const [showPreview, setShowPreview] = useState(false)

  return (
    <div className="space-y-6">
      {/* 场景地图列表 */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">场景地图 ({scenarios.length})</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? '📋 列表视图' : '🎨 预览视图'}
          </Button>
          <Button onClick={() => setIsCreating(true)} size="sm">
            + 新建场景
          </Button>
        </div>
      </div>

      {/* HTML预览视图 */}
      {showPreview && (
        <div className="w-full" style={{ height: '800px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <iframe
            src="/vnet-template/index.html"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="VNet运维技能场景地图"
          />
        </div>
      )}

      {/* 列表视图 */}
      {!showPreview && (
        <>
      {/* 原有列表内容 */}

      {isCreating && (
        <Card className="border-dashed border-2">
          <CardContent className="p-4 space-y-3">
            <input
              placeholder="场景名称"
              value={newScenario.name}
              onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <textarea
              placeholder="场景描述"
              value={newScenario.description}
              onChange={(e) => setNewScenario({ ...newScenario, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>取消</Button>
              <Button size="sm" onClick={handleCreate}>创建</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map(scenario => (
          <Card
            key={scenario.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedScenario?.id === scenario.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedScenario(selectedScenario?.id === scenario.id ? null : scenario)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="text-3xl">{scenario.icon}</div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteScenario(scenario.id)
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 mt-2">{scenario.name}</h4>
              <p className="text-sm text-gray-500 mt-1">{scenario.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {scenario.skills?.length || 0} 个技能
                </span>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {scenario.workflow?.length || 0} 个步骤
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 场景详情 */}
      {selectedScenario && (
        <Card className="overflow-hidden">
          <CardHeader 
            className="text-white"
            style={{ backgroundColor: selectedScenario.color }}
          >
            <CardTitle className="flex items-center gap-2">
              <span>{selectedScenario.icon}</span>
              <span>{selectedScenario.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <p className="text-gray-600">{selectedScenario.description}</p>

            {/* 技能关联 */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">关联技能</h4>
              <SkillSelector
                selectedSkills={selectedScenario.skills || []}
                onChange={(skills) => handleUpdateSkills(selectedScenario.id, skills)}
                availableSkills={availableSkills}
              />
              
              {/* 已关联技能列表 */}
              {(selectedScenario.skills || []).length > 0 && (
                <div className="mt-4 space-y-2">
                  {(selectedScenario.skills || [])
                    .sort((a, b) => (a.config?.order || 0) - (b.config?.order || 0))
                    .map((skill, index) => (
                    <div
                      key={skill.skillId}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="flex-1 font-medium">{skill.skillName}</span>
                      {skill.config?.isRequired && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">必需</span>
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

            {/* 工作流可视化 */}
            {selectedScenario.workflow && selectedScenario.workflow.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">工作流</h4>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {selectedScenario.workflow.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-2 shrink-0">
                      <div className="px-4 py-2 bg-blue-50 rounded-lg text-center min-w-[120px]">
                        <div className="text-lg">{step.icon}</div>
                        <div className="text-sm font-medium">{step.title}</div>
                      </div>
                      {index < selectedScenario.workflow!.length - 1 && (
                        <span className="text-gray-400">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 关联配置弹窗 */}
      {editingSkill && (
        <SkillAssociationConfig
          skill={editingSkill}
          onSave={(config) => {
            const updatedSkills = (selectedScenario?.skills || []).map(s =>
              s.skillId === editingSkill.skillId ? { ...s, config } : s
            )
            if (selectedScenario) {
              handleUpdateSkills(selectedScenario.id, updatedSkills)
            }
            setEditingSkill(null)
          }}
          onClose={() => setEditingSkill(null)}
        />
      )}
        </>
      )}
    </div>
  )
}
