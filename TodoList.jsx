import React, { useState } from 'react';
import { signIn, signUp } from '../firebase';

const ERRORS = {
  'auth/user-not-found': 'Kein Account mit dieser E-Mail gefunden.',
  'auth/wrong-password': 'Falsches Passwort.',
  'auth/invalid-credential': 'E-Mail oder Passwort ist falsch.',
  'auth/email-already-in-use': 'Diese E-Mail ist bereits registriert.',
  'auth/weak-password': 'Das Passwort muss mindestens 6 Zeichen lang sein.',
  'auth/invalid-email': 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
  'auth/too-many-requests': 'Zu viele Versuche. Bitte warten Sie kurz.',
};

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        if (!email || !password) {
          setError('Bitte alle Felder ausfüllen.');
          setLoading(false);
          return;
        }
        await signUp(email, password);
      }
    } catch (err) {
      setError(ERRORS[err.code] || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '10px' }}>
            Russmedia · Audience Development
          </div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '36px', fontWeight: 400, color: 'var(--text)', lineHeight: 1.1 }}>
            {mode === 'login' ? 'Willkommen zurück' : 'Account erstellen'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '10px' }}>
            {mode === 'login'
              ? 'Melden Sie sich an, um auf Ihren Planer zuzugreifen.'
              : 'Erstellen Sie einen neuen persönlichen Account.'}
          </div>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '32px',
          boxShadow: '0 4px 24px rgba(0,0,0,.06)',
        }}>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--bg)',
            borderRadius: '8px',
            padding: '4px',
            marginBottom: '24px',
            border: '1px solid var(--border)',
          }}>
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  padding: '8px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all .15s',
                  background: mode === m ? 'var(--surface)' : 'transparent',
                  color: mode === m ? 'var(--text)' : 'var(--text-3)',
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                }}
              >
                {m === 'login' ? 'Anmelden' : 'Registrieren'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '6px' }}>
                E-Mail
              </div>
              <input
                type="email"
                placeholder="name@russmedia.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid var(--border)', borderRadius: '8px',
                  background: 'var(--bg)', color: 'var(--text)', fontSize: '14px',
                  fontFamily: "'Inter', sans-serif", outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color .15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--text)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '6px' }}>
                Passwort
              </div>
              <input
                type="password"
                placeholder={mode === 'register' ? 'Mindestens 6 Zeichen' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid var(--border)', borderRadius: '8px',
                  background: 'var(--bg)', color: 'var(--text)', fontSize: '14px',
                  fontFamily: "'Inter', sans-serif", outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color .15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--text)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {error && (
              <div style={{
                background: 'var(--red-bg)', border: '1px solid #FECACA',
                borderRadius: '8px', padding: '10px 14px',
                fontSize: '13px', color: 'var(--red)', marginBottom: '16px', lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px',
                background: loading ? 'var(--border-strong)' : 'var(--accent)',
                color: 'var(--accent-fg)', border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: 500, fontFamily: "'Inter', sans-serif",
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity .15s', letterSpacing: '.01em',
              }}
            >
              {loading ? 'Bitte warten…' : mode === 'login' ? 'Anmelden' : 'Account erstellen'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-3)' }}>
          Self-Manager · Russmedia Audience Development
        </div>
      </div>
    </div>
  );
}
