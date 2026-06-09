import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/card';
import { getRankingDepartments, getRankingDevelopers, getRankingCenters, getRankingRegions, getSkills } from '../api/simple-client';

const METRIC_OPTIONS = [
  { label: '综合得分', value: 'composite' },
  { label: '发布量', value: 'publishes' },
  { label: '下载量', value: 'downloads' },
];

const MEDAL_ICONS = ['🥇', '🥈', '🥉'];

interface SkillDetail {
  name: string;
  slug: string;
  downloads: number;
  views: number;
  author: string;
  department: string;
}

export function RankingsDashboard() {
  const [metric, setMetric] = useState('composite');
  const [departments, setDepartments] = useState<any[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 详情弹窗状态
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedDev, setSelectedDev] = useState<string | null>(null);
  const [deptSkills, setDeptSkills] = useState<SkillDetail[]>([]);
  const [devSkills, setDevSkills] = useState<SkillDetail[]>([]);
  const [deptPage, setDeptPage] = useState(1);
  const [devPage, setDevPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    loadRankings();
  }, [metric]);

  async function loadRankings() {
    setIsLoading(true);
    try {
      const [deptRes, devRes, centerRes, regionRes] = await Promise.all([
        getRankingDepartments(metric, 10),
        getRankingDevelopers(metric, 10),
        getRankingCenters(metric),
        getRankingRegions(metric),
      ]);

      setDepartments(deptRes.data?.rankings || deptRes.data || []);
      setDevelopers(devRes.data?.rankings || devRes.data || []);
      setCenters(centerRes.data?.rankings || centerRes.data || []);
      setRegions(regionRes.data?.rankings || regionRes.data || []);
    } catch (err) {
      console.error('加载评奖数据失败', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDeptSkills(deptName: string) {
    try {
      // 获取所有技能（分页获取，注意：API页码从0开始）
      let allSkills: any[] = [];
      let page = 0; // API页码从0开始
      let hasMore = true;
      
      while (hasMore && page < 5) { // 最多获取500个技能
        const skillsRes = await getSkills({ page, size: 100 });
        const skills = skillsRes.data?.content || [];
        allSkills = [...allSkills, ...skills];
        
        const totalPages = skillsRes.data?.totalPages || 1;
        hasMore = page < totalPages - 1; // 当前页 < 总页数-1
        page++;
      }
      
      const filtered = allSkills
        .filter((s: any) => s.author_department === deptName)
        .map((s: any) => ({
          name: s.name,
          slug: s.slug,
          downloads: s.download_count || 0,
          views: s.view_count || 0,
          author: s.author_name,
          department: s.author_department,
        }));
      setDeptSkills(filtered);
      setDeptPage(1);
    } catch (err) {
      console.error('加载部门技能失败', err);
    }
  }

  async function loadDevSkills(devName: string) {
    try {
      // 获取所有技能（分页获取，注意：API页码从0开始）
      let allSkills: any[] = [];
      let page = 0; // API页码从0开始
      let hasMore = true;
      
      while (hasMore && page < 5) { // 最多获取500个技能
        const skillsRes = await getSkills({ page, size: 100 });
        const skills = skillsRes.data?.content || [];
        allSkills = [...allSkills, ...skills];
        
        const totalPages = skillsRes.data?.totalPages || 1;
        hasMore = page < totalPages - 1; // 当前页 < 总页数-1
        page++;
      }
      
      const filtered = allSkills
        .filter((s: any) => s.author_name === devName)
        .map((s: any) => ({
          name: s.name,
          slug: s.slug,
          downloads: s.download_count || 0,
          views: s.view_count || 0,
          author: s.author_name,
          department: s.author_department,
        }));
      setDevSkills(filtered);
      setDevPage(1);
    } catch (err) {
      console.error('加载个人技能失败', err);
    }
  }

  function handleDeptClick(deptName: string) {
    if (selectedDept === deptName) {
      setSelectedDept(null);
    } else {
      setSelectedDept(deptName);
      loadDeptSkills(deptName);
    }
  }

  function handleDevClick(devName: string) {
    if (selectedDev === devName) {
      setSelectedDev(null);
    } else {
      setSelectedDev(devName);
      loadDevSkills(devName);
    }
  }

  // 分页计算
  const deptTotalPages = Math.ceil(deptSkills.length / ITEMS_PER_PAGE);
  const deptPagedSkills = deptSkills.slice((deptPage - 1) * ITEMS_PER_PAGE, deptPage * ITEMS_PER_PAGE);
  
  const devTotalPages = Math.ceil(devSkills.length / ITEMS_PER_PAGE);
  const devPagedSkills = devSkills.slice((devPage - 1) * ITEMS_PER_PAGE, devPage * ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
        <p className="mt-4 text-gray-500">加载评奖数据...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">评奖数据中心</h2>
          <p className="text-sm text-gray-500 mt-1">部门与个人贡献排名统计（数智中心不参与评比）</p>
        </div>
        
        <div className="flex bg-gray-100 rounded-lg p-1">
          {METRIC_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setMetric(option.value)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                metric === option.value 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-2">
        <span className="text-blue-500">ℹ️</span>
        <p className="text-sm text-blue-700">
          数智中心作为平台运营方，不参与评比。综合得分 = 发布量 × 0.4 + 下载量 × 0.6
        </p>
      </div>

      {/* 部门排行榜 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🏢 部门排行榜</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">排名</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">部门</th>
                  <th className="text-right py-2 px-2 text-sm font-medium text-gray-500">发布</th>
                  <th className="text-right py-2 px-2 text-sm font-medium text-gray-500">下载</th>
                  <th className="text-right py-2 px-2 text-sm font-medium text-gray-500">浏览</th>
                  <th className="text-right py-2 px-2 text-sm font-medium text-gray-500">综合得分</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept: any, idx: number) => (
                  <>
                    <tr 
                      key={dept.name} 
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleDeptClick(dept.name)}
                    >
                      <td className="py-3 px-2">
                        <span className="text-lg">{MEDAL_ICONS[idx] || `${idx + 1}`}</span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{dept.name}</p>
                          <svg 
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              selectedDept === dept.name ? 'rotate-180' : ''
                            }`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">{dept.publishes}</td>
                      <td className="py-3 px-2 text-right">{dept.downloads}</td>
                      <td className="py-3 px-2 text-right">{dept.views}</td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-bold text-pink-600">{dept.composite_score}</span>
                      </td>
                    </tr>
                    
                    {/* 部门详情 */}
                    {selectedDept === dept.name && (
                      <tr>
                        <td colSpan={6} className="px-4 pb-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                              {dept.name} - 技能列表（共 {deptSkills.length} 个）
                            </h4>
                            
                            {deptPagedSkills.length > 0 ? (
                              <>
                                <div className="space-y-2">
                                  {deptPagedSkills.map((skill: SkillDetail) => (
                                    <div 
                                      key={skill.slug} 
                                      className="flex items-center justify-between py-2 px-3 bg-white rounded border border-gray-200"
                                    >
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{skill.name}</p>
                                        <p className="text-xs text-gray-500">作者: {skill.author}</p>
                                      </div>
                                      <div className="flex gap-4 text-sm">
                                        <span className="text-pink-600">📥 {skill.downloads}</span>
                                        <span className="text-purple-600">👁 {skill.views}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* 分页 */}
                                {deptTotalPages > 1 && (
                                  <div className="flex items-center justify-center gap-2 mt-4">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setDeptPage(p => Math.max(1, p - 1)); }}
                                      disabled={deptPage === 1}
                                      className="px-3 py-1 text-sm rounded bg-white border border-gray-300 disabled:opacity-50"
                                    >
                                      上一页
                                    </button>
                                    <span className="text-sm text-gray-600">
                                      {deptPage} / {deptTotalPages}
                                    </span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setDeptPage(p => Math.min(deptTotalPages, p + 1)); }}
                                      disabled={deptPage === deptTotalPages}
                                      className="px-3 py-1 text-sm rounded bg-white border border-gray-300 disabled:opacity-50"
                                    >
                                      下一页
                                    </button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <p className="text-sm text-gray-500 text-center py-4">暂无技能数据</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 个人排行榜 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">👤 个人排行榜</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">排名</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">姓名</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">部门</th>
                  <th className="text-right py-2 px-2 text-sm font-medium text-gray-500">发布</th>
                  <th className="text-right py-2 px-2 text-sm font-medium text-gray-500">下载</th>
                  <th className="text-right py-2 px-2 text-sm font-medium text-gray-500">浏览</th>
                  <th className="text-right py-2 px-2 text-sm font-medium text-gray-500">综合得分</th>
                </tr>
              </thead>
              <tbody>
                {developers.map((dev: any, idx: number) => (
                  <>
                    <tr 
                      key={dev.name} 
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleDevClick(dev.name)}
                    >
                      <td className="py-3 px-2">
                        <span className="text-lg">{MEDAL_ICONS[idx] || `${idx + 1}`}</span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{dev.name}</p>
                          <svg 
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              selectedDev === dev.name ? 'rotate-180' : ''
                            }`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm text-gray-500">{dev.department}</span>
                      </td>
                      <td className="py-3 px-2 text-right">{dev.publishes}</td>
                      <td className="py-3 px-2 text-right">{dev.downloads}</td>
                      <td className="py-3 px-2 text-right">{dev.views}</td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-bold text-pink-600">{dev.composite_score}</span>
                      </td>
                    </tr>
                    
                    {/* 个人详情 */}
                    {selectedDev === dev.name && (
                      <tr>
                        <td colSpan={7} className="px-4 pb-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                              {dev.name} - 技能列表（共 {devSkills.length} 个）
                            </h4>
                            
                            {devPagedSkills.length > 0 ? (
                              <>
                                <div className="space-y-2">
                                  {devPagedSkills.map((skill: SkillDetail) => (
                                    <div 
                                      key={skill.slug} 
                                      className="flex items-center justify-between py-2 px-3 bg-white rounded border border-gray-200"
                                    >
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{skill.name}</p>
                                        <p className="text-xs text-gray-500">{skill.department}</p>
                                      </div>
                                      <div className="flex gap-4 text-sm">
                                        <span className="text-pink-600">📥 {skill.downloads}</span>
                                        <span className="text-purple-600">👁 {skill.views}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* 分页 */}
                                {devTotalPages > 1 && (
                                  <div className="flex items-center justify-center gap-2 mt-4">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setDevPage(p => Math.max(1, p - 1)); }}
                                      disabled={devPage === 1}
                                      className="px-3 py-1 text-sm rounded bg-white border border-gray-300 disabled:opacity-50"
                                    >
                                      上一页
                                    </button>
                                    <span className="text-sm text-gray-600">
                                      {devPage} / {devTotalPages}
                                    </span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setDevPage(p => Math.min(devTotalPages, p + 1)); }}
                                      disabled={devPage === devTotalPages}
                                      className="px-3 py-1 text-sm rounded bg-white border border-gray-300 disabled:opacity-50"
                                    >
                                      下一页
                                    </button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <p className="text-sm text-gray-500 text-center py-4">暂无技能数据</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 区域分布 + 职能中心 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🗺️ 区域分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {regions.map((region: any) => (
                <div key={region.region_id || region.id} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600">{region.region_name || region.name}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ 
                        width: `${Math.max(
                          regions[0]?.publishes > 0 
                            ? (region.publishes / regions[0].publishes) * 100 
                            : 0,
                          5
                        )}%` 
                      }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-medium">
                    {region.publishes}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🏛️ 职能中心统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {centers.map((center: any) => (
                <div key={center.center_id || center.id} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600">{center.center_name || center.name}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ 
                        width: `${Math.max(
                          centers[0]?.publishes > 0 
                            ? (center.publishes / centers[0].publishes) * 100 
                            : 0,
                          5
                        )}%` 
                      }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-medium">
                    {center.publishes}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
