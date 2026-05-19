import { Star, Clock, HelpCircle } from 'lucide-react';
import './EventLegend.css';

export default function EventLegend() {
  return (
    <div className="legend" id="event-legend">
      <div className="legend__item">
        <span className="legend__dot legend__dot--allday"><Star size={10} /></span>
        <span className="legend__label">All Day / Special</span>
      </div>
      <div className="legend__item">
        <span className="legend__dot legend__dot--timed"><Clock size={10} /></span>
        <span className="legend__label">Start &amp; End Time</span>
      </div>
      <div className="legend__item">
        <span className="legend__dot legend__dot--open"><HelpCircle size={10} /></span>
        <span className="legend__label">Start Only (TBD)</span>
      </div>
    </div>
  );
}
