import React, { useState } from 'react';
import { ChevronDown, BookOpen, Plus, Trash2, Check, Clock, CalendarCheck, Trophy } from 'lucide-react';
import { getSubtopicName } from '../utils/syllabusData';
import { syncTopicCompletion } from '../database/db';

export default function GateSection({ data, onChange, selectedDay, currentWeekId }) {
  const [isOpen, setIsOpen] = useState(true);
  const [newTopic, setNewTopic] = useState('');

  const updateField = (field, value) => {
    onChange('gate', {
      ...data,
      [field]: value
    });
  };

  const handleHourChange = (newVal) => {
    const numValue = Math.max(0, parseFloat(newVal) || 0);
    const updatedDailyHours = {
      ...data.dailyHours,
      [selectedDay]: numValue
    };
    
    // Automatically recalculate weekly actualHours
    const totalHours = Object.values(updatedDailyHours).reduce((sum, h) => sum + h, 0);
    
    onChange('gate', {
      ...data,
      dailyHours: updatedDailyHours,
      actualHours: totalHours
    });
  };

  // Toggle completion of a specific targeted week subtopic
  const handleSubtopicToggle = async (subtopicId) => {
    const weeklySubtopics = data.weeklySubtopics || {};
    const subObj = weeklySubtopics[subtopicId] || { completed: false };
    const isCompletedNow = !subObj.completed;

    const updatedWeeklySubtopics = {
      ...weeklySubtopics,
      [subtopicId]: {
        ...subObj,
        completed: isCompletedNow
      }
    };
    updateField('weeklySubtopics', updatedWeeklySubtopics);
    
    // Global sync: auto schedule revision & mark complete in syllabus
    await syncTopicCompletion(subtopicId, isCompletedNow, currentWeekId);
  };

  // Adjust subtopic hours for the selected day only
  const handleSubtopicHoursAdjust = (subtopicId, delta) => {
    const weeklySubtopics = data.weeklySubtopics || {};
    const subObj = weeklySubtopics[subtopicId] || { completed: false };
    
    const daily = subObj.dailyHours && typeof subObj.dailyHours === 'object'
      ? { ...subObj.dailyHours }
      : { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };
    
    // Handle legacy data
    if (subObj.hours > 0 && Object.values(daily).reduce((s, h) => s + h, 0) === 0) {
      daily.monday = subObj.hours;
    }

    const currentVal = parseFloat(daily[selectedDay]) || 0;
    const newVal = Math.max(0, currentVal + delta);
    daily[selectedDay] = newVal;

    const totalWeeklySum = Object.values(daily).reduce((sum, h) => sum + h, 0);

    const updatedWeeklySubtopics = {
      ...weeklySubtopics,
      [subtopicId]: {
        ...subObj,
        dailyHours: daily,
        hours: totalWeeklySum
      }
    };

    updateField('weeklySubtopics', updatedWeeklySubtopics);
  };

  const handleDeadlineChange = (subtopicId, dayValue) => {
    const weeklySubtopics = data.weeklySubtopics || {};
    const subObj = weeklySubtopics[subtopicId] || {};
    
    const updatedWeeklySubtopics = {
      ...weeklySubtopics,
      [subtopicId]: {
        ...subObj,
        deadline: dayValue
      }
    };
    
    updateField('weeklySubtopics', updatedWeeklySubtopics);
  };

  const addConfidenceTopic = () => {
    if (!newTopic.trim()) return;
    const updatedConfidence = [
      ...(data.confidence || []),
      { topic: newTopic.trim(), rating: 4 }
    ];
    updateField('confidence', updatedConfidence);
    setNewTopic('');
  };

  const removeConfidenceTopic = (index) => {
    const updatedConfidence = (data.confidence || []).filter((_, i) => i !== index);
    updateField('confidence', updatedConfidence);
  };

  const setConfidenceRating = (index, rating) => {
    const updatedConfidence = (data.confidence || []).map((item, i) => 
      i === index ? { ...item, rating } : item
    );
    updateField('confidence', updatedConfidence);
  };

  // Dynamic Deadline Countdown Calculator
  const getHoursLeftText = (weekId, deadlineDayKey) => {
    if (!weekId) return { text: '', isOverdue: false };
    
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
    
    // Parse Monday start of the logged week (at 00:00:00)
    const mondayDate = new Date(weekId);
    mondayDate.setHours(0, 0, 0, 0);
    
    // Target deadline: set to the start of the next calendar day (giving the user the entire day to finish)
    const deadlineDate = new Date(mondayDate);
    deadlineDate.setDate(mondayDate.getDate() + offsetDays + 1);
    
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return { text: 'Overdue', isOverdue: true };
    }
    
    const hours = Math.round(diffMs / (60 * 60 * 1000));
    return { text: `${hours}h left`, isOverdue: false };
  };

  const totalStudyHours = Object.values(data.dailyHours || {}).reduce((sum, hrs) => sum + hrs, 0);
  
  // FILTER OUT COMPLETED TARGETS: Hide them from the active Record screen checklist
  const activeSubtopicsKeys = Object.keys(data.weeklySubtopics || {}).filter(
    key => !data.weeklySubtopics[key]?.completed
  );

  const activeDayValue = data.dailyHours?.[selectedDay] || 0;
  const dayNameCapitalized = selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1);

  return (
    <div className="card gate-section">
      <div className="section-header" onClick={() => setIsOpen(!isOpen)}>
        <h2 className="section-title gate-text">
          <BookOpen size={20} />
          GATE Prep Tracker
        </h2>
        <ChevronDown className={`chevron-icon ${isOpen ? 'open' : ''}`} size={20} />
      </div>

      {isOpen && (
        <div className="section-content">
          
          {/* Active Week Targets list */}
          <div className="form-group">
            <label className="form-label">Active Week Targets</label>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-4px', marginBottom: '12px' }}>
              Select target completion days and log study hours. Completed topics are archived to Revisions.
            </span>
            
            {activeSubtopicsKeys.length === 0 ? (
              <div style={{ background: 'var(--input-bg)', border: '1px dashed var(--card-border)', borderRadius: '12px', padding: '20px', textAlignment: 'center', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
                No active subtopics to study today.<br />
                <span style={{ color: 'var(--strava-orange)', fontWeight: 'bold' }}>Go to the GATE tab</span> to set new targets, or review completed ones in revisions.
              </div>
            ) : (
              <div className="record-subtopics-list" style={{ gap: '10px' }}>
                {activeSubtopicsKeys.map((key) => {
                  const subObj = data.weeklySubtopics[key] || { completed: false };
                  
                  // Safe load dailyHours
                  const daily = subObj.dailyHours && typeof subObj.dailyHours === 'object'
                    ? subObj.dailyHours
                    : { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };
                  
                  if (subObj.hours > 0 && Object.values(daily).reduce((s, h) => s + h, 0) === 0) {
                    daily.monday = subObj.hours;
                  }

                  const todayHours = daily[selectedDay] || 0;
                  
                  // Consistency checker: count days with hours > 0
                  const daysStudied = Object.values(daily).filter(h => h > 0).length;
                  const isTargetMet = daysStudied >= 4;

                  const deadline = subObj.deadline || 'sunday';
                  const hoursLeft = getHoursLeftText(currentWeekId, deadline);

                  const name = getSubtopicName(key);
                  return (
                    <div 
                      key={key} 
                      className="record-subtopic-row" 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '10px', 
                        alignItems: 'stretch',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '12px',
                        padding: '12px 14px'
                      }}
                    >
                      {/* Top Row: Checkbox, Name */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                        <div 
                          style={{ 
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            flex: 1,
                            cursor: 'pointer'
                          }}
                          onClick={() => handleSubtopicToggle(key)}
                        >
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%', 
                            border: '1.5px solid ' + (subObj.completed ? 'var(--strava-orange)' : 'var(--input-border)'),
                            background: subObj.completed ? 'var(--strava-orange)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            transition: 'all 0.15s',
                            marginTop: '2px',
                            flexShrink: 0
                          }}>
                            {subObj.completed && <Check size={12} strokeWidth={4} />}
                          </div>
                          <span style={{ 
                            fontSize: '13px',
                            fontWeight: '700',
                            lineHeight: '1.4',
                            color: 'var(--text-primary)' 
                          }}>
                            {name}
                          </span>
                        </div>
                      </div>

                      {/* Middle Row: Deadline Selector & Spaced Study indicators */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                        {/* Custom Deadline Dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Due:</span>
                          <select
                            value={deadline}
                            onChange={(e) => handleDeadlineChange(key, e.target.value)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid var(--card-border)',
                              borderRadius: '6px',
                              color: 'var(--text-secondary)',
                              fontSize: '11px',
                              fontWeight: '800',
                              padding: '2px 4px',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="monday">Mon</option>
                            <option value="tuesday">Tue</option>
                            <option value="wednesday">Wed</option>
                            <option value="thursday">Thu</option>
                            <option value="friday">Fri</option>
                            <option value="saturday">Sat</option>
                            <option value="sunday">Sun</option>
                          </select>
                        </div>

                        {/* Real-time Time Left Badge */}
                        <div 
                          style={{ 
                            fontSize: '10px', 
                            fontWeight: '800',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: hoursLeft.isOverdue ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: hoursLeft.isOverdue ? 'var(--danger-red)' : 'var(--warning-amber)',
                            border: hoursLeft.isOverdue ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em'
                          }}
                        >
                          <Clock size={10} />
                          {hoursLeft.text}
                        </div>

                        {/* 4-Day Study Consistency Badge */}
                        <div 
                          style={{ 
                            fontSize: '10px', 
                            fontWeight: '800', 
                            padding: '3px 8px', 
                            borderRadius: '6px',
                            backgroundColor: isTargetMet ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                            color: isTargetMet ? 'var(--job-green)' : 'var(--text-secondary)',
                            border: isTargetMet ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--card-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                            marginLeft: 'auto'
                          }}
                        >
                          <CalendarCheck size={11} />
                          {daysStudied} / 4 days
                        </div>
                      </div>

                      {/* Bottom Row: Day study timer dial */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--input-bg)', paddingTop: '8px', marginTop: '2px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} />
                          {dayNameCapitalized} study duration:
                        </span>
                        
                        <div className="number-control" style={{ gap: '4px' }}>
                          <button
                            type="button"
                            className="btn-counter"
                            style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--input-bg)', fontSize: '12px' }}
                            onClick={() => handleSubtopicHoursAdjust(key, -0.5)}
                            aria-label="Decrease hours"
                          >
                            -
                          </button>
                          
                          <span style={{ fontSize: '13px', fontWeight: '800', minWidth: '44px', textAlign: 'center', color: 'var(--text-primary)' }}>
                            {todayHours > 0 ? `${todayHours}h` : '0h'}
                          </span>

                          <button
                            type="button"
                            className="btn-counter"
                            style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--input-bg)', fontSize: '12px' }}
                            onClick={() => handleSubtopicHoursAdjust(key, 0.5)}
                            aria-label="Increase hours"
                          >
                            +
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Daily Study Hours Overall */}
          <div className="form-group" style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
            <label className="form-label">Overall Study Hours</label>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-4px', marginBottom: '8px' }}>
              Log total session volume for {dayNameCapitalized}
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
                  <Clock size={16} style={{ color: 'var(--gate-blue)' }} />
                  Total Session Time
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Weekly total sum: {totalStudyHours} hrs
                </span>
              </div>
              
              <div className="number-control" style={{ gap: '4px' }}>
                <button
                  type="button"
                  className="btn-counter"
                  style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                  onClick={() => handleHourChange(activeDayValue - 0.5)}
                >
                  -
                </button>
                <span style={{ fontSize: '16px', fontWeight: '800', minWidth: '48px', textAlign: 'center', color: 'var(--strava-orange)' }}>
                  {activeDayValue}h
                </span>
                <button
                  type="button"
                  className="btn-counter"
                  style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                  onClick={() => handleHourChange(activeDayValue + 0.5)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Questions Solved */}
          <div className="form-group" style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
            <label className="form-label">Questions Solved</label>
            
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
                  <Trophy size={16} style={{ color: '#FBBF24' }} />
                  Practice Set Size
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Total questions solved this week
                </span>
              </div>
              
              <div className="number-control" style={{ gap: '4px' }}>
                <button
                  type="button"
                  className="btn-counter"
                  style={{ padding: '0 8px', fontSize: '10px', height: '32px', borderRadius: '8px' }}
                  onClick={() => updateField('questionsSolved', Math.max(0, (parseInt(data.questionsSolved) || 0) - 10))}
                >
                  -10
                </button>
                <button
                  type="button"
                  className="btn-counter"
                  style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                  onClick={() => updateField('questionsSolved', Math.max(0, (parseInt(data.questionsSolved) || 0) - 1))}
                >
                  -
                </button>
                <span style={{ fontSize: '16px', fontWeight: '800', minWidth: '40px', textAlign: 'center', color: 'var(--gate-blue)' }}>
                  {data.questionsSolved || 0}
                </span>
                <button
                  type="button"
                  className="btn-counter"
                  style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                  onClick={() => updateField('questionsSolved', (parseInt(data.questionsSolved) || 0) + 1)}
                >
                  +
                </button>
                <button
                  type="button"
                  className="btn-counter"
                  style={{ padding: '0 8px', fontSize: '10px', height: '32px', borderRadius: '8px' }}
                  onClick={() => updateField('questionsSolved', (parseInt(data.questionsSolved) || 0) + 10)}
                >
                  +10
                </button>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
