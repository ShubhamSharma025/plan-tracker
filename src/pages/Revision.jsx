import React, { useState, useEffect } from 'react';
import { RotateCcw, Trash2, CheckCircle, Calendar, AlertCircle } from 'lucide-react';
import { getRevisions, markTopicRevised, deleteRevision, syncTopicCompletion } from '../database/db';
import { syllabusData } from '../utils/syllabusData';

export default function Revision({ embed = false, currentWeekId }) {
  const [revisions, setRevisions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRevisions = async () => {
    try {
      const data = await getRevisions();
      setRevisions(data || []);
    } catch (err) {
      console.error('Error loading revisions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRevisions();
  }, []);

  const handleMarkRevised = async (subtopicId) => {
    try {
      await markTopicRevised(subtopicId);
      loadRevisions();
    } catch (err) {
      console.error('Error marking topic revised:', err);
    }
  };

  const handleDeleteRevision = async (subtopicId) => {
    const confirmed = window.confirm('Remove this topic from your revision loop?');
    if (!confirmed) return;
    try {
      // Sync database globally: mark incomplete in syllabus, weekly targets, and revisions
      await syncTopicCompletion(subtopicId, false, currentWeekId);
      loadRevisions();
    } catch (err) {
      console.error('Error deleting revision:', err);
    }
  };

  // Helper to lookup subject name and subtopic label from ID
  const getTopicDetails = (subtopicId) => {
    for (const subject of syllabusData) {
      const subtopic = subject.subtopics.find(st => st.id === subtopicId);
      if (subtopic) {
        return {
          subjectName: subject.name,
          subtopicName: subtopic.name
        };
      }
    }
    return { subjectName: 'GATE Topic', subtopicName: 'Unknown Subtopic' };
  };

  // Sort and filter revisions
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;

  // Due / Overdue list (due date falls before tomorrow)
  const dueItems = revisions
    .filter(item => item.dueDate < tomorrowStart)
    .sort((a, b) => a.dueDate - b.dueDate);

  // Upcoming list (due date falls tomorrow or later)
  const upcomingItems = revisions
    .filter(item => item.dueDate >= tomorrowStart)
    .sort((a, b) => a.dueDate - b.dueDate);

  // Helper to calculate and display due text
  const getDueStatusText = (dueDateMs) => {
    const msPerDay = 24 * 60 * 60 * 1000;
    
    if (dueDateMs < todayStart) {
      // Overdue
      const diff = Math.ceil((todayStart - dueDateMs) / msPerDay);
      return { text: `Overdue by ${diff} day${diff === 1 ? '' : 's'}`, type: 'overdue' };
    } else if (dueDateMs >= todayStart && dueDateMs < tomorrowStart) {
      // Due Today
      return { text: 'Due Today', type: 'today' };
    } else {
      // Upcoming
      const diff = Math.ceil((dueDateMs - todayStart) / msPerDay);
      return { text: `Due in ${diff} day${diff === 1 ? '' : 's'}`, type: 'upcoming' };
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Loading revision schedule...</span>
      </div>
    );
  }

  return (
    <>
      {!embed && (
        <header className="app-header">
          <div className="header-row">
            <div className="header-title-container">
              <svg className="header-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" style={{ width: '24px', height: '24px' }}>
                <polygon points="60,10 95,70 25,70" fill="var(--strava-orange)" />
                <polygon points="60,50 85,95 35,95" fill="var(--strava-orange)" opacity="0.6" />
              </svg>
              <h1 className="header-title">Revision Loop</h1>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Spaced repetition revision tasks scheduled 3 days after completion
          </p>
        </header>
      )}

      {revisions.length === 0 ? (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', textAlign: 'center', gap: '16px' }}>
          <CheckCircle size={40} style={{ color: 'var(--job-green)' }} />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>No Active Revisions</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Completed topics from your weekly Record sheet or the GATE syllabus checklist will automatically appear here!
            </p>
          </div>
        </div>
      ) : (
        <div className="revision-list-section">
          
          {/* 1. DUE TODAY / OVERDUE */}
          {dueItems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h2 className="revision-section-title" style={{ color: 'var(--danger-red)' }}>
                <AlertCircle size={14} /> Due Today / Overdue ({dueItems.length})
              </h2>
              {dueItems.map(item => {
                const details = getTopicDetails(item.id);
                const status = getDueStatusText(item.dueDate);
                return (
                  <div key={item.id} className={`revision-card ${status.type}`}>
                    <div className="revision-card-header">
                      <span className="revision-subject-label">{details.subjectName}</span>
                      <span className={`revision-due-badge ${status.type}`}>{status.text}</span>
                    </div>
                    
                    <h3 className="revision-topic-title">{details.subtopicName}</h3>
                    
                    <div className="revision-footer">
                      <span className="revision-stats">
                        <RotateCcw size={12} />
                        Revised {item.revisedCount || 0} time{item.revisedCount === 1 ? '' : 's'}
                      </span>
                      <div className="revision-actions">
                        <button
                          type="button"
                          className="btn-revise"
                          onClick={() => handleMarkRevised(item.id)}
                        >
                          Mark Revised
                        </button>
                        <button
                          type="button"
                          className="btn-delete-revision"
                          onClick={() => handleDeleteRevision(item.id)}
                          title="Remove from loop"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. UPCOMING */}
          {upcomingItems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: dueItems.length > 0 ? '12px' : '0' }}>
              <h2 className="revision-section-title">
                <Calendar size={14} /> Upcoming Revisions ({upcomingItems.length})
              </h2>
              {upcomingItems.map(item => {
                const details = getTopicDetails(item.id);
                const status = getDueStatusText(item.dueDate);
                return (
                  <div key={item.id} className={`revision-card ${status.type}`}>
                    <div className="revision-card-header">
                      <span className="revision-subject-label">{details.subjectName}</span>
                      <span className={`revision-due-badge ${status.type}`}>{status.text}</span>
                    </div>
                    
                    <h3 className="revision-topic-title">{details.subtopicName}</h3>
                    
                    <div className="revision-footer">
                      <span className="revision-stats">
                        <RotateCcw size={12} />
                        Revised {item.revisedCount || 0} time{item.revisedCount === 1 ? '' : 's'}
                      </span>
                      <div className="revision-actions">
                        <button
                          type="button"
                          className="btn-delete-revision"
                          onClick={() => handleDeleteRevision(item.id)}
                          title="Remove from loop"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}
    </>
  );
}
