import React, { useState } from 'react';
import { ChevronDown, Sliders, Check } from 'lucide-react';
import ReflectionModal from './ReflectionModal';

export default function SharedSection({ 
  sharedData, 
  gateData, 
  jobData, 
  onSharedChange, 
  onGateChange, 
  onJobChange,
  selectedDay
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Map day keys to Mon-Sun index (0 to 6)
  const dayIndexMap = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6
  };
  const activeIndex = dayIndexMap[selectedDay] !== undefined ? dayIndexMap[selectedDay] : 0;
  const dayNameCapitalized = selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1);

  // Toggle checklist for the active selected day
  const toggleActiveDayChecklist = () => {
    const manualDailyMinimum = [...(sharedData.manualDailyMinimum || sharedData.dailyMinimum || [false, false, false, false, false, false, false])];
    manualDailyMinimum[activeIndex] = !manualDailyMinimum[activeIndex];
    
    const planned = parseInt(gateData.plannedHours) || 0;
    const actual = parseFloat(gateData.actualHours) || 0;
    const hasMetGoal = planned > 0 && actual >= planned;

    onSharedChange('shared', {
      ...sharedData,
      manualDailyMinimum,
      dailyMinimum: hasMetGoal 
        ? [true, true, true, true, true, true, true] 
        : manualDailyMinimum
    });
  };

  // Update GATE planned hours
  const handleGatePlannedHoursAdjust = (delta) => {
    const current = parseInt(gateData.plannedHours) || 0;
    const hrs = Math.max(0, current + delta);
    onGateChange('gate', {
      ...gateData,
      plannedHours: hrs
    });
  };

  const isChecked = !!sharedData.dailyMinimum?.[activeIndex];

  return (
    <div className="card shared-section">
      <div className="section-header" onClick={() => setIsOpen(!isOpen)}>
        <h2 className="section-title" style={{ color: 'var(--text-primary)' }}>
          <Sliders size={20} />
          Shared Tracking & Reflection
        </h2>
        <ChevronDown className={`chevron-icon ${isOpen ? 'open' : ''}`} size={20} />
      </div>

      {isOpen && (
        <div className="section-content">
          
          {/* Daily Minimum Checklist Row for selected day */}
          <div className="form-group">
            <label className="form-label">Daily Minimum Checklist</label>
            
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                background: isChecked ? 'rgba(16, 185, 129, 0.05)' : 'var(--input-bg)', 
                border: isChecked ? '1.5px solid rgba(16, 185, 129, 0.45)' : '1px solid var(--card-border)', 
                borderRadius: '12px', 
                padding: '14px 16px', 
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isChecked ? '0 4px 15px rgba(16, 185, 129, 0.08)' : 'none',
                transform: isChecked ? 'scale(1.01)' : 'none'
              }} 
              onClick={toggleActiveDayChecklist}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: isChecked ? 'var(--job-green)' : 'var(--text-primary)' }}>
                  Daily Minimum Standards
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Mark if checklist items were completed on {dayNameCapitalized}
                </span>
              </div>

              {/* Circular Checklist check bubble */}
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '1.5px solid ' + (isChecked ? 'var(--job-green)' : 'var(--input-border)'),
                background: isChecked ? 'var(--job-green)' : 'var(--card-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0
              }}>
                <Check size={14} strokeWidth={3.5} />
              </div>
            </div>
          </div>

          {/* Daily Reflection Button */}
          <div className="form-group" style={{ borderTop: '1px dashed var(--card-border)', paddingTop: '16px', margin: 0 }}>
            <button
              type="button"
              className="btn-secondary"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                height: '44px',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '13px',
                border: '1px solid var(--strava-orange)',
                color: 'var(--strava-orange)',
                background: 'rgba(252, 97, 32, 0.05)'
              }}
              onClick={() => setModalOpen(true)}
            >
              📝 Log Daily Reflection for {dayNameCapitalized}
            </button>
          </div>

          {/* Planned vs Actual hours */}
          <div className="form-group" style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
            <label className="form-label">Planned vs Actual Hours (Weekly Sum)</label>
            
            {/* GATE Preparation Hours */}
            <div style={{ background: 'var(--input-bg)', padding: '14px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <div style={{ fontWeight: '800', fontSize: '11px', color: 'var(--gate-blue)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                GATE PREPARATION
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Planned Goal:</span>
                  <div className="number-control" style={{ gap: '4px', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="btn-counter"
                      style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                      onClick={() => handleGatePlannedHoursAdjust(-1)}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '15px', fontWeight: '800', minWidth: '40px', textAlign: 'center', color: 'var(--text-primary)' }}>
                      {gateData.plannedHours || 0}h
                    </span>
                    <button
                      type="button"
                      className="btn-counter"
                      style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                      onClick={() => handleGatePlannedHoursAdjust(1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Actual Logged:</span>
                  <div 
                    className="input-field" 
                    style={{ 
                      minHeight: '40px', 
                      marginTop: '4px', 
                      padding: '8px 12px', 
                      background: 'rgba(255, 255, 255, 0.02)',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      fontWeight: '800',
                      borderRadius: '8px',
                      border: '1px solid var(--card-border)'
                    }}
                  >
                    {gateData.actualHours || 0} hrs
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Reflection Overlay Modal */}
      <ReflectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedDay={selectedDay}
        gateData={gateData}
        sharedData={sharedData}
        onGateChange={onGateChange}
        onSharedChange={onSharedChange}
      />
    </div>
  );
}
