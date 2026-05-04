import React, { useState } from 'react';

export default function QuickNotes({ quickNotes, setQuickNotes, onAddTodo, onAddReminder }) {
  const [inputText, setInputText] = useState('');

  const handleAdd = () => {
    const txt = inputText.trim();
    if (!txt) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' · ' + now.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
    setQuickNotes([{ id: Date.now(), text: txt, time: timeStr, done: false }, ...quickNotes]);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleDelete = (id) => {
    setQuickNotes(quickNotes.filter(n => n.id !== id));
  };

  const toggleDone = (id) => {
    setQuickNotes(quickNotes.map(n => n.id === id ? { ...n, done: !n.done } : n));
  };

  const clearDone = () => {
    setQuickNotes(quickNotes.filter(n => !n.done));
  };

  const toTodo = (id, text) => {
    onAddTodo(text);
    toggleDone(id);
  };

  const toReminder = (id, text) => {
    onAddReminder(text);
    toggleDone(id);
  };

  const openNotes = quickNotes.filter(n => !n.done);
  const doneNotes = quickNotes.filter(n => n.done);

  return (
    <div className="quick-section">
      <div className="section-label" style={{ marginTop: '32px', marginBottom: '12px' }}>Schnellnotizen</div>
      <div className="quick-pad">
        <div className="quick-input-wrap">
          <textarea
            className="quick-textarea"
            placeholder="Notiz eingeben… (Strg+Enter zum Speichern)"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          ></textarea>
        </div>
        <div className="quick-footer">
          <button className="quick-clear-btn" onClick={clearDone}>Erledigte löschen</button>
          <button className="quick-add-btn" onClick={handleAdd}>+ Hinzufügen</button>
        </div>
        
        <div id="quick-notes-list">
          {quickNotes.length === 0 ? (
            <div className="quick-empty">Einfach lostippen —<br/>Notizen können danach zu Aufgaben<br/>oder Erinnerungen werden.</div>
          ) : (
            <>
              {openNotes.length > 0 && <div className="quick-count">{openNotes.length} offen</div>}
              {openNotes.map(n => (
                <div className="quick-note" key={n.id}>
                  <div className="quick-note-text">{n.text}</div>
                  <div className="quick-note-meta">
                    <span className="quick-note-time">{n.time}</span>
                    <div className="quick-note-actions">
                      <button className="qn-btn task" onClick={() => toTodo(n.id, n.text)}>→ Aufgabe</button>
                      <button className="qn-btn reminder" onClick={() => toReminder(n.id, n.text)}>→ Erinnerung</button>
                      <button className="qn-btn del" onClick={() => handleDelete(n.id)}>✕</button>
                    </div>
                  </div>
                </div>
              ))}

              {doneNotes.length > 0 && <div className="quick-count" style={{ opacity: 0.5 }}>{doneNotes.length} erledigt</div>}
              {doneNotes.map(n => (
                <div className="quick-note" style={{ opacity: 0.4 }} key={n.id}>
                  <div className="quick-note-text" style={{ textDecoration: 'line-through', color: 'var(--text-3)' }}>{n.text}</div>
                  <div className="quick-note-meta">
                    <span className="quick-note-time">{n.time}</span>
                    <div className="quick-note-actions">
                      <button className="qn-btn" onClick={() => toggleDone(n.id)}>↩ Zurück</button>
                      <button className="qn-btn del" onClick={() => handleDelete(n.id)}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
