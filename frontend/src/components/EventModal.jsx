import { useState, useEffect } from 'react';
import { format, subMinutes, addDays } from 'date-fns';
import { X, Star, Clock, HelpCircle, CalendarRange } from 'lucide-react';
import './EventModal.css';

const EVENT_TYPES = [
  { id: 'allday', label: 'All Day / Special', icon: <Star size={16} />, color: 'var(--color-event-allday)' },
  { id: 'timed', label: 'Start & End Time', icon: <Clock size={16} />, color: 'var(--color-event-timed)' },
  { id: 'open', label: 'Start Only (TBD end)', icon: <HelpCircle size={16} />, color: 'var(--color-event-open)' },
];

const REMINDER_OPTIONS = [
  { value: 0, label: 'At start of event' },
  { value: 5, label: '5 minutes before' },
  { value: 10, label: '10 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

export default function EventModal({ isOpen, onClose, onSave, selectedDate, prefillTitle = '' }) {
  const [eventType, setEventType] = useState('timed');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [multiDay, setMultiDay] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(15);

  useEffect(() => {
    if (isOpen && selectedDate) {
      setTitle(prefillTitle || '');
      setDescription('');
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      setStartDate(dateStr);
      setEndDate(format(addDays(selectedDate, 1), 'yyyy-MM-dd'));
      setStartTime('09:00');
      setEndTime('10:00');
      setEventType('timed');
      setMultiDay(false);
      setReminderMinutes(15);
    }
  }, [isOpen, selectedDate]);

  if (!isOpen || !startDate) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    // 1. 先精準算出這個活動的「開始時間物件 (Date)」
    const startDateObj = eventType === 'allday'
      ? new Date(`${startDate}T00:00:00`)
      : new Date(`${startDate}T${startTime}:00`);

    // 2. 拿出神奇的計算機：開始時間 - 提醒分鐘數 = 確切的提醒時間！
    const remindTimeObj = subMinutes(startDateObj, reminderMinutes);

    // 3. Determine end time based on event type and multi-day toggle
    let endTimeStr = null;
    if (eventType === 'allday') {
      if (multiDay) {
        // Multi-day all-day event: end at midnight of the end date
        endTimeStr = `${endDate}T23:59:00`;
      }
      // Single all-day: end_time stays null (same-day)
    } else if (eventType === 'timed') {
      if (multiDay) {
        // Multi-day timed event: use end date + end time
        endTimeStr = `${endDate}T${endTime}:00`;
      } else {
        // Same-day timed event
        endTimeStr = `${startDate}T${endTime}:00`;
      }
    }
    // 'open' type: end_time is always null

    // 4. 把資料打包，這次欄位名稱完全配合你的 Python 後端！
    const event = {
      title: title.trim(),
      description: description.trim() || null,
      is_all_day: eventType === 'allday',
      start_time: format(startDateObj, "yyyy-MM-dd'T'HH:mm:00"),
      end_time: endTimeStr,

      // 🟢 丟掉 reminder_minutes，換成後端要的 remind_time！
      remind_time: format(remindTimeObj, "yyyy-MM-dd'T'HH:mm:00"),
      is_completed: false, // 順便配合後端加上預設值
      is_reminded: false
    };

    onSave(event);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} id="event-modal">
        <div className="modal__header">
          <h2 className="modal__title">New Event</h2>
          <span className="modal__date">{format(new Date(startDate), 'EEEE, MMM d, yyyy')}</span>
          <button className="modal__close" onClick={onClose} id="btn-close-modal"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal__form">
          {/* Event Type Selector */}
          <div className="modal__type-selector">
            {EVENT_TYPES.map(type => (
              <button
                key={type.id}
                type="button"
                className={`modal__type-btn ${eventType === type.id ? 'modal__type-btn--active' : ''}`}
                onClick={() => setEventType(type.id)}
                style={eventType === type.id ? { borderColor: type.color, color: type.color } : {}}
                id={`btn-type-${type.id}`}
              >
                {type.icon}
                <span>{type.label}</span>
              </button>
            ))}
          </div>

          <div className="modal__field">
            <label className="modal__label" htmlFor="event-title">Event Title</label>
            <input
              id="event-title"
              className="modal__input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's happening?"
              autoFocus
              required
            />
          </div>

          <div className="modal__field">
            <label className="modal__label" htmlFor="event-description">Description (optional)</label>
            <textarea
              id="event-description"
              className="modal__input modal__textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={2}
            />
          </div>

          {/* Multi-day toggle */}
          {eventType !== 'open' && (
            <button
              type="button"
              className={`modal__multiday-toggle ${multiDay ? 'modal__multiday-toggle--active' : ''}`}
              onClick={() => setMultiDay(prev => !prev)}
              id="btn-toggle-multiday"
            >
              <CalendarRange size={16} />
              <span>Multi-day event</span>
              <div className={`modal__toggle-switch ${multiDay ? 'modal__toggle-switch--on' : ''}`}>
                <div className="modal__toggle-knob" />
              </div>
            </button>
          )}

          {/* Date pickers row (always show start date, show end date if multi-day) */}
          <div className="modal__date-row">
            <div className="modal__field">
              <label className="modal__label" htmlFor="event-start-date">
                {multiDay ? 'Start Date' : 'Date'}
              </label>
              <input
                id="event-start-date"
                className="modal__input"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  // Auto-adjust end date if it's before start date
                  if (e.target.value > endDate) {
                    setEndDate(format(addDays(new Date(e.target.value), 1), 'yyyy-MM-dd'));
                  }
                }}
              />
            </div>
            {multiDay && (
              <div className="modal__field">
                <label className="modal__label" htmlFor="event-end-date">End Date</label>
                <input
                  id="event-end-date"
                  className="modal__input"
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {eventType !== 'allday' && (
            <div className="modal__time-row">
              <div className="modal__field">
                <label className="modal__label" htmlFor="event-start">Start Time</label>
                <input
                  id="event-start"
                  className="modal__input"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              {eventType === 'timed' && (
                <div className="modal__field">
                  <label className="modal__label" htmlFor="event-end">End Time</label>
                  <input
                    id="event-end"
                    className="modal__input"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              )}
              {eventType === 'open' && (
                <div className="modal__field modal__field--tbd">
                  <label className="modal__label">End Time</label>
                  <div className="modal__tbd-badge">TBD</div>
                </div>
              )}
            </div>
          )}
          <div className="modal__field">
            <label className="modal__label" htmlFor="event-reminder">Reminder</label>
            <select
              id="event-reminder"
              className="modal__select"
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(Number(e.target.value))}
            >
              {REMINDER_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="modal__submit" id="btn-save-event">
            Create Event
          </button>
        </form>
      </div>
    </div>
  );
}