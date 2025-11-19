import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

const db = new Database('C:\\Users\\kazda\\kiro\\hyper\\database\\goals.db');

const id = randomUUID();
const projectId = '996e1f72-aa59-41f1-aef7-bfea5d92b788';
const requirementName = 'keyboard-navigation-stories';
const title = 'Keyboard Navigation for StoryPlayer';
const overview = `Implemented comprehensive keyboard navigation for the StoryPlayer component to improve accessibility and user efficiency.

Key features:
1) Arrow key navigation - Up/Down to select between choices, Left to go back in history, Right/Enter/Space to select current choice
2) Home key to restart story from beginning
3) End key to restart story when at a dead end (no choices)
4) ? key to toggle keyboard shortcuts help tooltip
5) Escape key to close the help tooltip
6) Visual ring indicator on currently selected choice button
7) Keyboard shortcuts tooltip with a toggle button in the top-right corner

Implementation details:
- Uses useCallback for memoized keyboard event handler with proper dependency tracking
- Properly prevents default behavior to avoid conflicts with browser shortcuts
- Ignores keyboard events when focus is in input/textarea elements
- Resets selected choice index when choices change

Data-testid attributes added for testing:
- story-player (main container)
- keyboard-help-btn (help toggle button)
- keyboard-help-tooltip (help modal)
- keyboard-help-close-btn (close button)
- choice-btn-N (choice buttons, indexed)
- story-end (end of story indicator)
- back-btn (go back button)

Modified file: src/components/player/StoryPlayer.tsx`;

try {
  const stmt = db.prepare(`
    INSERT INTO implementation_log (id, project_id, requirement_name, title, overview, tested, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  stmt.run(id, projectId, requirementName, title, overview, 0);

  console.log('Successfully logged implementation with id:', id);
} catch (error) {
  console.error('Failed to log implementation:', error);
} finally {
  db.close();
}
