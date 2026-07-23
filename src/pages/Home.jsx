import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, RefreshCw, AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';
import { getOrCreateWeek, saveWeek } from '../database/db';
import { formatDateLabel, getPreviousWeek, getNextWeek } from '../utils/dateUtils';
import GateSection from '../components/GateSection';
import JobSection from '../components/JobSection';
import SharedSection from '../components/SharedSection';
import Revision from './Revision';

export default function Home({ currentWeekId, setCurrentWeekId }) {
  const [weekData, setWeekData] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const [pendingData, setPendingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Toggle state to embed Revision Loop on top right
  const [showRevision, setShowRevision] = useState(false);

  // Day Selector state defaulting to today's weekday
  const daysOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayRawIndex = new Date().getDay(); // 0 (Sun) to 6 (Sat)
  const todayKey = daysOrder[todayRawIndex];
  const [selectedDay, setSelectedDay] = useState(todayKey);

  // Load week data whenever currentWeekId changes
  useEffect(() => {
    let active = true;

    async function loadWeek() {
      setIsLoading(true);
      try {
        // Save pending data before navigating
        if (pendingData) {
          await saveWeek(pendingData);
          setPendingData(null);
          setSaveStatus('saved');
        }

        const data = await getOrCreateWeek(currentWeekId);
        if (active) {
          setWeekData(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading week:', err);
        setIsLoading(false);
      }
    }

    loadWeek();

    return () => {
      active = false;
    };
  }, [currentWeekId]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!pendingData) return;

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await saveWeek(pendingData);
        setSaveStatus('saved');
        setPendingData(null);
      } catch (err) {
        console.error('Auto-save error:', err);
        setSaveStatus('error');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [pendingData]);

  const handleSectionChange = (sectionKey, sectionData) => {
    if (!weekData) return;

    const updatedWeek = {
      ...weekData,
      [sectionKey]: sectionData
    };

    setWeekData(updatedWeek);
    setPendingData(updatedWeek);
  };

  const handlePrevWeek = async () => {
    const prevId = getPreviousWeek(currentWeekId);
    if (pendingData) {
      await saveWeek(pendingData);
      setPendingData(null);
      setSaveStatus('saved');
    }
    setCurrentWeekId(prevId);
  };

  const handleNextWeek = async () => {
    const nextId = getNextWeek(currentWeekId);
    if (pendingData) {
      await saveWeek(pendingData);
      setPendingData(null);
      setSaveStatus('saved');
    }
    setCurrentWeekId(nextId);
  };

  // Immediate save on opening revision overlay
  const handleOpenRevision = async () => {
    if (pendingData) {
      await saveWeek(pendingData);
      setPendingData(null);
      setSaveStatus('saved');
    }
    setShowRevision(true);
  };

  if (isLoading || !weekData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '16px' }}>
        <RefreshCw className="saving" style={{ animation: 'spin 1.5s linear infinite' }} size={32} />
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading Week Tracker...</span>
      </div>
    );
  }

  const label = formatDateLabel(currentWeekId);

  const days = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' }
  ];

  // If revision page overlay is toggled active
  if (showRevision) {
    return (
      <>
        <header className="app-header">
          <div className="header-row" style={{ justifyContent: 'flex-start', gap: '16px' }}>
            <button 
              type="button" 
              className="week-nav-btn" 
              onClick={() => setShowRevision(false)}
              aria-label="Back to inputs"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="header-title" style={{ fontSize: '20px' }}>Revision Loop</h1>
          </div>
        </header>
        <Revision embed={true} currentWeekId={weekData.id} />
      </>
    );
  }

  return (
    <>
      {/* Header section with title, auto-save indicator, and top-right Revision button */}
      <header className="app-header">
        <div className="header-row">
          <div className="header-title-container">
            <svg className="header-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" style={{ width: '24px', height: '24px' }}>
              <polygon points="60,10 95,70 25,70" fill="var(--strava-orange)" />
              <polygon points="60,50 85,95 35,95" fill="var(--strava-orange)" opacity="0.6" />
            </svg>
            <h1 className="header-title">Record Session</h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Save Status Indicators */}
            <div className={`save-indicator ${saveStatus}`} style={{ fontSize: '11px' }}>
              {saveStatus === 'saving' && <RefreshCw size={12} className="spin" />}
              {saveStatus === 'saved' && <CheckCircle size={12} />}
              {saveStatus === 'error' && <AlertTriangle size={12} style={{ color: 'var(--danger-red)' }} />}
            </div>

            {/* Revision Loop Trigger Button */}
            <button
              type="button"
              className="week-nav-btn"
              style={{ width: '36px', height: '36px', borderColor: 'var(--strava-orange)', color: 'var(--strava-orange)', background: 'var(--strava-orange-light)' }}
              onClick={handleOpenRevision}
              title="Open Revision Loop"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        {/* Date / Week navigation bar */}
        <div className="week-navigation">
          <button 
            type="button" 
            className="week-nav-btn" 
            onClick={handlePrevWeek}
            aria-label="Previous Week"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="week-label">{label}</span>
          <button 
            type="button" 
            className="week-nav-btn" 
            onClick={handleNextWeek}
            aria-label="Next Week"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day Selector Tab-Bar */}
        <div style={{ 
          display: 'flex', 
          background: 'rgba(28, 28, 30, 0.75)', 
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.05)', 
          borderRadius: '12px', 
          padding: '4px',
          marginTop: '12px',
          justifyContent: 'space-around',
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.02), 0 8px 24px rgba(0, 0, 0, 0.25)'
        }}>
          {days.map((d) => {
            const isSelected = selectedDay === d.key;
            const isActualToday = todayKey === d.key;
            return (
              <button
                key={d.key}
                type="button"
                style={{
                  flex: 1,
                  padding: '10px 0',
                  border: 'none',
                  background: isSelected ? 'linear-gradient(135deg, var(--strava-orange) 0%, #ff7849 100%)' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  boxShadow: isSelected ? '0 4px 12px rgba(252, 97, 32, 0.35)' : 'none',
                  transform: isSelected ? 'scale(1.02)' : 'none'
                }}
                onClick={() => setSelectedDay(d.key)}
              >
                {d.label}
                {isActualToday && (
                  <span style={{ 
                    width: '4px', 
                    height: '4px', 
                    borderRadius: '50%', 
                    background: isSelected ? '#ffffff' : 'var(--strava-orange)',
                    position: 'absolute',
                    bottom: '3px'
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* GATE Tracker */}
      <GateSection 
        data={weekData.gate} 
        onChange={handleSectionChange}
        selectedDay={selectedDay}
        currentWeekId={weekData.id}
      />

      {/* Job Search Tracker */}
      <JobSection 
        data={weekData.job} 
        onChange={handleSectionChange}
        selectedDay={selectedDay}
      />

      {/* Shared Tracking & Reflection Section */}
      <SharedSection 
        sharedData={weekData.shared}
        gateData={weekData.gate}
        jobData={weekData.job}
        onSharedChange={handleSectionChange}
        onGateChange={handleSectionChange}
        onJobChange={handleSectionChange}
        selectedDay={selectedDay}
      />
    </>
  );
}
