import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

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
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface TimeState {
  entries: TimeEntry[];
  projects: Project[];
  activeEntryId: string | null;

  // Timer actions
  startTimer: (projectId: string) => void;
  stopTimer: () => void;

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
          entries: [newEntry, ...state.entries],
          activeEntryId: newEntry.id,
        }));
      },

      stopTimer: () => {
        const { activeEntryId } = get();
        if (!activeEntryId) return;
        set(state => ({
          entries: state.entries.map(e =>
            e.id === activeEntryId ? { ...e, endTime: new Date().toISOString() } : e
          ),
          activeEntryId: null,
        }));
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
        return get().entries
          .filter(e => isToday(e.startTime))
          .reduce((acc, e) => acc + getDurationHours(e), 0);
      },
    }),
    {
      name: 'time-store-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export { getDurationHours };
