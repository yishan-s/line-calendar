import { useState, useRef, useEffect } from 'react';
import { Inbox as InboxIcon, Plus, X, GripVertical, Calendar, Trash2, ChevronRight } from 'lucide-react';
import './InboxPanel.css';

export default function InboxPanel({ user, onSchedule }) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  // Load inbox items from localStorage
  useEffect(() => {
    const key = user ? `inbox_${user.id}` : 'inbox_guest';
    const saved = localStorage.getItem(key);
    if (saved) {
      try { setItems(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, [user]);

  // Save inbox items to localStorage
  useEffect(() => {
    const key = user ? `inbox_${user.id}` : 'inbox_guest';
    localStorage.setItem(key, JSON.stringify(items));
  }, [items, user]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const newItem = {
      id: `inbox-${Date.now()}`,
      text: newItemText.trim(),
      createdAt: new Date().toISOString(),
    };
    setItems(prev => [newItem, ...prev]);
    setNewItemText('');
  };

  const handleDeleteItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleScheduleItem = (item) => {
    if (onSchedule) {
      onSchedule(item);
    }
    handleDeleteItem(item.id);
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        className={`inbox-trigger ${isOpen ? 'inbox-trigger--active' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Open Inbox"
        id="btn-inbox-trigger"
      >
        <InboxIcon size={20} />
        {items.length > 0 && (
          <span className="inbox-trigger__badge">{items.length}</span>
        )}
      </button>

      {/* Panel overlay */}
      {isOpen && (
        <div className="inbox-overlay" onClick={() => setIsOpen(false)}>
          <div
            className="inbox-panel"
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
            id="inbox-panel"
          >
            {/* Header */}
            <div className="inbox-panel__header">
              <div className="inbox-panel__header-left">
                <InboxIcon size={18} className="inbox-panel__header-icon" />
                <h2 className="inbox-panel__title">Inbox</h2>
                {items.length > 0 && (
                  <span className="inbox-panel__count">{items.length}</span>
                )}
              </div>
              <button
                className="inbox-panel__close"
                onClick={() => setIsOpen(false)}
                id="btn-inbox-close"
              >
                <X size={18} />
              </button>
            </div>

            <p className="inbox-panel__subtitle">
              Capture ideas & plans — schedule them when you're ready.
            </p>

            {/* Quick add form */}
            <form className="inbox-panel__form" onSubmit={handleAddItem}>
              <input
                ref={inputRef}
                className="inbox-panel__input"
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Add something to plan..."
                id="inbox-input"
              />
              <button
                type="submit"
                className="inbox-panel__add-btn"
                disabled={!newItemText.trim()}
                id="btn-inbox-add"
              >
                <Plus size={18} />
              </button>
            </form>

            {/* Items list */}
            <div className="inbox-panel__list">
              {items.length === 0 ? (
                <div className="inbox-panel__empty">
                  <InboxIcon size={36} className="inbox-panel__empty-icon" />
                  <p className="inbox-panel__empty-text">Your inbox is empty</p>
                  <p className="inbox-panel__empty-hint">Jot down event ideas here and schedule them later</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <div
                    key={item.id}
                    className="inbox-item"
                    style={{ animationDelay: `${index * 40}ms` }}
                    id={`inbox-item-${item.id}`}
                  >
                    <div className="inbox-item__grip">
                      <GripVertical size={14} />
                    </div>
                    <div className="inbox-item__content">
                      <span className="inbox-item__text">{item.text}</span>
                      <span className="inbox-item__date">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="inbox-item__actions">
                      <button
                        className="inbox-item__action inbox-item__action--schedule"
                        onClick={() => handleScheduleItem(item)}
                        title="Schedule this event"
                        aria-label="Schedule"
                      >
                        <Calendar size={14} />
                        <ChevronRight size={12} />
                      </button>
                      <button
                        className="inbox-item__action inbox-item__action--delete"
                        onClick={() => handleDeleteItem(item.id)}
                        title="Remove"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
