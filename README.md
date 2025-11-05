# Operation Water Rock

A terminal-style static website project built with plain HTML, CSS, and JavaScript. A hacker-themed game dashboard with role-based access, points system, and interactive dares.

## Project Structure

```
operation-water-rock/
├── index.html          # Login page with password authentication
├── dashboard.html      # Main dashboard with points and dares
├── admin.html          # Admin panel (password protected)
├── css/
│   ├── style.css       # Terminal-style base styling
│   └── dashboard.css   # Dashboard-specific styles
├── js/
│   ├── app.js          # Login logic and authentication
│   ├── dashboard.js    # Dashboard functionality and interactions
│   ├── admin.js        # Admin panel logic
│   ├── firebase-service.js   # Firebase/Firestore service module
│   ├── firebase-setup.js     # Firebase initialization script
│   └── firebase-config.example.js # Firebase config template (optional override)
├── data/
│   ├── dares.json      # Simple challenge dares (one-line challenges)
│   └── riddles.json    # Riddles with hints and answers (shown in order)
└── README.md           # This file
```

## Features

- **Role-based authentication** - Four roles: player1, player2, player3, admin
- **Terminal-style UI** - CRT aesthetic with green text, scanlines, and flicker effects
- **Interactive typewriter effect** - Animated text with moving cursor
- **Points system** - Earn points through dare completion (+10 points) and riddle answers (+50 correct, -5 incorrect). Points can be negative.
- **Simple dares** - One-line challenges that can be completed or trashed
- **Riddles** - Sequential riddles with hints and answers (shown in order)
- **Dashboard** - Real-time UI updates, locked/unlocked controls, dare management
- **Firebase integration** - Real-time admin state synchronization
- **Responsive design** - Works on desktop and mobile devices
- **No build dependencies** - Pure HTML, CSS, and JavaScript (ES modules)

## Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd operation-water-rock
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
4. Site will be available at `https://<username>.github.io/operation-water-rock/`

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge). Requires JavaScript enabled.

## Populating Dares and Riddles

**Note:** Both dares and riddles are primarily loaded from Firebase Firestore. The JSON files (`data/dares.json` and `data/riddles.json`) are fallbacks used when Firebase is not configured.

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
  "description": "Simple dares/challenges for operation-water-rock",
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
  "description": "Riddles data for operation-water-rock",
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

**Dares:**
- Loaded from Firebase `dares` collection (or `data/dares.json` as fallback)
- 5 random dares are shown to each player
- Players can complete dares for +10 points or trash them
- Dares update in real-time via Firebase subscriptions

**Riddles:**
- Loaded from Firebase `riddles` collection (or `data/riddles.json` as fallback)
- Riddles are sorted by `id` and shown sequentially (in order)
- Players see one riddle at a time in the riddle box
- When unlocked, players can:
  - Click "HINT" to reveal the hint
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
  }
}
```

**Note**: For production, implement proper authentication and stricter rules.

### Firestore Structure

- **admin/state**: Admin settings (unlocked flag)
- **users/{userId}**: User accounts with passwords (SECURE - stored in Firestore)
- **dares/{dareId}**: Dare entries (simple challenges)
- **riddles/{riddleId}**: Riddle entries (shown sequentially)

### Data Storage

- **Authentication**: Firestore `users` collection (passwords not in codebase)
- **User Management**: Firestore `users` collection (admin manages via admin panel)
- **Points**: localStorage (per user: `points_player1`, `points_player2`, etc.) - can be negative
- **Dares**: Firestore `dares` collection (for admin management and real-time updates)
- **Riddles**: Firestore `riddles` collection (shown sequentially, real-time updates)
- **Admin State**: Firestore (unlocked flag for real-time sync)

**Security**: Passwords are stored in Firestore, not in code. Admin panel requires admin password to access. Firebase API keys are public (security comes from Firestore security rules).

## Admin Panel Commands

Access admin panel at `admin.html` (requires admin password):

- `help` - Show all commands
- `list` - List all dares
- `list users` - List all users
- `list points` or `points` - List all player points
- `add "challenge text"` - Add a new dare (simple one-line challenge)
- `edit <id> challenge "<value>"` - Edit dare challenge
- `delete <id>` - Delete dare
- `riddle add <id> "riddle" "answer" "hint"` - Add a new riddle
- `riddle edit <id> <field> "<value>"` - Edit riddle (field: riddle, answer, or hint)
- `riddle delete <id>` - Delete riddle
- `list riddles` - List all riddles
- `user add <role>` - Add user
- `user list` - List all users
- `user pass <id> <password>` - Change user password
- `unlock true` / `unlock false` - Toggle unlock state
- `settings` - Show admin settings
- `clear` - Clear output

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please open an issue or submit a pull request.
