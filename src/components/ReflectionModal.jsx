import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export default function ReflectionModal({
  isOpen,
  onClose,
  selectedDay,
  gateData,
  sharedData,
  onGateChange,
  onSharedChange
}) {
  const [revisedTopics, setRevisedTopics] = useState('');
  const [blockerNote, setBlockerNote] = useState('');
  const [confidenceList, setConfidenceList] = useState([]);
  
  const [newTopic, setNewTopic] = useState('');
  const [newRating, setNewRating] = useState(4);

  const dayNameCapitalized = selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1);

  // Sync state whenever day opens
  useEffect(() => {
    if (isOpen) {
      const dailyRevs = gateData.dailyRevisedTopics || {};
      const dailyConfs = gateData.dailyConfidence || {};
      const dailyBlockers = sharedData.dailyBlockerNotes || {};

      setRevisedTopics(dailyRevs[selectedDay] || '');
      setBlockerNote(dailyBlockers[selectedDay] || '');
      setConfidenceList(dailyConfs[selectedDay] || []);
      setNewTopic('');
      setNewRating(4);
    }
  }, [isOpen, selectedDay, gateData, sharedData]);

  const handleSave = () => {
    // 1. Save GATE daily revised topics & daily confidence ratings
    const updatedDailyRevised = {
      ...(gateData.dailyRevisedTopics || {}),
      [selectedDay]: revisedTopics
    };
    const updatedDailyConfidence = {
      ...(gateData.dailyConfidence || {}),
      [selectedDay]: confidenceList
    };
    
    onGateChange('gate', {
      ...gateData,
      dailyRevisedTopics: updatedDailyRevised,
      dailyConfidence: updatedDailyConfidence
    });

    // 2. Save Shared daily blocker notes
    const updatedDailyBlockers = {
      ...(sharedData.dailyBlockerNotes || {}),
      [selectedDay]: blockerNote
    };

    onSharedChange('shared', {
      ...sharedData,
      dailyBlockerNotes: updatedDailyBlockers
    });

    onClose();
  };

  const addConfidence = () => {
    if (!newTopic.trim()) return;
    const updated = [
      ...confidenceList,
      { topic: newTopic.trim(), rating: newRating }
    ];
    setConfidenceList(updated);
    setNewTopic('');
    setNewRating(4);
  };

  const removeConfidence = (index) => {
    const updated = confidenceList.filter((_, i) => i !== index);
    setConfidenceList(updated);
  };

  const setConfidenceRating = (index, rating) => {
    const updated = confidenceList.map((item, i) =>
      i === index ? { ...item, rating } : item
    );
    setConfidenceList(updated);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 200,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div 
        className="card"
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#121214',
          border: '1px solid var(--card-border)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
            📝 Reflection: {dayNameCapitalized}
          </h2>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Revision log */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px' }}>Revision Log</label>
            <textarea
              className="input-field"
              placeholder={`What topics did you revise on ${dayNameCapitalized}?`}
              value={revisedTopics}
              onChange={(e) => setRevisedTopics(e.target.value)}
              style={{ minHeight: '60px', borderRadius: '10px', fontSize: '13px' }}
            />
          </div>

          {/* Blockers log */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px' }}>Blockers / Focus Notes</label>
            <textarea
              className="input-field"
              placeholder={`What got in your way or went well on ${dayNameCapitalized}?`}
              value={blockerNote}
              onChange={(e) => setBlockerNote(e.target.value)}
              style={{ minHeight: '60px', borderRadius: '10px', fontSize: '13px' }}
            />
          </div>

          {/* Confidence list for today */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px' }}>Syllabus Confidence Rated Today</label>
            
            {/* Added list */}
            {confidenceList.length > 0 && (
              <div className="confidence-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                {confidenceList.map((item, index) => (
                  <div key={index} className="confidence-item" style={{ background: 'var(--input-bg)', borderRadius: '8px', padding: '6px 10px', margin: 0 }}>
                    <span className="confidence-topic-name" style={{ fontSize: '12px' }}>{item.topic}</span>
                    <div className="stars-container">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star-btn ${star <= item.rating ? 'filled' : ''}`}
                          onClick={() => setConfidenceRating(index, star)}
                          style={{ fontSize: '14px' }}
                        >
                          ★
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => removeConfidence(index)}
                        style={{ marginLeft: '6px', color: 'var(--danger-red)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Confidence Creator form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '8px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Topic name (e.g. Cache Memory)"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                style={{ fontSize: '12px', minHeight: '36px', padding: '4px 8px', borderRadius: '6px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                <div className="stars-container" style={{ margin: 0 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${star <= newRating ? 'filled' : ''}`}
                      onClick={() => setNewRating(star)}
                      style={{ fontSize: '16px' }}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={addConfidence}
                  style={{ borderRadius: '6px', height: '32px', padding: '0 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={12} /> Add
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--card-border)', paddingTop: '14px', marginTop: '4px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ flex: 1, height: '40px', borderRadius: '10px', fontSize: '13px', fontWeight: '800' }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            style={{ flex: 1, height: '40px', borderRadius: '10px', fontSize: '13px', fontWeight: '800' }}
          >
            Save Reflection
          </button>
        </div>

      </div>
    </div>
  );
}
