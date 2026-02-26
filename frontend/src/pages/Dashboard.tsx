import api from '../api';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const headers = { Authorization: 'Bearer ' + token };

  useEffect(() => {
    api.get('/tasks', { headers })
      .then(r => setTasks(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function addTask() {
    if (!title.trim()) return;
    const r = await api.post('/tasks', { title }, { headers });
    setTasks([...tasks, r.data]);
    setTitle('');
  }

  async function deleteTask(id: string) {
    await api.delete('/tasks/' + id, { headers });
    setTasks(tasks.filter(t => t.id !== id));
  }

  function logout() {
    localStorage.removeItem('token');
    location.href = '/login';
  }

  const done = tasks.filter(t => t.done).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        .dash {
          min-height: 100vh;
          background: #0a0a0a;
          font-family: 'DM Sans', sans-serif;
          color: #fff;
          padding: 0 0 80px;
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 32px;
          border-bottom: 1px solid #1a1a1a;
          position: sticky;
          top: 0;
          background: rgba(10,10,10,0.95);
          backdrop-filter: blur(12px);
          z-index: 10;
        }
        .topbar-logo {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #63ffb0;
        }
        .btn-logout {
          background: none;
          border: 1px solid #2a2a2a;
          color: #555;
          padding: 8px 16px;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-logout:hover { border-color: #555; color: #fff; }
        .hero {
          padding: 48px 32px 32px;
          position: relative;
        }
        .hero::before {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(99,255,176,0.06) 0%, transparent 70%);
          top: -100px; right: -100px;
          pointer-events: none;
        }
        .hero-label {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 8px;
        }
        .hero-title {
          font-family: 'Syne', sans-serif;
          font-size: 42px;
          font-weight: 800;
          line-height: 1.05;
          margin-bottom: 16px;
        }
        .hero-title span { color: #63ffb0; }
        .stats {
          display: flex;
          gap: 16px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }
        .stat {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 12px;
          padding: 16px 20px;
          min-width: 100px;
        }
        .stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #63ffb0;
        }
        .stat-label {
          font-size: 12px;
          color: #444;
          margin-top: 2px;
        }
        .add-form {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
          padding: 0 32px;
        }
        .add-input {
          flex: 1;
          padding: 14px 18px;
          background: #111;
          border: 1px solid #222;
          border-radius: 12px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s;
        }
        .add-input:focus { border-color: #63ffb0; }
        .add-input::placeholder { color: #333; }
        .btn-add {
          padding: 14px 24px;
          background: #63ffb0;
          color: #0a0a0a;
          border: none;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.2s, transform 0.15s;
        }
        .btn-add:hover { opacity: 0.85; transform: translateY(-1px); }
        .btn-add:active { transform: translateY(0); }
        .tasks-list {
          padding: 0 32px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .task-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 14px;
          animation: slideIn 0.3s ease;
          transition: border-color 0.2s, transform 0.15s;
        }
        .task-item:hover { border-color: #2a2a2a; transform: translateX(4px); }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .task-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #63ffb0;
          margin-right: 14px;
          flex-shrink: 0;
        }
        .task-title {
          flex: 1;
          font-size: 15px;
          color: #ddd;
        }
        .btn-delete {
          background: none;
          border: none;
          color: #333;
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: color 0.2s, background 0.2s;
          line-height: 1;
        }
        .btn-delete:hover { color: #ff6363; background: rgba(255,99,99,0.08); }
        .empty {
          text-align: center;
          padding: 60px 32px;
          color: #333;
        }
        .empty-icon { font-size: 40px; margin-bottom: 12px; }
        .empty-text { font-size: 15px; }
        .skeleton {
          height: 58px;
          background: linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 14px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (max-width: 480px) {
          .topbar { padding: 16px 20px; }
          .hero { padding: 32px 20px 24px; }
          .hero-title { font-size: 32px; }
          .add-form { padding: 0 20px; }
          .tasks-list { padding: 0 20px; }
        }
      `}</style>
      <div className="dash">
        <div className="topbar">
          <div className="topbar-logo">◆ TodoApp</div>
          <button className="btn-logout" onClick={logout}>Выйти</button>
        </div>
        <div className="hero">
          <div className="hero-label">Мои задачи</div>
          <div className="hero-title">Сделай это<br /><span>сегодня.</span></div>
          <div className="stats">
            <div className="stat">
              <div className="stat-num">{tasks.length}</div>
              <div className="stat-label">Всего</div>
            </div>
            <div className="stat">
              <div className="stat-num">{tasks.length - done}</div>
              <div className="stat-label">В работе</div>
            </div>
          </div>
        </div>
        <div className="add-form">
          <input
            className="add-input"
            placeholder="Добавить задачу..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
          />
          <button className="btn-add" onClick={addTask}>+ Добавить</button>
        </div>
        <div className="tasks-list">
          {loading ? (
            <>
              <div className="skeleton" />
              <div className="skeleton" style={{ opacity: 0.6 }} />
              <div className="skeleton" style={{ opacity: 0.3 }} />
            </>
          ) : tasks.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">✦</div>
              <div className="empty-text">Пока нет задач. Добавьте первую!</div>
            </div>
          ) : (
            tasks.map(t => (
              <div className="task-item" key={t.id}>
                <div className="task-dot" />
                <div className="task-title">{t.title}</div>
                <button className="btn-delete" onClick={() => deleteTask(t.id)}>✕</button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
