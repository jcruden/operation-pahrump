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
│   ├── firebase-config.js       # Firebase config (gitignored)
│   └── firebase-config.example.js # Firebase config template
├── data/
│   └── dares.json      # Dares data with riddles, hints, and answers
└── README.md           # This file
```

## Features

- **Role-based authentication** - Four roles: player1, player2, player3, admin
- **Terminal-style UI** - CRT aesthetic with green text, scanlines, and flicker effects
- **Interactive typewriter effect** - Animated text with moving cursor
- **Points system** - Earn/lose points through dare completion and interactions
- **Interactive dares** - Complete dares, request hints, submit answers
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
   - Create Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Copy `js/firebase-config.example.js` to `js/firebase-config.js`
   - Add your Firebase configuration to `js/firebase-config.js`
   - Configure Firestore security rules (see below)
   - Initialize data: Open `index.html` in browser console and run:
     ```javascript
     import('./js/firebase-setup.js').then(async (module) => {
         await module.setupFirebase();
     });
     ```
   - This will prompt you to set passwords for all users

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
- **dares/{dareId}**: Dare entries (managed by admin)

### Data Storage

- **Authentication**: Firestore `users` collection (passwords not in codebase)
- **User Management**: Firestore `users` collection (admin manages via admin panel)
- **Points**: localStorage (per user: `points_player1`, `points_player2`, etc.)
- **Dares**: Firestore (for admin management and real-time updates)
- **Admin State**: Firestore (unlocked flag for real-time sync)

**Security**: Passwords are stored in Firestore, not in code. Admin panel requires admin password to access. `firebase-config.js` is gitignored

## Admin Panel Commands

Access admin panel at `admin.html` (requires admin password):

- `help` - Show all commands
- `list` - List all dares
- `list users` - List all users
- `list points` or `points` - List all player points
- `add "title" "desc" "difficulty" "category" "riddle" "answer" "hint"` - Add dare
- `edit <id> <field> "<value>"` - Edit dare
- `delete <id>` - Delete dare
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
