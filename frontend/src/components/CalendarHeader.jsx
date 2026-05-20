import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, LayoutGrid, LogIn, LogOut, User, ChevronDown, Sun, Moon } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import './CalendarHeader.css';

function getInitialTheme() {
  const saved = localStorage.getItem('calendar_theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export default function CalendarHeader({ currentDate, onPrev, onNext, onToday, user, onLogin, onLogout, viewMode, onViewModeChange }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const dropdownRef = useRef(null);

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

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('calendar_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [dropdownOpen]);

  return (
    <header className="cal-header" id="calendar-header">
      <div className="cal-header__left">
        <div className="cal-header__logo">
          <Calendar size={22} className="cal-header__logo-icon" />
          <span className="cal-header__logo-text">tomo.row</span>
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
          <div className="cal-header__user-menu" ref={dropdownRef}>
            <button
              className="cal-header__avatar-btn"
              onClick={() => setDropdownOpen(prev => !prev)}
              id="btn-avatar"
              aria-label="User menu"
            >
              {user.picture_url ? (
                <img src={user.picture_url} alt={user.display_name} className="cal-header__avatar" />
              ) : (
                <div className="cal-header__avatar cal-header__avatar--placeholder"><User size={16} /></div>
              )}
              <ChevronDown size={14} className={`cal-header__avatar-chevron ${dropdownOpen ? 'cal-header__avatar-chevron--open' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="cal-header__dropdown" id="user-dropdown">
                <div className="cal-header__dropdown-header">
                  {user.picture_url ? (
                    <img src={user.picture_url} alt={user.display_name} className="cal-header__dropdown-avatar" />
                  ) : (
                    <div className="cal-header__dropdown-avatar cal-header__dropdown-avatar--placeholder"><User size={24} /></div>
                  )}
                  <div className="cal-header__dropdown-info">
                    <span className="cal-header__dropdown-name">{user.display_name}</span>
                    {user.line_user_id && (
                      <span className="cal-header__dropdown-id">LINE ID: {user.line_user_id}</span>
                    )}
                  </div>
                </div>
                <div className="cal-header__dropdown-divider" />
                <button
                  className="cal-header__dropdown-item"
                  onClick={toggleTheme}
                  id="btn-toggle-theme"
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  <span className="cal-header__dropdown-shortcut">
                    {theme === 'dark' ? '☀️' : '🌙'}
                  </span>
                </button>
                <div className="cal-header__dropdown-divider" />
                <button
                  className="cal-header__dropdown-item cal-header__dropdown-item--danger"
                  onClick={() => { setDropdownOpen(false); onLogout(); }}
                  id="btn-logout"
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              className="cal-header__theme-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              id="btn-toggle-theme-guest"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="cal-header__login-btn" onClick={onLogin} id="btn-login">
              <LogIn size={16} />
              <span>LINE Login</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
