import { useEffect, useRef } from 'react';
import { trackEvent } from '../api/simple-client';

export function useSkillDuration(slug: string) {
  const startTimeRef = useRef(Date.now());
  const isActiveRef = useRef(true);

  useEffect(() => {
    startTimeRef.current = Date.now();
    isActiveRef.current = true;

    // 页面可见性变化处理
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面隐藏时，记录已使用时间
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (duration > 5) { // 至少使用5秒才记录
          trackEvent('skill.use', slug, { duration, type: 'page_view' });
        }
        isActiveRef.current = false;
      } else {
        // 页面重新可见，重置计时
        startTimeRef.current = Date.now();
        isActiveRef.current = true;
      }
    };

    // 页面卸载前记录
    const handleBeforeUnload = () => {
      if (isActiveRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (duration > 5) {
          trackEvent('skill.use', slug, { duration, type: 'page_view' });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 定期发送心跳（每30秒）
    const heartbeatInterval = setInterval(() => {
      if (isActiveRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (duration > 30) {
          trackEvent('skill.heartbeat', slug, { duration });
        }
      }
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(heartbeatInterval);
      
      // 组件卸载时记录总时长
      if (isActiveRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (duration > 5) {
          trackEvent('skill.use', slug, { duration, type: 'page_view' });
        }
      }
    };
  }, [slug]);
}
