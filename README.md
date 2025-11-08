# Operation Pahrump

A terminal-style static website project built with plain HTML, CSS, and JavaScript. A hacker-themed game dashboard with role-based access, points system, and interactive dares.

## Project Structure

```
operation-pahrump/
├── index.html          # Login page with password authentication
├── dashboard.html      # Main dashboard with points, dares, and clues
├── admin.html          # Admin panel (password protected)
├── instructions.html   # Instructions page with drink voting
├── css/
│   ├── style.css       # Terminal-style base styling
│   └── dashboard.css   # Dashboard-specific styles
├── js/
│   ├── app.js          # Login logic and authentication
│   ├── dashboard.js    # Dashboard functionality and interactions
│   ├── admin.js        # Admin panel logic
│   ├── instructions.js # Instructions page logic
│   ├── firebase-service.js   # Firebase/Firestore service module
│   ├── firebase-setup.js     # Firebase initialization script
│   └── firebase-config.example.js # Firebase config template (optional override)
├── data/
│   ├── dares.json      # Simple challenge dares (one-line challenges)
│   └── riddles.json    # Riddles with hints and answers (shown in order)
└── README.md           # This file
```

## Features

- **Terminal-style UI** - CRT aesthetic with green text, scanlines, and flicker effects
- **Interactive typewriter effect** - Animated text with moving cursor
- **Points system** - Earn points through dare completion (+10 points) and clue/riddle answers (+50 correct, -5 incorrect, -30 for hints). Points can be negative.
- **Simple dares** - One-line challenges that can be completed or trashed
- **Clue system** - Two types of clues:
  - **Global clues**: Same clue for everyone, advances for all when one person completes it
  - **Person-specific clues**: Individual clues per user, players must wait for others to complete before advancing
- **Riddles** - Sequential riddles with hints and answers (shown in order) - legacy system
- **Dashboard** - Real-time UI updates, locked/unlocked controls, dare management
- **Firebase integration** - Real-time admin state synchronization
- **Responsive design** - Works on desktop and mobile devices
- **No build dependencies** - Pure HTML, CSS, and JavaScript (ES modules)

## Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd operation-pahrump
   ```

2. Open `index.html` in a web browser or use a local server:
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Node.js (if http-server is installed)
   npx http-server -p 8000
   ```

3. Navigate to `http://localhost:8000` in your browser

4. **Firebase Setup** (required for full functionality):
   - Firebase configuration is already included in `js/firebase-service.js`
   - Firebase API keys are public by design - security comes from Firestore rules
   - Create Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Configure Firestore security rules (see below)
   - Initialize data: Open `index.html` in browser console and run:
     ```javascript
     import('./js/firebase-setup.js').then(async (module) => {
         await module.setupFirebase();
     });
     ```
   - This will prompt you to set passwords for all users
   - Optionally, you can override the Firebase config by copying `js/firebase-config.example.js` to `js/firebase-config.js` and modifying it

5. **Access Admin Panel**:
   - Go to `admin.html`
   - Enter admin password (set during Firebase setup)
   - Type `help` for available commands

## Deployment to GitHub Pages

1. Push code to GitHub repository
2. Go to Settings → Pages
3. Select main branch and root folder
4. Site will be available at `https://<username>.github.io/operation-pahrump/`

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge). Requires JavaScript enabled.

## Managing Clues, Dares, and Riddles

**Note:** Clues, dares, and riddles are primarily loaded from Firebase Firestore. The JSON files (`data/dares.json` and `data/riddles.json`) are fallbacks used when Firebase is not configured.

### Clues System (Recommended)

The clue system supports two types of clues:
- **Global clues**: All players see the same clue. When any player completes it, all players advance automatically.
- **Person-specific clues**: Each player gets their own clue. Players must complete their clue, then wait for all assigned players to complete theirs before everyone advances.

**Adding Clues via Admin Panel:**

1. Go to `admin.html` and log in
2. **Add a global clue:**
   ```
   clue add 1 global "What has keys but no locks?" "piano" "It's a musical instrument"
   ```
3. **Add a person-specific clue:**
   ```
   clue add 2 person "Zoe's personal clue" "answer" "hint" Zoe
   ```
4. **Add clues for multiple users:**
   ```
   clue add 2 person "Group clue" "answer" "hint" Zoe,JT,Alana
   ```
5. **View all clues:** `list clues`
6. **View user progress:** `list progress`
7. **Edit a clue:** `clue edit <clueId> <field> "<value>"`
8. **Delete a clue:** `clue delete <clueId>`
9. **Reset user progress:** `clue reset <userId>`

**Firestore Structure:**
```
clues/{clueId}
  - type: string ("global" or "person-specific")
  - order: number (sequential order - clues shown in this order)
  - riddle: string (the clue/riddle text)
  - answer: string (correct answer, case-insensitive)
  - hint: string (optional hint text)
  - assignedTo: array (for person-specific: ["Zoe", "JT"] - empty for global)
  - createdAt: timestamp
  - updatedAt: timestamp

clueProgress/{userId}
  - userId: string
  - currentClueOrder: number (current clue order the user is on)
  - completedClueIds: array (array of completed clue document IDs)
  - waitingForOthers: boolean (true if user completed their person-specific clue but others haven't)

globalClueCompletion/{clueId}
  - clueId: string
  - isCompleted: boolean
  - completedBy: string (userId who completed it)
  - completedAt: timestamp
```

**How It Works:**
- Clues are shown in order based on the `order` field
- **Global clues**: When any user answers correctly, the clue is marked as complete globally and all users advance to the next clue in real-time
- **Person-specific clues**: Each user sees only their assigned clue. When a user completes their clue:
  - If other assigned users haven't completed theirs, the user sees "WAIT FOR OTHER PLAYERS TO FINISH THEIR CLUES"
  - Once all assigned users complete their clues, everyone advances to the next clue
- Progress is tracked per user in Firestore
- Real-time updates sync across all users

**Example Clue Sequence:**
```
# Order 1: Global clue (everyone sees the same)
clue add 1 global "What has keys but no locks?" "piano" "musical instrument"

# Order 2: Person-specific clues (each user gets their own)
clue add 2 person "Zoe's clue: What is your favorite color?" "blue" "think sky" Zoe
clue add 2 person "JT's clue: What is 2 + 2?" "4" "math" JT
clue add 2 person "Alana's clue: Capital of France?" "paris" "city of light" Alana

# Order 3: Another global clue
clue add 3 global "I speak without a mouth" "echo" "sound"
```

**To Get Clue ID for Deletion:**
1. Run `list clues` to see all clues with their IDs
2. The ID appears in brackets: `[abc123def456]`
3. Use that ID: `clue delete abc123def456`

### Populating via Firebase (Recommended)

#### Dares

Dares are stored in the `dares` collection in Firestore. Use the admin panel to add dares:

1. Go to `admin.html` and log in
2. Use the command: `add "challenge text"`
   - Example: `add "Take a picture in a fountain"`
3. View all dares: `list`
4. Edit a dare: `edit <id> challenge "<new challenge>"`
5. Delete a dare: `delete <id>`

**Firestore Structure:**
```
dares/{dareId}
  - id: number (for ordering)
  - challenge: string (one-line challenge text)
  - createdAt: timestamp
  - updatedAt: timestamp
```

**Format:**
- `id`: Unique identifier (number) - used for ordering
- `challenge`: One-line challenge description (string)

#### Riddles

Riddles are stored in the `riddles` collection in Firestore. Use the admin panel to add riddles:

1. Go to `admin.html` and log in
2. Use the command: `riddle add <id> "riddle text" "answer" "hint"`
   - Example: `riddle add 1 "What has keys but no locks?" "piano" "It's a musical instrument"`
3. View all riddles: `list riddles`
4. Edit a riddle: `riddle edit <id> <field> "<value>"` (field: riddle, answer, or hint)
   - Example: `riddle edit 1 riddle "What has keys?"`
5. Delete a riddle: `riddle delete <id>`

**Firestore Structure:**
```
riddles/{riddleId}
  - id: number (for ordering - riddles shown sequentially)
  - riddle: string (the riddle question)
  - answer: string (correct answer, case-insensitive)
  - hint: string (optional hint text)
  - createdAt: timestamp
  - updatedAt: timestamp
```

**Format:**
- `id`: Unique identifier (number) - used to determine order (riddles shown sequentially)
- `riddle`: The riddle question (string)
- `answer`: The correct answer (string, case-insensitive)
- `hint`: Optional hint text (string)

**Important:** Riddles are shown in order based on their `id` field. Players must answer each riddle correctly before seeing the next one.

### Populating via JSON Files (Fallback)

If Firebase is not configured, the app will fall back to JSON files:

#### Dares (`data/dares.json`)

Edit `data/dares.json` to add your own dares:

```json
{
  "description": "Simple dares/challenges for operation pahrump",
  "version": "1.0",
  "dares": [
    {
      "id": 1,
      "challenge": "Take a picture in a fountain"
    },
    {
      "id": 2,
      "challenge": "Do 10 push-ups"
    },
    {
      "id": 3,
      "challenge": "Sing a song in public"
    }
  ]
}
```

#### Riddles (`data/riddles.json`)

Edit `data/riddles.json` to add your own riddles:

```json
{
  "description": "Riddles data for operation pahrump",
  "version": "1.0",
  "riddles": [
    {
      "id": 1,
      "riddle": "What has keys but no locks?",
      "answer": "piano",
      "hint": "It's a musical instrument"
    },
    {
      "id": 2,
      "riddle": "I speak without a mouth and hear without ears. What am I?",
      "answer": "echo",
      "hint": "Think about sound and reflection"
    },
    {
      "id": 3,
      "riddle": "What has hands but cannot clap?",
      "answer": "clock",
      "hint": "You check it to know the time"
    }
  ]
}
```

### How It Works

**Clues (New System - Recommended):**
- Loaded from Firebase `clues` collection
- System automatically detects if clues exist and uses them instead of riddles
- Two types of clues:
  - **Global**: All players see the same clue. When one player completes it, all players advance automatically in real-time
  - **Person-specific**: Each player sees only their assigned clue. Players wait for others to complete before advancing
- When unlocked, players can:
  - Click "HINT" to reveal the hint (-30 points)
  - Click "ENTER ANSWER" to submit an answer
  - Correct answers award +50 points and advance to the next clue
  - Incorrect answers subtract -5 points (points can be negative)
  - Person-specific clues show "WAIT FOR OTHER PLAYERS" message when user completes but others haven't
- Clues update in real-time via Firebase subscriptions

**Dares:**
- Loaded from Firebase `dares` collection (or `data/dares.json` as fallback)
- 3 random dares are shown to each player
- Players can complete dares for +10 points or trash them for -5 points
- Dares update in real-time via Firebase subscriptions

**Riddles (Legacy System):**
- Loaded from Firebase `riddles` collection (or `data/riddles.json` as fallback)
- Used only if no clues exist in the `clues` collection
- Riddles are sorted by `id` and shown sequentially (in order)
- Players see one riddle at a time in the riddle box
- When unlocked, players can:
  - Click "HINT" to reveal the hint (-30 points)
  - Click "ENTER ANSWER" to submit an answer
  - Correct answers award +50 points and advance to the next riddle
  - Incorrect answers subtract -5 points (points can be negative)
  - After completing all riddles, they cycle back to the beginning
- Riddles update in real-time via Firebase subscriptions

## Firebase Configuration

### Firestore Security Rules

Go to **Firestore Database** → **Rules** and update with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /admin/{document} {
      allow read, write: if true;
    }
    match /users/{userId} {
      allow read, write: if true;
    }
    match /dares/{dareId} {
      allow read, write: if true;
    }
    match /riddles/{riddleId} {
      allow read, write: if true;
    }
    match /clues/{clueId} {
      allow read, write: if true;
    }
    match /clueProgress/{userId} {
      allow read, write: if true;
    }
    match /globalClueCompletion/{clueId} {
      allow read, write: if true;
    }
  }
}
```

**Note**: For production, implement proper authentication and stricter rules.

### Firestore Structure

- **admin/state**: Admin settings (unlocked flag, canProceedToDashboard flag)
- **users/{userId}**: User accounts with passwords (SECURE - stored in Firestore)
- **dares/{dareId}**: Dare entries (simple challenges)
- **riddles/{riddleId}**: Riddle entries (shown sequentially) - legacy system
- **clues/{clueId}**: Clue entries (global or person-specific, shown in order)
- **clueProgress/{userId}**: User progress tracking (current order, completed clues, waiting status)
- **globalClueCompletion/{clueId}**: Global clue completion status (tracks when global clues are completed)
- **drinkChoices/{choiceId}**: Drink voting choices from instructions page

### Data Storage

- **Authentication**: Firestore `users` collection (passwords not in codebase)
- **User Management**: Firestore `users` collection (admin manages via admin panel)
- **Points**: localStorage (per user: `points_Zoe`, `points_JT`, `points_Alana`, etc.) - can be negative
- **Dares**: Firestore `dares` collection (for admin management and real-time updates)
- **Clues**: Firestore `clues` collection (global and person-specific clues, shown in order)
- **Clue Progress**: Firestore `clueProgress` collection (tracks each user's progress through clues)
- **Global Clue Completion**: Firestore `globalClueCompletion` collection (tracks when global clues are completed)
- **Riddles**: Firestore `riddles` collection (shown sequentially, real-time updates) - legacy system
- **Admin State**: Firestore (unlocked flag, canProceedToDashboard flag for real-time sync)
- **Drink Choices**: Firestore `drinkChoices` collection (stores user drink votes from instructions page)

**Security**: Passwords are stored in Firestore, not in code. Admin panel requires admin password to access. Firebase API keys are public (security comes from Firestore security rules).

## Admin Panel Commands

Access admin panel at `admin.html` (requires admin password):

### General Commands
- `help` - Show all commands
- `clear` - Clear output
- `settings` - Show admin settings

### Dares Commands
- `list` - List all dares
- `add "challenge text"` - Add a new dare (simple one-line challenge)
- `edit <id> challenge "<value>"` - Edit dare challenge
- `delete <id>` - Delete dare

### Clues Commands (Recommended)
- `list clues` - List all clues with IDs, order, type, and assignments
- `clue add <order> global "riddle" "answer" "hint"` - Add a global clue
- `clue add <order> person "riddle" "answer" "hint" users` - Add a person-specific clue
  - Example: `clue add 1 global "What has keys?" "piano" "musical instrument"`
  - Example: `clue add 2 person "Zoe's clue" "answer" "hint" Zoe`
- `clue edit <id> <field> "<value>"` - Edit a clue (fields: riddle, answer, hint, order, type, assignedTo)
- `clue delete <id>` - Delete a clue (get ID from `list clues`)
- `list progress` - List all user clue progress
- `clue reset <userId>` - Reset a user's clue progress

### Riddles Commands (Legacy System)
- `list riddles` - List all riddles
- `riddle add <id> "riddle" "answer" "hint"` - Add a new riddle
- `riddle edit <id> <field> "<value>"` - Edit riddle (field: riddle, answer, or hint)
- `riddle delete <id>` - Delete riddle

### User Commands
- `list users` - List all users
- `user add <role>` - Add a new user (prompts for password)
- `user pass <id> <password>` - Change user password
- `user list` - List all users

### Points and Progress
- `list points` or `points` - List all player points
- `list progress` - List all user clue progress

### Game Control
- `unlock true` / `unlock false` - Toggle unlock state (enables/disables clue/dare interactions)
- `proceed true` / `proceed false` - Allow users to proceed from instructions to dashboard

### Drink Choices
- `drinks` - List all drink choices

### Reset Commands
- `reset vote <userId>` - Reset drink vote for a user
- `clue reset <userId>` - Reset user's clue progress

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please open an issue or submit a pull request.
