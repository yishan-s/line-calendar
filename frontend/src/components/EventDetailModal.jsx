import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Star, Clock, HelpCircle, Pencil, Trash2, Save, XCircle } from 'lucide-react';
import './EventDetailModal.css';

const EVENT_TYPES = [
  { id: 'allday', label: 'All Day', icon: <Star size={14} /> },
  { id: 'timed', label: 'Start & End', icon: <Clock size={14} /> },
  { id: 'open', label: 'Start Only', icon: <HelpCircle size={14} /> },
];

function getEventType(event) {
  if (event.is_all_day) return 'allday';
  if (event.start_time && event.end_time) return 'timed';
  return 'open';
}

export default function EventDetailModal({ event, isOpen, onClose, onUpdate, onDelete, user }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('timed');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (event && isOpen) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setEventType(getEventType(event));
      const st = new Date(event.start_time);
      setStartTime(format(st, 'HH:mm'));
      if (event.end_time) {
        setEndTime(format(new Date(event.end_time), 'HH:mm'));
      } else {
        setEndTime('');
      }
      setEditing(false);
      setConfirmDelete(false);
    }
  }, [event, isOpen]);

  if (!isOpen || !event) return null;

  const type = getEventType(event);
  const startDate = new Date(event.start_time);

  const getTimeDisplay = () => {
    if (type === 'allday') return 'All Day';
    const s = format(startDate, 'HH:mm');
    if (type === 'timed') return `${s} – ${format(new Date(event.end_time), 'HH:mm')}`;
    return `${s} ~`;
  };

  const handleSave = () => {
    const dateStr = format(startDate, 'yyyy-MM-dd');
    const updateData = {
      title: title.trim(),
      description: description.trim() || null,
      is_all_day: eventType === 'allday',
      start_time: eventType === 'allday' ? `${dateStr}T00:00:00` : `${dateStr}T${startTime}:00`,
      end_time: eventType === 'timed' ? `${dateStr}T${endTime}:00` : null,
    };
    onUpdate(event.id, updateData);
    setEditing(false);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(event.id);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detail-modal" onClick={e => e.stopPropagation()} id="event-detail-modal">
        {/* Header */}
        <div className={`detail-modal__header detail-modal__header--${type}`}>
          <div className="detail-modal__type-badge">
            {type === 'allday' && <Star size={14} />}
            {type === 'timed' && <Clock size={14} />}
            {type === 'open' && <HelpCircle size={14} />}
            <span>{type === 'allday' ? 'All Day' : type === 'timed' ? 'Timed' : 'Open-ended'}</span>
          </div>
          <button className="detail-modal__close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="detail-modal__body">
          {!editing ? (
            <>
              <h2 className="detail-modal__title">{event.title}</h2>
              <div className="detail-modal__meta">
                <span className="detail-modal__date">{format(startDate, 'EEEE, MMM d, yyyy')}</span>
                <span className="detail-modal__time">{getTimeDisplay()}</span>
              </div>
              {event.description && (
                <p className="detail-modal__desc">{event.description}</p>
              )}
            </>
          ) : (
            <div className="detail-modal__edit-form">
              {/* Type selector */}
              <div className="detail-modal__type-selector">
                {EVENT_TYPES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={`detail-modal__type-btn ${eventType === t.id ? 'detail-modal__type-btn--active' : ''}`}
                    onClick={() => setEventType(t.id)}
                  >
                    {t.icon} <span>{t.label}</span>
                  </button>
                ))}
              </div>
              <input
                className="detail-modal__input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Event title"
              />
              <textarea
                className="detail-modal__input detail-modal__textarea"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
              />
              {eventType !== 'allday' && (
                <div className="detail-modal__time-row">
                  <div className="detail-modal__field">
                    <label className="detail-modal__label">Start</label>
                    <input type="time" className="detail-modal__input" value={startTime} onChange={e => setStartTime(e.target.value)} />
                  </div>
                  {eventType === 'timed' && (
                    <div className="detail-modal__field">
                      <label className="detail-modal__label">End</label>
                      <input type="time" className="detail-modal__input" value={endTime} onChange={e => setEndTime(e.target.value)} />
                    </div>
                  )}
                  {eventType === 'open' && (
                    <div className="detail-modal__field">
                      <label className="detail-modal__label">End</label>
                      <div className="detail-modal__tbd">TBD</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions — only for logged-in users */}
        {user && (
          <div className="detail-modal__actions">
            {!editing ? (
              <>
                <button className="detail-modal__btn detail-modal__btn--edit" onClick={() => setEditing(true)} id="btn-edit-event">
                  <Pencil size={14} /> Edit
                </button>
                <button
                  className={`detail-modal__btn detail-modal__btn--delete ${confirmDelete ? 'detail-modal__btn--confirm' : ''}`}
                  onClick={handleDelete}
                  id="btn-delete-event"
                >
                  <Trash2 size={14} /> {confirmDelete ? 'Confirm Delete?' : 'Delete'}
                </button>
              </>
            ) : (
              <>
                <button className="detail-modal__btn detail-modal__btn--save" onClick={handleSave} id="btn-save-edit">
                  <Save size={14} /> Save
                </button>
                <button className="detail-modal__btn detail-modal__btn--cancel" onClick={() => setEditing(false)}>
                  <XCircle size={14} /> Cancel
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
