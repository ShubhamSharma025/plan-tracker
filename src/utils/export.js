/**
 * Backup utilities (CSV/JSON import/export) - Syllabus-Targeted Edition
 */

/**
 * Triggers a browser download of the full database in JSON format.
 * 
 * @param {Array} weeks Array of all weekly records from IndexedDB
 */
export function exportToJSON(weeks) {
  if (!weeks || weeks.length === 0) return;
  
  const jsonContent = JSON.stringify(weeks, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `plan_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers a browser download of the database in CSV format.
 * 
 * @param {Array} weeks Array of all weekly records from IndexedDB
 */
export function exportToCSV(weeks) {
  if (!weeks || weeks.length === 0) return;

  const headers = [
    'Week Monday ID',
    'Week Start Date Label',
    'Week End Date Label',
    'GATE Actual Study Hours',
    'GATE Questions Solved',
    'GATE Revised Topics Description',
    'GATE Planned Hours Goal',
    'Job Applications Sent Count',
    'Job Applications Target Goal',
    'Daily Minimum Kept Count (Out of 7)',
    'Reflection Blocker Note'
  ];

  const rows = weeks.map(w => {
    const dailyMinCount = (w.shared?.dailyMinimum || []).filter(Boolean).length;
    const gateHours = Object.values(w.gate?.dailyHours || {}).reduce((s, h) => s + h, 0);

    const escapeCsv = (val) => {
      if (val === undefined || val === null) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    return [
      escapeCsv(w.id),
      escapeCsv(w.weekStart),
      escapeCsv(w.weekEnd),
      gateHours,
      w.gate?.questionsSolved || 0,
      escapeCsv(w.gate?.revisedTopics),
      w.gate?.plannedHours || 0,
      w.job?.applications || 0,
      w.job?.applicationsGoal || 5,
      `${dailyMinCount}/7`,
      escapeCsv(w.shared?.blockerNote)
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `plan_tracker_backup_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
