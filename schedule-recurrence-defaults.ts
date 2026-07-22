import type { RecurrenceRuleValues } from './schedule-recurrence-types';

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toTimeInputValue(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateInputValue(d);
}

export function addYears(dateStr: string, years: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setFullYear(d.getFullYear() + years);
  return toDateInputValue(d);
}

function roundUpToNextHalfHour(d: Date): Date {
  const rounded = new Date(d);
  const roundedMinutes = Math.ceil(d.getMinutes() / 30) * 30;
  rounded.setMinutes(roundedMinutes, 0, 0);
  return rounded;
}

export function buildDefaultRecurrenceRule(): RecurrenceRuleValues {
  const now = new Date();
  const roundedStart = roundUpToNextHalfHour(now);
  const startDate = toDateInputValue(roundedStart);
  const startTime = toTimeInputValue(roundedStart);
  const endDate = addDays(startDate, 1);
  const endTime = startTime;
  const startDateObj = new Date(`${startDate}T00:00:00`);

  return {
    startDate,
    startTime,
    endDate,
    endTime,
    frequency: 'NONE',
    interval: 1,
    daysOfWeek: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    monthlyMode: 'DAY_OF_MONTH',
    monthlyDayOfMonth: startDateObj.getDate(),
    monthlySetPosition: 1,
    monthlyWeekday: 'MON',
    yearlyMode: 'ON_DATE',
    yearlyMonth: startDateObj.getMonth() + 1,
    yearlyDayOfMonth: startDateObj.getDate(),
    yearlySetPosition: 1,
    yearlyWeekday: 'MON',
    recurrenceEndMode: 'ON_DATE',
    recurrenceEndDate: addYears(startDate, 1),
    occurrenceCount: undefined,
  };
}
