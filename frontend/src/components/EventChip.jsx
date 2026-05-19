import { format } from 'date-fns';
import { Star, Clock, HelpCircle } from 'lucide-react';
import './EventChip.css';

export default function EventChip({ event, onClick }) {
  const getEventType = () => {
    if (event.is_all_day) return 'allday';
    if (event.start_time && event.end_time) return 'timed';
    return 'open';
  };

  const type = getEventType();

  const icons = {
    allday: <Star size={10} />,
    timed: <Clock size={10} />,
    open: <HelpCircle size={10} />,
  };

  const getTimeLabel = () => {
    if (type === 'allday') return 'All Day';
    const start = format(new Date(event.start_time), 'HH:mm');
    if (type === 'timed') {
      const end = format(new Date(event.end_time), 'HH:mm');
      return `${start}–${end}`;
    }
    return `${start}~`;
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) onClick(event);
  };

  return (
    <div
      className={`event-chip event-chip--${type}`}
      title={`${event.title} · ${getTimeLabel()}`}
      onClick={handleClick}
    >
      <span className="event-chip__icon">{icons[type]}</span>
      <span className="event-chip__title">{event.title}</span>
    </div>
  );
}
