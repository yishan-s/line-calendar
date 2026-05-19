import { useState, useEffect, useCallback } from 'react';
import { addMonths, subMonths } from 'date-fns';
import CalendarHeader from './components/CalendarHeader';
import CalendarGrid from './components/CalendarGrid';
import EventDetailModal from './components/EventDetailModal';
import EventModal from './components/EventModal';
import EventLegend from './components/EventLegend';
import LoginPrompt from './components/LoginPrompt';
import WeeklyView from './components/WeeklyView';
import './App.css';

const API_BASE = 'http://127.0.0.1:8000';

/* Sample events for demo when API is unavailable */
const currentYear = new Date().getFullYear();

const DEMO_EVENTS = [
  { id: 1, title: '🎌 New Year\'s Day', start_time: new Date(currentYear, 0, 1).toISOString(), end_time: null, is_all_day: true },
  { id: 2, title: '🧧 Lunar New Year', start_time: new Date(currentYear, 1, 17).toISOString(), end_time: null, is_all_day: true },
  { id: 3, title: '🕊️ Peace Memorial Day', start_time: new Date(currentYear, 1, 28).toISOString(), end_time: null, is_all_day: true },
  { id: 4, title: '🎈 Children\'s Day', start_time: new Date(currentYear, 3, 4).toISOString(), end_time: null, is_all_day: true },
  { id: 5, title: '🪦 Tomb Sweeping Day', start_time: new Date(currentYear, 3, 5).toISOString(), end_time: null, is_all_day: true },
  { id: 6, title: '👷 Labor Day', start_time: new Date(currentYear, 4, 1).toISOString(), end_time: null, is_all_day: true },
  { id: 7, title: '🐉 Dragon Boat Festival', start_time: new Date(currentYear, 5, 19).toISOString(), end_time: null, is_all_day: true },
  { id: 8, title: '🥮 Mid-Autumn Festival', start_time: new Date(currentYear, 8, 25).toISOString(), end_time: null, is_all_day: true },
  { id: 9, title: '🇹🇼 National Day', start_time: new Date(currentYear, 9, 10).toISOString(), end_time: null, is_all_day: true },
  { id: 10, title: '🎄 Christmas Day', start_time: new Date(currentYear, 11, 25).toISOString(), end_time: null, is_all_day: true },
].map(event => ({ ...event, isDemo: true }));

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState(DEMO_EVENTS);
  const [user, setUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month');

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
    if (!user) {
      setEvents(DEMO_EVENTS);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents([...DEMO_EVENTS, ...data]);
      }
    } catch {
      /* API not running, use demo events */
      setEvents(DEMO_EVENTS);
    }
  }, [user]);

  // Fetch events on mount and when currentDate changes
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

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setDetailModalOpen(true);
  }

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

  const handleDeleteEvent = async (eventId) => {
    // 1. 如果是測試資料 (字串類型的 ID) 或是沒登入，就直接在前端把資料濾掉
    if (!user || typeof eventId === 'string') {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setDetailModalOpen(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/events/${eventId}`, {
        method: 'DELETE', // HTTP 刪除方法
      });
      
      if (res.ok) {
        // 刪除成功後，重新跟後端要一次最新的活動清單
        await fetchEvents();
      }
    } catch (error) {
      console.error("刪除失敗：", error);
    }
    
    // 3. 無論如何，刪除完就把詳情視窗關閉
    setDetailModalOpen(false);
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
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      <main className="app__main">
        {viewMode === 'month' ? (
          <CalendarGrid
            currentDate={currentDate}
            events={events}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
            user={user}
            viewMode={viewMode}
          />
        ) : (
          <WeeklyView
            currentDate={currentDate}
            events={events}
            onTimeClick={(time) => {
              setSelectedDate(time);
              user ? setModalOpen(true) : setLoginPromptOpen(true);
            }}
            onEventClick={handleEventClick}
            user={user}
          />
        )
        }
      </main>
      <EventLegend />

      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEvent}
        selectedDate={selectedDate}
      />

      <EventDetailModal
        isOpen={detailModalOpen}
        event={selectedEvent}
        onClose={() => setDetailModalOpen(false)}
        // 這裡我們暫時先丟空函數，讓你測試「顯示詳情」功能可以動
        onDelete={handleDeleteEvent}
        user={user}
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