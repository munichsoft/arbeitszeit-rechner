import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, startOfWeek } from 'date-fns';
import { useSettingsStore } from './useSettingsStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EntryType = 'work' | 'vacation' | 'sick' | 'holiday' | 'school';

export interface TimeEntry {
  id: string;
  projectId: string;
  startTime: string; // ISO string
  endTime: string | null; // null = currently running
  pauseMinutes: number;
  notes: string;
  billable: boolean;
  type?: EntryType; // undefined treated as 'work' (backwards-compatible)
}

export interface Project {
  id: string;
  name: string;
  client: string;
  hourlyRate: number; // EUR
  billable: boolean;
  color: string; // hex
  weeklyTargetHours?: number;
  workingDays?: number[]; // 1=Mon, ..., 7=Sun
  startDate?: string; // ISO Date String
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface TimeState {
  entries: TimeEntry[];
  projects: Project[];
  activeEntryId: string | null;
  activePauseStart: string | null;

  // Timer actions
  startTimer: (projectId: string) => void;
  stopTimer: () => void;
  cancelTimer: () => void; // discard active entry without saving
  togglePause: () => void;

  // Entry actions
  addEntry: (entry: Omit<TimeEntry, 'id'>) => void;
  updateEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteEntry: (id: string) => void;

  // Project actions
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Selectors (computed, not persisted)
  getActiveEntry: () => TimeEntry | null;
  getEntriesForDate: (dateStr: string) => TimeEntry[];
  getProjectById: (id: string) => Project | undefined;
  getTotalHoursForProject: (projectId: string) => number;
  getWeeklyHours: () => number;
  getMonthlyHours: () => number;
  getTodayHours: () => number;
  getTodayEarnings: (globalHourlyRate: number) => number;
  // Overtime: actual - target (negative = undertime)
  getWeeklyOvertime: (targetHours: number) => number;
  getCumulativeOvertime: (targetHours: number, since: Date) => number;
  copyEntriesFromDate: (fromDateStr: string, toDateStr: string) => void;
  getHoursForMonth: (year: number, month: number) => number;
  getEntriesForMonth: (year: number, month: number) => TimeEntry[];
  injectSampleData: () => void;
}



function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getDurationHours(entry: TimeEntry): number {
  // Non-work entries (vacation/sick/holiday/school) have no worked hours
  if (entry.type && entry.type !== 'work') return 0;
  const start = new Date(entry.startTime).getTime();
  const end = entry.endTime ? new Date(entry.endTime).getTime() : Date.now();
  const ms = end - start - entry.pauseMinutes * 60000;
  return Math.max(0, ms / 3600000);
}

// Bonus worked hours for neutral-day entries: each unique day with a
// non-work entry (vacation/sick/holiday/school) contributes the expected
// target hours for that day, so users don't get penalised.
function getNeutralDayBonus(entries: TimeEntry[], projects: Project[], globalTargetHours: number, globalWorkingDays: number[], from: Date, to: Date): number {
  const days = new Set<string>();
  for (const e of entries) {
    if (e.type && e.type !== 'work') {
      const d = new Date(e.startTime);
      if (d >= from && d <= to) days.add(format(d, 'yyyy-MM-dd'));
    }
  }

  if (days.size === 0) return 0;

  const hasCustomSchedules = projects.some(p => p.weeklyTargetHours !== undefined || p.workingDays !== undefined || p.startDate !== undefined);

  let bonus = 0;
  for (const dateStr of Array.from(days)) {
    const d = new Date(dateStr);
    const isoDay = d.getDay() === 0 ? 7 : d.getDay();
    
    if (hasCustomSchedules) {
      projects.forEach(p => {
         const target = p.weeklyTargetHours ?? 0;
         const pDays = p.workingDays ?? [];
         const pStart = p.startDate ? new Date(p.startDate) : new Date(0);
         pStart.setHours(0,0,0,0);
         if (target > 0 && pDays.includes(isoDay) && d >= pStart) {
            bonus += target / pDays.length;
         }
      });
    } else {
      if (globalWorkingDays.includes(isoDay)) {
         const dailyTarget = globalTargetHours / Math.max(1, globalWorkingDays.length);
         bonus += dailyTarget;
      }
    }
  }
  return bonus;
}

function isToday(isoStr: string): boolean {
  const d = new Date(isoStr);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function isThisWeek(isoStr: string): boolean {
  const d = new Date(isoStr);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Monday
  weekStart.setHours(0, 0, 0, 0);
  return d >= weekStart && d <= now;
}

function isThisMonth(isoStr: string): boolean {
  const d = new Date(isoStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export const useTimeStore = create<TimeState>()(
  persist(
    (set, get) => ({
      entries: [] as TimeEntry[],
      projects: [] as Project[],
      activeEntryId: null as string | null,
      activePauseStart: null as string | null,

      startTimer: (projectId) => {
        const { activeEntryId, stopTimer } = get();
        if (activeEntryId) stopTimer();
        const newEntry: TimeEntry = {
          id: uid(),
          projectId,
          startTime: new Date().toISOString(),
          endTime: null,
          pauseMinutes: 0,
          notes: '',
          billable: get().projects.find(p => p.id === projectId)?.billable ?? true,
        };
        set(state => ({
          entries: [...state.entries, newEntry],
          activeEntryId: newEntry.id,
          activePauseStart: null,
        }));
      },

      stopTimer: () => {
        const { activeEntryId, activePauseStart } = get();
        if (!activeEntryId) return;

        let additionalPause = 0;
        if (activePauseStart) {
          additionalPause = (Date.now() - new Date(activePauseStart).getTime()) / 60000;
        }

        const activeEntry = get().entries.find(e => e.id === activeEntryId);
        if (activeEntry) {
          const startMs = new Date(activeEntry.startTime).getTime();
          const totalPauseMs = (activeEntry.pauseMinutes + additionalPause) * 60000;
          const netSeconds = (Date.now() - startMs - totalPauseMs) / 1000;

          // Discard ghost entries shorter than 60 seconds of net work
          if (netSeconds < 60) {
            set(state => ({
              entries: state.entries.filter(e => e.id !== activeEntryId),
              activeEntryId: null,
              activePauseStart: null,
            }));
            return;
          }
        }

        set(state => ({
          entries: state.entries.map(e =>
            e.id === activeEntryId ? { ...e, endTime: new Date().toISOString(), pauseMinutes: Math.round(e.pauseMinutes + additionalPause) } : e
          ),
          activeEntryId: null,
          activePauseStart: null,
        }));
      },

      // Discard active entry without saving (e.g. timer disabled mid-run)
      cancelTimer: () => {
        const { activeEntryId } = get();
        if (!activeEntryId) return;
        set(state => ({
          entries: state.entries.filter(e => e.id !== activeEntryId),
          activeEntryId: null,
          activePauseStart: null,
        }));
      },

      togglePause: () => {
        const { activeEntryId, activePauseStart } = get();
        if (!activeEntryId) return;

        if (activePauseStart) {
          const additionalPause = (Date.now() - new Date(activePauseStart).getTime()) / 60000;
          set(state => ({
            activePauseStart: null,
            entries: state.entries.map(e =>
              e.id === activeEntryId ? { ...e, pauseMinutes: Math.round(e.pauseMinutes + additionalPause) } : e
            )
          }));
        } else {
          set({ activePauseStart: new Date().toISOString() });
        }
      },

      addEntry: (entry) => {
        set(state => ({
          entries: [{ ...entry, id: uid() }, ...state.entries],
        }));
      },

      updateEntry: (id, updates) => {
        set(state => ({
          entries: state.entries.map(e => e.id === id ? { ...e, ...updates } : e),
        }));
      },

      deleteEntry: (id) => {
        set(state => ({
          entries: state.entries.filter(e => e.id !== id),
          activeEntryId: state.activeEntryId === id ? null : state.activeEntryId,
        }));
      },

      copyEntriesFromDate: (fromDateStr, toDateStr) => {
        const { entries } = get();
        const from = entries.filter(e => format(new Date(e.startTime), 'yyyy-MM-dd') === fromDateStr);
        if (from.length === 0) return;
        const toDate = new Date(toDateStr);
        const newEntries = from.map(e => {
          const origStart = new Date(e.startTime);
          const origEnd = e.endTime ? new Date(e.endTime) : null;
          const newStart = new Date(toDate);
          newStart.setHours(origStart.getHours(), origStart.getMinutes(), 0, 0);
          const newEnd = origEnd ? new Date(toDate) : null;
          if (newEnd && origEnd) newEnd.setHours(origEnd.getHours(), origEnd.getMinutes(), 0, 0);
          return {
            ...e,
            id: uid(),
            startTime: newStart.toISOString(),
            endTime: newEnd ? newEnd.toISOString() : null,
          };
        });
        set(state => ({ entries: [...newEntries, ...state.entries] }));
      },

      addProject: (project) => {
        set(state => ({
          projects: [...state.projects, { ...project, id: uid() }],
        }));
      },

      updateProject: (id, updates) => {
        set(state => ({
          projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p),
        }));
      },

      deleteProject: (id) => {
        set(state => ({
          projects: state.projects.filter(p => p.id !== id),
        }));
      },

      getActiveEntry: () => {
        const { entries, activeEntryId } = get();
        return entries.find(e => e.id === activeEntryId) ?? null;
      },

      getEntriesForDate: (dateStr) => {
        const { entries } = get();
        return entries.filter(e => {
          const d = new Date(e.startTime);
          return format(d, 'yyyy-MM-dd') === dateStr;
        });
      },

      getProjectById: (id) => get().projects.find(p => p.id === id),

      getTotalHoursForProject: (projectId) => {
        return get().entries
          .filter(e => e.projectId === projectId)
          .reduce((acc, e) => acc + getDurationHours(e), 0);
      },

      getWeeklyHours: () => {
        return get().entries
          .filter(e => isThisWeek(e.startTime))
          .reduce((acc, e) => acc + getDurationHours(e), 0);
      },

      getMonthlyHours: () => {
        return get().entries
          .filter(e => isThisMonth(e.startTime))
          .reduce((acc, e) => acc + getDurationHours(e), 0);
      },

      getHoursForMonth: (year, month) => {
        return get().entries
          .filter(e => {
            const d = new Date(e.startTime);
            return d.getFullYear() === year && d.getMonth() === month;
          })
          .reduce((acc, e) => acc + getDurationHours(e), 0);
      },

      getEntriesForMonth: (year, month) => {
        return get().entries.filter(e => {
          const d = new Date(e.startTime);
          return d.getFullYear() === year && d.getMonth() === month;
        });
      },

      getTodayHours: () => {
        const today = new Date().toDateString();
        return get().entries
          .filter(e => new Date(e.startTime).toDateString() === today)
          .reduce((acc, e) => acc + getDurationHours(e), 0);
      },

      getTodayEarnings: (globalHourlyRate) => {
        const today = new Date().toDateString();
        return get().entries
          .filter(e => new Date(e.startTime).toDateString() === today)
          .reduce((acc, e) => {
            const project = get().projects.find(p => p.id === e.projectId);
            const rate = project?.hourlyRate ?? globalHourlyRate;
            return acc + getDurationHours(e) * rate;
          }, 0);
      },

      getWeeklyOvertime: (globalTargetHours) => {
        const { workingDays: globalWorkingDays, jobStartDate: globalStartDate } = useSettingsStore.getState();
        const now = new Date();
        const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
        const currentDayIso = now.getDay() === 0 ? 7 : now.getDay();
        
        const projects = get().projects;
        const hasCustomSchedules = projects.some(p => p.weeklyTargetHours !== undefined || p.workingDays !== undefined || p.startDate !== undefined);

        let totalExpectedTarget = 0;

        if (hasCustomSchedules) {
          projects.forEach(project => {
            const target = project.weeklyTargetHours ?? 0;
            const days = project.workingDays ?? [];
            const pStart = project.startDate ? new Date(project.startDate) : (globalStartDate ? new Date(globalStartDate) : new Date(0));
            
            if (target > 0 && days.length > 0) {
              const startDayIso = (pStart > currentWeekStart) ? (pStart.getDay() === 0 ? 7 : pStart.getDay()) : 1;
              let daysPassed = 0;
              for (let i = startDayIso; i <= currentDayIso; i++) {
                if (days.includes(i)) daysPassed++;
              }
              totalExpectedTarget += (target / days.length) * daysPassed;
            }
          });
        } else {
          const gStart = globalStartDate ? new Date(globalStartDate) : new Date(0);
          const startDayIso = (gStart > currentWeekStart) ? (gStart.getDay() === 0 ? 7 : gStart.getDay()) : 1;
          let daysPassed = 0;
          for (let i = startDayIso; i <= currentDayIso; i++) {
            if (globalWorkingDays.includes(i)) daysPassed++;
          }
          const totalWorkingDays = Math.max(1, globalWorkingDays.length);
          totalExpectedTarget = (globalTargetHours / totalWorkingDays) * daysPassed;
        }

        const neutralBonus = getNeutralDayBonus(get().entries, projects, globalTargetHours, globalWorkingDays, currentWeekStart, now);
        return get().getWeeklyHours() + neutralBonus - totalExpectedTarget;
      },

      getCumulativeOvertime: (globalTargetHours, since) => {
        const { entries, projects } = get();
        const { workingDays: globalWorkingDays, jobStartDate: globalStartDate } = useSettingsStore.getState();
        
        let total = 0;
        const now = new Date();
        const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
        
        let cursor = startOfWeek(since, { weekStartsOn: 1 });
        const hasCustomSchedules = projects.some(p => p.weeklyTargetHours !== undefined || p.workingDays !== undefined || p.startDate !== undefined);
        
        while (cursor < currentWeekStart) {
          const nextCursor = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000);
          
          let expectedTarget = 0;
          
          if (hasCustomSchedules) {
             projects.forEach(p => {
                const target = p.weeklyTargetHours ?? 0;
                const days = p.workingDays ?? [];
                const pStart = p.startDate ? new Date(p.startDate) : (globalStartDate ? new Date(globalStartDate) : new Date(0));
                
                if (target > 0 && days.length > 0) {
                   if (pStart >= nextCursor) {
                      expectedTarget += 0;
                   } else if (pStart > cursor) {
                      const startDayIso = pStart.getDay() === 0 ? 7 : pStart.getDay();
                      let validDays = 0;
                      for(let i = startDayIso; i <= 7; i++) {
                         if (days.includes(i)) validDays++;
                      }
                      expectedTarget += (target / days.length) * validDays;
                   } else {
                      expectedTarget += target;
                   }
                }
             });
          } else {
             const gStart = globalStartDate ? new Date(globalStartDate) : new Date(0);
             if (gStart >= nextCursor) {
                expectedTarget = 0;
             } else if (gStart > cursor) {
                const startDayIso = gStart.getDay() === 0 ? 7 : gStart.getDay();
                let validDays = 0;
                for(let i = startDayIso; i <= 7; i++) {
                   if (globalWorkingDays.includes(i)) validDays++;
                }
                const totalWorkingDays = Math.max(1, globalWorkingDays.length);
                expectedTarget += (globalTargetHours / totalWorkingDays) * validDays;
             } else {
                expectedTarget += globalTargetHours;
             }
          }

          const hoursThisWeek = entries
            .filter(e => {
              const d = new Date(e.startTime);
              return d >= cursor && d < nextCursor;
            })
            .reduce((acc, e) => acc + getDurationHours(e), 0);

          const neutralBonusWeek = getNeutralDayBonus(entries, projects, globalTargetHours, globalWorkingDays, cursor, nextCursor);
          total += hoursThisWeek + neutralBonusWeek - expectedTarget;
          cursor = nextCursor;
        }
        
        return total;
      },

      injectSampleData: () => {
        const projId = uid();
        const physioProject: Project = {
          id: projId,
          name: 'Physio',
          client: 'Physiozentrum',
          hourlyRate: 25,
          billable: true,
          color: '#10B981',
        };

        const newEntries: TimeEntry[] = [];
        const now = new Date();
        
        for (let i = 0; i < 60; i++) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          if (d.getDay() === 0 || d.getDay() === 6) continue;
          
          const start = new Date(d);
          start.setHours(8, 0, 0, 0);
          const end = new Date(d);
          end.setHours(12, 0, 0, 0);

          newEntries.push({
            id: uid() + '-' + i,
            projectId: projId,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            pauseMinutes: 0,
            notes: 'Sample therapy session',
            billable: true,
          });
        }

        set(state => ({
          projects: [...state.projects, physioProject],
          entries: [...state.entries, ...newEntries],
        }));
      },
    }),
    {
      name: 'time-store-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export { getDurationHours };
