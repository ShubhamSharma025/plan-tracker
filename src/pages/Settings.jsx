import React, { useRef, useState, useEffect } from 'react';
import { Moon, Sun, Download, Upload, Trash2, ShieldAlert, Check, Calendar, BarChart2, Zap, RefreshCw } from 'lucide-react';
import { db, getAllWeeks } from '../database/db';
import { exportToJSON, exportToCSV } from '../utils/export';

export default function Settings({ theme, setTheme }) {
  const fileInputRef = useRef(null);
  const [weeks, setWeeks] = useState([]);
  const [importStatus, setImportStatus] = useState(null); // null, 'success', 'error'
  const [importError, setImportError] = useState('');

  // Updates checking states
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const APP_VERSION = 'v1.2.0';
  const BUILD_DATE = 'July 23, 2026 - 21:00';

  // Load all weeks to compute dashboard metrics
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAllWeeks();
        setWeeks(data || []);
      } catch (err) {
        console.error('Error loading weeks for dashboard:', err);
      }
    }
    loadData();
  }, [importStatus]);

  // Force window hot-reload when service worker skipWaiting takes over
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleController = () => {
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleController);
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleController);
      };
    }
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleExportJSON = () => {
    exportToJSON(weeks);
  };

  const handleExportCSV = () => {
    exportToCSV(weeks);
  };

  const triggerImportFile = () => {
    fileInputRef.current?.click();
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result;
        const importedData = JSON.parse(text);

        // Validation
        if (!Array.isArray(importedData)) {
          throw new Error('Backup file must be a JSON array of weekly logs.');
        }

        for (const week of importedData) {
          if (!week.id || !week.gate || !week.job || !week.shared) {
            throw new Error('Backup data items contain invalid structure.');
          }
        }

        // Put to IndexedDB
        await db.transaction('rw', db.weeks, async () => {
          for (const week of importedData) {
            await db.weeks.put(week);
          }
        });

        setImportStatus('success');
        setImportError('');
        setTimeout(() => setImportStatus(null), 2500);
      } catch (err) {
        console.error('Import error:', err);
        setImportStatus('error');
        setImportError(err.message || 'Malformed JSON backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAll = async () => {
    const confirmed = window.confirm(
      '⚠️ CRITICAL: Are you absolutely sure you want to clear all weekly logs?\nThis action is irreversible!'
    );
    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      'Please confirm one more time: Do you want to delete ALL data on this device?'
    );
    if (!doubleConfirmed) return;

    try {
      await db.weeks.clear();
      alert('All tracker data has been successfully cleared.');
      window.location.reload();
    } catch (err) {
      console.error('Failed to clear database:', err);
      alert('Error clearing data: ' + err.message);
    }
  };

  const handleCheckForUpdates = async () => {
    if (!('serviceWorker' in navigator)) {
      alert('Service Worker is not supported on this browser.');
      return;
    }

    setIsCheckingUpdates(true);
    
    // Artificial 1-second timeout to give tactile feedback that network queries are executing
    setTimeout(async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          
          if (registration.waiting) {
            const confirmed = window.confirm('A new app version is available! Reload now to update?');
            if (confirmed) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          } else {
            alert('Your app is already up to date!');
          }
        } else {
          alert('No active service worker found. Updates are managed by your browser.');
        }
      } catch (err) {
        console.error('Update check failed:', err);
        alert('Could not check for updates: ' + err.message);
      } finally {
        setIsCheckingUpdates(false);
      }
    }, 1000);
  };

  // --- DYNAMIC DASHBOARD METRICS ---

  // 1. Helper to resolve today's key and index
  const getTodayKeys = () => {
    const daysOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayIndexRaw = new Date().getDay(); // 0 (Sun) to 6 (Sat)
    const todayKey = daysOrder[todayIndexRaw];
    
    // Mon (0) to Sun (6) index mapping
    const monToSunIndex = todayIndexRaw === 0 ? 6 : todayIndexRaw - 1;
    return { todayKey, monToSunIndex, label: todayKey.charAt(0).toUpperCase() + todayKey.slice(1) };
  };

  const todayInfo = getTodayKeys();

  // 2. Compute stats
  const activeWeek = weeks[0]; // Most recent week

  // DAILY STATS
  let todayStudyHours = 0;
  let todayMinimumStatus = false;
  if (activeWeek) {
    todayStudyHours = activeWeek.gate?.dailyHours?.[todayInfo.todayKey] || 0;
    todayMinimumStatus = !!activeWeek.shared?.dailyMinimum?.[todayInfo.monToSunIndex];
  }

  // WEEKLY STATS
  let weekStudyHours = 0;
  let weekStudyGoal = 0;
  let weekJobApplied = 0;
  let weekJobGoal = 5;
  let weekTargetsCompleted = 0;
  let weekTargetsTotal = 0;

  if (activeWeek) {
    weekStudyHours = Object.values(activeWeek.gate?.dailyHours || {}).reduce((s, h) => s + h, 0);
    weekStudyGoal = activeWeek.gate?.plannedHours || 0;
    
    weekJobApplied = activeWeek.job?.applications || 0;
    weekJobGoal = activeWeek.job?.applicationsGoal || 5;

    const targets = Object.values(activeWeek.gate?.weeklySubtopics || {});
    weekTargetsTotal = targets.length;
    weekTargetsCompleted = targets.filter(t => t.completed).length;
  }

  // MONTHLY STATS (Current calendar month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthWeeks = weeks.filter(w => {
    const weekDate = new Date(w.id);
    return weekDate.getMonth() === currentMonth && weekDate.getFullYear() === currentYear;
  });

  const monthStudyHours = currentMonthWeeks.reduce((sum, w) => {
    const hours = Object.values(w.gate?.dailyHours || {}).reduce((s, h) => s + h, 0);
    return sum + hours;
  }, 0);

  const monthJobApplied = currentMonthWeeks.reduce((sum, w) => sum + (w.job?.applications || 0), 0);
  const monthQuestions = currentMonthWeeks.reduce((sum, w) => sum + (w.gate?.questionsSolved || 0), 0);

  // LIFETIME STATS (Totals)
  const lifetimeStudyHours = weeks.reduce((sum, w) => {
    const hours = Object.values(w.gate?.dailyHours || {}).reduce((s, h) => s + h, 0);
    return sum + hours;
  }, 0);
  const lifetimeApplications = weeks.reduce((sum, w) => sum + (w.job?.applications || 0), 0);
  const lifetimeWeeksCount = weeks.length;

  return (
    <>
      <header className="app-header">
        <div className="header-row">
          <div className="header-title-container">
            <svg className="header-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" style={{ width: '24px', height: '24px' }}>
              <polygon points="60,10 95,70 25,70" fill="var(--strava-orange)" />
              <polygon points="60,50 85,95 35,95" fill="var(--strava-orange)" opacity="0.6" />
            </svg>
            <h1 className="header-title">Athlete Profile</h1>
          </div>
        </div>
      </header>

      {/* Profile Card & Lifetime Telemetry Stats */}
      <div className="card profile-card">
        <div className="profile-avatar-large">ME</div>
        <h2 className="profile-name">Plan Tracker Athlete</h2>
        <span className="profile-title-tag">Premium Consistency Level</span>

        <div className="profile-totals-grid">
          <div className="profile-total-item">
            <span className="profile-total-value">{lifetimeStudyHours}h</span>
            <span className="profile-total-label">Studied</span>
          </div>
          <div className="profile-total-item">
            <span className="profile-total-value">{lifetimeApplications}</span>
            <span className="profile-total-label">Apps Sent</span>
          </div>
          <div className="profile-total-item">
            <span className="profile-total-value">{lifetimeWeeksCount}</span>
            <span className="profile-total-label">Weeks Active</span>
          </div>
        </div>
      </div>

      {/* --- DAILY / WEEKLY / MONTHLY TRACKING DASHBOARD --- */}
      <div className="card" style={{ borderColor: 'var(--strava-orange-light)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', textTransform: 'uppercase', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.03em' }}>
          <BarChart2 size={18} style={{ color: 'var(--strava-orange)' }} />
          Performance Dashboard
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* DAILY TRACKING SECTION */}
          <div style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: 'var(--strava-orange)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
              <Zap size={13} /> Daily Track ({todayInfo.label})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Today's Study:</span>
                <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '2px', color: 'var(--text-primary)' }}>
                  {todayStudyHours} hrs
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Minimum standards:</span>
                <div style={{ fontSize: '14px', fontWeight: '800', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', color: todayMinimumStatus ? 'var(--job-green)' : 'var(--text-muted)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: todayMinimumStatus ? 'var(--job-green)' : 'var(--text-muted)' }}></div>
                  {todayMinimumStatus ? 'Kept' : 'Not met yet'}
                </div>
              </div>
            </div>
          </div>

          {/* WEEKLY TRACKING SECTION */}
          <div style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: 'var(--gate-blue)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
              <Calendar size={13} /> Weekly Goals
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Study goal */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span>GATE study volume:</span>
                  <span style={{ fontWeight: 'bold' }}>{weekStudyHours}h / {weekStudyGoal}h</span>
                </div>
                <div className="job-progress-bar" style={{ height: '6px', marginTop: '4px' }}>
                  <div className="job-progress-fill" style={{ width: `${weekStudyGoal > 0 ? Math.min(100, (weekStudyHours / weekStudyGoal) * 100) : 0}%`, backgroundColor: 'var(--gate-blue)', boxShadow: 'none' }} />
                </div>
              </div>

              {/* Job applications goal */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span>Job Applications:</span>
                  <span style={{ fontWeight: 'bold' }}>{weekJobApplied} / {weekJobGoal}</span>
                </div>
                <div className="job-progress-bar" style={{ height: '6px', marginTop: '4px' }}>
                  <div className="job-progress-fill" style={{ width: `${weekJobGoal > 0 ? Math.min(100, (weekJobApplied / weekJobGoal) * 100) : 0}%`, backgroundColor: 'var(--strava-orange)', boxShadow: 'none' }} />
                </div>
              </div>

              {/* Syllabus Targets */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)', borderTop: '1px solid var(--card-border)', paddingTop: '6px', marginTop: '2px' }}>
                <span>Syllabus targets completed:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {weekTargetsCompleted} / {weekTargetsTotal}
                </span>
              </div>
            </div>
          </div>

          {/* MONTHLY TRACKING SECTION */}
          <div style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: 'var(--job-green)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
              <BarChart2 size={13} /> Monthly Totals ({new Date().toLocaleString('en-US', { month: 'long' })})
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>GATE Hours</span>
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {monthStudyHours}h
                </div>
              </div>
              <div>
                <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Questions</span>
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {monthQuestions}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Applied</span>
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {monthJobApplied}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Application Updates & Changelog */}
      <div className="card" style={{ borderColor: 'rgba(252, 97, 32, 0.25)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={18} style={{ color: 'var(--strava-orange)' }} />
          Application Updates
        </h3>
        
        {/* Version Information Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '10px 12px', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Active Version</span>
            <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--job-green)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--job-green)' }}></div>
              {APP_VERSION}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Last Built</span>
            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '3px' }}>
              {BUILD_DATE}
            </div>
          </div>
        </div>

        {/* Changelog section */}
        <div style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.04em' }}>
            Latest Release Updates
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <span style={{ color: 'var(--strava-orange)' }}>✓</span>
              <span>Tactile incremental planned study target dial adjusters</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <span style={{ color: 'var(--strava-orange)' }}>✓</span>
              <span>Dynamic target completion countdowns (Xh left / Overdue)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <span style={{ color: 'var(--strava-orange)' }}>✓</span>
              <span>Unified completion sync between Syllabus & Record sheets</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <span style={{ color: 'var(--strava-orange)' }}>✓</span>
              <span>Daily blocker notes and study revision log modal drawers</span>
            </div>
          </div>
        </div>

        {/* Sync Trigger Button */}
        <button
          type="button"
          className="btn-primary"
          onClick={handleCheckForUpdates}
          disabled={isCheckingUpdates}
          style={{
            width: '100%',
            height: '42px',
            borderRadius: '10px',
            fontWeight: '800',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, var(--strava-orange) 0%, #ff7849 100%)',
            boxShadow: '0 4px 12px rgba(252, 97, 32, 0.15)'
          }}
        >
          <RefreshCw className={isCheckingUpdates ? 'spin' : ''} size={16} />
          {isCheckingUpdates ? 'Checking Server...' : 'Check & Refresh Updates'}
        </button>
      </div>

      {/* Theme Settings */}
      <div className="card">
        <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Appearance settings
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.4', margin: 0 }}>
            Switch between dark carbon and light card layouts for optimal screen visibility.
          </p>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              width: '100%',
              height: '42px',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: theme === 'dark' ? '1px solid var(--strava-orange)' : '1px solid var(--card-border)',
              background: theme === 'dark' ? 'rgba(252, 97, 32, 0.05)' : 'rgba(255, 255, 255, 0.03)',
              color: theme === 'dark' ? 'var(--strava-orange)' : 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.25s'
            }}
          >
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            {theme === 'dark' ? 'Dark Mode: Active' : 'Light Mode: Active'}
          </button>
        </div>
      </div>

      {/* Database Backups */}
      <div className="card">
        <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Database Backups
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '14px', lineHeight: '1.4' }}>
          Your data is stored in the browser local storage (IndexedDB). Periodic exports prevent accidental losses.
        </p>

        <div className="settings-button-group">
          {/* JSON Export */}
          <button type="button" className="btn-secondary" onClick={handleExportJSON} style={{ justifyContent: 'flex-start' }}>
            <Download size={18} style={{ color: 'var(--strava-orange)' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '700', fontSize: '13px' }}>Export JSON Backup</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Backup database to a local file</div>
            </div>
          </button>

          {/* CSV Export */}
          <button type="button" className="btn-secondary" onClick={handleExportCSV} style={{ justifyContent: 'flex-start' }}>
            <Download size={18} style={{ color: 'var(--job-green)' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '700', fontSize: '13px' }}>Export CSV Spreadsheet</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Generate analytical spreadsheets</div>
            </div>
          </button>

          {/* JSON Restore */}
          <button type="button" className="btn-secondary" onClick={triggerImportFile} style={{ justifyContent: 'flex-start' }}>
            <Upload size={18} style={{ color: 'var(--warning-amber)' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '700', fontSize: '13px' }}>Restore JSON Backup</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Restore and merge your previous backup files</div>
            </div>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden-file-input" 
            accept=".json" 
            onChange={handleImportJSON} 
          />

          {/* Feedback banners */}
          {importStatus === 'success' && (
            <div className="warning-card" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'var(--job-green)' }}>
              <Check size={18} style={{ color: 'var(--job-green)' }} />
              <div className="warning-content">
                <span className="warning-title" style={{ color: 'var(--job-green)' }}>Import Successful</span>
                <span className="warning-text">Your backup data has been restored and merged.</span>
              </div>
            </div>
          )}

          {importStatus === 'error' && (
            <div className="warning-card" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--danger-red)' }}>
              <ShieldAlert size={18} style={{ color: 'var(--danger-red)' }} />
              <div className="warning-content">
                <span className="warning-title" style={{ color: 'var(--danger-red)' }}>Import Failed</span>
                <span className="warning-text">{importError}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger settings */}
      <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.25)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--danger-red)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Danger Zone
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '14px', lineHeight: '1.4' }}>
          Deleting database logs is permanent. Ensure you have downloaded a JSON backup first if you want to recover them.
        </p>
        <button type="button" className="btn-danger" onClick={handleClearAll} style={{ width: '100%' }}>
          <Trash2 size={18} />
          Wipe Local Tracker Database
        </button>
      </div>
    </>
  );
}
