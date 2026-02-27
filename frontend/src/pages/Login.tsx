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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; }
        body { background: #0d1a0f; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .wrap {
          min-height: 100dvh;
          display: flex; flex-direction: column;
          background:
            radial-gradient(ellipse at 20% 10%, rgba(184,244,84,0.08) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 90%, rgba(184,244,84,0.05) 0%, transparent 50%),
            #0d1a0f;
          font-family: 'Plus Jakarta Sans', sans-serif;
          padding: 40px 24px 60px;
        }
        .badge {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.15em;
          text-transform: uppercase; color: #b8f454;
          margin-bottom: 48px;
          animation: fadeUp 0.4s ease;
        }
        .badge-icon {
          width: 22px; height: 22px; border-radius: 7px;
          background: linear-gradient(135deg, #b8f454, #4a7c1a);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; color: #0d1a0f;
        }
        .heading {
          animation: fadeUp 0.4s ease 0.05s both;
          margin-bottom: 32px;
        }
        .heading h1 {
          font-family: 'Syne', serif;
          font-size: 40px; font-weight: 400; line-height: 1.1;
          color: #e8f2d8;
        }
        .heading h1 em { font-style: normal; font-weight: 800; color: #b8f454; }
        .heading p {
          font-size: 14px; color: #4a6635; margin-top: 10px;
        }
        .heading p a { color: #b8f454; text-decoration: none; font-weight: 700; }
        .card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(184,244,84,0.1);
          border-radius: 20px; padding: 28px 24px;
          animation: fadeUp 0.4s ease 0.1s both;
          display: flex; flex-direction: column; gap: 16px;
        }
        .field label {
          display: block; font-size: 11px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: #4a6635; margin-bottom: 8px;
        }
        .field input {
          width: 100%; padding: 15px 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(184,244,84,0.1);
          border-radius: 12px; color: #e8f2d8;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 16px; outline: none;
          transition: border-color 0.2s;
          -webkit-appearance: none;
        }
        .field input:focus { border-color: rgba(184,244,84,0.4); }
        .field input::placeholder { color: #2d4a1a; }
        .error {
          font-size: 13px; color: #ff6b6b;
          padding: 12px 16px;
          background: rgba(255,107,107,0.07);
          border: 1px solid rgba(255,107,107,0.15);
          border-radius: 10px;
        }
        .btn {
          width: 100%; padding: 17px;
          background: linear-gradient(135deg, #b8f454, #4a7c1a);
          color: #0d1a0f; border: none; border-radius: 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 16px; font-weight: 800;
          cursor: pointer; margin-top: 4px;
          transition: opacity 0.2s, transform 0.15s;
          -webkit-appearance: none;
        }
        .btn:active { opacity: 0.8; transform: scale(0.98); }
        .btn:disabled { opacity: 0.4; }
      `}</style>
      <div className="wrap">
        <div className="badge">
          <div className="badge-icon">✦</div>
          Planner
        </div>
        <div className="heading">
          <h1>С возвращением,<br /><em>продуктивность.</em></h1>
          <p>Нет аккаунта? <a href="/register">Создать →</a></p>
        </div>
        <div className="card">
          {error && <div className="error">{error}</div>}
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="field">
            <label>Пароль</label>
            <input type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoComplete="current-password" />
          </div>
          <button className="btn" onClick={submit} disabled={loading}>
            {loading ? 'Входим...' : 'Войти →'}
          </button>
        </div>
      </div>
    </>
  );
}
