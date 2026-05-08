import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { printToFileAsync } from 'expo-print';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { TimeEntry, Project } from '../store/useTimeStore';
import type { CurrencySymbol } from '../store/useSettingsStore';
import { formatDurationHHMM, formatGermanDate } from './formatTime';

// ─── CSV ──────────────────────────────────────────────────────────────────────

function csvEscape(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function generateCSV(
  entries: TimeEntry[],
  projects: Project[],
  symbol: CurrencySymbol,
  hourlyRate: number
): string {
  const header = ['Datum', 'Projekt', 'Kunde', 'Startzeit', 'Endzeit', 'Pause (Min.)', 'Dauer', 'Einnahmen', 'Abrechenbar', 'Notizen'];
  const rows = entries.map(e => {
    const project = projects.find(p => p.id === e.projectId);
    const start = new Date(e.startTime);
    const end = e.endTime ? new Date(e.endTime) : new Date();
    const durMs = end.getTime() - start.getTime() - e.pauseMinutes * 60000;
    const durHours = Math.max(0, durMs / 3600000);
    const rate = project?.hourlyRate ?? hourlyRate;
    const earnings = `${symbol}${(durHours * rate).toFixed(2)}`;

    return [
      formatGermanDate(start),
      project?.name ?? '—',
      project?.client ?? '—',
      format(start, 'HH:mm'),
      e.endTime ? format(new Date(e.endTime), 'HH:mm') : 'Läuft',
      String(e.pauseMinutes),
      formatDurationHHMM(durHours),
      earnings,
      e.billable ? 'Ja' : 'Nein',
      e.notes,
    ].map(csvEscape).join(',');
  });

  return [header.map(csvEscape).join(','), ...rows].join('\n');
}

export async function exportCSV(
  entries: TimeEntry[],
  projects: Project[],
  symbol: CurrencySymbol,
  hourlyRate: number
): Promise<void> {
  const csv = generateCSV(entries, projects, symbol, hourlyRate);
  const filename = `Arbeitszeiten_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  const uri = FileSystem.documentDirectory + filename;
  await FileSystem.writeAsStringAsync(uri, csv, { encoding: 'utf8' });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
  }
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

export function generatePDFHTML(
  entries: TimeEntry[],
  projects: Project[],
  symbol: CurrencySymbol,
  hourlyRate: number,
  dateRangeLabel: string
): string {
  const totalHours = entries.reduce((acc, e) => {
    const start = new Date(e.startTime).getTime();
    const end = e.endTime ? new Date(e.endTime).getTime() : Date.now();
    return acc + Math.max(0, (end - start - e.pauseMinutes * 60000) / 3600000);
  }, 0);

  const totalEarnings = entries.reduce((acc, e) => {
    const project = projects.find(p => p.id === e.projectId);
    const rate = project?.hourlyRate ?? hourlyRate;
    const start = new Date(e.startTime).getTime();
    const end = e.endTime ? new Date(e.endTime).getTime() : Date.now();
    const h = Math.max(0, (end - start - e.pauseMinutes * 60000) / 3600000);
    return acc + h * rate;
  }, 0);

  const rows = entries.map(e => {
    const project = projects.find(p => p.id === e.projectId);
    const start = new Date(e.startTime);
    const end = e.endTime ? new Date(e.endTime) : new Date();
    const durMs = end.getTime() - start.getTime() - e.pauseMinutes * 60000;
    const durHours = Math.max(0, durMs / 3600000);
    const rate = project?.hourlyRate ?? hourlyRate;
    return `
      <tr>
        <td>${formatGermanDate(start)}</td>
        <td>${project?.name ?? '—'}</td>
        <td>${project?.client ?? '—'}</td>
        <td>${format(start, 'HH:mm')} – ${e.endTime ? format(new Date(e.endTime), 'HH:mm') : 'Jetzt'}</td>
        <td>${formatDurationHHMM(durHours)}</td>
        <td>${symbol}${(durHours * rate).toFixed(2)}</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8"/>
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #191C1E; padding: 32px; }
  h1 { font-size: 24px; margin-bottom: 4px; color: #091426; }
  .subtitle { color: #75777D; font-size: 14px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #F2F4F6; text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #45474C; }
  td { padding: 8px 12px; border-bottom: 1px solid #E0E3E5; }
  .summary { display: flex; gap: 24px; margin-top: 24px; padding: 16px; background: #F2F4F6; border-radius: 12px; }
  .summary-item { font-size: 13px; color: #45474C; }
  .summary-item strong { display: block; font-size: 20px; color: #091426; margin-bottom: 2px; }
</style>
</head>
<body>
  <h1>Arbeitszeitbericht</h1>
  <p class="subtitle">${dateRangeLabel} · Erstellt am ${formatGermanDate(new Date())}</p>
  <table>
    <thead>
      <tr>
        <th>Datum</th><th>Projekt</th><th>Kunde</th><th>Zeitraum</th><th>Dauer</th><th>Einnahmen</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="summary">
    <div class="summary-item"><strong>${formatDurationHHMM(totalHours)}</strong>Gesamtstunden</div>
    <div class="summary-item"><strong>${symbol}${totalEarnings.toFixed(2)}</strong>Gesamteinnahmen</div>
    <div class="summary-item"><strong>${entries.length}</strong>Einträge</div>
    <div class="summary-item"><strong>${new Set(entries.map(e => e.projectId)).size}</strong>Projekte</div>
  </div>
</body>
</html>`;
}

export async function exportPDF(
  entries: TimeEntry[],
  projects: Project[],
  symbol: CurrencySymbol,
  hourlyRate: number,
  dateRangeLabel: string
): Promise<void> {
  const html = generatePDFHTML(entries, projects, symbol, hourlyRate, dateRangeLabel);
  const { uri } = await printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}
