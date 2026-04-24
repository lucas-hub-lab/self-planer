import React, { useState, useEffect } from 'react';

const ITEMS_PER_PAGE = 7;

export default function GeneralNotes({ notes, setNotes, onOpenNoteModal }) {
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState([]);
  const [page, setPage] = useState(1);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = search
    ? notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || (n.body || '').toLowerCase().includes(search.toLowerCase()))
    : notes;

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedList = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Beitrag löschen?')) return;
    setNotes(notes.filter(n => n.id !== id));
  };

  const toggleExpand = (id) => {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const highlight = (text) => {
    if (!search || !text) return text;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? <mark key={i} style={{ background: '#FEF08A', borderRadius: '2px', padding: '0 1px' }}>{part}</mark> : part
    );
  };

  return (
    <div className="notes-section">
      <div className="notes-head">
        <div className="section-label" style={{ margin: 0 }}>Allgemeines</div>
        <button className="notes-add-btn" onClick={() => onOpenNoteModal(null)}>+ Neu</button>
      </div>
      <div className="notes-search-wrap">
        <span className="notes-search-icon">⌕</span>
        <input 
          className="notes-search" 
          placeholder="Suchen…" 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="notes-count">
        {search && filtered.length !== notes.length 
          ? `${filtered.length} von ${notes.length} Beiträgen`
          : notes.length === 0 ? '' : notes.length === 1 ? '1 Beitrag' : `${notes.length} Beiträge`
        }
      </div>
      <div className="notes-list">
        {filtered.length === 0 && (
          <div className="notes-empty">
            {search ? `Keine Ergebnisse für „${search}“` : 'Noch keine Einträge — klick auf + Neu.'}
          </div>
        )}
        {paginatedList.map(n => (
          <div 
            key={n.id} 
            className={`note-card ${expandedIds.includes(n.id) ? 'expanded' : ''}`} 
            onClick={() => toggleExpand(n.id)}
          >
            <div className="note-card-head">
              <div className="note-card-title">{highlight(n.title)}</div>
              <div className="note-card-actions" onClick={e => e.stopPropagation()}>
                <button className="note-card-btn" onClick={() => onOpenNoteModal(n.id)} title="Bearbeiten">✎</button>
                <button className="note-card-btn del" onClick={(e) => handleDelete(n.id, e)} title="Löschen">✕</button>
              </div>
            </div>
            {n.body && <div className="note-card-body">{highlight(n.body)}</div>}
            <div className="note-card-date">{n.updated || n.created}</div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
          <button 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)}
            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: page === 1 ? 'var(--text-3)' : 'var(--text)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            ← Zurück
          </button>
          <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 500 }}>
            Seite {page} von {totalPages}
          </span>
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage(page + 1)}
            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: page === totalPages ? 'var(--text-3)' : 'var(--text)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
          >
            Weiter →
          </button>
        </div>
      )}
    </div>
  );
}
