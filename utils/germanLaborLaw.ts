import type { TimeEntry } from '../store/useTimeStore';

export interface LaborLawWarning {
  type: 'daily_limit' | 'break_required' | 'rest_period';
  message: string;
  severity: 'warning' | 'info';
}

/**
 * ArbZG §3: Max 10 hours per day (8h + 2h extensions)
 */
export function checkDailyLimit(totalHoursToday: number): LaborLawWarning | null {
  if (totalHoursToday > 10) {
    return {
      type: 'daily_limit',
      severity: 'warning',
      message: `⚠️ ArbZG §3: ${totalHoursToday.toFixed(1)}h heute — das tägliche Maximum von 10 Stunden wurde überschritten.`,
    };
  }
  return null;
}

/**
 * ArbZG §4: Mandatory 30-min break after 6h, 45-min after 9h
 */
export function checkBreakRequirement(
  workingHours: number,
  pauseMinutes: number
): LaborLawWarning | null {
  if (workingHours > 9 && pauseMinutes < 45) {
    return {
      type: 'break_required',
      severity: 'warning',
      message: `⚠️ ArbZG §4: Bei mehr als 9 Stunden Arbeit sind mindestens 45 Minuten Pause erforderlich (aktuell: ${pauseMinutes} Min.).`,
    };
  }
  if (workingHours > 6 && pauseMinutes < 30) {
    return {
      type: 'break_required',
      severity: 'warning',
      message: `⚠️ ArbZG §4: Bei mehr als 6 Stunden Arbeit sind mindestens 30 Minuten Pause erforderlich (aktuell: ${pauseMinutes} Min.).`,
    };
  }
  return null;
}

/**
 * ArbZG §5: Minimum 11-hour rest period between shifts
 */
export function checkRestPeriod(entries: TimeEntry[]): LaborLawWarning | null {
  const sorted = [...entries]
    .filter(e => e.endTime)
    .sort((a, b) => new Date(a.endTime!).getTime() - new Date(b.endTime!).getTime());

  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = new Date(sorted[i - 1].endTime!).getTime();
    const nextStart = new Date(sorted[i].startTime).getTime();
    const restHours = (nextStart - prevEnd) / 3600000;
    if (restHours < 11 && restHours > 0) {
      return {
        type: 'rest_period',
        severity: 'warning',
        message: `⚠️ ArbZG §5: Die Ruhezeit zwischen zwei Schichten beträgt nur ${restHours.toFixed(1)}h (Minimum: 11 Stunden).`,
      };
    }
  }
  return null;
}

/**
 * Run all checks for an active/just-saved entry and return all violations
 */
export function runAllChecks(
  totalHoursToday: number,
  workingHours: number,
  pauseMinutes: number,
  recentEntries: TimeEntry[]
): LaborLawWarning[] {
  const warnings: LaborLawWarning[] = [];
  const daily = checkDailyLimit(totalHoursToday);
  if (daily) warnings.push(daily);
  const brk = checkBreakRequirement(workingHours, pauseMinutes);
  if (brk) warnings.push(brk);
  const rest = checkRestPeriod(recentEntries);
  if (rest) warnings.push(rest);
  return warnings;
}
