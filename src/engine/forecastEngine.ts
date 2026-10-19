import {
  Subject,
  Topic,
  TimetableSlot,
  OfficialHoliday,
  NonTeachingDate,
  Lesson,
  SubjectForecast,
  PaceStatus,
} from '@/types/database';
import { isWeekend, getWeekday1To5, parseDateISO, formatDateISO } from './schedulingEngine';
import { getNowInKolkata, timeStringToMinutes } from './reminderEngine';

export interface ForecastInput {
  subject: Subject;
  topics: Topic[];
  timetableSlots: TimetableSlot[];
  officialHolidays: OfficialHoliday[];
  nonTeachingDates: NonTeachingDate[];
  lessons?: Lesson[];
  asOfDate?: Date; // Defaults to current time in Asia/Kolkata
  planningTopicsPerPeriod?: number; // Configurable planning assumption (default 1.0)
  safetyBuffer?: number; // Configurable buffer for at_risk threshold (default 5 periods)
}

/**
 * Formats YYYY-MM-DD into readable date (e.g., "November 24, 2026")
 */
export function formatReadableDate(isoString: string): string {
  try {
    const [y, m, d] = isoString.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * Calculates deterministic completion forecast and topic-based progress
 * for a specific teaching assignment.
 */
export function calculateSubjectForecast(input: ForecastInput): SubjectForecast {
  const {
    subject,
    topics,
    timetableSlots,
    officialHolidays,
    nonTeachingDates,
    lessons = [],
    asOfDate,
    planningTopicsPerPeriod,
    safetyBuffer = 5,
  } = input;

  const totalTopics = topics.length;

  // Validation: Check for invalid or missing semester dates
  if (
    !subject.semester_start_date ||
    !subject.semester_end_date ||
    subject.semester_end_date < subject.semester_start_date
  ) {
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      classProgramme: subject.class_programme,
      section: subject.section,
      totalTopics,
      completedTopics: 0,
      remainingTopics: totalTopics,
      completionPercentage: 0,
      topicsPerPeriodRate: 1,
      isHistoricalRate: false,
      plannedPeriodsNeeded: totalTopics,
      availableRemainingSlots: 0,
      bufferPeriods: 0,
      estimatedCompletionDate: null,
      estimatedCompletionDisplay: null,
      semesterDeadline: subject.semester_end_date || '',
      status: 'invalid_dates',
      detailMessage: 'Reliable forecast unavailable: Invalid or missing semester dates.',
    };
  }

  // Edge case: No topics configured
  if (totalTopics === 0) {
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      classProgramme: subject.class_programme,
      section: subject.section,
      totalTopics: 0,
      completedTopics: 0,
      remainingTopics: 0,
      completionPercentage: 0,
      topicsPerPeriodRate: 1,
      isHistoricalRate: false,
      plannedPeriodsNeeded: 0,
      availableRemainingSlots: 0,
      bufferPeriods: 0,
      estimatedCompletionDate: null,
      estimatedCompletionDisplay: null,
      semesterDeadline: subject.semester_end_date,
      status: 'not_configured',
      detailMessage: 'Syllabus not configured. Add syllabus topics to start tracking pace.',
    };
  }

  // Topic-based calculation
  // A topic is completed ONLY when teacher explicitly confirmed is_completed = true
  const completedTopics = topics.filter((t) => t.is_completed).length;
  const remainingTopics = totalTopics - completedTopics;
  const completionPercentage = Math.round((completedTopics / totalTopics) * 100);

  // Determine velocity: topics covered per teaching period
  // Check if historical completed lessons exist for this specific teaching assignment
  const completedAssignmentLessons = lessons.filter(
    (l) => l.subject_id === subject.id && l.status === 'completed'
  );

  let topicsPerPeriodRate = 1.0;
  let isHistoricalRate = false;

  if (completedAssignmentLessons.length >= 3 && completedTopics > 0) {
    // Sizable historical record available: calculate average topics per completed period
    const rawRate = completedTopics / completedAssignmentLessons.length;
    // Keep rate reasonably bounded [0.25 to 4.0]
    topicsPerPeriodRate = Math.round(Math.max(0.25, Math.min(4.0, rawRate)) * 100) / 100;
    isHistoricalRate = true;
  } else if (planningTopicsPerPeriod && planningTopicsPerPeriod > 0) {
    topicsPerPeriodRate = planningTopicsPerPeriod;
  }

  // Calculate teaching periods needed for remaining topics
  // Formula: ceil(remainingTopics / topicsPerPeriodRate)
  const plannedPeriodsNeeded = remainingTopics === 0
    ? 0
    : Math.ceil(remainingTopics / topicsPerPeriodRate);

  // If already 100% completed
  if (remainingTopics === 0) {
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      classProgramme: subject.class_programme,
      section: subject.section,
      totalTopics,
      completedTopics,
      remainingTopics: 0,
      completionPercentage: 100,
      topicsPerPeriodRate,
      isHistoricalRate,
      plannedPeriodsNeeded: 0,
      availableRemainingSlots: 0,
      bufferPeriods: 0,
      estimatedCompletionDate: subject.semester_end_date,
      estimatedCompletionDisplay: formatReadableDate(subject.semester_end_date),
      semesterDeadline: subject.semester_end_date,
      status: 'complete',
      detailMessage: 'Syllabus complete. All topics have been finished!',
    };
  }

  // Filter timetable slots strictly assigned to this teaching assignment
  const relevantTimetableSlots = (timetableSlots || []).filter(
    (s) => s.subject_id === subject.id
  );

  // Also account for manual replacement lessons for this subject that fall within the semester
  const manualReplacementLessons = lessons.filter(
    (l) => l.subject_id === subject.id && l.status === 'planned'
  );

  // Calculate actual future teaching opportunities starting from Asia/Kolkata now
  const kolkataTime = getNowInKolkata(asOfDate);
  const todayStr = kolkataTime.dateStr;
  const currentMinutes = kolkataTime.currentMinutes;

  const holidayDateSet = new Set(officialHolidays.map((h) => h.holiday_date));
  const nonTeachingDateSet = new Set(nonTeachingDates.map((nt) => nt.date));

  // Determine starting evaluation date: max(todayStr, semester_start_date)
  const effectiveStartDateStr = todayStr > subject.semester_start_date ? todayStr : subject.semester_start_date;
  const semesterEnd = parseDateISO(subject.semester_end_date);
  const curDate = parseDateISO(effectiveStartDateStr);

  // Set of occupied replacement slots to avoid double counting
  const replacementSlotsByDate = new Map<string, Lesson[]>();
  for (const rep of manualReplacementLessons) {
    if (rep.scheduled_date >= effectiveStartDateStr && rep.scheduled_date <= subject.semester_end_date) {
      const existing = replacementSlotsByDate.get(rep.scheduled_date) || [];
      existing.push(rep);
      replacementSlotsByDate.set(rep.scheduled_date, existing);
    }
  }

  interface FutureSlot {
    dateStr: string;
    startTime: string;
    endTime: string;
  }

  const futureSlots: FutureSlot[] = [];

  while (curDate <= semesterEnd) {
    const dStr = formatDateISO(curDate);

    // Rule: Exclude weekends
    if (!isWeekend(curDate)) {
      // Rule: Exclude official holidays & non-teaching dates
      if (!holidayDateSet.has(dStr) && !nonTeachingDateSet.has(dStr)) {
        const weekday = getWeekday1To5(curDate);
        if (weekday !== null) {
          // Regular timetable slots for this subject on this weekday
          const daySlots = relevantTimetableSlots
            .filter((s) => s.weekday === weekday)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

          for (const s of daySlots) {
            // Rule: If date is today, exclude periods that have already ended or are currently in progress
            if (dStr === todayStr) {
              const startMin = timeStringToMinutes(s.start_time);
              if (currentMinutes >= startMin) {
                // Past or in-progress, skip
                continue;
              }
            }

            futureSlots.push({
              dateStr: dStr,
              startTime: s.start_time,
              endTime: s.end_time,
            });
          }
        }
      }
    }

    // Advance 1 day
    curDate.setDate(curDate.getDate() + 1);
  }

  // Include any extra manual replacement lessons that might be on free slots or dates
  // ensure no duplicate (dateStr + startTime)
  const slotKeySet = new Set(futureSlots.map((s) => `${s.dateStr}_${s.startTime}`));
  for (const [repDate, reps] of replacementSlotsByDate.entries()) {
    if (!holidayDateSet.has(repDate) && !nonTeachingDateSet.has(repDate)) {
      for (const rep of reps) {
        const key = `${repDate}_${rep.period_start}`;
        if (!slotKeySet.has(key)) {
          // If today, make sure it is in future
          if (repDate === todayStr) {
            if (currentMinutes >= timeStringToMinutes(rep.period_start)) {
              continue;
            }
          }
          slotKeySet.add(key);
          futureSlots.push({
            dateStr: repDate,
            startTime: rep.period_start,
            endTime: rep.period_end,
          });
        }
      }
    }
  }

  // Sort all future slots chronologically
  futureSlots.sort((a, b) => {
    if (a.dateStr !== b.dateStr) return a.dateStr.localeCompare(b.dateStr);
    return a.startTime.localeCompare(b.startTime);
  });

  const availableRemainingSlots = futureSlots.length;

  // Check if timetable is completely unconfigured for this class
  if (relevantTimetableSlots.length === 0 && futureSlots.length === 0) {
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      classProgramme: subject.class_programme,
      section: subject.section,
      totalTopics,
      completedTopics,
      remainingTopics,
      completionPercentage,
      topicsPerPeriodRate,
      isHistoricalRate,
      plannedPeriodsNeeded,
      availableRemainingSlots: 0,
      bufferPeriods: -plannedPeriodsNeeded,
      estimatedCompletionDate: null,
      estimatedCompletionDisplay: null,
      semesterDeadline: subject.semester_end_date,
      status: 'insufficient_data',
      detailMessage: 'No timetable configured for this class. Add teaching periods to calculate pace.',
    };
  }

  const bufferPeriods = availableRemainingSlots - plannedPeriodsNeeded;

  // Feasibility & Pace Determination
  let status: PaceStatus;
  let estimatedCompletionDate: string | null = null;
  let detailMessage: string;

  if (bufferPeriods < 0) {
    // Insufficient teaching periods before semester end
    status = 'behind_schedule';
    const shortage = Math.abs(bufferPeriods);
    detailMessage = `You need approximately ${plannedPeriodsNeeded} teaching periods, but only ${availableRemainingSlots} are available before the semester ends (${shortage} period shortfall).`;
  } else {
    // Sufficient teaching periods available
    const finishSlotIndex = Math.max(0, plannedPeriodsNeeded - 1);
    estimatedCompletionDate = futureSlots[finishSlotIndex]?.dateStr || subject.semester_end_date;

    if (estimatedCompletionDate > subject.semester_end_date) {
      status = 'behind_schedule';
      detailMessage = `Projected completion date (${formatReadableDate(estimatedCompletionDate)}) falls after the semester deadline (${formatReadableDate(subject.semester_end_date)}).`;
    } else if (bufferPeriods <= safetyBuffer) {
      status = 'at_risk';
      detailMessage = `Your syllabus is projected close to the semester deadline with only ${bufferPeriods} buffer period${bufferPeriods === 1 ? '' : 's'}. Consider reviewing your teaching plan.`;
    } else {
      status = 'on_track';
      detailMessage = `You have enough scheduled classes to finish comfortably before the semester ends (${bufferPeriods} buffer periods remaining).`;
    }
  }

  return {
    subjectId: subject.id,
    subjectName: subject.name,
    classProgramme: subject.class_programme,
    section: subject.section,
    totalTopics,
    completedTopics,
    remainingTopics,
    completionPercentage,
    topicsPerPeriodRate,
    isHistoricalRate,
    plannedPeriodsNeeded,
    availableRemainingSlots,
    bufferPeriods,
    estimatedCompletionDate,
    estimatedCompletionDisplay: estimatedCompletionDate ? formatReadableDate(estimatedCompletionDate) : null,
    semesterDeadline: subject.semester_end_date,
    status,
    detailMessage,
  };
}
