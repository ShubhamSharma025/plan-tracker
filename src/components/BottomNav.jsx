import React from 'react';
import { Zap, CircleDot, BookOpen, User, Target } from 'lucide-react';
import { motion } from 'motion/react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'today', label: 'Today', icon: Zap },
    { id: 'record', label: 'Record', icon: CircleDot },
    { id: 'status', label: 'Status', icon: Target },
    { id: 'gate', label: 'GATE', icon: BookOpen },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            aria-label={item.label}
          >
            {/* Sliding Highlight Background */}
            {isActive && (
              <motion.div
                layoutId="active-nav-glow"
                className="nav-active-glow"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            
            <motion.div
              className="nav-icon-wrapper"
              animate={{
                scale: isActive ? 1.15 : 1,
                y: isActive ? -2 : 0
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <IconComponent 
                size={20} 
                className={item.id === 'record' && isActive ? 'spin' : ''} 
                style={{ 
                  color: isActive ? 'var(--strava-orange)' : 'var(--text-secondary)',
                  animationDuration: item.id === 'record' ? '4s' : '0s'
                }}
                strokeWidth={isActive ? 2.5 : 2} 
              />
            </motion.div>
            <span className="nav-item-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
