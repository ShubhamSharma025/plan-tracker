import React, { useState, useEffect } from 'react';
import { RefreshCw, BookOpen, Briefcase, Clock, CheckCircle2, Target } from 'lucide-react';
import { getOrCreateWeek } from '../database/db';
import { getSubtopicName } from '../utils/syllabusData';
import SpotlightCard from '../components/SpotlightCard';

export default function Status({ currentWeekId }) {
  const [weekData, setWeekData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const data = await getOrCreateWeek(currentWeekId);
      setWeekData(data);
    } catch (err) {
      console.error('Error loading Status page data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentWeekId]);

  // Helper to compute hours left
  const getHoursLeft = (weekId, deadlineDayKey) => {
    if (!weekId) return { text: '', isOverdue: false, hours: 0 };
    
    const daysOffset = {
      monday: 0,
      tuesday: 1,
      wednesday: 2,
      thursday: 3,
      friday: 4,
      saturday: 5,
      sunday: 6
    };
    
    const offsetDays = daysOffset[deadlineDayKey] !== undefined ? daysOffset[deadlineDayKey] : 6;
    const mondayDate = new Date(weekId);
    mondayDate.setHours(0, 0, 0, 0);
    
    const deadlineDate = new Date(mondayDate);
    deadlineDate.setDate(mondayDate.getDate() + offsetDays + 1);
    
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    const hours = Math.round(diffMs / (60 * 60 * 1000));
    
    if (diffMs <= 0) {
      return { text: 'Overdue', isOverdue: true, hours };
    }
    return { text: `${hours}h left`, isOverdue: false, hours };
  };

  if (isLoading || !weekData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <RefreshCw className="spin" style={{ color: 'var(--strava-orange)' }} size={32} />
        <span style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>Loading Targets status...</span>
      </div>
    );
  }

  // GATE variables
  const activeSubtopics = weekData.gate?.weeklySubtopics
    ? Object.keys(weekData.gate.weeklySubtopics)
        .map(key => {
          const item = weekData.gate.weeklySubtopics[key];
          const deadline = item.deadline || 'sunday';
          const name = getSubtopicName(key);
          const timeLeft = getHoursLeft(currentWeekId, deadline);
          return {
            id: key,
            name,
            deadline,
            completed: item.completed,
            timeLeft
          };
        })
        .filter(sub => !sub.completed)
    : [];

  const sortedActiveSubtopics = [...activeSubtopics].sort((a, b) => a.timeLeft.hours - b.timeLeft.hours);
  const closestSubtopic = sortedActiveSubtopics[0];

  // Jobs variables
  const jobsGoal = parseInt(weekData.job?.applicationsGoal) || 5;
  const jobsApplied = parseInt(weekData.job?.applications) || 0;
  const jobsLeft = Math.max(0, jobsGoal - jobsApplied);

  return (
    <>
      <header className="app-header">
        <div className="header-row">
          <div className="header-title-container">
            <svg className="header-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" style={{ width: '24px', height: '24px' }}>
              <polygon points="60,10 95,70 25,70" fill="var(--strava-orange)" />
              <polygon points="60,50 85,95 35,95" fill="var(--strava-orange)" opacity="0.6" />
            </svg>
            <h1 className="header-title">Target Status</h1>
          </div>
          <button 
            type="button" 
            className="week-nav-btn"
            onClick={() => loadData(true)}
            style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Fetch Latest Data"
          >
            <RefreshCw size={18} className={isRefreshing ? 'spin' : ''} />
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
          Real-time countdowns & weekly metrics
        </p>
      </header>

      {/* Two Card Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* GATE Card using SpotlightCard */}
        <SpotlightCard 
          spotlightColor="rgba(59, 130, 246, 0.18)"
          borderColor="rgba(59, 130, 246, 0.25)"
          style={{ borderTop: '3px solid var(--gate-blue)', cursor: 'default' }}
          padding="14px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BookOpen size={12} style={{ color: 'var(--gate-blue)' }} />
              GATE Time Left
            </span>
            
            {activeSubtopics.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', gap: '4px' }}>
                <CheckCircle2 size={24} style={{ color: 'var(--job-green)' }} />
                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', textAlign: 'center' }}>
                  All Completed!
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ 
                    fontFamily: 'var(--font-family-display)', 
                    fontSize: closestSubtopic.timeLeft.isOverdue ? '20px' : '28px', 
                    fontWeight: '900', 
                    color: closestSubtopic.timeLeft.isOverdue ? 'var(--danger-red)' : 'var(--warning-amber)' 
                  }}>
                    {closestSubtopic.timeLeft.hours <= 0 ? 'Overdue' : `${closestSubtopic.timeLeft.hours}h`}
                  </span>
                  {closestSubtopic.timeLeft.hours > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>left</span>
                  )}
                </div>
                <span style={{ 
                  fontSize: '11px', 
                  color: 'var(--text-primary)', 
                  fontWeight: '700',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: '4px'
                }} title={closestSubtopic.name}>
                  {closestSubtopic.name}
                </span>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>
                  Due {closestSubtopic.deadline}
                </span>
              </div>
            )}
          </div>
        </SpotlightCard>

        {/* Job Apply Card using SpotlightCard */}
        <SpotlightCard 
          spotlightColor="rgba(252, 97, 32, 0.18)"
          borderColor="rgba(252, 97, 32, 0.25)"
          style={{ borderTop: '3px solid var(--strava-orange)', cursor: 'default' }}
          padding="14px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Briefcase size={12} style={{ color: 'var(--strava-orange)' }} />
              Job Apply Left
            </span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ 
                  fontFamily: 'var(--font-family-display)', 
                  fontSize: jobsLeft === 0 ? '20px' : '28px', 
                  fontWeight: '900', 
                  color: jobsLeft === 0 ? 'var(--job-green)' : 'var(--strava-orange)' 
                }}>
                  {jobsLeft === 0 ? 'Met 🎉' : jobsLeft}
                </span>
                {jobsLeft > 0 && (
                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>left</span>
                )}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', marginTop: '4px' }}>
                Applied: {jobsApplied} / {jobsGoal}
              </span>
              
              <div className="job-progress-bar" style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '6px' }}>
                <div 
                  className="job-progress-fill" 
                  style={{ 
                    width: `${Math.min(100, Math.round((jobsApplied / jobsGoal) * 100))}%`, 
                    height: '100%', 
                    background: jobsLeft === 0 ? 'var(--job-green)' : 'var(--strava-orange)',
                    boxShadow: 'none'
                  }} 
                />
              </div>
            </div>
          </div>
        </SpotlightCard>
      </div>

      {/* Break Down of all active GATE Targets */}
      {activeSubtopics.length > 0 && (
        <div className="card" style={{ marginTop: '4px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={14} style={{ color: 'var(--gate-blue)' }} />
            Active Targets Break Down ({activeSubtopics.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeSubtopics.map((sub) => (
              <div 
                key={sub.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '10px',
                  padding: '10px 14px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '70%' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sub.name}>
                    {sub.name}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Deadline: {sub.deadline.toUpperCase()}
                  </span>
                </div>
                <div style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: sub.timeLeft.isOverdue ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  color: sub.timeLeft.isOverdue ? 'var(--danger-red)' : 'var(--warning-amber)',
                  border: sub.timeLeft.isOverdue ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em'
                }}>
                  {sub.timeLeft.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
