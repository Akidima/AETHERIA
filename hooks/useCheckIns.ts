// useCheckIns hook - extracted from DailyCheckIn.tsx for lazy-loading support
import { useState, useCallback, useEffect } from 'react';
import { DailyCheckIn as CheckInType } from '../types';

const STORAGE_KEY = 'aetheria_checkins';

export function useCheckIns() {
  const [checkIns, setCheckIns] = useState<CheckInType[]>([]);
  const [streak, setStreak] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(false);

  // Load check-ins from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CheckInType[];
        setCheckIns(parsed);
        
        // Calculate streak
        const today = new Date().toISOString().split('T')[0];
        setTodayCompleted(parsed.some(c => c.date === today));
        
        let currentStreak = 0;
        const sortedDates = [...new Set(parsed.map(c => c.date))].sort().reverse();
        
        for (let i = 0; i < sortedDates.length; i++) {
          const expectedDate = new Date();
          expectedDate.setDate(expectedDate.getDate() - i);
          const expected = expectedDate.toISOString().split('T')[0];
          
          if (sortedDates[i] === expected) {
            currentStreak++;
          } else if (i === 0 && sortedDates[i] === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
            // Allow yesterday if today not completed yet
            currentStreak++;
          } else {
            break;
          }
        }
        
        setStreak(currentStreak);
      }
    } catch (e) {
      console.warn('Failed to load check-ins');
    }
  }, []);

  const addCheckIn = useCallback((checkIn: Omit<CheckInType, 'id' | 'createdAt'>) => {
    const newCheckIn: CheckInType = {
      ...checkIn,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };

    setCheckIns(prev => {
      const updated = [newCheckIn, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    setTodayCompleted(true);
    setStreak(prev => prev + 1);

    return newCheckIn;
  }, []);

  return { checkIns, streak, todayCompleted, addCheckIn };
}
