import React, { useState, useEffect } from 'react';
import { ThumbsUp, Compass, MessageSquare, Share2, Plus, Play } from 'lucide-react';
import { getAllWeeks, saveWeek } from '../database/db';
import { formatDateLabel } from '../utils/dateUtils';

export default function History({ onOpenWeek }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const weeks = await getAllWeeks();
        setHistory(weeks);
      } catch (err) {
        console.error('Error loading history:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  const handleKudos = async (e, week) => {
    e.stopPropagation(); // Avoid triggering openWeek
    const updatedWeek = {
      ...week,
      kudos: (week.kudos || 0) + 1
    };
    try {
      await saveWeek(updatedWeek);
      setHistory(prev => prev.map(w => w.id === week.id ? updatedWeek : w));
    } catch (err) {
      console.error('Error incrementing kudos:', err);
    }
  };

  // Helper to generate a simulated GPS workout path from daily hours
  const generateGpsPath = (dailyHours) => {
    const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const hours = daysOrder.map(day => dailyHours?.[day] || 0);
    
    // We map 7 days into a 280x80 box
    const paddingX = 40;
    const width = 200;
    const height = 80;
    
    const points = hours.map((h, i) => {
      const x = paddingX + (i * (width / 6));
      // Base line is near the bottom (y=65). Hours pull it up. Max height=20.
      const y = 65 - Math.min(45, h * 6);
      return { x, y };
    });

    // Make it wind organically like a trail run route
    let pathStr = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      // Wiggle coordinates slightly to simulate GPS tracking imperfections
      const wiggleX = (i === 6) ? p.x : p.x + (Math.sin(i * 1.8) * 6);
      const wiggleY = p.y + (Math.cos(i * 2.3) * 5);
      pathStr += ` C ${points[i-1].x + 15} ${points[i-1].y}, ${wiggleX - 15} ${wiggleY}, ${wiggleX} ${wiggleY}`;
    }
    
    return { pathStr, points };
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Loading athletic feed...</span>
      </div>
    );
  }

  return (
    <>
      <header className="app-header">
        <div className="header-row">
          <div className="header-title-container">
            <svg className="header-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" style={{ width: '24px', height: '24px' }}>
              <polygon points="60,10 95,70 25,70" fill="var(--strava-orange)" />
              <polygon points="60,50 85,95 35,95" fill="var(--strava-orange)" opacity="0.6" />
            </svg>
            <h1 className="header-title">Athlete Feed</h1>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
          Weekly activities completed by you
        </p>
      </header>

      {history.length === 0 ? (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', textAlign: 'center', gap: '16px' }}>
          <Compass size={40} style={{ color: 'var(--strava-orange)' }} />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>No Workouts Logged</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Record your first weekly activity session. Head over to the "Record" tab to start tracking!
            </p>
          </div>
        </div>
      ) : (
        <div className="history-list" style={{ gap: '16px' }}>
          {history.map((week) => {
            const weekLabel = formatDateLabel(week.id);
            const gateHours = Object.values(week.gate?.dailyHours || {}).reduce((s, h) => s + h, 0);
            const jobApps = week.job?.applications || 0;
            const questions = week.gate?.questionsSolved || 0;
            const streakCount = (week.shared?.dailyMinimum || []).filter(Boolean).length;
            
            // Build dynamic text tags based on topics
            const completedTag = week.gate?.completedTopics
              ? `Finished ${week.gate.completedTopics.split('\n')[0]}`
              : 'Grit and Study Session';
            
            const { pathStr, points } = generateGpsPath(week.gate?.dailyHours);

            return (
              <div 
                key={week.id} 
                className="feed-card"
                onClick={() => onOpenWeek(week.id)}
              >
                {/* Athlete Header block */}
                <div className="feed-card-header">
                  <div className="athlete-avatar">ME</div>
                  <div className="athlete-info">
                    <span className="athlete-name">Plan Tracker Athlete</span>
                    <span className="feed-time">Week of {weekLabel}</span>
                  </div>
                </div>

                {/* Workout Title */}
                <h3 className="feed-activity-title">
                  🏃‍♂️ Weekly Goal Sprint: {completedTag}
                </h3>

                {/* Telemetry Stats Split (Distance | Pace | Time style) */}
                <div className="telemetry-grid">
                  <div className="telemetry-item">
                    <span className="telemetry-value">{gateHours}h</span>
                    <span className="telemetry-label">Study Time</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="telemetry-value">{questions}</span>
                    <span className="telemetry-label">Questions</span>
                  </div>
                  <div className="telemetry-item">
                    <span className="telemetry-value">{jobApps}</span>
                    <span className="telemetry-label">Job Apps</span>
                  </div>
                </div>

                {/* Simulated GPS map route */}
                <div className="gps-route-container">
                  <span className="gps-map-badge">Route: Study Consistency</span>
                  <svg className="gps-route-svg">
                    {/* Winding road path */}
                    <path className="gps-path" d={pathStr} />
                    
                    {/* Start Marker (Green Dot) */}
                    <circle 
                      cx={points[0].x} 
                      cy={points[0].y} 
                      r="6" 
                      className="gps-marker-start" 
                    />
                    
                    {/* End Marker (Red Dot) */}
                    <circle 
                      cx={points[points.length-1].x} 
                      cy={points[points.length-1].y} 
                      r="6" 
                      className="gps-marker-end" 
                    />
                  </svg>
                </div>

                {/* Streak description text */}
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Daily minimum met: <strong>{streakCount}/7 days</strong></span>
                  <span style={{ color: 'var(--strava-orange)', fontWeight: '700' }}>
                    {streakCount >= 5 ? '🏆 Great Pace' : '⚡ Recovering'}
                  </span>
                </div>

                {/* Kudos and Comments interaction footer */}
                <div className="kudos-section">
                  <button 
                    type="button" 
                    className={`kudos-btn ${week.kudos > 0 ? 'liked' : ''}`}
                    onClick={(e) => handleKudos(e, week)}
                  >
                    <ThumbsUp className="kudos-icon-svg" size={16} />
                    <span>Kudos</span>
                  </button>
                  <span className="kudos-count-text">
                    {week.kudos || 0} {week.kudos === 1 ? 'person gave Kudos' : 'athletes gave Kudos'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
