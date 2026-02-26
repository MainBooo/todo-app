import api from '../api';
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setLoading(true);
    setError('');
    try {
      const r = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', r.data.accessToken);
      location.href = '/';
    } catch {
      setError('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        .auth-wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0a;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }
        .auth-wrap::before {
          content: '';
          position: absolute;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(99,255,176,0.08) 0%, transparent 70%);
          top: -100px; left: -100px;
          pointer-events: none;
        }
        .auth-wrap::after {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(99,176,255,0.06) 0%, transparent 70%);
          bottom: -50px; right: -50px;
          pointer-events: none;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          padding: 48px;
          background: #111;
          border: 1px solid #222;
          border-radius: 24px;
          position: relative;
          z-index: 1;
          animation: fadeUp 0.5s ease;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .auth-logo {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #63ffb0;
          margin-bottom: 40px;
        }
        .auth-title {
          font-family: 'Syne', sans-serif;
          font-size: 36px;
          font-weight: 800;
          color: #fff;
          line-height: 1.1;
          margin-bottom: 8px;
        }
        .auth-sub {
          font-size: 14px;
          color: #555;
          margin-bottom: 36px;
        }
        .auth-sub a {
          color: #63ffb0;
          text-decoration: none;
        }
        .field { margin-bottom: 16px; }
        .field label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 8px;
        }
        .field input {
          width: 100%;
          padding: 14px 16px;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s;
        }
        .field input:focus { border-color: #63ffb0; }
        .field input::placeholder { color: #333; }
        .error-msg {
          font-size: 13px;
          color: #ff6363;
          margin-bottom: 16px;
          padding: 12px 16px;
          background: rgba(255,99,99,0.08);
          border-radius: 8px;
          border: 1px solid rgba(255,99,99,0.15);
        }
        .btn-primary {
          width: 100%;
          padding: 15px;
          background: #63ffb0;
          color: #0a0a0a;
          border: none;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          margin-top: 8px;
        }
        .btn-primary:hover { opacity: 0.85; transform: translateY(-1px); }
        .btn-primary:active { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
      `}</style>
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-logo">◆ TodoApp</div>
          <div className="auth-title">Добро<br />пожаловать</div>
          <div className="auth-sub">Нет аккаунта? <a href="/register">Создать →</a></div>
          {error && <div className="error-msg">{error}</div>}
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Пароль</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>
          <button className="btn-primary" onClick={submit} disabled={loading}>
            {loading ? 'Входим...' : 'Войти →'}
          </button>
        </div>
      </div>
    </>
  );
}
