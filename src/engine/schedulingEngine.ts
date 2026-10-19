import { Subject, TimetableSlot, Topic, OfficialHoliday, NonTeachingDate, Lesson } from '@/types/database';

export interface SchedulingInput {
  subject: Subject;
  timetableSlots: TimetableSlot[];
  orderedTopics: Topic[];
  officialHolidays: OfficialHoliday[];
  nonTeachingDates: NonTeachingDate[];
  existingCompletedLessons?: Lesson[];
  userId: string;
}

export interface SchedulingResult {
  lessons: Array<Omit<Lesson, 'id' | 'created_at' | 'updated_at'>>;
  totalSlotsAvailable: number;
  totalPeriodsRequired: number;
  scheduledPeriods: number;
  unscheduledTopicsCount: number;
  periodShortage: number;
  isFeasible: boolean;
  warnings: string[];
}

/**
 * Returns formatted YYYY-MM-DD string from a Date object
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse YYYY-MM-DD into a localized Date (noon to prevent midnight timezone drifts)
 */
export function parseDateISO(isoString: string): Date {
  const [y, m, d] = isoString.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/**
 * Validates whether a date is a weekend (Saturday or Sunday)
 * In JS Date: 0 = Sunday, 6 = Saturday
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Get weekday index 1..5 for Monday..Friday matching timetable_slots schema
 */
export function getWeekday1To5(date: Date): number | null {
  const day = date.getDay();
  if (day >= 1 && day <= 5) return day;
  return null;
}

/**
 * Core deterministic scheduling engine for CampusFlow
 */
export function generateSchedule(input: SchedulingInput): SchedulingResult {
  const {
    subject,
    timetableSlots,
    orderedTopics,
    officialHolidays,
    nonTeachingDates,
    existingCompletedLessons = [],
    userId,
  } = input;

  const warnings: string[] = [];
  const holidayDateSet = new Set(officialHolidays.map((h) => h.holiday_date));
  const nonTeachingDateSet = new Set(nonTeachingDates.map((nt) => nt.date));

  // Validation 1: Semester dates
  const startDate = parseDateISO(subject.semester_start_date);
  const endDate = parseDateISO(subject.semester_end_date);

  if (endDate < startDate) {
    return {
      lessons: [],
      totalSlotsAvailable: 0,
      totalPeriodsRequired: 0,
      scheduledPeriods: 0,
      unscheduledTopicsCount: orderedTopics.length,
      periodShortage: 0,
      isFeasible: false,
      warnings: ['Semester end date cannot be earlier than semester start date.'],
    };
  }

  // Validation 2: Timetable slots
  if (!timetableSlots || timetableSlots.length === 0) {
    return {
      lessons: [],
      totalSlotsAvailable: 0,
      totalPeriodsRequired: orderedTopics.reduce((acc, t) => acc + (t.estimated_periods || 1), 0),
      scheduledPeriods: 0,
      unscheduledTopicsCount: orderedTopics.length,
      periodShortage: orderedTopics.reduce((acc, t) => acc + (t.estimated_periods || 1), 0),
      isFeasible: false,
      warnings: ['No weekly timetable periods configured for this subject.'],
    };
  }

  // Validation 3: Topics
  if (!orderedTopics || orderedTopics.length === 0) {
    return {
      lessons: [],
      totalSlotsAvailable: 0,
      totalPeriodsRequired: 0,
      scheduledPeriods: 0,
      unscheduledTopicsCount: 0,
      periodShortage: 0,
      isFeasible: true,
      warnings: ['No topics added to syllabus.'],
    };
  }

  // Sort timetable slots by weekday and period start time
  const sortedSlots = [...timetableSlots].sort((a, b) => {
    if (a.weekday !== b.weekday) return a.weekday - b.weekday;
    return a.start_time.localeCompare(b.start_time);
  });

  // Calculate total periods required
  const totalPeriodsRequired = orderedTopics.reduce(
    (sum, topic) => sum + Math.max(1, topic.estimated_periods || 1),
    0
  );

  // Completed lessons mapping: slots that are already used by completed lessons
  const completedSlotsSet = new Set<string>();
  const completedTopicIdSet = new Set<string>();

  existingCompletedLessons.forEach((cl) => {
    completedSlotsSet.add(`${cl.scheduled_date}_${cl.period_start}`);
    if (cl.status === 'completed') {
      completedTopicIdSet.add(cl.topic_id);
    }
  });

  // Collect all available teaching slots between startDate and endDate
  interface AvailableSlot {
    dateStr: string;
    startTime: string;
    endTime: string;
  }

  const availableSlots: AvailableSlot[] = [];
  const currentDate = new Date(startDate.getTime());

  while (currentDate <= endDate) {
    // Rule: Exclude Saturday and Sunday
    if (!isWeekend(currentDate)) {
      const dateStr = formatDateISO(currentDate);

      // Rule: Exclude official holidays
      const isOfficialHoliday = holidayDateSet.has(dateStr);

      // Rule: Exclude exam / non-teaching dates
      const isNonTeachingDate = nonTeachingDateSet.has(dateStr);

      if (!isOfficialHoliday && !isNonTeachingDate) {
        const weekday = getWeekday1To5(currentDate);
        if (weekday !== null) {
          const slotsForDay = sortedSlots.filter((slot) => slot.weekday === weekday);
          for (const s of slotsForDay) {
            const slotKey = `${dateStr}_${s.start_time}`;
            // If already occupied by a preserved completed lesson, do not overwrite it
            if (!completedSlotsSet.has(slotKey)) {
              availableSlots.push({
                dateStr,
                startTime: s.start_time,
                endTime: s.end_time,
              });
            }
          }
        }
      }
    }
    // Increment date by 1 day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const totalSlotsAvailable = availableSlots.length + existingCompletedLessons.length;

  // Identify topics needing scheduling
  // If an entire topic is already completed and has completed lessons, we keep existing lessons and skip
  // We allocate periods sequentially
  interface TopicPeriodQueueItem {
    topic: Topic;
    periodIndex: number;
    totalPeriodsForTopic: number;
  }

  const periodQueue: TopicPeriodQueueItem[] = [];

  for (const topic of orderedTopics) {
    // Count how many completed lessons already exist for this topic
    const completedForThis = existingCompletedLessons.filter((cl) => cl.topic_id === topic.id).length;
    const needed = Math.max(1, topic.estimated_periods || 1);
    const remainingToSchedule = Math.max(0, needed - completedForThis);

    for (let p = 0; p < remainingToSchedule; p++) {
      periodQueue.push({
        topic,
        periodIndex: completedForThis + p + 1,
        totalPeriodsForTopic: needed,
      });
    }
  }

  const scheduledLessons: Array<Omit<Lesson, 'id' | 'created_at' | 'updated_at'>> = [];

  // Re-include preserved completed lessons in output
  for (const cl of existingCompletedLessons) {
    scheduledLessons.push({
      subject_id: cl.subject_id,
      topic_id: cl.topic_id,
      user_id: cl.user_id,
      scheduled_date: cl.scheduled_date,
      period_start: cl.period_start,
      period_end: cl.period_end,
      status: cl.status,
      completed_at: cl.completed_at,
      notes: cl.notes,
    });
  }

  let slotIndex = 0;
  const unscheduledTopics = new Set<string>();

  for (const queueItem of periodQueue) {
    if (slotIndex < availableSlots.length) {
      const slot = availableSlots[slotIndex];
      scheduledLessons.push({
        subject_id: subject.id,
        topic_id: queueItem.topic.id,
        user_id: userId,
        scheduled_date: slot.dateStr,
        period_start: slot.startTime,
        period_end: slot.endTime,
        status: 'planned',
        completed_at: null,
        notes: null,
      });
      slotIndex++;
    } else {
      unscheduledTopics.add(queueItem.topic.id);
    }
  }

  const scheduledPeriods = scheduledLessons.length;
  const periodShortage = Math.max(0, totalPeriodsRequired - scheduledPeriods);
  const unscheduledTopicsCount = unscheduledTopics.size;
  const isFeasible = periodShortage === 0;

  if (!isFeasible) {
    warnings.push(
      `Syllabus exceeds semester timetable by ${periodShortage} period(s). ${unscheduledTopicsCount} topic(s) cannot be accommodated before ${subject.semester_end_date}.`
    );
  }

  // Sort all lessons deterministically by date and start time
  scheduledLessons.sort((a, b) => {
    if (a.scheduled_date !== b.scheduled_date) {
      return a.scheduled_date.localeCompare(b.scheduled_date);
    }
    return a.period_start.localeCompare(b.period_start);
  });

  return {
    lessons: scheduledLessons,
    totalSlotsAvailable,
    totalPeriodsRequired,
    scheduledPeriods,
    unscheduledTopicsCount,
    periodShortage,
    isFeasible,
    warnings,
  };
}
