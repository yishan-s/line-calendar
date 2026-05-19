import { ChevronLeft, ChevronRight, Calendar, LayoutGrid, LogIn, LogOut, User } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import './CalendarHeader.css';

export default function CalendarHeader({ currentDate, onPrev, onNext, onToday, user, onLogin, onLogout, viewMode, onViewModeChange }) {
  const getTitle = () => {
    if (viewMode === 'week') {
      const ws = startOfWeek(currentDate);
      const we = endOfWeek(currentDate);
      if (ws.getMonth() === we.getMonth()) {
        return `${format(ws, 'MMM d')} – ${format(we, 'd, yyyy')}`;
      }
      return `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  };

  return (
    <header className="cal-header" id="calendar-header">
      <div className="cal-header__left">
        <div className="cal-header__logo">
          <Calendar size={22} className="cal-header__logo-icon" />
          <span className="cal-header__logo-text">LINE Calendar</span>
        </div>
      </div>

      <div className="cal-header__center">
        <button className="cal-header__nav-btn" onClick={onPrev} aria-label="Previous" id="btn-prev">
          <ChevronLeft size={20} />
        </button>
        <h1 className="cal-header__title" id="calendar-title">
          {getTitle()}
        </h1>
        <button className="cal-header__nav-btn" onClick={onNext} aria-label="Next" id="btn-next">
          <ChevronRight size={20} />
        </button>
        <button className="cal-header__today-btn" onClick={onToday} id="btn-today">
          Today
        </button>

        {/* View toggle */}
        <div className="cal-header__view-toggle" id="view-toggle">
          <button
            className={`cal-header__view-btn ${viewMode === 'month' ? 'cal-header__view-btn--active' : ''}`}
            onClick={() => onViewModeChange('month')}
            id="btn-view-month"
          >
            <LayoutGrid size={14} />
            <span>Month</span>
          </button>
          <button
            className={`cal-header__view-btn ${viewMode === 'week' ? 'cal-header__view-btn--active' : ''}`}
            onClick={() => onViewModeChange('week')}
            id="btn-view-week"
          >
            <Calendar size={14} />
            <span>Week</span>
          </button>
        </div>
      </div>

      <div className="cal-header__right">
        {user ? (
          <div className="cal-header__user">
            {user.picture_url ? (
              <img src={user.picture_url} alt={user.display_name} className="cal-header__avatar" />
            ) : (
              <div className="cal-header__avatar cal-header__avatar--placeholder"><User size={16} /></div>
            )}
            <span className="cal-header__username">{user.display_name}</span>
            <button className="cal-header__logout-btn" onClick={onLogout} id="btn-logout">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button className="cal-header__login-btn" onClick={onLogin} id="btn-login">
            <LogIn size={16} />
            <span>LINE Login</span>
          </button>
        )}
      </div>
    </header>
  );
}
