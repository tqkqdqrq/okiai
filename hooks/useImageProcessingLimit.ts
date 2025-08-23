import { useState, useEffect } from 'react';

interface UsageData {
  count: number;
  resetTime: number;
}

const STORAGE_KEY = 'image_processing_usage';
const MAX_USES_PER_HOUR = 3;
const HOUR_IN_MS = 60 * 60 * 1000;

export const useImageProcessingLimit = () => {
  const [usageCount, setUsageCount] = useState<number>(0);
  const [resetTime, setResetTime] = useState<number>(0);
  const [isLimitReached, setIsLimitReached] = useState<boolean>(false);

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const now = Date.now();
      
      if (stored) {
        const data: UsageData = JSON.parse(stored);
        
        // 1時間経過していたらリセット
        if (now >= data.resetTime) {
          resetUsage();
        } else {
          setUsageCount(data.count);
          setResetTime(data.resetTime);
          setIsLimitReached(data.count >= MAX_USES_PER_HOUR);
        }
      } else {
        resetUsage();
      }
    } catch (error) {
      console.error('Failed to load usage data:', error);
      resetUsage();
    }
  };

  const resetUsage = () => {
    const now = Date.now();
    const nextReset = now + HOUR_IN_MS;
    
    setUsageCount(0);
    setResetTime(nextReset);
    setIsLimitReached(false);
    
    const data: UsageData = {
      count: 0,
      resetTime: nextReset
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const incrementUsage = () => {
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    setIsLimitReached(newCount >= MAX_USES_PER_HOUR);
    
    const data: UsageData = {
      count: newCount,
      resetTime
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const getRemainingTime = () => {
    const now = Date.now();
    const remaining = resetTime - now;
    return Math.max(0, Math.ceil(remaining / (60 * 1000))); // 分単位で返す
  };

  const getRemainingUses = () => {
    return Math.max(0, MAX_USES_PER_HOUR - usageCount);
  };

  return {
    usageCount,
    isLimitReached,
    incrementUsage,
    getRemainingTime,
    getRemainingUses,
    maxUses: MAX_USES_PER_HOUR
  };
};