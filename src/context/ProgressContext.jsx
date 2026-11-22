import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'arapca_kulliyati_progress_v4';
const THEME_KEY = 'arapca_kulliyati_theme';

const DEFAULT_PROGRESS = {
  version: '4.0.0',
  updatedAt: null,
  settings: {
    harakaMode: 'full', // 'full' | 'irab' | 'plain'
    speechRate: 0.85,   // 0.7 | 0.85 | 1.0
    dailyGoal: 20       // günlük SRS + aktivite hedefi
  },
  // SRS: { [cardId]: { intervalDays, ease, reps, lapses, dueAt, lastRating, reviews } }
  srs: {},
  favorites: [],        // Favori / Zor kart ID listesi
  completedDrills: {},  // { [drillId]: { correct: boolean, attempts: number, lastAt } }
  completedReadings: [], // readingId listesi
  completedDialogues: [], // dialogueId listesi
  completedWorkshops: [], // workshop item id listesi
  finalScores: {},      // { [finalId]: { score, total, bestScore, lastAt } }
  // Hata Defteri: yanlış yapılan soruları tekrar etmek için saklar
  errorNotebook: [],    // [{ id, moduleId, source, prompt, correctAnswer, explanation, addedAt }]
  // Günlük seri & aktivite sayacı
  activity: {
    streakDays: 0,
    lastActiveDate: null,
    todayDate: null,
    todayCount: 0
  }
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function loadInitialProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      settings: { ...DEFAULT_PROGRESS.settings, ...(parsed.settings || {}) },
      activity: { ...DEFAULT_PROGRESS.activity, ...(parsed.activity || {}) }
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

/**
 * 4 Dereceli Spaced Repetition (SM-2 uyarlamalı)
 * rating: 1 (Tekrar) | 2 (Zor) | 3 (İyi) | 4 (Kolay)
 */
function calculateNextSrs(prev, rating) {
  const now = Date.now();
  const base = prev || { intervalDays: 0, ease: 2.5, reps: 0, lapses: 0, reviews: 0 };
  let ease = base.ease;
  let reps = base.reps;
  let lapses = base.lapses;
  let intervalDays = base.intervalDays;

  if (rating === 1) {
    // Tekrar: kısa süre sonra yeniden sor
    reps = 0;
    lapses += 1;
    ease = Math.max(1.3, ease - 0.2);
    intervalDays = 0;
    return {
      intervalDays,
      ease: Number(ease.toFixed(2)),
      reps,
      lapses,
      reviews: base.reviews + 1,
      lastRating: rating,
      dueAt: now + 10 * 60 * 1000 // 10 dakika sonra
    };
  }

  if (rating === 2) {
    // Zor
    reps = Math.max(1, reps);
    ease = Math.max(1.3, ease - 0.12);
    intervalDays = intervalDays < 1 ? 1 : Math.max(1, Math.round(intervalDays * 1.2));
  } else if (rating === 3) {
    // İyi
    reps += 1;
    if (reps === 1) intervalDays = 1;
    else if (reps === 2) intervalDays = 4;
    else intervalDays = Math.round(intervalDays * ease);
  } else {
    // Kolay
    reps += 1;
    ease = Math.min(3.0, ease + 0.15);
    if (reps === 1) intervalDays = 4;
    else if (reps === 2) intervalDays = 8;
    else intervalDays = Math.round(intervalDays * ease * 1.3);
  }

  return {
    intervalDays,
    ease: Number(ease.toFixed(2)),
    reps,
    lapses,
    reviews: base.reviews + 1,
    lastRating: rating,
    dueAt: now + intervalDays * 24 * 60 * 60 * 1000
  };
}

function bumpDailyActivity(activity) {
  const today = todayISO();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (activity.todayDate === today) {
    return {
      ...activity,
      todayCount: activity.todayCount + 1,
      lastActiveDate: today,
      streakDays: Math.max(1, activity.streakDays)
    };
  }
  const streakDays = activity.lastActiveDate === yesterday ? activity.streakDays + 1 : 1;
  return {
    streakDays,
    lastActiveDate: today,
    todayDate: today,
    todayCount: 1
  };
}

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(loadInitialProgress);
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...progress, updatedAt: new Date().toISOString() }));
    } catch {
      // localStorage dolu veya devre dışı
    }
  }, [progress]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setHarakaMode = useCallback((harakaMode) => {
    setProgress((p) => ({ ...p, settings: { ...p.settings, harakaMode } }));
  }, []);

  const setSpeechRate = useCallback((speechRate) => {
    setProgress((p) => ({ ...p, settings: { ...p.settings, speechRate } }));
  }, []);

  const rateCard = useCallback((cardId, rating) => {
    setProgress((p) => ({
      ...p,
      srs: { ...p.srs, [cardId]: calculateNextSrs(p.srs[cardId], rating) },
      activity: bumpDailyActivity(p.activity)
    }));
  }, []);

  const toggleFavorite = useCallback((cardId) => {
    setProgress((p) => {
      const exists = p.favorites.includes(cardId);
      return {
        ...p,
        favorites: exists ? p.favorites.filter((id) => id !== cardId) : [...p.favorites, cardId]
      };
    });
  }, []);

  const recordDrillResult = useCallback((drillId, correct, errorMeta = null) => {
    setProgress((p) => {
      const prev = p.completedDrills[drillId];
      let nextNotebook = p.errorNotebook;

      if (!correct && errorMeta) {
        const exists = nextNotebook.some((item) => item.id === drillId);
        if (!exists) {
          nextNotebook = [
            {
              id: drillId,
              ...errorMeta,
              addedAt: new Date().toISOString()
            },
            ...nextNotebook
          ].slice(0, 200);
        }
      } else if (correct) {
        nextNotebook = nextNotebook.filter((item) => item.id !== drillId);
      }

      return {
        ...p,
        completedDrills: {
          ...p.completedDrills,
          [drillId]: {
            correct: correct || Boolean(prev?.correct),
            attempts: (prev?.attempts || 0) + 1,
            lastAt: new Date().toISOString()
          }
        },
        errorNotebook: nextNotebook,
        activity: bumpDailyActivity(p.activity)
      };
    });
  }, []);

  const removeErrorItem = useCallback((id) => {
    setProgress((p) => ({
      ...p,
      errorNotebook: p.errorNotebook.filter((item) => item.id !== id)
    }));
  }, []);

  const markReadingComplete = useCallback((readingId) => {
    setProgress((p) => {
      if (p.completedReadings.includes(readingId)) return p;
      return {
        ...p,
        completedReadings: [...p.completedReadings, readingId],
        activity: bumpDailyActivity(p.activity)
      };
    });
  }, []);

  const markDialogueComplete = useCallback((dialogueId) => {
    setProgress((p) => {
      if (p.completedDialogues.includes(dialogueId)) return p;
      return {
        ...p,
        completedDialogues: [...p.completedDialogues, dialogueId],
        activity: bumpDailyActivity(p.activity)
      };
    });
  }, []);

  const markWorkshopComplete = useCallback((workshopId) => {
    setProgress((p) => {
      if (p.completedWorkshops.includes(workshopId)) return p;
      return {
        ...p,
        completedWorkshops: [...p.completedWorkshops, workshopId],
        activity: bumpDailyActivity(p.activity)
      };
    });
  }, []);

  const recordFinalScore = useCallback((finalId, score, total) => {
    setProgress((p) => {
      const prev = p.finalScores[finalId];
      return {
        ...p,
        finalScores: {
          ...p.finalScores,
          [finalId]: {
            score,
            total,
            bestScore: Math.max(score, prev?.bestScore || 0),
            lastAt: new Date().toISOString()
          }
        },
        activity: bumpDailyActivity(p.activity)
      };
    });
  }, []);

  const exportProgressJson = useCallback(() => {
    return JSON.stringify(
      {
        ...progress,
        exportedAt: new Date().toISOString(),
        app: 'arapca-kulliyati-v4'
      },
      null,
      2
    );
  }, [progress]);

  const importProgressJson = useCallback((rawText) => {
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== 'object' || !parsed.srs || !parsed.settings) {
      throw new Error('Geçersiz yedek dosyası formatı.');
    }
    setProgress({
      ...DEFAULT_PROGRESS,
      ...parsed,
      settings: { ...DEFAULT_PROGRESS.settings, ...(parsed.settings || {}) },
      activity: { ...DEFAULT_PROGRESS.activity, ...(parsed.activity || {}) }
    });
    return true;
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
  }, []);

  const stats = useMemo(() => {
    const learnedCards = Object.values(progress.srs).filter((s) => s.reps >= 1).length;
    const dueCards = Object.values(progress.srs).filter((s) => s.dueAt <= Date.now()).length;
    const masteredDrills = Object.values(progress.completedDrills).filter((d) => d.correct).length;
    const today = todayISO();
    const todayCount = progress.activity.todayDate === today ? progress.activity.todayCount : 0;
    return {
      learnedCards,
      dueCards,
      masteredDrills,
      readingsCount: progress.completedReadings.length,
      dialoguesCount: progress.completedDialogues.length,
      workshopsCount: progress.completedWorkshops.length,
      errorCount: progress.errorNotebook.length,
      streakDays: progress.activity.streakDays,
      todayCount,
      dailyGoal: progress.settings.dailyGoal
    };
  }, [progress]);

  const value = useMemo(
    () => ({
      progress,
      stats,
      theme,
      toggleTheme,
      setHarakaMode,
      setSpeechRate,
      rateCard,
      toggleFavorite,
      recordDrillResult,
      removeErrorItem,
      markReadingComplete,
      markDialogueComplete,
      markWorkshopComplete,
      recordFinalScore,
      exportProgressJson,
      importProgressJson,
      resetProgress
    }),
    [
      progress,
      stats,
      theme,
      toggleTheme,
      setHarakaMode,
      setSpeechRate,
      rateCard,
      toggleFavorite,
      recordDrillResult,
      removeErrorItem,
      markReadingComplete,
      markDialogueComplete,
      markWorkshopComplete,
      recordFinalScore,
      exportProgressJson,
      importProgressJson,
      resetProgress
    ]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
