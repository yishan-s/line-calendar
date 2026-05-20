import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ListTodo, Plus, X, CalendarPlus, Lightbulb, CheckCircle2 } from 'lucide-react';
import IdeasTab from './inbox/IdeasTab';
import ToDoTab from './inbox/ToDoTab';
import './InboxPanel.css';

const TAB_IDEAS = 'ideas';
const TAB_TODO = 'todo';

function buildCalendarLinkedTodos(todoItems) {
  return todoItems
    .filter((item) => !item.completed && (item.timeType === 'scheduled' || item.timeType === 'deadline'))
    .map((item) => ({
      id: item.id,
      title: item.text,
      type: item.timeType,
      datetime: item.timeType === 'scheduled' ? item.scheduledAt : item.deadlineAt,
      source: 'inbox-todo',
    }));
}

export default function InboxPanel({ user, onSchedule, onCreateEvent, onTodoCalendarDataChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFabExpanded, setIsFabExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(TAB_IDEAS);

  const [ideaBlocks, setIdeaBlocks] = useState([]);
  const [ideaDraft, setIdeaDraft] = useState('');

  const [todoItems, setTodoItems] = useState([]);
  const [todoDraft, setTodoDraft] = useState('');
  const [todoDraftTimeType, setTodoDraftTimeType] = useState('none');
  const [todoDraftDateTime, setTodoDraftDateTime] = useState('');

  const ideaInputRef = useRef(null);
  const todoInputRef = useRef(null);
  const fabContainerRef = useRef(null);

  useEffect(() => {
    const oldKey = user ? `inbox_${user.id}` : 'inbox_guest';
    const unplannedKey = user ? `unplanned_${user.id}` : 'unplanned_guest';
    const ideasKey = user ? `ideas_${user.id}` : 'ideas_guest';
    const oldData = localStorage.getItem(oldKey);
    const unplannedData = localStorage.getItem(unplannedKey);

    if (oldData && !unplannedData) {
      localStorage.setItem(unplannedKey, oldData);
      localStorage.removeItem(oldKey);
    }
    if (unplannedData && !localStorage.getItem(ideasKey)) {
      localStorage.setItem(ideasKey, unplannedData);
      localStorage.removeItem(unplannedKey);
    }
  }, [user]);

  useEffect(() => {
    const ideasKey = user ? `ideas_${user.id}` : 'ideas_guest';
    const todosKey = user ? `todos_${user.id}` : 'todos_guest';
    const savedIdeas = localStorage.getItem(ideasKey);
    const savedTodos = localStorage.getItem(todosKey);
    if (savedIdeas) {
      try {
        setIdeaBlocks(JSON.parse(savedIdeas));
      } catch {
        setIdeaBlocks([]);
      }
    }
    if (savedTodos) {
      try {
        setTodoItems(JSON.parse(savedTodos));
      } catch {
        setTodoItems([]);
      }
    }
  }, [user]);

  useEffect(() => {
    const key = user ? `ideas_${user.id}` : 'ideas_guest';
    localStorage.setItem(key, JSON.stringify(ideaBlocks));
  }, [ideaBlocks, user]);

  useEffect(() => {
    const key = user ? `todos_${user.id}` : 'todos_guest';
    localStorage.setItem(key, JSON.stringify(todoItems));
  }, [todoItems, user]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (activeTab === TAB_IDEAS) {
        ideaInputRef.current?.focus();
      } else {
        todoInputRef.current?.focus();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (isOpen) setIsFabExpanded(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isFabExpanded) return;
    const handleClickOutside = (e) => {
      if (fabContainerRef.current && !fabContainerRef.current.contains(e.target)) {
        setIsFabExpanded(false);
      }
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFabExpanded]);

  const linkedTodosForCalendar = useMemo(() => buildCalendarLinkedTodos(todoItems), [todoItems]);

  useEffect(() => {
    if (onTodoCalendarDataChange) onTodoCalendarDataChange(linkedTodosForCalendar);
  }, [linkedTodosForCalendar, onTodoCalendarDataChange]);

  const handleAddIdea = (e) => {
    e.preventDefault();
    if (!ideaDraft.trim()) return;
    setIdeaBlocks((prev) => [
      {
        id: `idea-${Date.now()}`,
        text: ideaDraft.trim(),
        createdAt: new Date().toISOString(),
        meta: { tags: [], mood: null, source: 'manual' },
      },
      ...prev,
    ]);
    setIdeaDraft('');
  };

  const handleDeleteIdea = (id) => setIdeaBlocks((prev) => prev.filter((item) => item.id !== id));

  const handleScheduleIdea = (idea) => {
    if (onSchedule) onSchedule(idea);
    handleDeleteIdea(idea.id);
  };

  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!todoDraft.trim()) return;
    const hasTime = todoDraftTimeType !== 'none';
    if (hasTime && !todoDraftDateTime) return;

    const iso = hasTime ? new Date(todoDraftDateTime).toISOString() : null;
    setTodoItems((prev) => [
      {
        id: `todo-${Date.now()}`,
        text: todoDraft.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        timeType: todoDraftTimeType,
        scheduledAt: todoDraftTimeType === 'scheduled' ? iso : null,
        deadlineAt: todoDraftTimeType === 'deadline' ? iso : null,
        calendarSync: { exposed: true, lastSyncedAt: null },
      },
      ...prev,
    ]);

    setTodoDraft('');
    setTodoDraftTimeType('none');
    setTodoDraftDateTime('');
  };

  const handleToggleTodo = (id) => {
    setTodoItems((prev) => prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)));
  };

  const handleDeleteTodo = (id) => setTodoItems((prev) => prev.filter((item) => item.id !== id));

  const handleFabToggle = useCallback(() => setIsFabExpanded((prev) => !prev), []);
  const handleOpenPanel = useCallback(() => {
    setIsFabExpanded(false);
    setIsOpen(true);
  }, []);
  const handleCreateEvent = useCallback(() => {
    setIsFabExpanded(false);
    if (onCreateEvent) onCreateEvent();
  }, [onCreateEvent]);

  const uncompletedCount = todoItems.filter((item) => !item.completed).length;
  const badgeCount = ideaBlocks.length + uncompletedCount;

  return (
    <>
      {!isOpen && (
        <div className="fab-container" ref={fabContainerRef}>
          {isFabExpanded && <div className="fab-backdrop" onClick={() => setIsFabExpanded(false)} />}

          <button
            className={`fab-child fab-child--create ${isFabExpanded ? 'fab-child--visible' : ''}`}
            onClick={handleCreateEvent}
            aria-label="Create Event"
            style={{ transitionDelay: isFabExpanded ? '80ms' : '0ms' }}
          >
            <CalendarPlus size={20} />
            <span className="fab-label">Create Event</span>
          </button>

          <button
            className={`fab-child fab-child--tasks ${isFabExpanded ? 'fab-child--visible' : ''}`}
            onClick={handleOpenPanel}
            aria-label="Open Inbox"
            style={{ transitionDelay: isFabExpanded ? '40ms' : '0ms' }}
          >
            <ListTodo size={20} />
            {badgeCount > 0 && <span className="fab-child__badge">{badgeCount}</span>}
            <span className="fab-label">Inbox</span>
          </button>

          <button
            className={`fab-main ${isFabExpanded ? 'fab-main--expanded' : ''}`}
            onClick={handleFabToggle}
            aria-label={isFabExpanded ? 'Close menu' : 'Open menu'}
            id="btn-fab-main"
          >
            <Plus size={22} className="fab-main__icon" />
          </button>
        </div>
      )}

      {isOpen && (
        <div className="tasks-overlay" onClick={() => setIsOpen(false)}>
          <div className="tasks-panel" onClick={(e) => e.stopPropagation()} id="tasks-panel">
            <div className="tasks-panel__header">
              <div className="tasks-panel__tabs" role="tablist" aria-label="Inbox tabs">
                <button
                  className={`tasks-panel__tab ${activeTab === TAB_IDEAS ? 'tasks-panel__tab--active' : ''}`}
                  onClick={() => setActiveTab(TAB_IDEAS)}
                  role="tab"
                  aria-selected={activeTab === TAB_IDEAS}
                  id="tab-ideas"
                >
                  <Lightbulb size={14} />
                  Ideas
                </button>
                <button
                  className={`tasks-panel__tab ${activeTab === TAB_TODO ? 'tasks-panel__tab--active' : ''}`}
                  onClick={() => setActiveTab(TAB_TODO)}
                  role="tab"
                  aria-selected={activeTab === TAB_TODO}
                  id="tab-todo"
                >
                  <CheckCircle2 size={14} />
                  ToDo
                </button>
              </div>
              <button className="tasks-panel__close" onClick={() => setIsOpen(false)} id="btn-tasks-close">
                <X size={18} />
              </button>
            </div>

            <div className="tasks-panel__content">
              <div className={`tasks-tab-panel ${activeTab === TAB_IDEAS ? 'tasks-tab-panel--active' : ''}`}>
                <IdeasTab
                  inputRef={ideaInputRef}
                  draftText={ideaDraft}
                  onDraftTextChange={setIdeaDraft}
                  blocks={ideaBlocks}
                  onAddIdea={handleAddIdea}
                  onDeleteIdea={handleDeleteIdea}
                  onScheduleIdea={handleScheduleIdea}
                />
              </div>
              <div className={`tasks-tab-panel ${activeTab === TAB_TODO ? 'tasks-tab-panel--active' : ''}`}>
                <ToDoTab
                  inputRef={todoInputRef}
                  draftText={todoDraft}
                  onDraftTextChange={setTodoDraft}
                  draftTimeType={todoDraftTimeType}
                  onDraftTimeTypeChange={setTodoDraftTimeType}
                  draftDateTime={todoDraftDateTime}
                  onDraftDateTimeChange={setTodoDraftDateTime}
                  items={todoItems}
                  onAddTodo={handleAddTodo}
                  onToggleTodo={handleToggleTodo}
                  onDeleteTodo={handleDeleteTodo}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
