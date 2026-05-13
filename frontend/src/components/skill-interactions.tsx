import { useState, useEffect } from 'react';
import { trackEvent } from '../api/simple-client';

interface SkillInteractionsProps {
  slug: string;
  initialFavorites?: number;
  initialShares?: number;
}

export function SkillInteractions({ slug, initialFavorites = 0, initialShares = 0 }: SkillInteractionsProps) {
  const [favorites, setFavorites] = useState(initialFavorites);
  const [shares, setShares] = useState(initialShares);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  // 从localStorage读取收藏状态
  useEffect(() => {
    const favoritedSkills = JSON.parse(localStorage.getItem('favorited_skills') || '[]');
    setIsFavorited(favoritedSkills.includes(slug));
  }, [slug]);

  const handleFavorite = async () => {
    const newFavorited = !isFavorited;
    setIsFavorited(newFavorited);
    setFavorites(prev => newFavorited ? prev + 1 : prev - 1);
    
    // 更新localStorage
    const favoritedSkills = JSON.parse(localStorage.getItem('favorited_skills') || '[]');
    if (newFavorited) {
      favoritedSkills.push(slug);
    } else {
      const index = favoritedSkills.indexOf(slug);
      if (index > -1) favoritedSkills.splice(index, 1);
    }
    localStorage.setItem('favorited_skills', JSON.stringify(favoritedSkills));
    
    // 追踪事件
    trackEvent(newFavorited ? 'skill.favorite' : 'skill.unfavorite', slug);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/skill/${slug}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: '随航守卫 - Skill分享',
          text: '我发现了一个很棒的Skill，快来看看吧！',
          url: shareUrl,
        });
      } catch (err) {
        // 用户取消分享
      }
    } else {
      // 复制到剪贴板
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      } catch (err) {
        // 复制失败，显示URL
        alert(`分享链接：${shareUrl}`);
      }
    }
    
    setShares(prev => prev + 1);
    trackEvent('skill.share', slug, { method: typeof navigator.share === 'function' ? 'native' : 'clipboard' });
  };

  return (
    <div className="flex items-center gap-3">
      {/* 收藏按钮 */}
      <button
        onClick={handleFavorite}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
          isFavorited
            ? 'bg-pink-100 text-pink-600 border border-pink-200'
            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-pink-50 hover:text-pink-500'
        }`}
      >
        <svg className="w-5 h-5" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span className="text-sm font-medium">
          {isFavorited ? '已收藏' : '收藏'}
          {favorites > 0 && ` (${favorites})`}
        </span>
      </button>

      {/* 分享按钮 */}
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 border border-gray-200 rounded-lg hover:bg-blue-50 hover:text-blue-500 transition-all"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span className="text-sm font-medium">
          分享
          {shares > 0 && ` (${shares})`}
        </span>
      </button>

      {/* 分享成功提示 */}
      {showShareToast && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up">
          链接已复制到剪贴板！
        </div>
      )}
    </div>
  );
}
