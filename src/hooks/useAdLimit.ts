import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

const MAX_ADS_PER_HOUR = 2;

export const useAdLimit = () => {
  const { user } = useAuth();
  const [adsWatchedThisHour, setAdsWatchedThisHour] = useState(0);
  const [canWatchAd, setCanWatchAd] = useState(true);
  const [nextAdAvailableIn, setNextAdAvailableIn] = useState<number | null>(null);

  const getStorageKey = useCallback(() => {
    return `ad_history_${user?.id || 'guest'}`;
  }, [user?.id]);

  // Load and clean up ad history
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    const loadAdHistory = () => {
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        setAdsWatchedThisHour(0);
        setCanWatchAd(true);
        return;
      }

      try {
        const adTimestamps: number[] = JSON.parse(stored);
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        
        // Filter to only ads within the last hour
        const recentAds = adTimestamps.filter(ts => ts > oneHourAgo);
        
        // Update storage with cleaned data
        localStorage.setItem(storageKey, JSON.stringify(recentAds));
        
        setAdsWatchedThisHour(recentAds.length);
        setCanWatchAd(recentAds.length < MAX_ADS_PER_HOUR);

        // Calculate when next ad will be available
        if (recentAds.length >= MAX_ADS_PER_HOUR) {
          const oldestAd = Math.min(...recentAds);
          const nextAvailable = oldestAd + 60 * 60 * 1000;
          setNextAdAvailableIn(Math.ceil((nextAvailable - Date.now()) / 1000 / 60));
        } else {
          setNextAdAvailableIn(null);
        }
      } catch {
        localStorage.removeItem(storageKey);
        setAdsWatchedThisHour(0);
        setCanWatchAd(true);
      }
    };

    loadAdHistory();

    // Check every minute
    const interval = setInterval(loadAdHistory, 60 * 1000);
    return () => clearInterval(interval);
  }, [getStorageKey]);

  const recordAdWatch = useCallback(() => {
    const storageKey = getStorageKey();

    const stored = localStorage.getItem(storageKey);
    const adTimestamps: number[] = stored ? JSON.parse(stored) : [];
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    // Filter to recent ads
    const recentAds = adTimestamps.filter(ts => ts > oneHourAgo);
    
    if (recentAds.length >= MAX_ADS_PER_HOUR) {
      return false;
    }

    // Add new timestamp
    recentAds.push(Date.now());
    localStorage.setItem(storageKey, JSON.stringify(recentAds));
    
    setAdsWatchedThisHour(recentAds.length);
    setCanWatchAd(recentAds.length < MAX_ADS_PER_HOUR);

    return true;
  }, [getStorageKey]);

  return {
    adsWatchedThisHour,
    maxAdsPerHour: MAX_ADS_PER_HOUR,
    canWatchAd,
    nextAdAvailableIn,
    recordAdWatch,
  };
};
