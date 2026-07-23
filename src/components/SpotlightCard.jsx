import React, { useRef, useState } from 'react';

/**
 * SpotlightCard component inspired by ReactBits & Shadcn.
 * Creates an interactive border & background glow effect that follows the user's cursor.
 */
export default function SpotlightCard({ 
  children, 
  className = '', 
  spotlightColor = 'rgba(255, 255, 255, 0.1)',
  borderColor = 'var(--card-border)',
  borderWidth = '1px',
  borderRadius = '12px',
  padding = '14px',
  style = {},
  ...props 
}) {
  const containerRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const activeBorder = isHovered 
    ? `radial-gradient(150px circle at ${coords.x}px ${coords.y}px, ${spotlightColor}, transparent 80%), ${borderColor}`
    : borderColor;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`spotlight-card-container ${className}`}
      style={{
        position: 'relative',
        borderRadius,
        padding: borderWidth,
        overflow: 'hidden',
        background: activeBorder,
        transition: 'background 0.3s ease',
        ...style
      }}
      {...props}
    >
      <div
        className="spotlight-card-content"
        style={{
          background: 'var(--card-bg)',
          borderRadius: `calc(${borderRadius} - ${borderWidth})`,
          height: '100%',
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          padding,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        {/* Spotlight overlay inside card */}
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: `radial-gradient(220px circle at ${coords.x}px ${coords.y}px, ${spotlightColor}, transparent 80%)`,
              zIndex: 0
            }}
          />
        )}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', width: '100%', gap: 'inherit' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
