import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, DollarSign, Plus, Trash2, 
  Printer, Briefcase, FileText, X
} from 'lucide-react';
 
interface Shift {
  id: string;
  projectId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  hours: number;
  type: 'work' | 'gathering' | string;
  hourlyRate: number;
  amount: number;
  note?: string;
}
 
interface Project {
  id: string;
  name: string;
  defaultRate: number;
}
 
const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', name: 'Основная работа', defaultRate: 400 },
  { id: 'p2', name: 'Фриланс / Заказы', defaultRate: 500 },
];
 
export default function App() {
  const [projects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('shift_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });
 
  const [activeProjectId, setActiveProjectId] = useState<string>(projects[0]?.id || 'p1');
 
  // Загружаем смены из localStorage при старте
  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem('shift_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Ошибка чтения смен', e);
      }
    }
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: '1',
        projectId: 'p1',
        date: today,
        startTime: '09:00',
        endTime: '17:00',
        hours: 8,
        type: 'work',
        hourlyRate: 400,
        amount: 3200,
        note: 'Дневная смена'
      }
    ];
  });
 
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formHours, setFormHours] = useState<number>(8);
  const [formRate, setFormRate] = useState<number>(400);
  const [formType, setFormType] = useState<'work' | 'gathering'>('work');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('17:00');
  const [formNote, setFormNote] = useState('');
 
  // Сохраняем в localStorage при каждом изменении shifts
  useEffect(() => {
    localStorage.setItem('shift_records', JSON.stringify(shifts));
  }, [shifts]);
 
  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      if (shift.projectId !== activeProjectId) return false;
      if (!shift.date.startsWith(selectedMonth)) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [shifts, activeProjectId, selectedMonth]);
 
  const monthTotals = useMemo(() => {
    return filteredShifts.reduce((acc, shift) => {
      if (shift.type === 'gathering') {
        acc.gatheringDays += 1;
      } else {
        acc.workDays += 1;
      }
      acc.totalHours += Number(shift.hours) || 0;
      acc.totalAmount += Number(shift.amount) || 0;
      return acc;
    }, { workDays: 0, gatheringDays: 0, totalHours: 0, totalAmount: 0 });
  }, [filteredShifts]);
 
  const handleDelete = (id: string) => {
    if (confirm('Удалить эту запись?')) {
      setShifts(prev => prev.filter(s => s.id !== id));
    }
  };
 
  const handleSaveNewShift = (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = Number(formHours) || 0;
    const rateNum = Number(formRate) || 0;
    const calculatedAmount = hoursNum * rateNum;
 
    const newShift: Shift = {
      id: Date.now().toString(),
      projectId: activeProjectId,
      date: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      hours: hoursNum,
      type: formType,
      hourlyRate: rateNum,
      amount: calculatedAmount,
      note: formNote
    };
 
    setShifts(prev => [newShift, ...prev]);
    setIsModalOpen(false);
    setFormNote('');
  };
 
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '24px 16px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
 
        {/* Header */}
        <header style={{
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          border: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              backgroundColor: '#2563eb',
              padding: '12px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Briefcase color="#ffffff" size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#ffffff' }}>Учёт Смен и Часов</h1>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>Мониторинг рабочего времени и доходов</p>
            </div>
          </div>
 
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select 
              value={activeProjectId} 
              onChange={(e) => setActiveProjectId(e.target.value)}
              style={{
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #475569',
                borderRadius: '10px',
                padding: '10px 14px',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
 
            <button 
              onClick={() => setIsModalOpen(true)}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)'
              }}
            >
              <Plus size={18} /> Добавить смену
            </button>
          </div>
        </header>
 
        {/* Analytics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <p style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', margin: 0 }}>Итого Заработано</p>
              <p style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', margin: '6px 0 0 0' }}>
                {monthTotals.totalAmount.toLocaleString()} ₽
              </p>
            </div>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px' }}>
              <DollarSign color="#10b981" size={28} />
            </div>
          </div>
 
          <div style={{
            backgroundColor: '#1e293b',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <p style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', margin: 0 }}>Часов Отработано</p>
              <p style={{ fontSize: '24px', fontWeight: '800', color: '#3b82f6', margin: '6px 0 0 0' }}>
                {monthTotals.totalHours} ч.
              </p>
            </div>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '12px' }}>
              <Clock color="#3b82f6" size={28} />
            </div>
          </div>
 
          <div style={{
            backgroundColor: '#1e293b',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <p style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', margin: 0 }}>Рабочие Дни</p>
              <p style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc', margin: '6px 0 0 0' }}>
                {monthTotals.workDays} дн.
              </p>
            </div>
            <div style={{ backgroundColor: 'rgba(248, 250, 252, 0.1)', padding: '12px', borderRadius: '12px' }}>
              <Calendar color="#cbd5e1" size={28} />
            </div>
          </div>
 
          <div style={{
            backgroundColor: '#1e293b',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <p style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', margin: 0 }}>Дни Сборов</p>
              <p style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b', margin: '6px 0 0 0' }}>
                {monthTotals.gatheringDays} дн.
              </p>
            </div>
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '12px' }}>
              <FileText color="#f59e0b" size={28} />
            </div>
          </div>
        </div>
 
        {/* Filters and Controls */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Месяц:</span>
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #475569',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
 
          <button 
            onClick={() => window.print()} 
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #475569',
              color: '#cbd5e1',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
          >
            <Printer size={16} /> Печать
          </button>
        </div>
 
        {/* Table */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          border: '1px solid #334155',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '16px' }}>Дата</th>
                  <th style={{ padding: '16px' }}>Тип</th>
                  <th style={{ padding: '16px' }}>Время</th>
                  <th style={{ padding: '16px' }}>Часы</th>
                  <th style={{ padding: '16px' }}>Ставка</th>
                  <th style={{ padding: '16px' }}>Сумма</th>
                  <th style={{ padding: '16px' }}>Примечание</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Удалить</th>
                </tr>
              </thead>
              <tbody>
                {filteredShifts.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                      Записей за выбранный период ({selectedMonth}) не найдено. Попробуйте сменить месяц.
                    </td>
                  </tr>
                ) : (
                  filteredShifts.map((shift) => (
                    <tr key={shift.id} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '16px', fontWeight: '600', color: '#ffffff' }}>{shift.date}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          backgroundColor: shift.type === 'gathering' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: shift.type === 'gathering' ? '#f59e0b' : '#60a5fa',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {shift.type === 'gathering' ? 'Сбор' : 'Работа'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#cbd5e1' }}>
                        {shift.startTime && shift.endTime ? `${shift.startTime} - ${shift.endTime}` : '—'}
                      </td>
                      <td style={{ padding: '16px', fontWeight: '700', color: '#38bdf8' }}>{shift.hours} ч.</td>
                      <td style={{ padding: '16px', color: '#94a3b8' }}>{shift.hourlyRate} ₽</td>
                      <td style={{ padding: '16px', fontWeight: '700', color: '#34d399' }}>{shift.amount} ₽</td>
                      <td style={{ padding: '16px', color: '#cbd5e1' }}>{shift.note || '—'}</td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleDelete(shift.id)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '6px'
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
 
      </div>
 
      {/* Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '440px',
            border: '1px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>Добавить Смену</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
 
            <form onSubmit={handleSaveNewShift} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Дата</label>
                <input 
                  type="date" 
                  value={formDate} 
                  onChange={(e) => setFormDate(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '10px',
                    boxSizing: 'border-box'
                  }}
                  required 
                />
              </div>
 
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Кол-во часов</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={formHours} 
                    onChange={(e) => setFormHours(Number(e.target.value))}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      padding: '10px',
                      boxSizing: 'border-box'
                    }}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Ставка (₽/ч)</label>
                  <input 
                    type="number" 
                    value={formRate} 
                    onChange={(e) => setFormRate(Number(e.target.value))}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      padding: '10px',
                      boxSizing: 'border-box'
                    }}
                    required 
                  />
                </div>
              </div>
 
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Начало</label>
                  <input 
                    type="time" 
                    value={formStartTime} 
                    onChange={(e) => setFormStartTime(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      padding: '10px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Конец</label>
                  <input 
                    type="time" 
                    value={formEndTime} 
                    onChange={(e) => setFormEndTime(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      padding: '10px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
 
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Тип смены</label>
                <select 
                  value={formType} 
                  onChange={(e) => setFormType(e.target.value as 'work' | 'gathering')}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '10px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="work">Рабочая смена</option>
                  <option value="gathering">Сбор / Выезд</option>
                </select>
              </div>
 
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>Примечание</label>
                <input 
                  type="text" 
                  placeholder="Например: Дневная смена"
                  value={formNote} 
                  onChange={(e) => setFormNote(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '10px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
 
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    backgroundColor: '#334155',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}