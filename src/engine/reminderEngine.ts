import { TimetableSlot, Subject, OfficialHoliday } from '@/types/database';
import { FIXED_PERIODS, getPeriodConfig } from '@/config/timetableConfig';

export interface ReminderState {
  type:
    | 'in_progress'
    | 'upcoming'
    | 'break'
    | 'lunch'
    | 'free_period'
    | 'conflict'
    | 'holiday'
    | 'weekend'
    | 'done_for_today'
    | 'no_timetable';
  title: string;
  subtitle: string;
  periodNumber?: number;
  details?: {
    subjectName: string;
    classProgramme: string;
    section: string;
    classroom?: string | null;
    timeRange: string;
    startsInMinutes?: number;
    periodNumber?: number;
  };
  conflictSlots?: Array<{
    subjectName: string;
    classProgramme: string;
    section: string;
    timeRange: string;
  }>;
}

/**
 * Parses time string "HH:mm" into minutes since start of day
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Returns the current date in Asia/Kolkata timezone
 */
export function getNowInKolkata(overrideNow?: Date): {
  now: Date;
  dateStr: string;
  currentMinutes: number;
  weekday: number; // 0=Sun, 1=Mon, ..., 6=Sat
  weekday1To5: number | null; // 1=Mon..5=Fri or null if weekend
} {
  // Use Intl to format in Asia/Kolkata accurately regardless of local environment timezone
  const now = overrideNow || new Date();
  
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const y = Number(partMap.year);
  const m = Number(partMap.month);
  const d = Number(partMap.day);
  const hour = Number(partMap.hour);
  const min = Number(partMap.minute);

  const dateStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
  const currentMinutes = hour * 60 + min;

  // Day of week in Asia/Kolkata
  const kolkataDate = new Date(Date.UTC(y, m - 1, d, hour, min));
  const weekday = kolkataDate.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const weekday1To5 = weekday >= 1 && weekday <= 5 ? weekday : null;

  return {
    now,
    dateStr,
    currentMinutes,
    weekday,
    weekday1To5,
  };
}

/**
 * Formats "HH:mm" to human friendly "h:mm AM/PM"
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export interface EnrichedSlot extends Omit<TimetableSlot, 'classroom'> {
  subject_name?: string;
  class_programme?: string;
  section?: string;
  classroom?: string | null;
}

/**
 * Determines current class reminder according to exact college timetable timings
 */
export function calculateClassReminder(params: {
  slots: EnrichedSlot[];
  subjects: Subject[];
  officialHolidays: OfficialHoliday[];
  overrideNow?: Date;
}): ReminderState {
  const { slots, subjects, officialHolidays, overrideNow } = params;

  // 1. If no timetable configured or no subjects
  const scheduledSlots = (slots || []).filter((s) => s.subject_id !== null && s.subject_id !== '');
  if (scheduledSlots.length === 0 || subjects.length === 0) {
    return {
      type: 'no_timetable',
      title: 'No timetable configured',
      subtitle: 'Set up your weekly timetable to receive live class reminders.',
    };
  }

  const { dateStr, currentMinutes, weekday, weekday1To5 } = getNowInKolkata(overrideNow);

  // 2. Weekend check: Saturday or Sunday
  if (weekday === 0 || weekday === 6) {
    const dayName = weekday === 0 ? 'Sunday' : 'Saturday';
    return {
      type: 'weekend',
      title: `No classes today (${dayName})`,
      subtitle: 'CampusFlow schedule resumes on Monday. Enjoy your weekend!',
    };
  }

  // 3. Official holiday check
  const holiday = officialHolidays.find((h) => h.holiday_date === dateStr);
  if (holiday) {
    return {
      type: 'holiday',
      title: `Official Holiday: ${holiday.name}`,
      subtitle: 'All teaching sessions are excused today as per the 2026 academic calendar.',
    };
  }

  // 4. Filter slots for today (Monday..Friday) that have an assigned subject
  const todayScheduledSlots = scheduledSlots
    .filter((s) => s.weekday === weekday1To5)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Break timings in minutes:
  // Morning Break: 10:10 AM - 10:20 AM (610 to 620 mins)
  const breakStart = 10 * 60 + 10;
  const breakEnd = 10 * 60 + 20;

  // Lunch Break: 12:00 PM - 12:40 PM (720 to 760 mins)
  const lunchStart = 12 * 60;
  const lunchEnd = 12 * 60 + 40;

  // Find next upcoming scheduled class today
  const nextScheduledSlot = todayScheduledSlots.find((s) => {
    return timeStringToMinutes(s.start_time) > currentMinutes;
  });

  const nextClassSubtitle = nextScheduledSlot
    ? `Next: ${nextScheduledSlot.subject_name} (${nextScheduledSlot.class_programme} - Sec ${nextScheduledSlot.section}) at ${formatTime12h(nextScheduledSlot.start_time)}`
    : 'No more classes scheduled for today.';

  // 5. Break check (10:10 - 10:20 AM)
  if (currentMinutes >= breakStart && currentMinutes < breakEnd) {
    return {
      type: 'break',
      title: 'Morning Break (10:10 – 10:20 AM)',
      subtitle: nextClassSubtitle,
      details: nextScheduledSlot
        ? {
            subjectName: nextScheduledSlot.subject_name || 'Class',
            classProgramme: nextScheduledSlot.class_programme || '',
            section: nextScheduledSlot.section || '',
            classroom: nextScheduledSlot.classroom,
            timeRange: `${formatTime12h(nextScheduledSlot.start_time)}–${formatTime12h(nextScheduledSlot.end_time)}`,
            startsInMinutes: timeStringToMinutes(nextScheduledSlot.start_time) - currentMinutes,
            periodNumber: nextScheduledSlot.period_number,
          }
        : undefined,
    };
  }

  // 6. Lunch check (12:00 - 12:40 PM)
  if (currentMinutes >= lunchStart && currentMinutes < lunchEnd) {
    return {
      type: 'lunch',
      title: 'Lunch Break (12:00 – 12:40 PM)',
      subtitle: nextClassSubtitle,
      details: nextScheduledSlot
        ? {
            subjectName: nextScheduledSlot.subject_name || 'Class',
            classProgramme: nextScheduledSlot.class_programme || '',
            section: nextScheduledSlot.section || '',
            classroom: nextScheduledSlot.classroom,
            timeRange: `${formatTime12h(nextScheduledSlot.start_time)}–${formatTime12h(nextScheduledSlot.end_time)}`,
            startsInMinutes: timeStringToMinutes(nextScheduledSlot.start_time) - currentMinutes,
            periodNumber: nextScheduledSlot.period_number,
          }
        : undefined,
    };
  }

  // 7. Check if currently inside one of the 8 periods
  const currentPeriodConfig = FIXED_PERIODS.find((p) => {
    const sMin = timeStringToMinutes(p.startTime);
    const eMin = timeStringToMinutes(p.endTime);
    return currentMinutes >= sMin && currentMinutes < eMin;
  });

  if (currentPeriodConfig) {
    // Check if teacher has a class assigned to this period today
    const currentClass = todayScheduledSlots.find((s) => {
      const sMin = timeStringToMinutes(s.start_time);
      const eMin = timeStringToMinutes(s.end_time);
      return currentMinutes >= sMin && currentMinutes < eMin;
    });

    if (currentClass) {
      const timeRange = `${formatTime12h(currentClass.start_time)}–${formatTime12h(currentClass.end_time)}`;
      return {
        type: 'in_progress',
        title: `Class in progress · Period ${currentClass.period_number || currentPeriodConfig.periodNumber}`,
        subtitle: `${currentClass.subject_name || 'Class'} · ${currentClass.class_programme || ''} — Section ${currentClass.section || ''}`,
        periodNumber: currentClass.period_number || currentPeriodConfig.periodNumber,
        details: {
          subjectName: currentClass.subject_name || 'Class',
          classProgramme: currentClass.class_programme || '',
          section: currentClass.section || '',
          classroom: currentClass.classroom,
          timeRange,
          periodNumber: currentClass.period_number || currentPeriodConfig.periodNumber,
        },
      };
    } else {
      // Period is ongoing, but teacher is Free / None
      return {
        type: 'free_period',
        title: `Free Period · Period ${currentPeriodConfig.periodNumber} (${currentPeriodConfig.displayTime})`,
        subtitle: nextClassSubtitle,
        periodNumber: currentPeriodConfig.periodNumber,
        details: nextScheduledSlot
          ? {
              subjectName: nextScheduledSlot.subject_name || 'Class',
              classProgramme: nextScheduledSlot.class_programme || '',
              section: nextScheduledSlot.section || '',
              classroom: nextScheduledSlot.classroom,
              timeRange: `${formatTime12h(nextScheduledSlot.start_time)}–${formatTime12h(nextScheduledSlot.end_time)}`,
              startsInMinutes: timeStringToMinutes(nextScheduledSlot.start_time) - currentMinutes,
              periodNumber: nextScheduledSlot.period_number,
            }
          : undefined,
      };
    }
  }

  // 8. If before the first period (before 8:30 AM)
  const firstPeriodStart = timeStringToMinutes(FIXED_PERIODS[0].startTime); // 08:30 = 510
  if (currentMinutes < firstPeriodStart) {
    if (nextScheduledSlot) {
      const diff = timeStringToMinutes(nextScheduledSlot.start_time) - currentMinutes;
      return {
        type: 'upcoming',
        title: `Next class at ${formatTime12h(nextScheduledSlot.start_time)}`,
        subtitle: `${nextScheduledSlot.subject_name} · ${nextScheduledSlot.class_programme} — Section ${nextScheduledSlot.section}`,
        periodNumber: nextScheduledSlot.period_number,
        details: {
          subjectName: nextScheduledSlot.subject_name || 'Class',
          classProgramme: nextScheduledSlot.class_programme || '',
          section: nextScheduledSlot.section || '',
          classroom: nextScheduledSlot.classroom,
          timeRange: `${formatTime12h(nextScheduledSlot.start_time)}–${formatTime12h(nextScheduledSlot.end_time)}`,
          startsInMinutes: diff,
          periodNumber: nextScheduledSlot.period_number,
        },
      };
    } else {
      return {
        type: 'done_for_today',
        title: 'No classes scheduled for today',
        subtitle: "You don't have any teaching periods assigned for this weekday.",
      };
    }
  }

  // 9. If upcoming class exists later today
  if (nextScheduledSlot) {
    const diff = timeStringToMinutes(nextScheduledSlot.start_time) - currentMinutes;
    const titleText =
      diff <= 1
        ? 'Next class starting now'
        : diff < 60
        ? `Next class in ${diff} minutes`
        : `Next class at ${formatTime12h(nextScheduledSlot.start_time)}`;

    return {
      type: 'upcoming',
      title: titleText,
      subtitle: `${nextScheduledSlot.subject_name} · ${nextScheduledSlot.class_programme} — Section ${nextScheduledSlot.section}`,
      periodNumber: nextScheduledSlot.period_number,
      details: {
        subjectName: nextScheduledSlot.subject_name || 'Class',
        classProgramme: nextScheduledSlot.class_programme || '',
        section: nextScheduledSlot.section || '',
        classroom: nextScheduledSlot.classroom,
        timeRange: `${formatTime12h(nextScheduledSlot.start_time)}–${formatTime12h(nextScheduledSlot.end_time)}`,
        startsInMinutes: diff,
        periodNumber: nextScheduledSlot.period_number,
      },
    };
  }

  // 10. After the final period (after 3:50 PM)
  return {
    type: 'done_for_today',
    title: "You're done for today.",
    subtitle: 'All scheduled lectures for today have concluded.',
  };
}
