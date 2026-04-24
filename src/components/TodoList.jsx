import React, { useState, useEffect } from 'react';
import { isToday, isOverdue, addDays, dateStr, TODAY, catStyle, CATEGORIES } from '../utils';

const ITEMS_PER_PAGE = 7;

export default function TodoList({ todos, setTodos, onOpenEdit }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => { setPage(1); }, [activeFilter]);

  const open = todos.filter(t => !t.done);
  const heute = todos.filter(isToday);
  const ueberr = todos.filter(t => isOverdue(t));
  const doneElems = todos.filter(t => t.done);

  const filters = [
    { id: 'all',     label: 'Alle',      count: open.length },
    { id: 'high',    label: 'Dringend',  count: todos.filter(t => t.prio === 'high' && !t.done).length },
    { id: 'today',   label: 'Heute',     count: heute.length },
    { id: 'overdue', label: 'Überfällig',count: ueberr.length },
  ];

  let list = [...open].sort((a, b) => {
    const pM = { high: 0, mid: 1, low: 2 };
    return pM[a.prio] - pM[b.prio];
  });

  if (activeFilter === 'high')    list = list.filter(t => t.prio === 'high');
  if (activeFilter === 'today')   list = list.filter(isToday);
  if (activeFilter === 'overdue') list = list.filter(isOverdue);

  const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE) || 1;
  const paginatedList = list.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleTodo  = (id) => setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTodo  = (id) => setTodos(todos.filter(t => t.id !== id));

  const pct = todos.length > 0 ? Math.round((doneElems.length / todos.length) * 100) : 0;
  const pL = { high: 'Hoch', mid: 'Mittel', low: 'Niedrig' };

  return (
    <>
      <div className="section-label" style={{ marginTop: '32px' }}>Ansicht</div>
      <div className="filters">
        {filters.map(f => (
          <button key={f.id} className={`filt ${activeFilter === f.id ? 'active' : ''}`} onClick={() => setActiveFilter(f.id)}>
            {f.label}
            {f.count > 0 && <span className="filt-count">{f.count}</span>}
          </button>
        ))}
      </div>

      <div className="todo-list">
        {!list.length && (
          <div className="empty">
            {activeFilter === 'all' ? 'Noch keine Aufgaben — fang einfach an.' : 'Keine Einträge in dieser Ansicht.'}
          </div>
        )}
        {paginatedList.map(t => {
          const od = isOverdue(t);
          const td = isToday(t);
          return (
            <div key={t.id} className="todo-item">
              <button className="check" onClick={() => toggleTodo(t.id)}></button>
              <div className="todo-body">
                <div className="todo-text">{t.text}</div>
                <div className="todo-tags">
                  <span className={`tag tag-${t.prio}`}>{pL[t.prio]}</span>
                  {(() => { const s = catStyle(t.cat); return <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '4px', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{t.cat}</span>; })()}
                  {t.date && (
                    <span className={`tag-date ${od ? 'od' : td ? 'td' : ''}`}>
                      {od ? 'Überfällig ' : td ? 'Heute ' : ''}{t.date}
                    </span>
                  )}
                </div>
                {t.note && <div className="todo-note">{t.note}</div>}
              </div>
              <div className="item-actions">
                <button className="edit-btn" onClick={() => onOpenEdit(t.id)} title="Bearbeiten">✎</button>
                <button className="del-btn" onClick={() => deleteTodo(t.id)}>×</button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px', marginBottom: '8px' }}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)}
            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: page === 1 ? 'var(--text-3)' : 'var(--text)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
            ← Zurück
          </button>
          <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 500 }}>Seite {page} von {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}
            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: page === totalPages ? 'var(--text-3)' : 'var(--text)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>
            Weiter →
          </button>
        </div>
      )}

      {todos.length > 0 && (
        <div className="prog-wrap" style={{ marginTop: '20px' }}>
          <div className="prog-head"><span>Fortschritt</span><span>{pct} %</span></div>
          <div className="prog-track"><div className="prog-fill" style={{ width: `${pct}%` }}></div></div>
        </div>
      )}

      <div style={{ marginTop: '32px', marginBottom: '16px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
        <button onClick={() => setShowDone(!showDone)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', padding: '0', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Erledigt</span>
            <span style={{ fontSize: '11px', fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-3)' }}>
              {doneElems.length}
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
            {showDone ? '▲ Einklappen' : '▼ Ausklappen'}
          </span>
        </button>

        {showDone && (
          <div className="todo-list" style={{ marginTop: '16px' }}>
            {doneElems.length === 0 ? (
              <div className="empty">Noch keine erledigten Aufgaben.</div>
            ) : (
              doneElems.map(t => (
                <div key={t.id} className="todo-item is-done" style={{ opacity: 0.7 }}>
                  <button className="check checked" onClick={() => toggleTodo(t.id)}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 3.5L3.8 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <div className="todo-body">
                    <div className="todo-text">{t.text}</div>
                    <div className="todo-tags">
                      <span className={`tag tag-${t.prio}`}>{pL[t.prio]}</span>
                      {(() => { const s = catStyle(t.cat); return <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '4px', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{t.cat}</span>; })()}
                    </div>
                  </div>
                  <div className="item-actions">
                    <button className="del-btn" onClick={() => deleteTodo(t.id)}>×</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
