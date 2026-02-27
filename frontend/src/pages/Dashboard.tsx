import api from '../api';
import { useEffect, useState, useRef } from 'react';

// ── helpers ───────────────────────────────────────────────────────────────────
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function parseText(text: string): { title: string; scheduledAt: string | null }[] {
  const lines = text.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
  const timePatterns = [
    { re: /\bat\s+(\d{1,2}):(\d{2})\s*(am|pm)?/i, type: 'hhmm' },
    { re: /\bat\s+(\d{1,2})\s*(am|pm)/i, type: 'h_ampm' },
    { re: /\b(\d{1,2}):(\d{2})\s*(am|pm)?/i, type: 'hhmm' },
    { re: /\b(\d{1,2})\s*(am|pm)/i, type: 'h_ampm' },
    { re: /\bв\s+(\d{1,2}):(\d{2})/i, type: 'hhmm_ru' },
    { re: /\bв\s+(\d{1,2})\s*(утра|дня|вечера|ночи)/i, type: 'h_ru' },
  ];
  return lines.map(line => {
    let scheduledAt: string | null = null;
    let title = line;
    for (const p of timePatterns) {
      const m = line.match(p.re);
      if (!m) continue;
      let h = parseInt(m[1]);
      const min = p.type === 'hhmm' || p.type === 'hhmm_ru' ? parseInt(m[2]) : 0;
      const period = (m[2] || m[3] || '').toLowerCase();
      if (period === 'pm' || period === 'вечера' || period === 'дня') { if (h < 12) h += 12; }
      else if (period === 'am' || period === 'утра') { if (h === 12) h = 0; }
      scheduledAt = `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
      title = line.replace(m[0],'').replace(/\bat\b/i,'').replace(/\bв\b/i,'').trim().replace(/^[,\s]+|[,\s]+$/g,'').trim() || line;
      break;
    }
    return { title: title.charAt(0).toUpperCase() + title.slice(1), scheduledAt };
  });
}

// ── GlowBorder ────────────────────────────────────────────────────────────────
function GlowBorder({ active }: { active: boolean }) {
  const s = (extra: any) => ({
    position:'absolute' as const, pointerEvents:'none' as const,
    background:'linear-gradient(90deg,transparent,#b8f454,transparent)',
    boxShadow:'0 0 20px 6px #b8f454,0 0 60px 14px rgba(184,244,84,0.35)',
    animation: active ? 'glowPulse 1.5s ease-in-out infinite' : 'none', ...extra
  });
  return (
    <div style={{position:'fixed',inset:0,zIndex:100,pointerEvents:'none',opacity:active?1:0,transition:'opacity 0.5s'}}>
      <div style={s({top:0,left:0,right:0,height:3})} />
      <div style={s({bottom:0,left:0,right:0,height:3,animationDelay:'0.3s'})} />
      <div style={s({top:0,bottom:0,left:0,width:3,background:'linear-gradient(180deg,transparent,#b8f454,transparent)',animationDelay:'0.15s'})} />
      <div style={s({top:0,bottom:0,right:0,width:3,background:'linear-gradient(180deg,transparent,#b8f454,transparent)',animationDelay:'0.45s'})} />
    </div>
  );
}

// ── Mini calendar picker ───────────────────────────────────────────────────────
function CalendarPicker({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [viewDate, setViewDate] = useState(() => {
    const d = value ? new Date(value+'T00:00:00') : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // monday first
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const cells: (number|null)[] = [...Array(firstDow).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="cal-picker">
      <div className="cal-picker-nav">
        <button onClick={() => setViewDate(new Date(year, month-1, 1))}>‹</button>
        <span>{monthNames[month]} {year}</span>
        <button onClick={() => setViewDate(new Date(year, month+1, 1))}>›</button>
      </div>
      <div className="cal-picker-grid">
        {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
          <div key={d} className="cal-picker-dow">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const cellDate = new Date(year, month, day);
          const dateStr = toDateStr(cellDate);
          const isPast = cellDate < today;
          const isSelected = dateStr === value;
          const isToday = dateStr === toDateStr(today);
          return (
            <div key={i}
              className={`cal-picker-day${isSelected?' selected':''}${isToday?' today':''}${isPast?' past':''}`}
              onClick={() => !isPast && onChange(dateStr)}
            >{day}</div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
type Task = { id: string; title: string; scheduledAt: string|null; date: string|null; completed: boolean };
type Screen = 'input'|'loading'|'timeline';

export default function Dashboard() {
  const today = new Date(); today.setHours(0,0,0,0);
  const todayStr = toDateStr(today);

  const [screen, setScreen] = useState<Screen>('input');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]); // all tasks for dot indicators
  const [inputText, setInputText] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewDate, setViewDate] = useState(todayStr); // active day in timeline
  const [showCal, setShowCal] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading context..');
  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);

  const calScrollRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('token');
  const headers = { Authorization: 'Bearer ' + token };

  const phrases = [
    'Встреча с командой в 10 AM...',
    'Тренировка в 7 утра, завтрак в 8:00...',
    'Позвонить маме в 6 вечера...',
    'Приготовить ужин в 18:00...',
    'Рабочий созвон в 10 AM, обед в 13:00...',
  ];

  // typewriter
  useEffect(() => {
    if (screen !== 'input' || inputText) return;
    const phrase = phrases[phraseIndex];
    let t: ReturnType<typeof setTimeout>;
    if (!isDeleting) {
      if (typedPlaceholder.length < phrase.length)
        t = setTimeout(() => setTypedPlaceholder(phrase.slice(0, typedPlaceholder.length+1)), 55);
      else t = setTimeout(() => setIsDeleting(true), 1800);
    } else {
      if (typedPlaceholder.length > 0)
        t = setTimeout(() => setTypedPlaceholder(phrase.slice(0, typedPlaceholder.length-1)), 25);
      else { setIsDeleting(false); setPhraseIndex(i => (i+1) % phrases.length); }
    }
    return () => clearTimeout(t);
  }, [typedPlaceholder, isDeleting, phraseIndex, screen, inputText]);

  // load tasks for current viewDate
  useEffect(() => {
    api.get('/tasks', { headers, params: { date: viewDate } })
      .then(r => { setTasks(r.data); })
      .catch(console.error);
  }, [viewDate]);

  // load ALL tasks (for dot indicators) on mount
  useEffect(() => {
    api.get('/tasks', { headers })
      .then(r => {
        setAllTasks(r.data);
        if (r.data.length > 0) setScreen('timeline');
      })
      .catch(console.error);
  }, []);

  // loading animation
  useEffect(() => {
    if (screen !== 'loading') return;
    const texts = ['Loading context..', 'Parsing tasks..', 'Adding to schedule...'];
    let i = 0;
    const iv = setInterval(() => {
      i++; if (i < texts.length) setLoadingText(texts[i]); else clearInterval(iv);
    }, 900);
    return () => clearInterval(iv);
  }, [screen]);

  async function handleSubmit() {
    if (!inputText.trim()) return;
    setScreen('loading');
    const parsed = parseText(inputText).map(p => ({ ...p, date: selectedDate }));
    await new Promise(r => setTimeout(r, 2700));
    try {
      await api.post('/tasks/bulk', { tasks: parsed }, { headers });
    } catch {
      for (const p of parsed)
        await api.post('/tasks', { title: p.title, scheduledAt: p.scheduledAt, date: p.date }, { headers });
    }
    // reload
    const [dayRes, allRes] = await Promise.all([
      api.get('/tasks', { headers, params: { date: selectedDate } }),
      api.get('/tasks', { headers }),
    ]);
    setTasks(dayRes.data);
    setAllTasks(allRes.data);
    setViewDate(selectedDate);
    setScreen('timeline');
  }

  async function toggleTask(task: Task) {
    const r = await api.patch('/tasks/'+task.id, { completed: !task.completed }, { headers });
    setTasks(prev => prev.map(t => t.id===task.id ? r.data : t));
    setAllTasks(prev => prev.map(t => t.id===task.id ? r.data : t));
  }

  async function deleteTask(id: string) {
    await api.delete('/tasks/'+id, { headers });
    setTasks(prev => prev.filter(t => t.id!==id));
    setAllTasks(prev => prev.filter(t => t.id!==id));
  }

  async function clearAll() {
    for (const t of allTasks) await api.delete('/tasks/'+t.id, { headers });
    setTasks([]); setAllTasks([]); setInputText(''); setScreen('input');
  }

  // scroll calendar to today on open
  useEffect(() => {
    if (screen !== 'timeline' || !calScrollRef.current) return;
    const todayEl = calScrollRef.current.querySelector('.week-day.today') as HTMLElement;
    if (todayEl) {
      const container = calScrollRef.current;
      const offset = todayEl.offsetLeft - container.offsetWidth / 2 + todayEl.offsetWidth / 2;
      container.scrollTo({ left: offset, behavior: 'smooth' });
    }
  }, [screen]);

  function logout() { localStorage.removeItem('token'); location.href='/login'; }

  // rolling 90-day strip (45 past + 45 future)
  const calDays = Array.from({length:90}, (_,i) => {
    const d = new Date(today); d.setDate(today.getDate() - 45 + i);
    return { date: d, str: toDateStr(d), isToday: toDateStr(d)===todayStr };
  });
  const daysWithTasks = new Set(allTasks.map(t => t.date).filter(Boolean));
  const dowNames = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

  const cardVariants = ['variant-green','variant-dark','variant-blue','variant-olive'];
  const scheduled = tasks.filter(t => t.scheduledAt).sort((a,b) => a.scheduledAt!>b.scheduledAt! ? 1:-1);
  const unscheduled = tasks.filter(t => !t.scheduledAt);

  const viewDateObj = new Date(viewDate+'T00:00:00');
  const monthNames = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const viewLabel = viewDate===todayStr ? 'Сегодня' : `${viewDateObj.getDate()} ${monthNames[viewDateObj.getMonth()]}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@400;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%}
        body{background:#0d1a0f;color:#e8f2d8;font-family:'Plus Jakarta Sans',sans-serif}
        @keyframes glowPulse{0%,100%{opacity:.7}50%{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes loadDot{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
        .screen{min-height:100dvh;display:flex;flex-direction:column}

        /* ── INPUT ── */
        .input-screen{
          background:radial-gradient(ellipse at 30% 20%,rgba(184,244,84,.07) 0%,transparent 60%),
                     radial-gradient(ellipse at 70% 80%,rgba(184,244,84,.04) 0%,transparent 50%),#0d1a0f;
          padding:0 0 40px;
        }
        .input-topbar{display:flex;align-items:center;justify-content:space-between;padding:20px 24px}
        .app-badge{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#b8f454}
        .app-badge-icon{width:22px;height:22px;border-radius:7px;background:linear-gradient(135deg,#b8f454,#4a7c1a);display:flex;align-items:center;justify-content:center;font-size:12px;color:#0d1a0f}
        .btn-ghost{background:none;border:1px solid rgba(184,244,84,.15);color:#4a6635;padding:8px 14px;border-radius:8px;font-family:inherit;font-size:13px;cursor:pointer;transition:all .2s}
        .btn-ghost:active{color:#b8f454;border-color:rgba(184,244,84,.4)}
        .input-hero{padding:24px 24px 20px;animation:fadeUp .5s ease}
        .input-hero h1{font-family:'Syne',sans-serif;font-size:34px;font-weight:800;line-height:1.15;color:#e8f2d8}
        .input-hero h1 span{color:#b8f454}
        .input-hero p{font-size:13px;color:#4a6635;margin-top:8px}
        .input-box{margin:0 24px;background:rgba(255,255,255,.03);border:1px solid rgba(184,244,84,.1);border-radius:18px;padding:20px;position:relative;animation:fadeUp .5s ease .1s both}
        .input-box textarea{width:100%;background:none;border:none;outline:none;color:#e8f2d8;font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;line-height:1.6;resize:none;min-height:110px}
        .input-hint{font-size:12px;color:#2d4a1a;margin-top:12px;display:flex;gap:16px;flex-wrap:wrap}

        /* Date selector in form */
        .date-selector{margin:16px 24px 0;animation:fadeUp .5s ease .15s both}
        .date-selector-label{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#4a6635;margin-bottom:8px}
        .date-pills{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
        .date-pills::-webkit-scrollbar{display:none}
        .date-pill{flex-shrink:0;display:flex;flex-direction:column;align-items:center;padding:10px 14px;border-radius:14px;border:1px solid rgba(184,244,84,.1);background:rgba(255,255,255,.02);cursor:pointer;transition:all .2s;min-width:52px}
        .date-pill.active{background:rgba(184,244,84,.12);border-color:rgba(184,244,84,.35)}
        .date-pill.today-pill.active .date-pill-num{background:#b8f454;color:#0d1a0f;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center}
        .date-pill-dow{font-size:10px;font-weight:700;color:#4a6635;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
        .date-pill.active .date-pill-dow{color:#b8f454}
        .date-pill-num{font-size:16px;font-weight:700;color:#7a9a65}
        .date-pill.active .date-pill-num{color:#b8f454}
        .btn-cal-open{flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 14px;border-radius:14px;border:1px solid rgba(184,244,84,.1);background:rgba(255,255,255,.02);cursor:pointer;font-size:18px;min-width:52px;transition:all .2s}
        .btn-cal-open:active{background:rgba(184,244,84,.1)}

        /* Full calendar picker */
        .cal-picker-overlay{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);display:flex;align-items:flex-end;animation:fadeUp .2s ease}
        .cal-picker{background:#0f2212;border:1px solid rgba(184,244,84,.12);border-radius:24px 24px 0 0;padding:24px 20px 40px;width:100%}
        .cal-picker-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
        .cal-picker-nav span{font-family:'Syne',sans-serif;font-size:17px;font-weight:700;color:#e8f2d8}
        .cal-picker-nav button{background:rgba(255,255,255,.05);border:1px solid rgba(184,244,84,.1);color:#b8f454;width:36px;height:36px;border-radius:10px;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center}
        .cal-picker-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
        .cal-picker-dow{text-align:center;font-size:11px;font-weight:700;color:#4a6635;letter-spacing:.06em;padding:6px 0;text-transform:uppercase}
        .cal-picker-day{text-align:center;padding:10px 4px;border-radius:10px;font-size:15px;font-weight:600;color:#7a9a65;cursor:pointer;transition:all .15s;position:relative}
        .cal-picker-day:active{background:rgba(184,244,84,.15)}
        .cal-picker-day.today{color:#e8f2d8}
        .cal-picker-day.today::after{content:'';position:absolute;bottom:4px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:#b8f454}
        .cal-picker-day.selected{background:#b8f454;color:#0d1a0f;border-radius:12px}
        .cal-picker-day.past{color:#2d4a1a;cursor:default}
        .cal-picker-close{margin-top:16px;width:100%;padding:15px;background:rgba(184,244,84,.08);border:1px solid rgba(184,244,84,.15);border-radius:14px;color:#b8f454;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer}

        .btn-submit{margin:20px 24px 0;width:calc(100% - 48px);padding:17px;background:linear-gradient(135deg,#b8f454,#4a7c1a);color:#0d1a0f;border:none;border-radius:14px;font-family:inherit;font-size:16px;font-weight:800;cursor:pointer;animation:fadeUp .5s ease .2s both;transition:opacity .2s,transform .15s}
        .btn-submit:active{opacity:.8;transform:scale(.98)}

        /* ── LOADING ── */
        .loading-screen{background:#0d1a0f;justify-content:flex-start;padding:60px 24px}
        .loading-bubble{background:rgba(255,255,255,.05);border:1px solid rgba(184,244,84,.1);border-radius:18px 18px 18px 4px;padding:16px 20px;max-width:85%;font-size:15px;color:#b0c898;line-height:1.5;margin-bottom:24px;animation:fadeUp .4s ease}
        .loading-status{font-size:20px;font-weight:700;color:#e8f2d8;animation:fadeUp .3s ease}
        .loading-dots{display:inline-flex;gap:5px;margin-left:4px;vertical-align:middle}
        .loading-dots span{width:5px;height:5px;border-radius:50%;background:#b8f454;animation:loadDot 1.2s infinite}
        .loading-dots span:nth-child(2){animation-delay:.2s}
        .loading-dots span:nth-child(3){animation-delay:.4s}

        /* ── TIMELINE ── */
        .timeline-screen{background:#0d1a0f;min-height:100dvh}
        .cal-topbar{position:sticky;top:0;z-index:20;background:rgba(13,26,15,.95);backdrop-filter:blur(16px);border-bottom:1px solid rgba(184,244,84,.06);padding:16px 20px 14px}
        .cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
        .cal-header-left{}
        .cal-view-label{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#e8f2d8;line-height:1}
        .cal-view-date{font-size:12px;color:#4a6635;margin-top:3px;letter-spacing:.05em}
        .cal-header-actions{display:flex;gap:8px}
        .btn-icon{background:rgba(255,255,255,.04);border:1px solid rgba(184,244,84,.1);color:#6a8a55;width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;transition:all .2s}
        .btn-icon:active{color:#b8f454;border-color:rgba(184,244,84,.3)}
        .week-scroll{display:flex;gap:6px;overflow-x:auto;padding:0 4px 4px;scrollbar-width:none;-webkit-overflow-scrolling:touch;margin-bottom:2px}
        .week-scroll::-webkit-scrollbar{display:none}
        .week-strip{display:contents}
        .week-day{flex:1;display:flex;flex-direction:column;align-items:center;padding:8px 2px;border-radius:14px;cursor:pointer;transition:all .2s;position:relative}
        .week-day.active{background:rgba(184,244,84,.12)}
        .week-day-name{font-size:10px;font-weight:700;color:#4a6635;letter-spacing:.05em;text-transform:uppercase;margin-bottom:4px}
        .week-day.active .week-day-name{color:#b8f454}
        .week-day-num{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#7a9a65}
        .week-day.today .week-day-num{background:#b8f454;color:#0d1a0f}
        .week-day.active:not(.today) .week-day-num{color:#b8f454}
        .week-day-dot{width:4px;height:4px;border-radius:50%;background:#b8f454;margin-top:3px;opacity:.7}

        /* timeline body */
        .tl-body{padding:16px 0 120px;position:relative}
        .tl-row{display:flex;align-items:flex-start;padding:0 16px;margin-bottom:6px;animation:slideIn .35s ease both}
        .tl-time-col{width:52px;flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;padding-right:12px;padding-top:14px;position:relative}
        .tl-time-text{font-size:11px;font-weight:700;color:#4a6635;letter-spacing:.04em;line-height:1}
        .tl-line-wrap{position:absolute;right:4px;top:0;bottom:-6px;width:2px;display:flex;flex-direction:column;align-items:center}
        .tl-line-seg{width:2px;flex:1;background:linear-gradient(180deg,rgba(184,244,84,.4),rgba(184,244,84,.08));border-radius:2px}
        .tl-dot{width:8px;height:8px;border-radius:50%;background:#b8f454;box-shadow:0 0 8px rgba(184,244,84,.6);margin-bottom:2px;flex-shrink:0}
        .tl-card{flex:1;border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:12px;position:relative;overflow:hidden;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);transition:transform .15s}
        .tl-card:active{transform:scale(.98)}
        .tl-card.variant-green{background:rgba(40,80,30,.55);border:1px solid rgba(184,244,84,.15)}
        .tl-card.variant-dark{background:rgba(20,35,20,.7);border:1px solid rgba(255,255,255,.07)}
        .tl-card.variant-blue{background:rgba(20,45,70,.6);border:1px solid rgba(100,180,255,.12)}
        .tl-card.variant-olive{background:rgba(50,60,20,.6);border:1px solid rgba(184,244,84,.1)}
        .tl-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.04) 0%,transparent 60%);pointer-events:none}
        .tl-card.done{opacity:.35}
        .tl-card.done .tl-card-title{text-decoration:line-through}
        .tl-check{width:22px;height:22px;border-radius:50%;flex-shrink:0;border:2px solid rgba(184,244,84,.25);display:flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(0,0,0,.2);transition:all .2s}
        .tl-check.checked{background:#b8f454;border-color:#b8f454}
        .tl-check.checked::after{content:'✓';font-size:11px;color:#0d1a0f;font-weight:900}
        .tl-card-title{flex:1;font-size:15px;font-weight:600;color:#deefc8}
        .tl-del{background:none;border:none;color:rgba(255,255,255,.15);font-size:16px;cursor:pointer;padding:4px 6px;border-radius:6px;flex-shrink:0;transition:color .2s}
        .tl-del:active{color:#ff6b6b}
        .tl-section-label{font-size:11px;color:#4a6635;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:12px 20px 8px;display:flex;align-items:center;gap:10px}
        .tl-section-label::after{content:'';flex:1;height:1px;background:rgba(184,244,84,.06)}
        .tl-row-plain{padding:0 16px;margin-bottom:6px;animation:slideIn .35s ease both}
        .empty-state{text-align:center;padding:60px 24px;color:#2d4a1a}
        .empty-state .es-icon{font-size:40px;margin-bottom:12px}
        .empty-state p{font-size:15px}
        .empty-state button{margin-top:20px;background:rgba(184,244,84,.08);border:1px solid rgba(184,244,84,.15);color:#b8f454;padding:12px 24px;border-radius:14px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer}
        .fab{position:fixed;bottom:32px;right:20px;width:56px;height:56px;border-radius:18px;background:linear-gradient(135deg,#b8f454,#4a7c1a);border:none;color:#0d1a0f;font-size:28px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 0 30px rgba(184,244,84,.35),0 4px 20px rgba(0,0,0,.4);transition:transform .2s;z-index:30}
        .fab:active{transform:scale(.92)}
      `}</style>

      <GlowBorder active={screen==='loading'} />

      {/* ── INPUT ── */}
      {screen==='input' && (
        <div className="screen input-screen">
          <div className="input-topbar">
            <div className="app-badge"><div className="app-badge-icon">✦</div>Planner</div>
            <div style={{display:'flex',gap:10}}>
              {allTasks.length>0 && <button className="btn-ghost" style={{borderColor:'rgba(184,244,84,.3)',color:'#b8f454'}} onClick={()=>setScreen('timeline')}>К задачам →</button>}
              <button className="btn-ghost" onClick={logout}>Выйти</button>
            </div>
          </div>
          <div className="input-hero">
            <h1>Опиши планы<br /><span>в свободной форме.</span></h1>
            <p>Напиши всё подряд — разберём сами</p>
          </div>
          <div className="input-box">
            <textarea
              placeholder=""
              value={inputText}
              onChange={e => setInputText(e.target.value)}
            />
            {!inputText && (
              <div style={{position:'absolute',top:20,left:20,right:20,pointerEvents:'none',color:'#2d4a1a',fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,lineHeight:1.6}}>
                {typedPlaceholder}
                <span style={{borderRight:'2px solid #b8f454',marginLeft:1,animation:'blink 1s step-end infinite'}} />
              </div>
            )}
            <div className="input-hint">
              <span>🕐 "в 3 PM" или "в 15:00"</span>
              <span>📝 Через запятую или с новой строки</span>
            </div>
          </div>

          {/* Date selector */}
          <div className="date-selector">
            <div className="date-selector-label">Дата</div>
            <div className="date-pills">
              {Array.from({length:14},(_,i)=>{
                const d = new Date(today); d.setDate(today.getDate()+i);
                const ds = toDateStr(d);
                const isT = ds===todayStr;
                const dow = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][d.getDay()];
                return (
                  <div key={ds} className={`date-pill${selectedDate===ds?' active':''}${isT?' today-pill':''}`} onClick={()=>setSelectedDate(ds)}>
                    <div className="date-pill-dow">{isT ? 'Сег' : dow}</div>
                    <div className="date-pill-num">{d.getDate()}</div>
                  </div>
                );
              })}
              <div className="btn-cal-open" onClick={()=>setShowCal(true)}>📅</div>
            </div>
          </div>

          <button className="btn-submit" onClick={handleSubmit}>Добавить в расписание →</button>
        </div>
      )}

      {/* Calendar overlay */}
      {showCal && (
        <div className="cal-picker-overlay" onClick={()=>setShowCal(false)}>
          <div onClick={e=>e.stopPropagation()}>
            <CalendarPicker value={selectedDate} onChange={d=>{setSelectedDate(d);setShowCal(false)}} />
            <button className="cal-picker-close" onClick={()=>setShowCal(false)}>Закрыть</button>
          </div>
        </div>
      )}

      {/* ── LOADING ── */}
      {screen==='loading' && (
        <div className="screen loading-screen">
          <div className="loading-bubble">{inputText}</div>
          <div className="loading-status">
            {loadingText.replace('..','').replace('...','') }
            <span style={{color:'#b8f454'}}>{loadingText.includes('...') ? '...' : '..'}</span>
            <div className="loading-dots"><span/><span/><span/></div>
          </div>
        </div>
      )}

      {/* ── TIMELINE ── */}
      {screen==='timeline' && (
        <div className="screen timeline-screen">
          <div className="cal-topbar">
            <div className="cal-header">
              <div className="cal-header-left">
                <div className="cal-view-label">{viewLabel}</div>
                <div className="cal-view-date">
                  {viewDateObj.toLocaleDateString('ru-RU',{weekday:'long'})}
                  {' · '}{tasks.length} задач{tasks.length===1?'а':tasks.length<5&&tasks.length>1?'и':''}
                </div>
              </div>
              <div className="cal-header-actions">
                <button className="btn-icon" onClick={clearAll}>🗑</button>
                <button className="btn-icon" onClick={logout}>↩</button>
              </div>
            </div>
            <div className="week-scroll" ref={calScrollRef}>
                {calDays.map((d)=>(
                  <div key={d.str}
                    className={`week-day${d.str===viewDate?' active':''}${d.isToday?' today':''}`}
                    onClick={()=>setViewDate(d.str)}
                  >
                    <div className="week-day-name">{dowNames[d.date.getDay()]}</div>
                    <div className="week-day-num">{d.date.getDate()}</div>
                    {daysWithTasks.has(d.str) && <div className="week-day-dot"/>}
                  </div>
                ))}
            </div>
          </div>

          <div className="tl-body">
            {scheduled.length===0 && unscheduled.length===0 && (
              <div className="empty-state">
                <div className="es-icon">✦</div>
                <p>Нет задач на этот день</p>
                <button onClick={()=>{setSelectedDate(viewDate);setScreen('input');setInputText('')}}>+ Добавить задачи</button>
              </div>
            )}
            {scheduled.map((task,i)=>(
              <div className="tl-row" key={task.id} style={{animationDelay:`${i*.06}s`}}>
                <div className="tl-time-col">
                  <div className="tl-dot"/>
                  <div className="tl-time-text">{task.scheduledAt}</div>
                  <div className="tl-line-wrap"><div className="tl-line-seg"/></div>
                </div>
                <div className={`tl-card ${cardVariants[i%4]} ${task.completed?'done':''}`}>
                  <div className={`tl-check ${task.completed?'checked':''}`} onClick={()=>toggleTask(task)}/>
                  <div className="tl-card-title">{task.title}</div>
                  <button className="tl-del" onClick={()=>deleteTask(task.id)}>✕</button>
                </div>
              </div>
            ))}
            {unscheduled.length>0 && (
              <>
                <div className="tl-section-label">Без времени</div>
                {unscheduled.map((task,i)=>(
                  <div className="tl-row-plain" key={task.id} style={{animationDelay:`${(scheduled.length+i)*.06}s`}}>
                    <div className={`tl-card ${cardVariants[(scheduled.length+i)%4]} ${task.completed?'done':''}`}>
                      <div className={`tl-check ${task.completed?'checked':''}`} onClick={()=>toggleTask(task)}/>
                      <div className="tl-card-title">{task.title}</div>
                      <button className="tl-del" onClick={()=>deleteTask(task.id)}>✕</button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <button className="fab" onClick={()=>{setSelectedDate(viewDate);setScreen('input');setInputText('')}}>+</button>
        </div>
      )}
    </>
  );
}
