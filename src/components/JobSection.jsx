import React, { useState } from 'react';
import { ChevronDown, Briefcase } from 'lucide-react';

export default function JobSection({ data, onChange, selectedDay }) {
  const [isOpen, setIsOpen] = useState(true);

  const updateField = (field, value) => {
    onChange('job', {
      ...data,
      [field]: value
    });
  };

  const adjustGoal = (delta) => {
    const current = parseInt(data.applicationsGoal) || 5; // Default goal is 5
    updateField('applicationsGoal', Math.max(1, current + delta));
  };

  const handleDailyAppsAdjust = (delta) => {
    const dailyApplications = data.dailyApplications || {
      monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0
    };
    const currentVal = parseInt(dailyApplications[selectedDay]) || 0;
    const newVal = Math.max(0, currentVal + delta);
    
    const updatedDailyApps = {
      ...dailyApplications,
      [selectedDay]: newVal
    };
    
    // Automatically recalculate weekly applications sum
    const totalApps = Object.values(updatedDailyApps).reduce((sum, val) => sum + val, 0);
    
    onChange('job', {
      ...data,
      dailyApplications: updatedDailyApps,
      applications: totalApps
    });
  };

  const dailyApplications = data.dailyApplications || {
    monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0
  };
  const todayApps = dailyApplications[selectedDay] || 0;
  const applied = parseInt(data.applications) || 0;
  const goal = parseInt(data.applicationsGoal) || 5;
  const percent = goal > 0 ? Math.min(100, Math.round((applied / goal) * 100)) : 0;
  const dayNameCapitalized = selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1);

  return (
    <div className="card job-section">
      <div className="section-header" onClick={() => setIsOpen(!isOpen)}>
        <h2 className="section-title job-text">
          <Briefcase size={20} />
          Job Outreach Tracker
        </h2>
        <ChevronDown className={`chevron-icon ${isOpen ? 'open' : ''}`} size={20} />
      </div>

      {isOpen && (
        <div className="section-content">
          
          {/* Target Applications Goal */}
          <div className="form-group">
            <label className="form-label">Weekly Application Goal</label>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              background: 'var(--input-bg)', 
              border: '1px solid var(--card-border)', 
              borderRadius: '12px', 
              padding: '14px 16px' 
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Weekly Outreach Goal
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Target job applications to complete this week
                </span>
              </div>
              
              <div className="number-control" style={{ gap: '4px' }}>
                <button
                  type="button"
                  className="btn-counter"
                  style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                  onClick={() => adjustGoal(-1)}
                >
                  -
                </button>
                <span style={{ fontSize: '16px', fontWeight: '800', minWidth: '32px', textAlign: 'center', color: 'var(--text-primary)' }}>
                  {goal}
                </span>
                <button
                  type="button"
                  className="btn-counter"
                  style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                  onClick={() => adjustGoal(1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Daily Applications Sent for selectedDay */}
          <div className="form-group" style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
            <label className="form-label">Applications Sent</label>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-4px', marginBottom: '8px' }}>
              Log outreach completed on {dayNameCapitalized}
            </span>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              background: 'var(--input-bg)', 
              border: '1px solid var(--card-border)', 
              borderRadius: '12px', 
              padding: '14px 16px' 
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Briefcase size={16} style={{ color: 'var(--strava-orange)' }} />
                  Applications on {dayNameCapitalized}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Weekly total sent: {applied} / {goal}
                </span>
              </div>
              
              <div className="number-control" style={{ gap: '4px' }}>
                <button
                  type="button"
                  className="btn-counter"
                  style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                  onClick={() => handleDailyAppsAdjust(-1)}
                >
                  -
                </button>
                <span style={{ fontSize: '16px', fontWeight: '800', minWidth: '32px', textAlign: 'center', color: 'var(--strava-orange)' }}>
                  {todayApps}
                </span>
                <button
                  type="button"
                  className="btn-counter"
                  style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                  onClick={() => handleDailyAppsAdjust(1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Progress gauge bar */}
          <div className="job-progress-container" style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
            <div className="job-progress-text">
              <span>Goal Fulfillment</span>
              <span style={{ color: 'var(--strava-orange)' }}>{applied} / {goal} ({percent}%)</span>
            </div>
            <div className="job-progress-bar">
              <div className="job-progress-fill" style={{ width: `${percent}%`, boxShadow: '0 0 10px rgba(252, 97, 32, 0.45)' }} />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
