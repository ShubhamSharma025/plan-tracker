import React, { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle, Award, RefreshCw } from 'lucide-react';
import { getSyllabus, saveSyllabus, getOrCreateWeek, saveWeek, syncTopicCompletion } from '../database/db';
import { syllabusData, getAllSubtopics } from '../utils/syllabusData';

export default function Syllabus({ currentWeekId }) {
  const [syllabus, setSyllabus] = useState({ id: 'global', completed: [] });
  const [weekData, setWeekData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openSubjects, setOpenSubjects] = useState({});

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const globalSyllabus = await getSyllabus();
        const activeWeek = await getOrCreateWeek(currentWeekId);
        setSyllabus(globalSyllabus || { id: 'global', completed: [] });
        setWeekData(activeWeek);
        
        // Default first subject to open
        setOpenSubjects({ [syllabusData[0].id]: true });
      } catch (err) {
        console.error('Error loading syllabus views:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [currentWeekId]);

  const toggleSubject = (subjectId) => {
    setOpenSubjects(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  // Toggle global syllabus subtopic completion
  const handleGlobalCompletionToggle = async (subtopicId) => {
    const isCompletedNow = !syllabus.completed.includes(subtopicId);
    
    // Sync state locally first for immediate feedback
    const currentCompleted = [...syllabus.completed];
    if (isCompletedNow) {
      currentCompleted.push(subtopicId);
    } else {
      const idx = currentCompleted.indexOf(subtopicId);
      if (idx > -1) currentCompleted.splice(idx, 1);
    }
    setSyllabus({ ...syllabus, completed: currentCompleted });

    // Sync database globally
    await syncTopicCompletion(subtopicId, isCompletedNow, currentWeekId);
    
    // Reload week data in background to sync targeted status state
    const activeWeek = await getOrCreateWeek(currentWeekId);
    setWeekData(activeWeek);
  };

  // Toggle targeting this subtopic for the current week
  const handleWeeklyTargetToggle = async (subtopicId) => {
    if (!weekData) return;

    const weeklySubtopics = { ...(weekData.gate?.weeklySubtopics || {}) };
    
    if (weeklySubtopics[subtopicId]) {
      // Remove from weekly targets
      delete weeklySubtopics[subtopicId];
    } else {
      // Add as weekly target
      weeklySubtopics[subtopicId] = { 
        completed: syllabus.completed.includes(subtopicId), // matches global completion
        hours: 0, 
        deadline: 'sunday',
        dailyHours: { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 }
      };
    }

    const updatedWeek = {
      ...weekData,
      gate: {
        ...weekData.gate,
        weeklySubtopics
      }
    };

    setWeekData(updatedWeek);
    await saveWeek(updatedWeek);
  };

  if (isLoading || !weekData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <RefreshCw className="spin" style={{ color: 'var(--strava-orange)' }} size={32} />
        <span style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>Loading syllabus data...</span>
      </div>
    );
  }

  const allSubtopics = getAllSubtopics();
  const totalSubtopics = allSubtopics.length;
  const completedCount = syllabus.completed.length;
  const overallPercent = totalSubtopics > 0 ? Math.round((completedCount / totalSubtopics) * 100) : 0;
  
  const weeklyTargetsKeys = Object.keys(weekData.gate?.weeklySubtopics || {});

  return (
    <>
      <header className="app-header">
        <div className="header-row">
          <div className="header-title-container">
            <svg className="header-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" style={{ width: '24px', height: '24px' }}>
              <polygon points="60,10 95,70 25,70" fill="var(--strava-orange)" />
              <polygon points="60,50 85,95 35,95" fill="var(--strava-orange)" opacity="0.6" />
            </svg>
            <h1 className="header-title">GATE Syllabus</h1>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
          Select week study targets and log global completions
        </p>
      </header>

      {/* Global Progress stats */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={18} style={{ color: 'var(--strava-orange)' }} />
          Syllabus Mastery
        </h3>
        <div className="job-progress-container" style={{ marginTop: '0px' }}>
          <div className="job-progress-text">
            <span>Completed Topics</span>
            <span style={{ color: 'var(--strava-orange)' }}>{completedCount} / {totalSubtopics} ({overallPercent}%)</span>
          </div>
          <div className="job-progress-bar">
            <div className="job-progress-fill" style={{ width: `${overallPercent}%` }} />
          </div>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Active targeted topics for this week: <strong style={{ color: 'var(--strava-orange)' }}>{weeklyTargetsKeys.length} subtopics</strong>
        </div>
      </div>

      {/* Collapsible syllabus subjects */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {syllabusData.map((subject) => {
          const isSubjectOpen = openSubjects[subject.id];
          
          // Calculate completions for this subject specifically
          const subjectSubtopicIds = subject.subtopics.map(st => st.id);
          const subjectCompleted = subjectSubtopicIds.filter(id => syllabus.completed.includes(id)).length;
          const subjectTotal = subject.subtopics.length;
          
          return (
            <div key={subject.id} className="card subject-card">
              <div 
                className="section-header" 
                onClick={() => toggleSubject(subject.id)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  <h3 className="section-title" style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '800' }}>
                    {subject.name}
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {subjectCompleted} of {subjectTotal} completed
                  </span>
                </div>
                <ChevronDown className={`chevron-icon ${isSubjectOpen ? 'open' : ''}`} size={18} />
              </div>

              {isSubjectOpen && (
                <div className="subtopic-list">
                  {subject.subtopics.map((subtopic) => {
                    const isGlobalCompleted = syllabus.completed.includes(subtopic.id);
                    const isWeeklyTarget = !!weekData.gate?.weeklySubtopics?.[subtopic.id];
                    
                    // Dynamic indicators: Green for complete, Orange for targeted
                    let borderStyle = '1px solid var(--card-border)';
                    let bgStyle = 'var(--input-bg)';
                    let textColor = 'var(--text-primary)';
                    let checkColor = 'var(--text-muted)';

                    if (isGlobalCompleted) {
                      borderStyle = '1.5px solid rgba(16, 185, 129, 0.45)';
                      bgStyle = 'rgba(16, 185, 129, 0.05)';
                      textColor = 'var(--job-green)';
                      checkColor = 'var(--job-green)';
                    } else if (isWeeklyTarget) {
                      borderStyle = '1.5px solid rgba(252, 97, 32, 0.45)';
                      bgStyle = 'rgba(252, 97, 32, 0.05)';
                      textColor = 'var(--strava-orange)';
                    }

                    return (
                      <div 
                        key={subtopic.id} 
                        className="subtopic-item"
                        style={{
                          background: bgStyle,
                          border: borderStyle,
                          color: textColor,
                          transition: 'all 0.25s'
                        }}
                      >
                        <span className="subtopic-title" style={{ color: 'inherit' }}>
                          {subtopic.name}
                        </span>
                        
                        <div className="subtopic-actions">
                          {/* Target Week Toggle: disabled if already completed */}
                          {!isGlobalCompleted && (
                            <button
                              type="button"
                              className={`target-toggle-btn ${isWeeklyTarget ? 'active' : ''}`}
                              onClick={() => handleWeeklyTargetToggle(subtopic.id)}
                              title={isWeeklyTarget ? 'Remove from weekly target' : 'Target for this week'}
                            >
                              {isWeeklyTarget ? 'Targeted' : '+ Target'}
                            </button>
                          )}

                          {/* Global Complete Check button */}
                          <button
                            type="button"
                            className="global-check-btn"
                            style={{ color: checkColor }}
                            onClick={() => handleGlobalCompletionToggle(subtopic.id)}
                            title={isGlobalCompleted ? 'Mark incomplete' : 'Mark completed'}
                          >
                            <CheckCircle size={18} strokeWidth={isGlobalCompleted ? 2.5 : 2} style={{ fill: isGlobalCompleted ? 'rgba(16, 185, 129, 0.12)' : 'none' }} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
