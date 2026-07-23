import React, { useState, useEffect } from 'react';
import { AlertTriangle, BookOpen, Briefcase, Calendar, Award } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { getAllWeeks } from '../database/db';
import { getWarnings, getTrendsData } from '../utils/analytics';
import { formatDateLabel } from '../utils/dateUtils';

export default function Review({ onOpenWeek }) {
  const [weeks, setWeeks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAllWeeks();
        setWeeks(data);
      } catch (err) {
        console.error('Error loading review data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Loading athletic progress...</span>
      </div>
    );
  }

  // Fallback if no weeks are tracked yet
  if (weeks.length === 0) {
    return (
      <>
        <header className="app-header">
          <div className="header-row">
            <h1 className="header-title">Progress</h1>
          </div>
        </header>
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <Calendar size={48} style={{ color: 'var(--strava-orange)' }} />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>No Fitness Stats Yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              We need at least one completed week of logs to compute your relative study efforts.
            </p>
          </div>
        </div>
      </>
    );
  }

  const activeWeek = weeks[0];
  const activeWeekLabel = formatDateLabel(activeWeek.id);

  // Compute metrics
  const gatePlanned = activeWeek.gate?.plannedHours || 0;
  const gateActual = activeWeek.gate?.actualHours || 0;

  const jobPlanned = activeWeek.job?.plannedHours || 0;
  const jobActual = activeWeek.job?.actualHours || 0;

  const dailyMinimums = activeWeek.shared?.dailyMinimum || [false, false, false, false, false, false, false];
  const streakCount = dailyMinimums.filter(Boolean).length;

  const warnings = getWarnings(weeks);
  const trendsData = getTrendsData(weeks, 4);

  const getProgressPercentage = (actual, planned) => {
    if (!planned) return actual > 0 ? 100 : 0;
    return Math.min(100, Math.round((actual / planned) * 100));
  };

  return (
    <>
      <header className="app-header">
        <div className="header-row">
          <div>
            <h1 className="header-title" style={{ fontSize: '24px', letterSpacing: '0.02em', background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Relative Progress
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Current stats: Week of {activeWeekLabel}
            </p>
          </div>
        </div>
      </header>

      {/* Observations */}
      <div className="card">
        <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          <AlertTriangle size={16} style={{ color: warnings.length > 0 ? 'var(--strava-orange)' : 'var(--text-muted)' }} />
          Consistency Observations
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {warnings.map((w) => (
            <div key={w.id} className="warning-card">
              <AlertTriangle className="warning-icon" size={18} />
              <div className="warning-content">
                <span className="warning-title">{w.title}</span>
                <span className="warning-text">{w.message}</span>
              </div>
            </div>
          ))}
          {warnings.length === 0 && (
            <div className="no-warnings">
              Zero training flags raised. Pace is perfect!
            </div>
          )}
        </div>
      </div>

      {/* Goal Splits */}
      <div className="card">
        <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          <Award size={16} style={{ color: 'var(--strava-orange)' }} />
          Weekly Target Progress
        </h3>
        
        <div className="review-metric-compare">
          {/* GATE */}
          <div className="compare-row">
            <div className="compare-label-row" style={{ fontSize: '13px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gate-blue)', fontWeight: '800' }}>
                <BookOpen size={14} /> GATE PREP
              </span>
              <span style={{ fontWeight: '700' }}>
                {gateActual}h / <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>{gatePlanned}h goal</span>
              </span>
            </div>
            <div className="progress-bar-container" style={{ height: '10px' }}>
              <div 
                className="progress-bar-fill gate" 
                style={{ width: `${getProgressPercentage(gateActual, gatePlanned)}%`, backgroundColor: 'var(--gate-blue)', boxShadow: '0 0 6px rgba(59, 130, 246, 0.4)' }}
              />
            </div>
          </div>

          {/* Job Search */}
          <div className="compare-row" style={{ marginTop: '12px' }}>
            <div className="compare-label-row" style={{ fontSize: '13px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--job-green)', fontWeight: '800' }}>
                <Briefcase size={14} /> JOB OUTREACH
              </span>
              <span style={{ fontWeight: '700' }}>
                {jobActual}h / <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>{jobPlanned}h goal</span>
              </span>
            </div>
            <div className="progress-bar-container" style={{ height: '10px' }}>
              <div 
                className="progress-bar-fill job" 
                style={{ width: `${getProgressPercentage(jobActual, jobPlanned)}%`, backgroundColor: 'var(--job-green)', boxShadow: '0 0 6px rgba(16, 185, 129, 0.4)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Consistency Streak (Daily Minimum) */}
      <div className="card">
        <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Weekly Relative Effort
        </h3>
        
        <div style={{ display: 'flex', gap: '6px', margin: '14px 0' }}>
          {dailyMinimums.map((done, i) => (
            <div 
              key={i} 
              style={{
                flex: 1,
                height: '12px',
                borderRadius: '4px',
                backgroundColor: done ? 'var(--strava-orange)' : 'var(--input-bg)',
                border: done ? 'none' : '1px solid var(--input-border)',
                boxShadow: done ? '0 0 10px rgba(252, 97, 32, 0.5)' : 'none',
                transition: 'all 0.3s'
              }}
              title={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
            />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>Day Checklist Streak:</span>
          <span style={{ fontWeight: '800', color: streakCount >= 5 ? 'var(--strava-orange)' : 'var(--warning-amber)' }}>
            {streakCount} / 7 Days Complete
          </span>
        </div>
      </div>

      {/* Trends Graphs */}
      {trendsData.length > 0 && (
        <>
          {/* Study hours trend */}
          <div className="card">
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Study Hours History
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Weekly GATE preparation volume
            </span>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stravaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--strava-orange)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--strava-orange)" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '8px' }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                    itemStyle={{ color: 'var(--strava-orange)' }}
                  />
                  <Area type="monotone" dataKey="gateHours" stroke="var(--strava-orange)" strokeWidth={3} fillOpacity={1} fill="url(#stravaGrad)" name="Hours" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Job Applications Trend */}
          <div className="card">
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Job Outreach History
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Weekly applications logged
            </span>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '8px' }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                    itemStyle={{ color: 'var(--strava-orange)' }}
                  />
                  <Area type="monotone" dataKey="applications" stroke="var(--strava-orange)" strokeWidth={3} fillOpacity={1} fill="url(#stravaGrad)" name="Applications" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </>
  );
}
