import { useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, format
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
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return isSameDay(eventDate, day);
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