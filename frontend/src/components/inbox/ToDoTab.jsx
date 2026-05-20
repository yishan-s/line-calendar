import { Check, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import './ToDoTab.css';

function formatTodoTime(item) {
  if (item.timeType === 'scheduled' && item.scheduledAt) {
    return `Time: ${new Date(item.scheduledAt).toLocaleString()}`;
  }
  if (item.timeType === 'deadline' && item.deadlineAt) {
    return `DDL: ${new Date(item.deadlineAt).toLocaleString()}`;
  }
  return 'No time';
}

export default function ToDoTab({
  inputRef,
  draftText,
  onDraftTextChange,
  draftTimeType,
  onDraftTimeTypeChange,
  draftDateTime,
  onDraftDateTimeChange,
  items,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
}) {
  const sorted = [...items].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  const doneCount = items.filter((item) => item.completed).length;
  const progress = items.length > 0 ? (doneCount / items.length) * 100 : 0;

  return (
    <div className="inbox-tab">
      <div className="inbox-tab__intro">
        <p className="inbox-tab__title">Actionable task list</p>
        <p className="inbox-tab__hint">Assign specific time, deadline, or keep it flexible.</p>
      </div>

      {items.length > 0 && (
        <div className="todo-progress">
          <div className="todo-progress__meta">
            <span>{items.length - doneCount} open</span>
            <span>{doneCount}/{items.length} done</span>
          </div>
          <div className="todo-progress__bar">
            <div className="todo-progress__fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <form className="todo-form" onSubmit={onAddTodo}>
        <input
          ref={inputRef}
          className="inbox-tab__input"
          type="text"
          value={draftText}
          onChange={(e) => onDraftTextChange(e.target.value)}
          placeholder="Add a to-do..."
          id="todo-input"
        />

        <div className="todo-form__row">
          <select
            className="todo-form__select"
            value={draftTimeType}
            onChange={(e) => onDraftTimeTypeChange(e.target.value)}
            id="todo-time-type"
          >
            <option value="none">No time</option>
            <option value="scheduled">Specific time</option>
            <option value="deadline">DDL</option>
          </select>

          {draftTimeType !== 'none' && (
            <input
              className="todo-form__datetime"
              type="datetime-local"
              value={draftDateTime}
              onChange={(e) => onDraftDateTimeChange(e.target.value)}
              id="todo-datetime"
            />
          )}

          <button
            type="submit"
            className="inbox-tab__add-btn"
            disabled={!draftText.trim() || (draftTimeType !== 'none' && !draftDateTime)}
          >
            <Plus size={16} />
          </button>
        </div>
      </form>

      <div className="inbox-tab__list">
        {sorted.length === 0 ? (
          <div className="inbox-tab__empty">
            <CheckCircle2 size={24} className="inbox-tab__empty-icon" />
            <span>No to-dos yet</span>
          </div>
        ) : (
          sorted.map((item) => (
            <article key={item.id} className={`todo-row ${item.completed ? 'todo-row--completed' : ''}`}>
              <button
                className={`todo-row__checkbox ${item.completed ? 'todo-row__checkbox--checked' : ''}`}
                onClick={() => onToggleTodo(item.id)}
                aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {item.completed && <Check size={12} strokeWidth={3} />}
              </button>
              <div className="todo-row__content">
                <p className="todo-row__text">{item.text}</p>
                <span className="todo-row__time">{formatTodoTime(item)}</span>
              </div>
              <button
                className="todo-row__delete"
                onClick={() => onDeleteTodo(item.id)}
                title="Delete"
                aria-label="Delete todo"
              >
                <Trash2 size={14} />
              </button>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
