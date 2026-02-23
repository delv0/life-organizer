# Life Organizer

Modern web application for personal productivity with Eisenhower Matrix, Kanban boards, habit tracker, and Pomodoro timer.

## Features

- **Eisenhower Matrix** - Prioritize tasks by urgency and importance across 4 quadrants
- **Kanban Boards** - Visual workflow management: Backlog, In Progress, Done
- **Habit Tracker** - Daily habit monitoring with streak counting
- **Pomodoro Timer** - Time management with 25/5 minute intervals
- **Drag and Drop** - Move tasks between lists and quadrants
- **Resizable Lists** - Adjust height and width like in graphic editors
- **Offline Support** - All data stored locally in browser
- **Data Sync** - Export/import via JSON files
- **Responsive Design** - Works on desktop and mobile devices

## Quick Start

### Desktop

**Simple method:**
1. Open `index.html` in your browser
2. Press Ctrl + F5 to clear cache if needed

**With local server (recommended):**
```bash
python -m http.server 8000
```
Then open: http://localhost:8000

### Mobile

**Method 1: Local Server**

On your computer:
1. Run: `python -m http.server 8000`
2. Find your IP address: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   Example: 192.168.1.100

On your phone:
1. Connect to the same WiFi network
2. Open browser and navigate to: http://192.168.1.100:8000

**Install as app:**
- Android: Menu > Install app
- iOS: Safari > Share > Add to Home Screen

**Method 2: Copy Files**

Transfer the entire folder to your phone via USB or cloud storage, then open `index.html` in mobile browser.

## Usage

### Eisenhower Matrix

Tasks are organized into 4 quadrants:

1. **Urgent and Important** - Do immediately (red border)
2. **Not Urgent but Important** - Schedule and plan (blue border)
3. **Urgent but Not Important** - Delegate if possible (yellow border)
4. **Not Urgent and Not Important** - Eliminate (gray border)

### Kanban Board

Three columns for workflow:
- **Backlog** - Tasks waiting to be started
- **In Progress** - Currently active work (limit to 3-5 items)
- **Done** - Completed tasks

### Drag and Drop

Click and hold any task, then drag it to another quadrant or column to move it.

### Resizing Lists

- **Matrix quadrants**: Hover over bottom edge, cursor changes to vertical arrows, drag to resize
- **Kanban columns**: Hover over bottom-right corner, cursor changes to diagonal arrows, drag to resize

### Habit Tracking

1. Create a habit with a goal (e.g., 30 days)
2. Check off each day you complete it
3. Track your streak and progress bar
4. View your completion percentage

### Pomodoro Timer

1. Set focus time (default: 25 minutes)
2. Click Start to begin session
3. Take a short break (5 minutes) after timer ends
4. Take a long break (15 minutes) after 4 pomodoros

## Data Synchronization

### Export Data

Settings > Export Data > Save JSON file to cloud storage

### Import Data

On another device: Settings > Import Data > Select saved JSON file

All tasks, habits, and settings will be transferred.

## Task Import Tool

Use `convert-tasks.html` to import work logs:

1. Open the converter in browser
2. Paste JSON array: `[{"date": "...", "location": "...", "action": "..."}]`
3. Click Convert > Download JSON
4. In app: Settings > Import Data

Tasks will be automatically categorized into appropriate quadrants based on type.

## Data Storage

- All data stored locally in browser IndexedDB
- No data sent to external servers
- Data persists even after clearing browser cache
- Regular exports recommended for backup

## Settings

### Pomodoro Configuration
- Focus time (default: 25 minutes)
- Short break (default: 5 minutes)
- Long break (default: 15 minutes)

### List Display
- Each list shows approximately 5 tasks
- Scroll to view more tasks
- Resize lists by dragging edges

## Troubleshooting

### CSS changes not applying
- Press Ctrl + F5 to force refresh
- Or open in incognito mode (Ctrl + Shift + N)

### Data not saving
- Check that incognito mode is not enabled
- Verify browser supports IndexedDB (all modern browsers)

### App won't install on mobile
- Ensure using HTTPS or localhost
- Verify server is running if using local server method

### Drag and drop not working
- Works best with mouse on desktop
- Try different browser (Chrome recommended)

### Mobile access issues
- Verify phone and computer on same WiFi network
- Check IP address is correct
- Temporarily disable firewall if needed

## Privacy

- No account registration required
- All data stored only on your device
- No external data transmission
- No analytics or tracking
- Complete data ownership

## File Structure

```
life-organizer/
├── index.html          # Main application page
├── styles.css          # Modern minimalist styles
├── app.js              # Application logic with drag & drop
├── sw.js               # Service worker for PWA
├── manifest.json       # PWA manifest
├── icon-192.png        # App icon 192x192
├── icon-512.png        # App icon 512x512
├── convert-tasks.html  # Work log import converter
└── README.md           # This file
```

## Keyboard Shortcuts

- Ctrl + F5 - Force reload (clear cache)
- Ctrl + Shift + N - Open incognito window

## Best Practices

### For Eisenhower Matrix
- Spend 80% of time in "Not Urgent but Important" quadrant
- Minimize "Urgent and Important" through better planning
- Delegate or automate "Urgent but Not Important" tasks
- Eliminate "Not Urgent and Not Important" items

### For Kanban
- Limit work in progress to 3-5 items
- Focus on completing tasks rather than starting new ones
- Move items to Done immediately upon completion
- Regular review and prioritization of Backlog

### For Habits
- Start with 1-3 habits maximum
- Link new habits to existing routines
- Never skip two days in a row
- Mark habit immediately after completion

### For Pomodoro
- Plan tasks before starting work sessions
- No distractions during focus time
- Stand and move during breaks
- Take long breaks seriously after 4 sessions

## Technical Details

- Built with vanilla JavaScript (no frameworks)
- IndexedDB for local data persistence
- PWA capabilities for offline use
- Service Worker for caching
- Responsive CSS Grid and Flexbox layout
- Modern CSS variables for theming

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Version

2.0 - Modern Design Edition

## License

Free for personal use

## Getting Started

1. Open the application
2. Create your first task in Eisenhower Matrix
3. Add a habit you want to build
4. Start a Pomodoro session and begin working

Stay organized and work efficiently.
