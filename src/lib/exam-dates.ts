// Upcoming SAT test dates (College Board, official as of 2026).
// Both US and international students test on the same global dates.
// Source: https://satsuite.collegeboard.org/sat/dates-deadlines

export type ExamDate = {
  date: string;       // ISO YYYY-MM-DD
  display: string;    // "August 22, 2026"
  regions: ("us" | "international")[];
};

export const SAT_EXAM_DATES: ExamDate[] = [
  { date: "2026-08-22", display: "August 22, 2026",    regions: ["us", "international"] },
  { date: "2026-09-12", display: "September 12, 2026", regions: ["us", "international"] },
  { date: "2026-10-03", display: "October 3, 2026",    regions: ["us", "international"] },
  { date: "2026-11-07", display: "November 7, 2026",   regions: ["us", "international"] },
  { date: "2026-12-05", display: "December 5, 2026",   regions: ["us", "international"] },
  { date: "2027-03-06", display: "March 6, 2027",      regions: ["us", "international"] },
  { date: "2027-05-01", display: "May 1, 2027",        regions: ["us", "international"] },
  { date: "2027-06-05", display: "June 5, 2027",       regions: ["us", "international"] },
];

// Only show dates that haven't passed yet
export function getUpcomingExamDates(region: "us" | "international"): ExamDate[] {
  const today = new Date().toISOString().slice(0, 10);
  return SAT_EXAM_DATES.filter(
    (d) => d.regions.includes(region) && d.date >= today
  );
}

// Format a date as "X days from now" for the dashboard countdown
export function daysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
