import { Calendar, ChevronRight, Lightbulb, Plus, Trash2 } from 'lucide-react';
import './IdeasTab.css';

export default function IdeasTab({
  inputRef,
  draftText,
  onDraftTextChange,
  blocks,
  onAddIdea,
  onDeleteIdea,
  onScheduleIdea,
}) {
  return (
    <div className="inbox-tab">
      <div className="inbox-tab__intro">
        <p className="inbox-tab__title">Brainstorming & planning inbox</p>
        <p className="inbox-tab__hint">Capture unscheduled ideas and publish them as blocks.</p>
      </div>

      <form className="inbox-tab__form" onSubmit={onAddIdea}>
        <input
          ref={inputRef}
          className="inbox-tab__input"
          type="text"
          value={draftText}
          onChange={(e) => onDraftTextChange(e.target.value)}
          placeholder="Write an idea..."
          id="ideas-input"
        />
        <button type="submit" className="inbox-tab__add-btn" disabled={!draftText.trim()}>
          <Plus size={16} />
        </button>
      </form>

      <div className="inbox-tab__list">
        {blocks.length === 0 ? (
          <div className="inbox-tab__empty">
            <Lightbulb size={24} className="inbox-tab__empty-icon" />
            <span>No ideas yet</span>
          </div>
        ) : (
          blocks.map((item) => (
            <article key={item.id} className="idea-block">
              <div className="idea-block__body">
                <p className="idea-block__text">{item.text}</p>
                <span className="idea-block__date">
                  {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="idea-block__actions">
                <button
                  className="idea-block__action idea-block__action--schedule"
                  onClick={() => onScheduleIdea(item)}
                  aria-label="Schedule idea"
                  title="Schedule"
                >
                  <Calendar size={14} />
                  <ChevronRight size={12} />
                </button>
                <button
                  className="idea-block__action idea-block__action--delete"
                  onClick={() => onDeleteIdea(item.id)}
                  aria-label="Delete idea"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
