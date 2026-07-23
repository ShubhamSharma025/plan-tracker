import React from 'react';
import { Zap, CircleDot, BookOpen, User } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'today', label: 'Today', icon: Zap },
    { id: 'record', label: 'Record', icon: CircleDot },
    { id: 'gate', label: 'GATE', icon: BookOpen },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            aria-label={item.label}
          >
            <IconComponent 
              size={22} 
              className={item.id === 'record' && activeTab === 'record' ? 'spin' : ''} 
              style={{ 
                color: activeTab === item.id ? 'var(--strava-orange)' : 'var(--text-secondary)',
                animationDuration: item.id === 'record' ? '4s' : '0s'
              }}
              strokeWidth={activeTab === item.id ? 2.5 : 2} 
            />
            <span className="nav-item-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
