import { useState, useEffect } from 'react';

interface ExpertReviewManagerProps {
  token: string;
}

interface Skill {
  slug: string;
  name: string;
  author_name: string;
  status: string;
}

const REVIEW_DIMENSIONS = [
  { key: 'code_quality', label: '代码质量', maxScore: 100 },
  { key: 'documentation', label: '文档完整性', maxScore: 100 },
  { key: 'functionality', label: '功能完善度', maxScore: 100 },
  { key: 'innovation', label: '创新性', maxScore: 100 },
  { key: 'maintainability', label: '可维护性', maxScore: 100 },
];

export function ExpertReviewManager({ token: _token }: ExpertReviewManagerProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // 评审表单状态
  const [dimensions, setDimensions] = useState<Record<string, { score: number; comment: string }>>({});
  const [overallComment, setOverallComment] = useState('');
  const [isRecommended, setIsRecommended] = useState<boolean | null>(null);
  const [expertName, setExpertName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 加载已审核的Skill列表
  useEffect(() => {
    fetch('/api/skills?size=100')
      .then(res => res.json())
      .then(data => {
        console.log('Skills API response:', data);
        if (data.success && data.data && data.data.content) {
          const approvedSkills = data.data.content.filter((s: Skill) => s.status === 'approved');
          console.log('Approved skills:', approvedSkills);
          setSkills(approvedSkills);
        } else {
          console.error('Invalid API response structure:', data);
        }
      })
      .catch(err => {
        console.error('Failed to fetch skills:', err);
      });
  }, []);

  // 加载选中Skill的评审记录
  const loadReviews = (slug: string) => {
    fetch(`/api/skills/${slug}/expert-reviews`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReviews(data.data);
        }
      })
      .catch(console.error);
  };

  const handleSelectSkill = (skill: Skill) => {
    setSelectedSkill(skill);
    loadReviews(skill.slug);
    setShowReviewForm(false);
  };

  const handleDimensionChange = (key: string, field: 'score' | 'comment', value: string | number) => {
    setDimensions(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const handleSubmitReview = async () => {
    if (!selectedSkill) return;
    if (!expertName.trim()) {
      alert('请输入专家姓名');
      return;
    }

    const formattedDimensions: Record<string, { score: number; comment: string }> = {};
    for (const dim of REVIEW_DIMENSIONS) {
      if (dimensions[dim.key]) {
        formattedDimensions[dim.key] = {
          score: Number(dimensions[dim.key].score) || 0,
          comment: dimensions[dim.key].comment || '',
        };
      }
    }

    if (Object.keys(formattedDimensions).length === 0) {
      alert('请至少填写一个评分维度');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/skills/${selectedSkill.slug}/expert-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expert_id: `expert_${Date.now()}`,
          expert_name: expertName,
          dimensions: formattedDimensions,
          overall_comment: overallComment,
          is_recommended: isRecommended,
        }),
      });

      if (!response.ok) throw new Error('提交失败');

      alert('评审提交成功！');
      setShowReviewForm(false);
      loadReviews(selectedSkill.slug);
      
      // 重置表单
      setDimensions({});
      setOverallComment('');
      setIsRecommended(null);
    } catch (error) {
      console.error('评审提交失败:', error);
      alert('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skill列表 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">选择Skill进行评审</h3>
              <p className="text-sm text-gray-500 mt-1">共 {skills.length} 个已审核Skill</p>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {skills.map(skill => (
                <button
                  key={skill.slug}
                  onClick={() => handleSelectSkill(skill)}
                  className={`w-full text-left p-4 border-b border-gray-100 transition-colors ${
                    selectedSkill?.slug === skill.slug
                      ? 'bg-blue-50 border-l-4 border-l-blue-500'
                      : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                  }`}
                >
                  <p className="font-medium text-gray-900">{skill.name}</p>
                  <p className="text-sm text-gray-500">作者: {skill.author_name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 评审详情 */}
        <div className="lg:col-span-2">
          {!selectedSkill ? (
            <div className="bg-gray-50 rounded-xl p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500">请从左侧选择一个Skill进行评审</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Skill信息 */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedSkill.name}</h2>
                    <p className="text-gray-500">作者: {selectedSkill.author_name}</p>
                  </div>
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    {showReviewForm ? '取消评审' : '添加评审'}
                  </button>
                </div>
              </div>

              {/* 评审表单 */}
              {showReviewForm && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">专家评审表单</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">专家姓名 *</label>
                    <input
                      type="text"
                      value={expertName}
                      onChange={(e) => setExpertName(e.target.value)}
                      placeholder="请输入您的姓名"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-4">
                    {REVIEW_DIMENSIONS.map((dim) => (
                      <div key={dim.key} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="font-medium text-gray-700">{dim.label}</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max={dim.maxScore}
                              value={dimensions[dim.key]?.score || ''}
                              onChange={(e) => handleDimensionChange(dim.key, 'score', e.target.value)}
                              className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-center"
                              placeholder="0-100"
                            />
                            <span className="text-sm text-gray-500">/ {dim.maxScore}</span>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={dimensions[dim.key]?.comment || ''}
                          onChange={(e) => handleDimensionChange(dim.key, 'comment', e.target.value)}
                          placeholder={`${dim.label}评价（可选）`}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">综合评价</label>
                    <textarea
                      value={overallComment}
                      onChange={(e) => setOverallComment(e.target.value)}
                      placeholder="请输入综合评价..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">是否推荐</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setIsRecommended(true)}
                        className={`flex-1 py-2.5 rounded-lg border-2 transition-all ${
                          isRecommended === true
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-green-300'
                        }`}
                      >
                        推荐
                      </button>
                      <button
                        onClick={() => setIsRecommended(false)}
                        className={`flex-1 py-2.5 rounded-lg border-2 transition-all ${
                          isRecommended === false
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 hover:border-red-300'
                        }`}
                      >
                        不推荐
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitReview}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? '提交中...' : '提交评审'}
                  </button>
                </div>
              )}

              {/* 已有评审记录 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">评审记录 ({reviews.length})</h3>
                
                {reviews.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">
                    <p>暂无专家评审记录</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold">{review.expert_name[0]}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{review.expert_name}</p>
                              <p className="text-sm text-gray-500">{new Date(review.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                          {review.is_recommended !== null && (
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                review.is_recommended
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {review.is_recommended ? '推荐' : '不推荐'}
                            </span>
                          )}
                        </div>

                        {review.dimensions && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                            {Object.entries(review.dimensions).map(([key, dim]: [string, any]) => (
                              <div key={key} className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">
                                  {REVIEW_DIMENSIONS.find((d) => d.key === key)?.label || key}
                                </p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-500 h-2 rounded-full transition-all"
                                      style={{ width: `${dim.score}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">{dim.score}</span>
                                </div>
                                {dim.comment && <p className="text-xs text-gray-600 mt-1">{dim.comment}</p>}
                              </div>
                            ))}
                          </div>
                        )}

                        {review.overall_comment && (
                          <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">{review.overall_comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
