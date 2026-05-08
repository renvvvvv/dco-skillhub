// 开始页面 - 包含 Hero、智能体矩阵、复利效应、成果数据、成长路径
export function StartPage({ onEnter }: { onEnter: () => void }) {
  const agents = [
    { icon: '🔧', title: '故障诊断专家', desc: '快速定位系统故障根因，提供修复建议和应急预案，支持多维度日志分析', tags: ['日志分析', '根因定位', '应急处理'], color: 'from-blue-400 to-blue-500' },
    { icon: '📊', title: '容量规划师', desc: '基于历史数据和业务趋势，智能预测资源需求，优化成本结构', tags: ['趋势预测', '成本优化', '资源调度'], color: 'from-purple-400 to-purple-500' },
    { icon: '🔒', title: '安全审计官', desc: '自动化安全检查，识别配置漏洞，提供合规建议和修复方案', tags: ['漏洞扫描', '合规检查', '风险评估'], color: 'from-orange-400 to-orange-500' },
    { icon: '⚙️', title: '自动化工程师', desc: '生成运维脚本和自动化流程，支持Ansible、Shell、Python等多语言', tags: ['脚本生成', 'CI/CD', '流水线'], color: 'from-green-400 to-green-500' },
    { icon: '🚨', title: '告警治理专家', desc: '智能降噪、关联分析、根因聚合，让告警从噪音变为可执行洞察', tags: ['告警降噪', '关联分析', '智能分级'], color: 'from-red-400 to-red-500' },
    { icon: '📚', title: '知识库管家', desc: '运维知识沉淀与检索，SOP、故障案例、最佳实践一网打尽', tags: ['知识检索', 'SOP', '案例库'], color: 'from-cyan-400 to-cyan-500' },
    { icon: '🐳', title: '容器编排助手', desc: 'Kubernetes 问题诊断、资源配置优化、集群健康检查', tags: ['K8s诊断', '资源优化', '调度分析'], color: 'from-indigo-400 to-indigo-500' },
    { icon: '🗄️', title: '数据库专家', desc: 'SQL优化、性能调优、备份策略、慢查询分析一站式解决', tags: ['SQL优化', '性能调优', '容灾方案'], color: 'from-pink-400 to-pink-500' },
  ];

  const compounds = [
    { icon: '💡', title: '知识沉淀', desc: '故障案例、解决方案自动归档，形成部门级知识资产' },
    { icon: '🔄', title: '能力复用', desc: '专家经验数字化，新手也能获得资深工程师的指导' },
    { icon: '📈', title: '持续进化', desc: '基于使用反馈和数据积累，智能体越用越聪明' },
    { icon: '🤝', title: '协同增效', desc: '多智能体协作，复杂问题一站式解决' },
  ];

  const achievements = [
    { number: '1,200+', label: '小时 / 月', desc: '为事业部节省的人工成本，相当于3名全职工程师', featured: false },
    { number: '85%', label: '效率提升', desc: '常见故障诊断时间从平均2小时缩短至15分钟', featured: true },
    { number: '98%', label: '满意度', desc: '运维同事对智能体服务的满意度评分', featured: false },
  ];

  const growthSteps = [
    { step: '1', title: '新手入门', desc: '智能问答\n基础操作指引' },
    { step: '2', title: '技能积累', desc: 'SOP 学习\n案例复盘' },
    { step: '3', title: '独立处理', desc: '智能体辅助\n自主解决问题' },
    { step: '4', title: '专家进阶', desc: '深度优化\n策略制定' },
    { step: '5', title: '知识输出', desc: '训练智能体\n赋能团队' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-y-auto bg-gradient-to-b from-pink-50 via-white to-purple-50/30">
      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-pink-200/50 to-purple-200/30 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-200/40 to-pink-200/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-pink-200 shadow-sm mb-8">
            <span className="text-pink-500">⚡</span>
            <span className="text-sm font-medium text-gray-700">运维事业部 · 数智中心</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="text-gray-800">DCO SkillHub</span>
            <br />
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              智能运维复利增长新引擎
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            汇聚全事业部智慧，构建运维智能体生态。从知识沉淀到能力复利，让每一位运维工程师都能站在巨人的肩膀上。
          </p>
          <div className="flex justify-center gap-8 sm:gap-16 mb-12 flex-wrap">
            <div className="text-center px-4">
              <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">50+</div>
              <div className="text-sm text-gray-500 mt-1">专业智能体</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">2,000+</div>
              <div className="text-sm text-gray-500 mt-1">累计服务次数</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">85%</div>
              <div className="text-sm text-gray-500 mt-1">问题解决效率提升</div>
            </div>
          </div>
          <div className="flex justify-center gap-4 flex-wrap">
            <button 
              onClick={onEnter}
              className="px-8 py-4 bg-gradient-to-r from-pink-400 via-purple-400 to-pink-500 text-white font-semibold rounded-2xl shadow-lg shadow-pink-200 hover:shadow-xl hover:shadow-pink-300 transition-all duration-300 hover:-translate-y-1 inline-flex items-center gap-2"
            >
              <span>🚀</span>
              <span>进入 DCO SkillHub</span>
            </button>
            <button className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-2xl border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all duration-300">
              了解更多
            </button>
          </div>
        </div>
      </section>

      {/* 智能体矩阵 */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 bg-rose-50 border border-rose-200 rounded-full text-xs font-medium text-rose-600 mb-4">
              AI Agents Ecosystem
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">运维智能体矩阵</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              覆盖全栈运维场景，从故障诊断到容量规划，从安全审计到自动化运维，每个智能体都是资深专家的数字化分身
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {agents.map((agent, i) => (
              <div key={i} className="group bg-white/70 backdrop-blur-sm border border-pink-100 rounded-2xl p-5 hover:shadow-lg hover:shadow-pink-100/50 hover:border-pink-200 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-lg shadow-md`}>
                    {agent.icon}
                  </div>
                  <h3 className="font-semibold text-gray-800">{agent.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{agent.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {agent.tags.map((tag, j) => (
                    <span key={j} className="px-2.5 py-1 bg-pink-50 text-pink-600 text-xs rounded-full border border-pink-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 复利效应 */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-pink-50/80 to-rose-50/80 border-y border-pink-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 bg-white border border-pink-200 rounded-full text-xs font-medium text-pink-600 mb-4">
              Compound Effect
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">智能体复利效应</h2>
            <p className="text-gray-600">每一次使用都在积累，每一个智能体都在进化，知识资产持续增值</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {compounds.map((item, i) => (
              <div key={i} className="text-center p-6">
                <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-pink-400 to-rose-400 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-pink-200">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 成果展示 */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 bg-rose-50 border border-rose-200 rounded-full text-xs font-medium text-rose-600 mb-4">
              Achievements
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">数智中心成果数据</h2>
            <p className="text-gray-600">用数据说话，数智中心持续为事业部创造价值</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {achievements.map((item, i) => (
              <div 
                key={i} 
                className={`rounded-2xl p-8 text-center transition-all hover:shadow-lg ${
                  item.featured 
                    ? 'bg-gradient-to-br from-pink-400 to-rose-400 text-white shadow-lg shadow-pink-200' 
                    : 'bg-white/80 backdrop-blur-sm border border-pink-100 hover:shadow-pink-100/50'
                }`}
              >
                <div className={`text-4xl font-bold mb-2 ${item.featured ? '' : 'bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent'}`}>
                  {item.number}
                </div>
                <div className={`text-sm mb-1 ${item.featured ? 'text-white/80' : 'text-gray-500'}`}>{item.label}</div>
                <p className={`text-sm ${item.featured ? 'text-white/90' : 'text-gray-600'}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 成长路径 */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-pink-50/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 bg-rose-50 border border-rose-200 rounded-full text-xs font-medium text-rose-600 mb-4">
              Growth Path
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">运维工程师成长路径</h2>
            <p className="text-gray-600">DCO SkillHub 陪伴你从入门到专家，每一步都有 AI 加持</p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-pink-200 via-rose-200 to-pink-200" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {growthSteps.map((item, i) => (
                <div key={i} className="relative text-center group">
                  <div className="w-12 h-12 mx-auto mb-4 bg-white border-2 border-pink-200 rounded-full flex items-center justify-center font-bold text-pink-500 group-hover:border-pink-400 group-hover:bg-pink-50 transition-all z-10 relative">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-500 whitespace-pre-line">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-white/80 backdrop-blur-sm border border-pink-100 rounded-3xl p-10 md:p-14 text-center overflow-hidden shadow-xl shadow-pink-100/50">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-pink-200 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-rose-200 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">开启你的智能运维之旅</h2>
              <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                加入 DCO SkillHub，与全事业部的运维精英一起，用 AI 重塑运维生产力
              </p>
              <button 
                onClick={onEnter}
                className="px-8 py-4 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 text-white font-semibold rounded-2xl shadow-lg shadow-pink-200 hover:shadow-xl hover:shadow-pink-300 transition-all duration-300 hover:-translate-y-1 inline-flex items-center gap-2"
              >
                <span>🚀</span>
                <span>立即进入 DCO SkillHub</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-4 text-center border-t border-pink-100">
        <p className="text-gray-500 text-sm">运维事业部 · 数智中心 | 让运维更智能，让成长更高效</p>
        <p className="text-gray-400 text-xs mt-2">© 2026 DCO SkillHub. Powered by <span className="text-pink-500 font-medium">数智中心</span></p>
      </footer>
    </div>
  )
}
