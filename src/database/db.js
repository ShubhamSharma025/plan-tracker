import Dexie from 'dexie';

export const db = new Dexie('PlanTrackerDB');

// Upgrade database to version 4 to support daily-based reflections & revision logs
db.version(4).stores({
  weeks: 'id',
  syllabus: 'id', // Holds global syllabus completion status: { id: 'global', completed: [...] }
  revisions: 'id' // Holds active revisions: { id: subtopicId, completedAt: ms, dueDate: ms, revisedCount: number }
});

export function createDefaultWeek(id) {
  const monday = new Date(id);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const options = { day: 'numeric', month: 'long' }; // "20 July"
  const weekStartStr = monday.toLocaleDateString('en-US', options);
  const weekEndStr = sunday.toLocaleDateString('en-US', options);

  return {
    id,
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    kudos: 0,
    gate: {
      dailyHours: {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0
      },
      questionsSolved: 0,
      revisedTopics: "", // Legacy weekly revision log
      confidence: [], // Legacy weekly confidence
      plannedHours: 0,
      actualHours: 0,
      weeklySubtopics: {}, // Mapped as: { [subtopicKey]: { completed: boolean, hours: number, dailyHours: {...} } }
      dailyRevisedTopics: {
        monday: "",
        tuesday: "",
        wednesday: "",
        thursday: "",
        friday: "",
        saturday: "",
        sunday: ""
      },
      dailyConfidence: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      }
    },
    job: {
      applications: 0,
      applicationsGoal: 5, // Default goal is to apply to 5 jobs
      actualHours: 0,
      dailyApplications: {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0
      }
    },
    shared: {
      dailyMinimum: [false, false, false, false, false, false, false],
      manualDailyMinimum: [false, false, false, false, false, false, false],
      blockerNote: "", // Legacy weekly blocker reflection
      dailyBlockerNotes: {
        monday: "",
        tuesday: "",
        wednesday: "",
        thursday: "",
        friday: "",
        saturday: "",
        sunday: ""
      }
    }
  };
}

export function processWeekMinStandard(week) {
  if (!week) return week;
  
  if (week.shared) {
    if (!week.shared.manualDailyMinimum) {
      week.shared.manualDailyMinimum = [...(week.shared.dailyMinimum || [false, false, false, false, false, false, false])];
    }
    
    const planned = parseInt(week.gate?.plannedHours) || 0;
    const actual = parseFloat(week.gate?.actualHours) || 0;
    const hasMetGoal = planned > 0 && actual >= planned;
    
    week.shared.dailyMinimum = hasMetGoal 
      ? [true, true, true, true, true, true, true]
      : [...(week.shared.manualDailyMinimum || [false, false, false, false, false, false, false])];
  }
  
  return week;
}

// Fetch a week by ID; initialize if it doesn't exist
export async function getOrCreateWeek(id) {
  let week = await db.weeks.get(id);
  if (!week) {
    week = createDefaultWeek(id);
    await db.weeks.add(week);
  }
  return processWeekMinStandard(week);
}

// Save a week
export async function saveWeek(week) {
  if (!week || !week.id) return;
  await db.weeks.put(week);
}

// Get all weeks sorted newest first
export async function getAllWeeks() {
  const weeks = await db.weeks.reverse().toArray();
  return weeks.map(processWeekMinStandard);
}

// Syllabus Database helpers
export async function getSyllabus() {
  let data = await db.syllabus.get('global');
  if (!data) {
    data = { id: 'global', completed: [] };
    await db.syllabus.add(data);
  }
  return data;
}

export async function saveSyllabus(syllabus) {
  await db.syllabus.put(syllabus);
}

// --- Leitner Spaced Repetition Revisions helpers ---

/**
 * Adds or removes a topic from the spaced repetition revisions list based on completion status.
 * Schedules due date exactly 3 days in the future.
 * 
 * @param {string} subtopicId The subtopic identifier
 * @param {boolean} isCompleted Toggled completion state
 */
export async function addOrUpdateRevision(subtopicId, isCompleted) {
  if (isCompleted) {
    const existing = await db.revisions.get(subtopicId);
    if (!existing) {
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      await db.revisions.put({
        id: subtopicId,
        completedAt: Date.now(),
        dueDate: Date.now() + threeDaysMs,
        revisedCount: 0
      });
    }
  } else {
    // If unmarked complete, remove it from the active revision cycle
    await db.revisions.delete(subtopicId);
  }
}

/**
 * Resets the revision item due date to 3 days in the future and increments count.
 * 
 * @param {string} subtopicId The subtopic identifier
 */
export async function markTopicRevised(subtopicId) {
  const item = await db.revisions.get(subtopicId);
  if (item) {
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    await db.revisions.put({
      ...item,
      dueDate: Date.now() + threeDaysMs,
      revisedCount: (item.revisedCount || 0) + 1
    });
  }
}

/**
 * Deletes a revision card.
 */
export async function deleteRevision(subtopicId) {
  await db.revisions.delete(subtopicId);
}

/**
 * Fetches all active revision schedule cards.
 */
export async function getRevisions() {
  return await db.revisions.toArray();
}

/**
 * Synchronizes completion states globally: updates global syllabus check lists,
 * updates weekly record targets, and schedules/removes revision items.
 * 
 * @param {string} subtopicId The subtopic identifier
 * @param {boolean} isCompleted Completion state
 * @param {string} weekId Current active week ID (to sync weekly targets)
 */
export async function syncTopicCompletion(subtopicId, isCompleted, weekId) {
  // 1. Sync global syllabus completions array
  const syllabusObj = await getSyllabus();
  const completedList = [...(syllabusObj.completed || [])];
  const index = completedList.indexOf(subtopicId);
  
  if (isCompleted) {
    if (index === -1) {
      completedList.push(subtopicId);
    }
  } else {
    if (index > -1) {
      completedList.splice(index, 1);
    }
  }
  await saveSyllabus({ ...syllabusObj, completed: completedList });

  // 2. Sync revision scheduling loop
  await addOrUpdateRevision(subtopicId, isCompleted);

  // 3. Sync week target completed property (if targeted in the current week)
  if (weekId) {
    const week = await getOrCreateWeek(weekId);
    const weeklySubtopics = { ...(week.gate?.weeklySubtopics || {}) };
    
    if (weeklySubtopics[subtopicId]) {
      weeklySubtopics[subtopicId].completed = isCompleted;
      
      await saveWeek({
        ...week,
        gate: {
          ...week.gate,
          weeklySubtopics
        }
      });
    }
  }
}
