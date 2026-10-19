/**
 * Fixed Daily Timetable Configuration
 *
 * Predefined periods and college timings:
 * Period 1: 08:30 - 09:20
 * Period 2: 09:20 - 10:10
 * Break:    10:10 - 10:20 (Separator, non-teaching)
 * Period 3: 10:20 - 11:10
 * Period 4: 11:10 - 12:00
 * Lunch:    12:00 - 12:40 (Separator, non-teaching)
 * Period 5: 12:40 - 13:30
 * Period 6: 13:30 - 14:20
 * Period 7: 14:20 - 15:05
 * Period 8: 15:05 - 15:50
 */

export interface PeriodConfig {
  periodNumber: number; // 1 to 8
  label: string;        // 'Period 1'
  startTime: string;    // '08:30' (24h format HH:mm)
  endTime: string;      // '09:20' (24h format HH:mm)
  displayTime: string;  // '8:30 – 9:20 AM'
}

export interface BreakConfig {
  type: 'break' | 'lunch';
  label: string;
  startTime: string;
  endTime: string;
  displayTime: string;
}

export type TimelineSlotConfig =
  | ({ isTeaching: true } & PeriodConfig)
  | ({ isTeaching: false } & BreakConfig);

export const FIXED_PERIODS: PeriodConfig[] = [
  {
    periodNumber: 1,
    label: 'Period 1',
    startTime: '08:30',
    endTime: '09:20',
    displayTime: '8:30 – 9:20 AM',
  },
  {
    periodNumber: 2,
    label: 'Period 2',
    startTime: '09:20',
    endTime: '10:10',
    displayTime: '9:20 – 10:10 AM',
  },
  {
    periodNumber: 3,
    label: 'Period 3',
    startTime: '10:20',
    endTime: '11:10',
    displayTime: '10:20 – 11:10 AM',
  },
  {
    periodNumber: 4,
    label: 'Period 4',
    startTime: '11:10',
    endTime: '12:00',
    displayTime: '11:10 AM – 12:00 PM',
  },
  {
    periodNumber: 5,
    label: 'Period 5',
    startTime: '12:40',
    endTime: '13:30',
    displayTime: '12:40 – 1:30 PM',
  },
  {
    periodNumber: 6,
    label: 'Period 6',
    startTime: '13:30',
    endTime: '14:20',
    displayTime: '1:30 – 2:20 PM',
  },
  {
    periodNumber: 7,
    label: 'Period 7',
    startTime: '14:20',
    endTime: '15:05',
    displayTime: '2:20 – 3:05 PM',
  },
  {
    periodNumber: 8,
    label: 'Period 8',
    startTime: '15:05',
    endTime: '15:50',
    displayTime: '3:05 – 3:50 PM',
  },
];

export const TIMETABLE_TIMELINE: TimelineSlotConfig[] = [
  { isTeaching: true, ...FIXED_PERIODS[0] }, // Period 1: 08:30 - 09:20
  { isTeaching: true, ...FIXED_PERIODS[1] }, // Period 2: 09:20 - 10:10
  {
    isTeaching: false,
    type: 'break',
    label: 'Morning Break',
    startTime: '10:10',
    endTime: '10:20',
    displayTime: '10:10 – 10:20 AM',
  },
  { isTeaching: true, ...FIXED_PERIODS[2] }, // Period 3: 10:20 - 11:10
  { isTeaching: true, ...FIXED_PERIODS[3] }, // Period 4: 11:10 - 12:00
  {
    isTeaching: false,
    type: 'lunch',
    label: 'Lunch Break',
    startTime: '12:00',
    endTime: '12:40',
    displayTime: '12:00 – 12:40 PM',
  },
  { isTeaching: true, ...FIXED_PERIODS[4] }, // Period 5: 12:40 - 13:30
  { isTeaching: true, ...FIXED_PERIODS[5] }, // Period 6: 13:30 - 14:20
  { isTeaching: true, ...FIXED_PERIODS[6] }, // Period 7: 14:20 - 15:05
  { isTeaching: true, ...FIXED_PERIODS[7] }, // Period 8: 15:05 - 15:50
];

export function getPeriodConfig(periodNumber: number): PeriodConfig | undefined {
  return FIXED_PERIODS.find((p) => p.periodNumber === periodNumber);
}

/**
 * Maps arbitrary legacy time strings to the closest fixed period (1 to 8)
 * Returns null if no unambiguous match can be determined.
 */
export function mapLegacyTimeToPeriod(startTime: string): number | null {
  if (!startTime) return null;
  const [h, m] = startTime.split(':').map(Number);
  const minutes = h * 60 + m;

  const candidates = FIXED_PERIODS.map((p) => {
    const [ph, pm] = p.startTime.split(':').map(Number);
    const pMinutes = ph * 60 + pm;
    return {
      periodNumber: p.periodNumber,
      diff: Math.abs(minutes - pMinutes),
    };
  }).sort((a, b) => a.diff - b.diff);

  if (candidates.length > 0 && candidates[0].diff <= 35) {
    return candidates[0].periodNumber;
  }
  return null;
}
