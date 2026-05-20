import { useMemo } from 'react';
import {
  startOfWeek, endOfWeek, eachDayOfInterval, format,
  isSameDay, isToday, getHours, getMinutes, differenceInMinutes
} from 'date-fns';
import './WeeklyView.css';

const HOUR_START = 6;
const HOUR_END = 23;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
const HOUR_HEIGHT = 56; // px per hour

export default function WeeklyView({ currentDate, events, onTimeClick, onEventClick, user }) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const getEventsForDay = (day) =>
    events
      .filter(e => isSameDay(new Date(e.start_time), day))
      // 加入排序：依據開始時間由早到晚 (垂直順序)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const getAllDayEvents = (day) =>
    getEventsForDay(day).filter(e => e.is_all_day);

  const getTimedEvents = (day) =>
    getEventsForDay(day).filter(e => !e.is_all_day);

  const getEventStyle = (event) => {
    const start = new Date(event.start_time);
    const startHour = getHours(start) + getMinutes(start) / 60;
    const top = (startHour - HOUR_START) * HOUR_HEIGHT;

    if (event.end_time) {
      const end = new Date(event.end_time);
      const duration = differenceInMinutes(end, start);
      const height = Math.max((duration / 60) * HOUR_HEIGHT, 24);
      return { top: `${top}px`, height: `${height}px` };
    }
    // Open-ended: show as 1-hour dashed block
    return { top: `${top}px`, height: `${HOUR_HEIGHT}px` };
  };

  const getEventType = (event) => {
    if (event.is_all_day) return 'allday';
    if (event.start_time && event.end_time) return 'timed';
    return 'open';
  };

  const handleGridClick = (day, hour) => {
    const clickedDate = new Date(day);
    clickedDate.setHours(hour, 0, 0, 0);
    onTimeClick(clickedDate);
  };

  // Current time indicator
  const now = new Date();
  const nowHour = getHours(now) + getMinutes(now) / 60;
  const nowTop = (nowHour - HOUR_START) * HOUR_HEIGHT;

  return (
    <div className="weekly" id="weekly-view">
      {/* All-day banner */}
      <div className="weekly__allday-row">
        <div className="weekly__gutter weekly__gutter--allday">ALL DAY</div>
        {weekDays.map(day => {
          const allDay = getAllDayEvents(day);
          return (
            <div key={day.toISOString()} className="weekly__allday-cell">
              {allDay.map(e => (
                <div
                  key={e.id}
                  className="weekly__allday-chip"
                  onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                  title={e.title}
                >
                  {e.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Header with day names */}
      <div className="weekly__header">
        <div className="weekly__gutter"></div>
        {weekDays.map(day => (
          <div
            key={day.toISOString()}
            className={`weekly__day-header ${isToday(day) ? 'weekly__day-header--today' : ''}`}
          >
            <span className="weekly__day-name">{format(day, 'EEE')}</span>
            <span className={`weekly__day-num ${isToday(day) ? 'weekly__day-num--today' : ''}`}>
              {format(day, 'd')}
            </span>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="weekly__scroll">
        <div className="weekly__grid">
          {/* Time labels */}
          <div className="weekly__gutter-col">
            {HOURS.map(h => (
              <div key={h} className="weekly__time-label" style={{ height: `${HOUR_HEIGHT}px` }}>
                {format(new Date(2000, 0, 1, h), 'h a')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map(day => {
            const timedEvents = getTimedEvents(day);
            const today = isToday(day);
            return (
              <div key={day.toISOString()} className="weekly__day-col">
                {/* Hour cells (clickable) */}
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="weekly__hour-cell"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    onClick={() => handleGridClick(day, h)}
                  />
                ))}

                {/* Current time line */}
                {today && nowHour >= HOUR_START && nowHour <= HOUR_END && (
                  <div className="weekly__now-line" style={{ top: `${nowTop}px` }}>
                    <div className="weekly__now-dot" />
                  </div>
                )}

                {/* Event blocks */}
                {timedEvents.map(e => {
                  const type = getEventType(e);
                  const style = getEventStyle(e);
                  return (
                    <div
                      key={e.id}
                      className={`weekly__event weekly__event--${type}`}
                      style={style}
                      onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                      title={`${e.title} · ${format(new Date(e.start_time), 'HH:mm')}${e.end_time ? '–' + format(new Date(e.end_time), 'HH:mm') : '~'}`}
                    >
                      <span className="weekly__event-title">{e.title}</span>
                      <span className="weekly__event-time">
                        {format(new Date(e.start_time), 'HH:mm')}
                        {e.end_time ? `–${format(new Date(e.end_time), 'HH:mm')}` : ' ~'}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
