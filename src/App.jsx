import React, { useState, useEffect } from 'react';
import { getWeekId } from './utils/dateUtils';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Today from './pages/Today';
import Syllabus from './pages/Syllabus';
import Settings from './pages/Settings';
import './styles/app.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('today'); // Default view is the Today dashboard
  const [currentWeekId, setCurrentWeekId] = useState(() => getWeekId(new Date()));
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Sync theme to index.html document tag
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'today':
        return <Today currentWeekId={currentWeekId} />;
      case 'record':
        return (
          <Home 
            currentWeekId={currentWeekId} 
            setCurrentWeekId={setCurrentWeekId} 
          />
        );
      case 'gate':
        return (
          <Syllabus 
            currentWeekId={currentWeekId}
          />
        );
      case 'profile':
        return (
          <Settings 
            theme={theme} 
            setTheme={setTheme} 
          />
        );
      default:
        return <Today currentWeekId={currentWeekId} />;
    }
  };

  return (
    <div className="app-container">
      {renderActivePage()}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
