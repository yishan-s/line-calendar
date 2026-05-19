import { useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, format,
  startOfDay, endOfDay, isWithinInterval
} from 'date-fns';
import EventChip from './EventChip';
import './CalendarGrid.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarGrid({ currentDate, events, onDayClick, onEventClick, user }) {
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  const getEventsForDay = (day) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    return events.filter(event => {
      const eventStart = startOfDay(new Date(event.start_time));

      // If event has no end_time, it only appears on its start day
      if (!event.end_time) {
        return isSameDay(eventStart, day);
      }

      const eventEnd = endOfDay(new Date(event.end_time));

      // Check if this day overlaps with the event's date range
      return (
        isWithinInterval(dayStart, { start: eventStart, end: eventEnd }) ||
        isWithinInterval(dayEnd, { start: eventStart, end: eventEnd }) ||
        (dayStart <= eventStart && dayEnd >= eventEnd)
      );
    });
  };

  return (
    <div className="cal-grid" id="calendar-grid">
      <div className="cal-grid__weekdays">
        {WEEKDAYS.map(day => (
          <div key={day} className="cal-grid__weekday">{day}</div>
        ))}
      </div>
      <div className="cal-grid__days">
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const MAX_VISIBLE = 3;
          const visibleEvents = dayEvents.slice(0, MAX_VISIBLE);
          const overflow = dayEvents.length - MAX_VISIBLE;

          return (
            <div
              key={day.toISOString()}
              className={`cal-grid__cell ${!inMonth ? 'cal-grid__cell--outside' : ''} ${today ? 'cal-grid__cell--today' : ''}`}
              onClick={() => onDayClick(day)}
              style={{ animationDelay: `${(index % 7) * 30}ms` }}
              id={`cell-${format(day, 'yyyy-MM-dd')}`}
            >
              <div className="cal-grid__date-wrapper">
                <span className={`cal-grid__date ${today ? 'cal-grid__date--today' : ''}`}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="cal-grid__events">
                {visibleEvents.map(event => (
                  <EventChip key={event.id} event={event} onClick={onEventClick} />
                ))}
                {overflow > 0 && (
                  <span className="cal-grid__overflow">+{overflow} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}