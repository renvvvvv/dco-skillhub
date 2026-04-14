import { useState, useEffect } from 'react'
import { getSkills, searchSkills, getSkill, publishSkill, deleteSkill, Skill, SkillDetail } from './api/simple-client'
import { UploadZone } from './features/publish/upload-zone'
import { SearchBar } from './features/search/search-bar'
import { Button } from './shared/ui/button'
import { Input } from './shared/ui/input'
import { Label } from './shared/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './shared/ui/card'
import { StaffSearchInput, Staff } from './components/StaffSearchInput'

// 更新 Dialog
function 更新Dialog({ skill, isOpen, onClose, onSuccess }: { 
  skill: SkillDetail | null, isOpen: boolean, onClose: () => void, onSuccess: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [version, set版本号] = useState('')
  const [tag, set标签] = useState('稳定版')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !skill) { alert('请选择文件'); return }
    const formData = new FormData()
    formData.append('skillZip', file)
    formData.append('version', version)
    formData.append('tag', tag)
    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/skills/${skill.slug}/versions`, { method: 'POST', body: formData })
      if (!response.ok) { const error = await response.json(); throw new Error(error.detail || '更新 failed') }
      alert('版本号 updated successfully!')
      onSuccess()
      onClose()
    } catch (err) { alert('更新 failed: ' + (err as Error).message) }
    finally { setIsSubmitting(false) }
  }
  if (!isOpen || !skill) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">更新 Skill 版本号</h2>
          <p className="text-sm text-gray-500 mt-1">{skill.name}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><Label>New 版本号 Package (ZIP)</Label><div className="mt-2"><UploadZone onFileSelect={setFile} />{file && <p className="mt-2 text-sm text-green-600">已选择: {file.name}</p>}</div></div>
          <div><Label htmlFor="update版本号">版本号</Label><Input id="update版本号" value={version} onChange={(e) => set版本号(e.target.value)} placeholder="例如: 1.1.0" required /></div>
          <div><Label htmlFor="update标签">标签</Label><select id="update标签" value={tag} onChange={(e) => set标签(e.target.value)} className="w-full border rounded-lg px-3 py-2"><option value="稳定版">Stable</option><option value="测试版">Beta</option></select></div>
          <div className="flex gap-3 pt-4"><Button type="button" variant="outline" onClick={onClose} className="flex-1">取消</Button><Button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500">{isSubmitting ? '更新中...' : 'Confirm 更新'}</Button></div>
        </form>
      </div>
    </div>
  )
}

import { StartPage } from './start-page'

// Skill Card
function SimpleSkillCard({ skill, onClick, onDelete }: { skill: Skill; onClick: () => void; onDelete: (e: React.MouseEvent) => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow relative group">
      <div onClick={onClick}>
        <CardHeader><CardTitle className="text-lg">{skill.name}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 line-clamp-2">{skill.description || '暂无描述'}</p>
          <div className="flex items-center justify-between mt-4 text-xs text-gray-500"><span>作者: {skill.author_name}</span><span>下载: {skill.download_count}</span></div>
          <div className="mt-2"><span className="px-2 py-1 bg-gray-100 rounded text-xs">v{skill.latest_version}</span></div>
        </CardContent>
      </div>
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
        title="删除 Skill"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </Card>
  )
}

// Main App
export function SimpleApp() {
  const [currentView, setCurrentView] = useState<'start' | 'home' | 'publish' | 'detail'>('start')
  const [skills, setSkills] = useState<Skill[]>([])
  const [selectedSkill, setSelectedSkill] = useState<SkillDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [is更新DialogOpen, setIs更新DialogOpen] = useState(false)

  useEffect(() => { if (currentView !== 'start') { loadSkills() } }, [currentView])

  async function loadSkills() {
    try { setIsLoading(true); setError(null); const result = await getSkills(); setSkills(result.data.content) }
    catch (err) { setError('加载失败: ' + (err as Error).message) }
    finally { setIsLoading(false) }
  }

  async function handle搜索(query: string) {
    if (!query.trim()) { loadSkills(); return }
    try { setIsLoading(true); const result = await searchSkills(query); setSkills(result.data.content) }
    catch (err) { setError('搜索 failed: ' + (err as Error).message) }
    finally { setIsLoading(false) }
  }

  async function handleSkillClick(slug: string) {
    try { const result = await getSkill(slug); setSelectedSkill(result.data); setCurrentView('detail') }
    catch (err) { alert('加载详情失败: ' + (err as Error).message) }
  }

  async function handleDeleteSkill(e: React.MouseEvent, slug: string) {
    e.stopPropagation()
    if (!confirm('确定要删除这个 Skill 吗？此操作不可恢复。')) return
    try {
      await deleteSkill(slug)
      alert('删除成功!')
      loadSkills()
    } catch (err) {
      alert('删除失败: ' + (err as Error).message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 onClick={() => setCurrentView('start')} className="text-xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent cursor-pointer">DCO SkillHub</h1>
            <nav className="hidden sm:flex bg-gray-100/80 p-1 rounded-xl">
              {[{ key: 'start', label: '开始' }, { key: 'home', label: '浏览' }, { key: 'publish', label: '发布' }].map((item) => (
                <button key={item.key} onClick={() => setCurrentView(item.key as any)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${currentView === item.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{item.label}</button>
              ))}
            </nav>
            <div className="sm:hidden">
              <select value={currentView} onChange={(e) => setCurrentView(e.target.value as any)} className="bg-gray-100 border-0 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-pink-500">
                <option value="start">开始</option><option value="home">浏览</option><option value="publish">发布</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main>
        {currentView === 'start' && <StartPage onEnter={() => setCurrentView('home')} />}
        {currentView === 'home' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
              <div className="text-center py-8"><h2 className="text-3xl font-bold text-gray-900 mb-4">发现与分享技能</h2><div className="max-w-2xl mx-auto"><SearchBar onSearch={handle搜索} /></div></div>
              {isLoading && <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div><p className="mt-4 text-gray-500">加载中...</p></div>}
              {error && <div className="text-center py-12"><p className="text-red-500 mb-4">{error}</p><Button onClick={loadSkills}>重试</Button></div>}
              {!isLoading && !error && skills.length === 0 && <div className="text-center py-12"><p className="text-gray-500">暂无技能</p></div>}
              {!isLoading && !error && skills.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{skills.map(skill => <SimpleSkillCard key={skill.id} skill={skill} onClick={() => handleSkillClick(skill.slug)} onDelete={(e) => handleDeleteSkill(e, skill.slug)} />)}</div>}
            </div>
          </div>
        )}
        {currentView === 'publish' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <发布View onSuccess={() => { loadSkills(); setCurrentView('home') }} />
          </div>
        )}
        {currentView === 'detail' && selectedSkill && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <DetailView skill={selectedSkill} on返回={() => setCurrentView('home')} on更新={() => setIs更新DialogOpen(true)} />
          </div>
        )}
      </main>

      <更新Dialog skill={selectedSkill} isOpen={is更新DialogOpen} onClose={() => setIs更新DialogOpen(false)} onSuccess={loadSkills} />
    </div>
  )
}

// 发布 View
function 发布View({ onSuccess }: { onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const [authorEmployeeId, setAuthorEmployeeId] = useState('')
  const [authorDepartment, setAuthorDepartment] = useState('')
  const [authorOrganization, setAuthorOrganization] = useState('')
  
  function handleStaffSelect(staff: Staff) {
    setAuthorName(staff.name)
    // 优先使用新员工编号，如果没有则使用员工编号
    setAuthorEmployeeId(staff.new_employee_id || staff.employee_id || '')
    setAuthorDepartment(staff.department)
    setAuthorOrganization(staff.organization)
  }
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) { alert('请选择文件'); return }
    const form = e.currentTarget
    
    // 获取表单值
    const nameValue = (form.elements.namedItem('authorName') as HTMLInputElement).value
    if (!nameValue.trim()) { alert('请输入作者名称'); return }
    
    const formData = new FormData()
    formData.append('skillZip', file)
    formData.append('authorName', nameValue)
    formData.append('authorEmployeeId', (form.elements.namedItem('authorEmployeeId') as HTMLInputElement)?.value || '')
    formData.append('authorDepartment', (form.elements.namedItem('authorDepartment') as HTMLInputElement)?.value || '')
    formData.append('authorOrganization', (form.elements.namedItem('authorOrganization') as HTMLInputElement)?.value || '')
    formData.append('version', (form.elements.namedItem('version') as HTMLInputElement).value)
    formData.append('tag', (form.elements.namedItem('tag') as HTMLSelectElement).value)
    try { setIsSubmitting(true); await publishSkill(formData); alert('发布成功!'); onSuccess() }
    catch (err) { alert('发布失败: ' + (err as Error).message) }
    finally { setIsSubmitting(false) }
  }
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader><CardTitle>发布 New Skill</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>技能包 (ZIP)</Label><div className="mt-2"><UploadZone onFileSelect={setFile} />{file && <p className="mt-2 text-sm text-green-600">已选择: {file.name}</p>}</div></div>
          
          <div><Label>人员搜索</Label><div className="mt-2"><StaffSearchInput onSelect={handleStaffSelect} placeholder="输入姓名或工号搜索..." /></div></div>
          
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="authorName">作者名称</Label><Input id="authorName" name="authorName" value={authorName} onChange={(e) => setAuthorName(e.target.value)} required /></div>
            <div><Label htmlFor="authorEmployeeId">作者工号</Label><Input id="authorEmployeeId" name="authorEmployeeId" value={authorEmployeeId} onChange={(e) => setAuthorEmployeeId(e.target.value)} /></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="authorDepartment">部门</Label><Input id="authorDepartment" name="authorDepartment" value={authorDepartment} readOnly className="bg-gray-50" /></div>
            <div><Label htmlFor="authorOrganization">组织</Label><Input id="authorOrganization" name="authorOrganization" value={authorOrganization} readOnly className="bg-gray-50" /></div>
          </div>
          
          <div><Label htmlFor="version">版本号</Label><Input id="version" name="version" defaultValue="1.0.0" required /></div>
          <div><Label htmlFor="tag">标签</Label><select id="tag" name="tag" className="w-full border rounded px-3 py-2"><option value="稳定版">Stable</option><option value="测试版">Beta</option></select></div>
          <div className="flex space-x-4 pt-4"><Button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500">{isSubmitting ? '发布中...' : '发布 Skill'}</Button></div>
        </form>
      </CardContent>
    </Card>
  )
}

// Detail View with 下载 and 更新 Buttons
function DetailView({ skill, on返回, on更新 }: { skill: SkillDetail; on返回: () => void; on更新: () => void }) {
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={on返回}>← 返回</Button>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl">{skill.name}</CardTitle>
            <div className="flex gap-3">
              <a href={`/api/skills/${skill.slug}/download`} download className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all hover:-translate-y-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                下载
              </a>
              <button onClick={on更新} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 transition-all hover:-translate-y-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                更新
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600 text-lg">{skill.description || '暂无描述'}</p>
          <div className="flex items-center gap-6 text-sm text-gray-500 bg-gray-50 p-4 rounded-xl">
            <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>作者: {skill.author_name}</span>
            <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>下载s: {skill.download_count}</span>
          </div>
          {skill.versions && skill.versions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>版本号 History</h3>
              <div className="space-y-3">{skill.versions.map(v => (
                <div key={v.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3"><span className="font-semibold text-gray-900">{v.version}</span>{v.tag && <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${v.tag === '稳定版' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{v.tag}</span>}{v.is_latest && <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-pink-100 text-pink-700">最新</span>}</div>
                  <a href={`/api/skills/${skill.slug}/download?version=${v.version}`} className="text-pink-600 hover:text-pink-700 font-medium text-sm flex items-center gap-1 hover:underline" download>下载<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></a>
                </div>
              ))}</div>
            </div>
          )}
          {skill.readme_content && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>文档说明</h3>
              <pre className="bg-gray-50 p-5 rounded-xl text-sm overflow-x-auto border border-gray-100 text-gray-700 leading-relaxed">{skill.readme_content}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
