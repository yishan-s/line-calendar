import { useState, useEffect, useRef, useMemo } from 'react';
import {
  format,
  isSameDay,
  differenceInMinutes,
  getDayOfYear,
} from 'date-fns';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Sparkles,
  FileText,
  Plus,
  Sun,
  Calendar,
} from 'lucide-react';
import './DayDashboard.css';

/**
 * Determine the event type string from an event object.
 */
function getEventType(event) {
  if (event.is_all_day) return 'allday';
  if (event.start_time && event.end_time) return 'timed';
  return 'open';
}

/**
 * Sort comparator: all-day first, then by start_time ascending.
 */
function eventSortComparator(a, b) {
  if (a.is_all_day && !b.is_all_day) return -1;
  if (!a.is_all_day && b.is_all_day) return 1;
  return new Date(a.start_time) - new Date(b.start_time);
}

export default function DayDashboard({
  date,
  events,
  user,
  onClose,
  onEventClick,
  onCreateEvent,
}) {
  /* ===== Notes state ===== */
  const [notes, setNotes] = useState('');
  const [savedIndicator, setSavedIndicator] = useState(false);
  const debounceRef = useRef(null);
  const savedTimerRef = useRef(null);

  /* ===== Derived: filtered events & stats ===== */
  const dayEvents = useMemo(() => {
    if (!events || !date) return [];
    return events
      .filter((ev) => {
        const evStart = new Date(ev.start_time);
        return isSameDay(evStart, date);
      })
      .sort(eventSortComparator);
  }, [events, date]);

  const stats = useMemo(() => {
    let totalEvents = dayEvents.length;
    let bookedMinutes = 0;

    dayEvents.forEach((ev) => {
      if (!ev.is_all_day && ev.start_time && ev.end_time) {
        const mins = differenceInMinutes(
          new Date(ev.end_time),
          new Date(ev.start_time)
        );
        if (mins > 0) bookedMinutes += mins;
      }
    });

    const bookedHours = bookedMinutes / 60;
    const workingHours = 8;
    const freeHours = Math.max(0, workingHours - bookedHours);

    return {
      totalEvents,
      bookedHours: bookedHours % 1 === 0 ? bookedHours : bookedHours.toFixed(1),
      freeHours: freeHours % 1 === 0 ? freeHours : freeHours.toFixed(1),
    };
  }, [dayEvents]);

  /* ===== localStorage key for notes ===== */
  const notesKey = useMemo(() => {
    if (!date) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    const userKey = user?.id ?? 'guest';
    return `daynotes_${userKey}_${dateStr}`;
  }, [date, user]);

  /* ===== Load notes from localStorage ===== */
  useEffect(() => {
    if (!notesKey) return;
    const saved = localStorage.getItem(notesKey);
    setNotes(saved || '');
    setSavedIndicator(false);
  }, [notesKey]);

  /* ===== Save notes (debounced) ===== */
  const handleNotesChange = (e) => {
    const value = e.target.value;
    setNotes(value);
    setSavedIndicator(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (notesKey) {
        if (value.trim()) {
          localStorage.setItem(notesKey, value);
        } else {
          localStorage.removeItem(notesKey);
        }
        setSavedIndicator(true);

        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSavedIndicator(false), 2000);
      }
    }, 500);
  };

  /* ===== Cleanup timers ===== */
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  /* ===== Guard clause (after all hooks) ===== */
  if (!date) return null;

  /* ===== Formatted dates ===== */
  const dateMain = format(date, 'EEEE, MMMM d, yyyy');
  const dayOfYear = getDayOfYear(date);
  const dateSub = `Day ${dayOfYear} of ${format(date, 'yyyy')}`;

  /* ===== Get time display for an event ===== */
  const getTimeLabel = (event) => {
    const type = getEventType(event);
    if (type === 'allday') return 'All Day';
    const s = format(new Date(event.start_time), 'HH:mm');
    if (type === 'timed') return `${s} – ${format(new Date(event.end_time), 'HH:mm')}`;
    return `${s} ~`;
  };

  return (
    <div className="day-dashboard-overlay" onClick={onClose}>
      <div
        className="day-dashboard"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Dashboard for ${dateMain}`}
      >
        {/* ===== A. Header ===== */}
        <header className="day-dashboard__header">
          <button className="day-dashboard__back" onClick={onClose}>
            <ArrowLeft size={16} />
            <span>Back to Calendar</span>
          </button>
          <div className="day-dashboard__date-display">
            <div className="day-dashboard__date-main">{dateMain}</div>
            <div className="day-dashboard__date-sub">
              <Sun size={12} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              {dateSub}
            </div>
          </div>
        </header>

        {/* ===== B. Stats Bar ===== */}
        <div className="day-dashboard__stats">
          <div className="day-dashboard__stat-card">
            <div className="day-dashboard__stat-icon">
              <CalendarDays size={18} />
            </div>
            <div className="day-dashboard__stat-value">{stats.totalEvents}</div>
            <div className="day-dashboard__stat-label">Events</div>
          </div>
          <div className="day-dashboard__stat-card">
            <div className="day-dashboard__stat-icon">
              <Clock size={18} />
            </div>
            <div className="day-dashboard__stat-value">{stats.bookedHours}</div>
            <div className="day-dashboard__stat-label">Hours Booked</div>
          </div>
          <div className="day-dashboard__stat-card">
            <div className="day-dashboard__stat-icon">
              <Sparkles size={18} />
            </div>
            <div className="day-dashboard__stat-value">{stats.freeHours}</div>
            <div className="day-dashboard__stat-label">Free Hours</div>
          </div>
        </div>

        {/* ===== C. Timeline ===== */}
        <div className="day-dashboard__section">
          <div className="day-dashboard__section-title">
            <Clock size={14} />
            <span>Timeline</span>
          </div>

          {dayEvents.length > 0 ? (
            <div className="day-dashboard__timeline">
              {dayEvents.map((ev) => {
                const type = getEventType(ev);
                return (
                  <div
                    key={ev.id}
                    className="day-dashboard__timeline-item"
                    onClick={() => onEventClick?.(ev)}
                  >
                    <div className={`day-dashboard__timeline-dot day-dashboard__timeline-dot--${type}`} />
                    <div className="day-dashboard__timeline-time">
                      {getTimeLabel(ev)}
                    </div>
                    <div className="day-dashboard__timeline-content">
                      <div className="day-dashboard__timeline-title">{ev.title}</div>
                      {ev.description && (
                        <div className="day-dashboard__timeline-desc">
                          {ev.description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="day-dashboard__timeline-empty">
              <div className="day-dashboard__timeline-empty-icon">
                <Calendar size={24} />
              </div>
              <div className="day-dashboard__timeline-empty-text">
                No events scheduled
              </div>
              <div className="day-dashboard__timeline-empty-sub">
                This day is wide open — add something!
              </div>
            </div>
          )}
        </div>

        {/* ===== D. Notes & Records ===== */}
        <div className="day-dashboard__notes">
          <div className="day-dashboard__section-title">
            <FileText size={14} />
            <span>Notes &amp; Records</span>
          </div>
          <textarea
            className="day-dashboard__notes-textarea"
            value={notes}
            onChange={handleNotesChange}
            placeholder="Write your thoughts, records, or reflections for today..."
            rows={4}
          />
          <div className="day-dashboard__notes-meta">
            <span
              className={`day-dashboard__notes-saved ${
                savedIndicator ? 'day-dashboard__notes-saved--visible' : ''
              }`}
            >
              ✓ Saved
            </span>
            <span>{notes.length} characters</span>
          </div>
        </div>

        {/* ===== E. Quick Add Button ===== */}
        {user && (
          <div className="day-dashboard__footer">
            <button
              className="day-dashboard__add-btn"
              onClick={() => onCreateEvent?.(date)}
            >
              <Plus size={18} />
              Add Event for this Day
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
