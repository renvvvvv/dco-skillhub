import { useState, useEffect } from 'react';

interface Skill {
  slug: string;
  name: string;
  author_name: string;
  status: string;
}

interface PickForm {
  skill_slug: string;
  reason: string;
}

interface WeekRecord {
  id: string;
  week_number: number;
  week_start: string;
  week_end: string;
  selected_by_name: string;
  picks: Array<{
    skill_slug: string;
    skill_name: string;
    reason: string;
  }>;
}

export function WeeklyPicksManager() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<PickForm[]>([
    { skill_slug: '', reason: '' },
    { skill_slug: '', reason: '' },
    { skill_slug: '', reason: '' },
  ]);
  const [history, setHistory] = useState<WeekRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingWeek, setEditingWeek] = useState<string | null>(null);

  // 加载Skill列表
  useEffect(() => {
    fetch('/api/skills?size=100')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.content) {
          const approvedSkills = data.data.content.filter((s: Skill) => s.status === 'approved');
          setSkills(approvedSkills);
        }
      })
      .catch(console.error);
  }, []);

  // 加载历史记录
  const loadHistory = () => {
    fetch('/api/admin/weekly-picks/history', {
      headers: { Authorization: 'Bearer admin' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHistory(data.data);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSkillChange = (index: number, skillSlug: string) => {
    const newSelected = [...selectedSkills];
    newSelected[index] = { ...newSelected[index], skill_slug: skillSlug };
    setSelectedSkills(newSelected);
  };

  const handleReasonChange = (index: number, reason: string) => {
    const newSelected = [...selectedSkills];
    newSelected[index] = { ...newSelected[index], reason };
    setSelectedSkills(newSelected);
  };

  const handleSubmit = async () => {
    // 验证
    for (let i = 0; i < 3; i++) {
      if (!selectedSkills[i].skill_slug) {
        setMessage(`请选择第${i + 1}个Skill`);
        return;
      }
      if (!selectedSkills[i].reason.trim()) {
        setMessage(`请填写第${i + 1}个Skill的评选理由`);
        return;
      }
    }

    setLoading(true);
    setMessage('');

    try {
      const url = editingWeek 
        ? `/api/admin/weekly-picks/${editingWeek}` 
        : '/api/admin/weekly-picks';
      const method = editingWeek ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin',
        },
        body: JSON.stringify({
          picks: selectedSkills,
          admin_id: 'admin',
          admin_name: '管理员',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '操作失败');
      }

      const data = await response.json();
      if (data.success) {
        setMessage(editingWeek ? '历史记录更新成功！' : '本周精选设置成功！');
        setSelectedSkills([
          { skill_slug: '', reason: '' },
          { skill_slug: '', reason: '' },
          { skill_slug: '', reason: '' },
        ]);
        setEditingWeek(null);
        loadHistory();
      }
    } catch (error: any) {
      setMessage('操作失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (weekId: string) => {
    try {
      const response = await fetch(`/api/admin/weekly-picks/${weekId}`, {
        headers: { Authorization: 'Bearer admin' },
      });
      
      if (!response.ok) {
        throw new Error('获取记录失败');
      }

      const data = await response.json();
      if (data.success && data.data) {
        const week = data.data;
        const picks = week.picks.map((pick: any) => ({
          skill_slug: pick.skill_slug,
          reason: pick.reason,
        }));
        
        // 确保有3个位置
        while (picks.length < 3) {
          picks.push({ skill_slug: '', reason: '' });
        }
        
        setSelectedSkills(picks.slice(0, 3));
        setEditingWeek(weekId);
        setMessage('');
        
        // 滚动到编辑区域
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error: any) {
      setMessage('加载记录失败: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingWeek(null);
    setSelectedSkills([
      { skill_slug: '', reason: '' },
      { skill_slug: '', reason: '' },
      { skill_slug: '', reason: '' },
    ]);
    setMessage('');
  };

  // 获取已选择的Skill名称
  const getSkillName = (slug: string) => {
    const skill = skills.find(s => s.slug === slug);
    return skill ? skill.name : slug;
  };

  return (
    <div className="space-y-8">
      {/* 设置/编辑本周精选 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {editingWeek ? '编辑历史精选' : '设置本周精选'}
        </h3>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              message.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-4">
          {[0, 1, 2].map(index => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    index === 0
                      ? 'bg-amber-500'
                      : index === 1
                      ? 'bg-gray-500'
                      : 'bg-orange-500'
                  }`}
                >
                  {index + 1}
                </div>
                <span className="font-medium text-gray-700">第{index + 1}位</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">选择Skill</label>
                  <select
                    value={selectedSkills[index].skill_slug}
                    onChange={e => handleSkillChange(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  >
                    <option value="">请选择Skill</option>
                    {skills.map(skill => (
                      <option key={skill.slug} value={skill.slug}>
                        {skill.name} - {skill.author_name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSkills[index].skill_slug && (
                  <div className="text-sm text-gray-500">
                    已选择: {getSkillName(selectedSkills[index].skill_slug)}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">评选理由</label>
                  <textarea
                    value={selectedSkills[index].reason}
                    onChange={e => handleReasonChange(index, e.target.value)}
                    placeholder="请输入评选理由..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? '提交中...' : editingWeek ? '更新记录' : '设置本周精选'}
          </button>
          
          {editingWeek && (
            <button
              onClick={handleCancelEdit}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
            >
              取消编辑
            </button>
          )}
        </div>
      </div>

      {/* 历史记录 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">历史精选记录</h3>

        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-400">暂无历史记录</div>
        ) : (
          <div className="space-y-4">
            {history.map((week, weekIndex) => (
              <div key={weekIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      第{week.week_number}周
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(week.week_start).toLocaleDateString()} -
                      {new Date(week.week_end).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      精选人: {week.selected_by_name}
                    </span>
                    <button
                      onClick={() => handleEdit(week.id)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      编辑
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {week.picks.map((pick: any, pickIndex: number) => (
                    <div
                      key={pickIndex}
                      className="flex items-start gap-3 bg-gray-50 rounded-lg p-3"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                          pickIndex === 0
                            ? 'bg-amber-500'
                            : pickIndex === 1
                            ? 'bg-gray-500'
                            : 'bg-orange-500'
                        }`}
                      >
                        {pickIndex + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{pick.skill_name}</p>
                        <p className="text-sm text-gray-600">{pick.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
