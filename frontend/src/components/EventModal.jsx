import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Star, Clock, HelpCircle } from 'lucide-react';
import './EventModal.css';

const EVENT_TYPES = [
  { id: 'allday', label: 'All Day / Special', icon: <Star size={16} />, color: 'var(--color-event-allday)' },
  { id: 'timed', label: 'Start & End Time', icon: <Clock size={16} />, color: 'var(--color-event-timed)' },
  { id: 'open', label: 'Start Only (TBD end)', icon: <HelpCircle size={16} />, color: 'var(--color-event-open)' },
];

export default function EventModal({ isOpen, onClose, onSave, selectedDate }) {
  const [eventType, setEventType] = useState('timed');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setStartTime('09:00');
      setEndTime('10:00');
      setEventType('timed');
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const event = {
      title: title.trim(),
      description: description.trim() || null,
      is_all_day: eventType === 'allday',
      start_time: eventType === 'allday' ? `${dateStr}T00:00:00` : `${dateStr}T${startTime}:00`,
      end_time: eventType === 'timed' ? `${dateStr}T${endTime}:00` : null,
    };
    onSave(event);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} id="event-modal">
        <div className="modal__header">
          <h2 className="modal__title">New Event</h2>
          <span className="modal__date">{format(selectedDate, 'EEEE, MMM d, yyyy')}</span>
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

          <button type="submit" className="modal__submit" id="btn-save-event">
            Create Event
          </button>
        </form>
      </div>
    </div>
  );
}
