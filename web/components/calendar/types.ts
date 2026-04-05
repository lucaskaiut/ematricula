export type RecurrenceRule = {
  frequency: "weekly";
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  recurrence?: RecurrenceRule;
};

export type CalendarView = "day" | "week" | "month";

export type CalendarProps = {
  events: CalendarEvent[];
  date: Date;
  view?: CalendarView;
  defaultView?: CalendarView;
  onViewChange?: (view: CalendarView) => void;
  viewportAdaptive?: boolean;
  viewportAdaptiveBreakpointPx?: number;
  showViewSwitcher?: boolean;
  onCreateEvent?: (date: Date) => void;
  onUpdateEvent?: (event: CalendarEvent) => void;
  hourStart?: number;
  hourEnd?: number;
  slotMinutes?: number;
  pixelsPerHour?: number;
  weekStartsOn?: 0 | 1;
  autoScrollToFirstEvent?: boolean;
};

export type CalendarEventInstance = CalendarEvent & {
  instanceKey: string;
};
