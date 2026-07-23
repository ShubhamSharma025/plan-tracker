export function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  // If Sunday (0), go back 6 days, otherwise go back (day - 1) days
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getWeekStartAndEnd(monday) {
  const start = new Date(monday);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(monday);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

export function formatDateLabel(monday) {
  const { start, end } = getWeekStartAndEnd(monday);
  
  const startDay = start.getDate();
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  
  const endDay = end.getDate();
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  
  // Example: "20 Jul - 26 Jul"
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
}

export function formatDateString(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getWeekId(date) {
  const monday = getMonday(date);
  return formatDateString(monday);
}

export function getPreviousWeek(mondayStr) {
  const currentMonday = new Date(mondayStr);
  currentMonday.setDate(currentMonday.getDate() - 7);
  return formatDateString(currentMonday);
}

export function getNextWeek(mondayStr) {
  const currentMonday = new Date(mondayStr);
  currentMonday.setDate(currentMonday.getDate() + 7);
  return formatDateString(currentMonday);
}
