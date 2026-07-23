import React, { useState, useEffect } from 'react';
import { RefreshCw, BookOpen, Briefcase, CheckCircle2, Zap, Calendar, MessageSquare, AlertOctagon, Star } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { getOrCreateWeek, getAllWeeks } from '../database/db';

export default function Today({ currentWeekId }) {
  const [weekData, setWeekData] = useState(null);
  const [allWeeks, setAllWeeks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Reflections period tab: 'day', 'week', 'month'
  const [period, setPeriod] = useState('day');

  useEffect(() => {
    async function loadToday() {
      setIsLoading(true);
      try {
        const data = await getOrCreateWeek(currentWeekId);
        const list = await getAllWeeks();
        setWeekData(data);
        setAllWeeks(list || []);
      } catch (err) {
        console.error('Error loading Today view:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadToday();
  }, [currentWeekId]);

  // Resolve current date labels
  const daysOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayRawIndex = new Date().getDay(); // 0 (Sun) to 6 (Sat)
  const todayKey = daysOrder[todayRawIndex];
  const monToSunIndex = todayRawIndex === 0 ? 6 : todayRawIndex - 1; // Mon (0) to Sun (6)

  const dayLabel = todayKey.charAt(0).toUpperCase() + todayKey.slice(1);
  const dateStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  if (isLoading || !weekData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <RefreshCw className="spin" style={{ color: 'var(--strava-orange)' }} size={32} />
        <span style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>Loading Today's Activity...</span>
      </div>
    );
  }

  // Today metrics
  const studyToday = weekData.gate?.dailyHours?.[todayKey] || 0;
  const jobsToday = weekData.job?.dailyApplications?.[todayKey] || 0;
  const checklistToday = !!weekData.shared?.dailyMinimum?.[monToSunIndex];

  // Recharts line graph data mapping Mon-Sun
  const chartData = [
    { name: 'Mon', Study: weekData.gate?.dailyHours?.monday || 0, Jobs: weekData.job?.dailyApplications?.monday || 0 },
    { name: 'Tue', Study: weekData.gate?.dailyHours?.tuesday || 0, Jobs: weekData.job?.dailyApplications?.tuesday || 0 },
    { name: 'Wed', Study: weekData.gate?.dailyHours?.wednesday || 0, Jobs: weekData.job?.dailyApplications?.wednesday || 0 },
    { name: 'Thu', Study: weekData.gate?.dailyHours?.thursday || 0, Jobs: weekData.job?.dailyApplications?.thursday || 0 },
    { name: 'Fri', Study: weekData.gate?.dailyHours?.friday || 0, Jobs: weekData.job?.dailyApplications?.friday || 0 },
    { name: 'Sat', Study: weekData.gate?.dailyHours?.saturday || 0, Jobs: weekData.job?.dailyApplications?.saturday || 0 },
    { name: 'Sun', Study: weekData.gate?.dailyHours?.sunday || 0, Jobs: weekData.job?.dailyApplications?.sunday || 0 }
  ];

  // Reflections extraction utility
  const getDailyLog = (week, dayKey) => {
    const revised = week.gate?.dailyRevisedTopics?.[dayKey] || '';
    const blocker = week.shared?.dailyBlockerNotes?.[dayKey] || '';
    const confidence = week.gate?.dailyConfidence?.[dayKey] || [];

    if (!revised && !blocker && confidence.length === 0) return null;

    const capDayName = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
    return {
      dayKey,
      dayLabel: capDayName,
      weekLabel: week.weekStart,
      revised,
      blocker,
      confidence
    };
  };

  // Compile reflection list based on active period
  const getReflectionsFeed = () => {
    const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    if (period === 'day') {
      const log = getDailyLog(weekData, todayKey);
      return log ? [log] : [];
    }

    if (period === 'week') {
      return weekDays.map(day => getDailyLog(weekData, day)).filter(Boolean);
    }

    if (period === 'month') {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthWeeks = allWeeks.filter(w => {
        const d = new Date(w.id);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const list = [];
      for (const w of monthWeeks) {
        for (const day of weekDays) {
          const log = getDailyLog(w, day);
          if (log) list.push(log);
        }
      }
      return list;
    }

    return [];
  };

  const feedItems = getReflectionsFeed();

  return (
    <>
      <header className="app-header">
        <div className="header-row">
          <div className="header-title-container">
            <svg className="header-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" style={{ width: '24px', height: '24px' }}>
              <polygon points="60,10 95,70 25,70" fill="var(--strava-orange)" />
              <polygon points="60,50 85,95 35,95" fill="var(--strava-orange)" opacity="0.6" />
            </svg>
            <h1 className="header-title">Today's Activity</h1>
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
          {dayLabel}, {dateStr}
        </p>
      </header>

      {/* Today Only Statistics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center', borderTop: '3px solid var(--gate-blue)' }}>
          <BookOpen size={24} style={{ color: 'var(--gate-blue)' }} />
          <div>
            <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Study Time Today
            </span>
            <div style={{ fontFamily: 'var(--font-family-display)', fontSize: '28px', fontWeight: '800', marginTop: '2px', color: 'var(--text-primary)' }}>
              {studyToday}h
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center', borderTop: '3px solid var(--strava-orange)' }}>
          <Briefcase size={24} style={{ color: 'var(--strava-orange)' }} />
          <div>
            <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Applications Today
            </span>
            <div style={{ fontFamily: 'var(--font-family-display)', fontSize: '28px', fontWeight: '800', marginTop: '2px', color: 'var(--text-primary)' }}>
              {jobsToday}
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Today Banner */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} style={{ color: checklistToday ? 'var(--job-green)' : 'var(--text-muted)' }} />
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
            Daily minimum standards met:
          </span>
        </div>
        <span style={{ fontSize: '14px', fontWeight: '800', color: checklistToday ? 'var(--job-green)' : 'var(--text-muted)' }}>
          {checklistToday ? 'MET ✓' : 'INCOMPLETE ✗'}
        </span>
      </div>

      {/* Weekly Line Graph Card */}
      <div className="card">
        <h3 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.03em' }}>
          <Zap size={16} style={{ color: 'var(--strava-orange)' }} />
          Weekly Status Trend
        </h3>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Mon-Sun study hours vs job applications sent
        </span>
        
        <div className="chart-container" style={{ height: '200px', marginTop: '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '8px' }}
                labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
              
              <Line 
                type="monotone" 
                dataKey="Study" 
                stroke="var(--gate-blue)" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 1 }} 
                activeDot={{ r: 6 }} 
                name="GATE Study (h)" 
              />
              
              <Line 
                type="monotone" 
                dataKey="Jobs" 
                stroke="var(--strava-orange)" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 1 }} 
                activeDot={{ r: 6 }} 
                name="Job Applications" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reflections Log Feed */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Card Header & Toggle Period Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.03em', margin: 0 }}>
            <MessageSquare size={16} style={{ color: 'var(--strava-orange)' }} />
            Reflections & Notes
          </h3>
          
          <div style={{ display: 'flex', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '2px' }}>
            {['day', 'week', 'month'].map(p => (
              <button
                key={p}
                type="button"
                className={`target-toggle-btn ${period === p ? 'active' : ''}`}
                style={{ 
                  fontSize: '9px', 
                  padding: '4px 10px', 
                  borderRadius: '6px', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontWeight: '800',
                  textTransform: 'uppercase'
                }}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Reflections timeline list */}
        {feedItems.length === 0 ? (
          <div style={{ background: 'var(--input-bg)', border: '1px dashed var(--card-border)', borderRadius: '10px', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No reflections or revised topics logged for this {period} period yet.<br />
            <span style={{ color: 'var(--strava-orange)', fontWeight: 'bold' }}>Log them in the Record tab</span> under Daily Reflections.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {feedItems.map((item, idx) => (
              <div 
                key={idx} 
                style={{ 
                  borderLeft: '3px solid var(--strava-orange)', 
                  paddingLeft: '12px', 
                  paddingVertical: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                    {item.dayLabel}
                  </span>
                  {period === 'month' && (
                    <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Week of {item.weekLabel}
                    </span>
                  )}
                </div>

                {item.revised && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    <CheckCircle2 size={13} style={{ color: 'var(--gate-blue)', marginTop: '2px', flexShrink: 0 }} />
                    <span>
                      <strong style={{ color: 'var(--text-primary)' }}>Revised:</strong> {item.revised}
                    </span>
                  </div>
                )}

                {item.blocker && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    <AlertOctagon size={13} style={{ color: 'var(--warning-amber)', marginTop: '2px', flexShrink: 0 }} />
                    <span>
                      <strong style={{ color: 'var(--text-primary)' }}>Blockers:</strong> {item.blocker}
                    </span>
                  </div>
                )}

                {item.confidence && item.confidence.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                    {item.confidence.map((conf, confIdx) => (
                      <div key={confIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <Star size={13} style={{ color: '#FBBF24', fill: '#FBBF24', flexShrink: 0 }} />
                        <span>
                          <strong style={{ color: 'var(--text-primary)' }}>{conf.topic}:</strong> {conf.rating}/5 stars
                        </span>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

      </div>
    </>
  );
}
