/**
 * Analytical helper functions for Plan Tracker (Strava edition)
 */

/**
 * Evaluates the weekly logs to determine if consistency warnings should be generated.
 * 
 * @param {Array} weeks Array of weekly records sorted from newest to oldest
 * @returns {Array} List of warnings trigger-matched
 */
export function getWarnings(weeks) {
  const warnings = [];
  if (!weeks || weeks.length === 0) return warnings;

  // Warning 1: GATE study hours < planned hours for 2 consecutive weeks
  if (weeks.length >= 2) {
    const recent2 = weeks.slice(0, 2);
    const gateBelowPlan = recent2.every(w => {
      const planned = w.gate?.plannedHours || 0;
      const actual = w.gate?.actualHours || 0;
      return planned > 0 && actual < planned;
    });

    if (gateBelowPlan) {
      warnings.push({
        id: 'gate-hours-deficit',
        title: 'Training Flag: study deficit',
        message: 'Your GATE study hours fell below your weekly plan for the last 2 weeks.'
      });
    }
  }

  // Warning 2: Job Applications < Application Goal for 2 consecutive weeks
  if (weeks.length >= 2) {
    const recent2 = weeks.slice(0, 2);
    const jobBelowGoal = recent2.every(w => {
      const goal = w.job?.applicationsGoal || 0;
      const actual = w.job?.applications || 0;
      return goal > 0 && actual < goal;
    });

    if (jobBelowGoal) {
      warnings.push({
        id: 'job-applications-deficit',
        title: 'Training Flag: outreach deficit',
        message: 'Your job applications were below your goal for the last 2 weeks. Pick up the application pace!'
      });
    }
  }

  return warnings;
}

/**
 * Formats weekly data for trends visualization in Recharts.
 * 
 * @param {Array} weeks Array of weekly records sorted from newest to oldest
 * @param {number} limit Number of recent weeks to return
 * @returns {Array} Formatted data points sorted chronologically (oldest to newest)
 */
export function getTrendsData(weeks, limit = 4) {
  if (!weeks || weeks.length === 0) return [];
  
  const recentWeeks = weeks.slice(0, limit).reverse();
  
  return recentWeeks.map(w => {
    const monday = new Date(w.id);
    const label = monday.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    
    return {
      weekId: w.id,
      name: label,
      gateHours: w.gate?.actualHours || 0,
      gatePlanned: w.gate?.plannedHours || 0,
      applications: w.job?.applications || 0,
      applicationsGoal: w.job?.applicationsGoal || 0,
      streakDays: (w.shared?.dailyMinimum || []).filter(Boolean).length
    };
  });
}
