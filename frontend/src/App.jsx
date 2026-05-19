import { useState, useEffect, useCallback } from 'react';
import { addMonths, subMonths } from 'date-fns';
import CalendarHeader from './components/CalendarHeader';
import CalendarGrid from './components/CalendarGrid';
import EventModal from './components/EventModal';
import EventLegend from './components/EventLegend';
import LoginPrompt from './components/LoginPrompt';
import './App.css';

const API_BASE = 'http://127.0.0.1:8000';

/* Sample events for demo when API is unavailable */
const DEMO_EVENTS = [
  { id: 1, title: '🎌 National Holiday', start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(), end_time: null, is_all_day: true },
  { id: 2, title: 'Team Standup', start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 5, 10, 0).toISOString(), end_time: new Date(new Date().getFullYear(), new Date().getMonth(), 5, 10, 30).toISOString(), is_all_day: false },
  { id: 3, title: 'Dentist Appointment', start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 8, 14, 0).toISOString(), end_time: new Date(new Date().getFullYear(), new Date().getMonth(), 8, 15, 0).toISOString(), is_all_day: false },
  { id: 4, title: 'Hackathon', start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 12, 9, 0).toISOString(), end_time: null, is_all_day: false },
  { id: 5, title: '🎂 Birthday Party', start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString(), end_time: null, is_all_day: true },
  { id: 6, title: 'Project Review', start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 15, 13, 0).toISOString(), end_time: new Date(new Date().getFullYear(), new Date().getMonth(), 15, 14, 30).toISOString(), is_all_day: false },
  { id: 7, title: 'Gym Session', start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 18, 18, 0).toISOString(), end_time: null, is_all_day: false },
  { id: 8, title: 'Sprint Planning', start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 20, 10, 0).toISOString(), end_time: new Date(new Date().getFullYear(), new Date().getMonth(), 20, 11, 0).toISOString(), is_all_day: false },
  { id: 9, title: '📢 Manager Announcement', start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 22).toISOString(), end_time: null, is_all_day: true },
  { id: 10, title: 'Coffee Chat', start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 25, 15, 0).toISOString(), end_time: null, is_all_day: false },
];

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState(DEMO_EVENTS);
  const [user, setUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  /* Restore user from sessionStorage on mount */
  useEffect(() => {
    const saved = sessionStorage.getItem('line_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  /* Parse user info from URL params after LINE OAuth redirect */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('user_id');
    const displayName = params.get('display_name');
    if (userId && displayName) {
      const userData = {
        id: Number(userId),
        line_user_id: params.get('line_user_id'),
        display_name: displayName,
        picture_url: params.get('picture_url') || null,
      };
      setUser(userData);
      sessionStorage.setItem('line_user', JSON.stringify(userData));
      // Clean URL
      window.history.replaceState({}, '', '/');
    }
  }, []);

  /* Try to fetch events from the API */
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/test-events`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) setEvents(data);
      }
    } catch {
      /* API not running, use demo events */
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handlePrev = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNext = () => setCurrentDate(prev => addMonths(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleDayClick = (day) => {
    setSelectedDate(day);
    if (!user) {
      setLoginPromptOpen(true);
    } else {
      setModalOpen(true);
    }
  };

  const handleLogin = () => {
    window.location.href = `${API_BASE}/login/line`;
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('line_user');
  };

  const handleSaveEvent = async (eventData) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...eventData, user_id: user.id }),
      });
      if (res.ok) {
        await fetchEvents();
      }
    } catch {
      /* Fallback: add locally */
      const newEvent = { ...eventData, id: Date.now() };
      setEvents(prev => [...prev, newEvent]);
    }
    setModalOpen(false);
  };

  return (
    <div className="app" id="app-root">
      <CalendarHeader
        currentDate={currentDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      <main className="app__main">
        <CalendarGrid
          currentDate={currentDate}
          events={events}
          onDayClick={handleDayClick}
          user={user}
        />
      </main>
      <EventLegend />

      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEvent}
        selectedDate={selectedDate}
      />

      {loginPromptOpen && (
        <LoginPrompt
          onLogin={handleLogin}
          onClose={() => setLoginPromptOpen(false)}
        />
      )}
    </div>
  );
}
