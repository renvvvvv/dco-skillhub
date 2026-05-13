import { useState, useEffect } from 'react';

interface ExpertReviewFormProps {
  slug: string;
  onReviewSubmitted?: () => void;
}

const REVIEW_DIMENSIONS = [
  { key: 'code_quality', label: '代码质量', maxScore: 100 },
  { key: 'documentation', label: '文档完整性', maxScore: 100 },
  { key: 'functionality', label: '功能完善度', maxScore: 100 },
  { key: 'innovation', label: '创新性', maxScore: 100 },
  { key: 'maintainability', label: '可维护性', maxScore: 100 },
];

export function ExpertReviewForm({ slug, onReviewSubmitted }: ExpertReviewFormProps) {
  const [dimensions, setDimensions] = useState<Record<string, { score: number; comment: string }>>({});
  const [overallComment, setOverallComment] = useState('');
  const [isRecommended, setIsRecommended] = useState<boolean | null>(null);
  const [expertName, setExpertName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleDimensionChange = (key: string, field: 'score' | 'comment', value: string | number) => {
    setDimensions(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
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
      const response = await fetch(`/api/skills/${slug}/expert-review`, {
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

      setSubmitted(true);
      onReviewSubmitted?.();
    } catch (error) {
      console.error('评审提交失败:', error);
      alert('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <svg className="w-12 h-12 mx-auto mb-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-green-800 mb-1">评审提交成功</h3>
        <p className="text-green-600">感谢您的专业评审！</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">专家评审</h3>
        <span className="text-sm text-gray-500">请对各维度进行评分（0-100）</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">专家姓名</label>
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
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
      >
        {isSubmitting ? '提交中...' : '提交评审'}
      </button>
    </div>
  );
}

interface ExpertReviewListProps {
  slug: string;
}

export function ExpertReviewList({ slug }: ExpertReviewListProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/skills/${slug}/expert-reviews`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReviews(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="text-center py-8 text-gray-500">加载中...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl">
        <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>暂无专家评审</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">专家评审记录</h3>
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
  );
}
