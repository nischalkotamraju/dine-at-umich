import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import type { MealTimes } from '~/utils/locations';
import type { DayHours } from '~/utils/hours';

type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

// Dining hall hours are stored as Eastern Time (Ann Arbor, MI). Regardless of
// what timezone the user's device is set to (e.g. Central Time), we need to
// compare "now" against those hours in Eastern Time — otherwise a device set
// to a different zone reads the wrong local hour and miscalculates open/closed
// state and countdowns by the zone offset (e.g. thinks something 1 hour away
// is 8 minutes away). This converts a real Date into a "fake local" Date whose
// local getters (getHours, getDate, etc.) report Eastern Time values.
function toEasternTime(date: Date): Date {
  return toZonedTime(date, 'America/Detroit');
}

// Returns weekday name, e.g., 'Monday'
const weekdayName = (date: Date): WeekDay => format(date, 'EEEE') as WeekDay;

// Returns time of day: 'morning', 'afternoon', or 'evening'
export const timeOfDay = (
  date: Date,
  mealTimes?: MealTimes,
): 'morning' | 'afternoon' | 'evening' => {
  const easternDate = toEasternTime(date);
  const hour = easternDate.getHours();
  const minutes = easternDate.getMinutes();
  // Convert to military time
  const currentTime = hour * 100 + minutes;

  // If mealTimes is provided, use it to determine time of day
  if (mealTimes && (mealTimes.breakfast || mealTimes.lunch || mealTimes.dinner)) {
    const breakfastEnd = mealTimes.breakfast?.closeTime ?? 1100;
    const lunchEnd = mealTimes.lunch?.closeTime ?? 1700;

    if (currentTime < breakfastEnd) return 'morning';
    if (currentTime < lunchEnd) return 'afternoon';
    return 'evening';
  }

  // Fall back to default logic if mealTimes not provided
  if (hour < 11) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

// Helper to convert HHMM number to minutes since midnight.
function convertToMinutes(time: number): number {
  const hour = Math.floor(time / 100);
  const minute = time % 100;
  return hour * 60 + minute;
}

// Helper: convert HHMM number to a formatted time string.
// It uses the provided date as a reference.
function formatTimeFromNumber(time: number, referenceDate: Date): string {
  const hour = Math.floor(time / 100);
  const minute = time % 100;
  const d = new Date(referenceDate);
  d.setHours(hour, minute, 0, 0);
  return format(d, 'hh:mm a');
}

// ---------------------------------------------------------------------------
// Per-date status, driven by scraped location_hours (DayHours) rather than the
// stale weekly regular_service_hours. These are the functions the app UI and
// widget now use. A day with status !== 'open' has no serving intervals, so it
// reads as closed — there is deliberately no fallback to weekly hours.

interface OpenInterval {
  openTime: number;
  closeTime: number;
}

function intervalsFromDay(day: DayHours | null | undefined): OpenInterval[] {
  if (!day || day.status !== 'open') return [];
  return day.blocks.map((b) => ({ openTime: b.open, closeTime: b.close }));
}

// Is the location open right now, given today's scraped hours? `forceClose`
// short-circuits to false (temporary closures overriding posted hours).
export function isOpenFromHours(
  day: DayHours | null | undefined,
  forceClose = false,
  currentTime: Date = new Date(),
): boolean {
  if (forceClose) return false;
  const intervals = intervalsFromDay(day);
  if (intervals.length === 0) return false;
  const easternTime = toEasternTime(currentTime);
  const currentMinutes = easternTime.getHours() * 60 + easternTime.getMinutes();
  return intervals.some(
    (i) => currentMinutes >= convertToMinutes(i.openTime) && currentMinutes < convertToMinutes(i.closeTime),
  );
}

// The active open slot as "11:00 AM - 2:00 PM", or null if not open now.
export function currentOpenSlotFromHours(
  day: DayHours | null | undefined,
  currentTime: Date = new Date(),
): string | null {
  const easternTime = toEasternTime(currentTime);
  const currentMinutes = easternTime.getHours() * 60 + easternTime.getMinutes();
  for (const { openTime, closeTime } of intervalsFromDay(day)) {
    if (currentMinutes >= convertToMinutes(openTime) && currentMinutes < convertToMinutes(closeTime)) {
      return `${formatTimeFromNumber(openTime, easternTime)} - ${formatTimeFromNumber(closeTime, easternTime)}`;
    }
  }
  return null;
}

// "Open for 2 hours" / "Opens in 30 minutes" (later today) / "Closed".
export function timeMessageFromHours(
  day: DayHours | null | undefined,
  currentTime: Date = new Date(),
): string {
  const intervals = intervalsFromDay(day);
  if (intervals.length === 0) return 'Closed';
  const easternTime = toEasternTime(currentTime);
  const currentMinutes = easternTime.getHours() * 60 + easternTime.getMinutes();

  for (const { openTime, closeTime } of intervals) {
    const openM = convertToMinutes(openTime);
    const closeM = convertToMinutes(closeTime);
    if (currentMinutes >= openM && currentMinutes < closeM) {
      const diffMins = closeM - currentMinutes;
      return diffMins < 60
        ? `Open for ${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'}`
        : `Open for ${Math.ceil(diffMins / 60)} ${Math.ceil(diffMins / 60) > 1 ? 'hours' : 'hour'}`;
    }
  }

  const nextOpening = intervals
    .map(({ openTime }) => convertToMinutes(openTime))
    .filter((openM) => openM > currentMinutes)
    .sort((a, b) => a - b)[0];

  if (nextOpening !== undefined) {
    const diffMins = nextOpening - currentMinutes;
    return diffMins < 60
      ? `Opens in ${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'}`
      : `Opens in ${Math.ceil(diffMins / 60)} ${Math.ceil(diffMins / 60) > 1 ? 'hours' : 'hour'}`;
  }

  return 'Closed';
}

// Next opening today as "9:00 AM", or null if none remain today.
export function nextOpenTimeTodayFromHours(
  day: DayHours | null | undefined,
  currentTime: Date = new Date(),
): string | null {
  const easternTime = toEasternTime(currentTime);
  const currentMinutes = easternTime.getHours() * 60 + easternTime.getMinutes();
  const next = intervalsFromDay(day)
    .filter(({ openTime }) => convertToMinutes(openTime) > currentMinutes)
    .sort((a, b) => convertToMinutes(a.openTime) - convertToMinutes(b.openTime))[0];
  return next ? formatTimeFromNumber(next.openTime, easternTime) : null;
}

// When a currently-closed location next opens. `days` is the scraped-hours
// window from today onward (today first, then future dates in order). Returns
// null if no upcoming opening is known within the window.
export function nextOpeningInfoFromHours(
  days: DayHours[],
  currentTime: Date = new Date(),
): { label: string } | null {
  if (days.length === 0) return null;
  const easternTime = toEasternTime(currentTime);

  const todayNext = nextOpenTimeTodayFromHours(days[0], easternTime);
  if (todayNext) return { label: `Opens today at ${todayNext}` };

  for (let offset = 1; offset < days.length; offset++) {
    const intervals = intervalsFromDay(days[offset]);
    if (intervals.length === 0) continue;
    const earliest = [...intervals].sort((a, b) => a.openTime - b.openTime)[0];
    const refDate = new Date(easternTime);
    refDate.setDate(refDate.getDate() + offset);
    const dayLabel = offset === 1 ? 'Tomorrow' : weekdayName(refDate);
    return { label: `Opens ${dayLabel} at ${formatTimeFromNumber(earliest.openTime, refDate)}` };
  }

  return null;
}
