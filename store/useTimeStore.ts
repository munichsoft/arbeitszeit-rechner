import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, startOfWeek } from 'date-fns';
import { useSettingsStore } from './useSettingsStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimeEntry {
  id: string;
  projectId: string;
  startTime: string; // ISO string
  endTime: string | null; // null = currently running
  pauseMinutes: number;
  notes: string;
  billable: boolean;
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
  injectSampleData: () => void;
}



function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getDurationHours(entry: TimeEntry): number {
  const start = new Date(entry.startTime).getTime();
  const end = entry.endTime ? new Date(entry.endTime).getTime() : Date.now();
  const ms = end - start - entry.pauseMinutes * 60000;
  return Math.max(0, ms / 3600000);
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

        set(state => ({
          entries: state.entries.map(e =>
            e.id === activeEntryId ? { ...e, endTime: new Date().toISOString(), pauseMinutes: e.pauseMinutes + additionalPause } : e
          ),
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
              e.id === activeEntryId ? { ...e, pauseMinutes: e.pauseMinutes + additionalPause } : e
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

        return get().getWeeklyHours() - totalExpectedTarget;
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
            
          total += hoursThisWeek - expectedTarget;
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
