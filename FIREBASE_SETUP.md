# Firebase Firestore Data Structure & Setup Guide

## Firestore Collections Structure

Your Firestore database should have the following collections:

### 1. `admin/state` (Single Document)
```
admin/state
  - unlocked: boolean (false)
  - updatedAt: timestamp
```

**Purpose**: Controls whether players can interact with dares/riddles

### 2. `users/{userId}` (Collection)
```
users/Dani
  - role: string ("Dani")
  - username: string ("Dani")
  - password: string (plaintext password)
  - active: boolean (true)
  - updatedAt: timestamp

users/JT
  - role: string ("JT")
  - username: string ("JT")
  - password: string (plaintext password)
  - active: boolean (true)
  - updatedAt: timestamp

users/Alana
  - role: string ("Alana")
  - username: string ("Alana")
  - password: string (plaintext password)
  - active: boolean (true)
  - updatedAt: timestamp

users/admin
  - role: string ("admin")
  - username: string ("admin")
  - password: string (plaintext password)
  - active: boolean (true)
  - updatedAt: timestamp
```

**Purpose**: User authentication and role management

### 3. `dares/{dareId}` (Collection)
```
dares/{auto-generated-id}
  - id: number (1, 2, 3...)
  - challenge: string ("Take a picture in a fountain")
  - createdAt: timestamp
  - updatedAt: timestamp
```

**Purpose**: Store dare challenges that players can complete

**Example Documents**:
```
dares/abc123
  - id: 1
  - challenge: "Take a picture in a fountain"
  - createdAt: 2025-01-15T10:30:00Z
  - updatedAt: 2025-01-15T10:30:00Z

dares/def456
  - id: 2
  - challenge: "Do 10 push-ups"
  - createdAt: 2025-01-15T10:31:00Z
  - updatedAt: 2025-01-15T10:31:00Z
```

### 4. `riddles/{riddleId}` (Collection)
```
riddles/{auto-generated-id}
  - id: number (1, 2, 3...)
  - riddle: string ("What has keys but no locks?")
  - answer: string ("piano")
  - hint: string ("It's a musical instrument")
  - createdAt: timestamp
  - updatedAt: timestamp
```

**Purpose**: Store riddles that players answer sequentially

**Example Documents**:
```
riddles/ghi789
  - id: 1
  - riddle: "What has keys but no locks?"
  - answer: "piano"
  - hint: "It's a musical instrument"
  - createdAt: 2025-01-15T10:30:00Z
  - updatedAt: 2025-01-15T10:30:00Z

riddles/jkl012
  - id: 2
  - riddle: "I speak without a mouth and hear without ears. What am I?"
  - answer: "echo"
  - hint: "Think about sound and reflection"
  - createdAt: 2025-01-15T10:31:00Z
  - updatedAt: 2025-01-15T10:31:00Z
```

## How to Initialize/Update Data

### Option 1: Using the Setup Script (Recommended for Initial Setup)

1. **Start a local server** (required for importing JSON):
   ```bash
   python3 -m http.server 8000
   # or
   npx http-server -p 8000
   ```

2. **Open `index.html`** in your browser:
   ```
   http://localhost:8000
   ```

3. **Open browser console** (F12 or Cmd+Option+I)

4. **Run the setup script**:
   ```javascript
   import('./js/firebase-setup.js').then(async (module) => {
       await module.setupFirebase();
   });
   ```

   This will:
   - Initialize admin state (unlocked: false)
   - Prompt you to set passwords for all users
   - Import dares from `data/dares.json`
   - **Note**: Riddles need to be imported separately (see below)

5. **Import riddles** (after initial setup):
   ```javascript
   import('./js/firebase-service.js').then(async (module) => {
       const response = await fetch('data/riddles.json');
       const data = await response.json();
       for (const riddle of data.riddles) {
           await module.addRiddle(riddle);
       }
       console.log('Riddles imported!');
   });
   ```

### Option 2: Using Firebase Console (Manual)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `operation-pahrump`
3. Go to **Firestore Database**
4. Click **Start collection** or use existing collections

#### Create Admin State:
- Collection ID: `admin`
- Document ID: `state`
- Fields:
  - `unlocked` (boolean): `false`
  - `updatedAt` (timestamp): current time

#### Create Users:
- Collection ID: `users`
- For each user, create a document:
  - Document ID: `Dani`, `JT`, `Alana`, `admin`
  - Fields:
    - `role` (string): `Dani`, `JT`, `Alana`, or `admin`
    - `username` (string): same as role
    - `password` (string): your chosen password
    - `active` (boolean): `true`
    - `updatedAt` (timestamp): current time

#### Create Dares:
- Collection ID: `dares`
- Click **Add document** (auto-generate ID)
- Add fields:
  - `id` (number): `1`, `2`, `3`, etc.
  - `challenge` (string): dare text
  - `createdAt` (timestamp): current time
  - `updatedAt` (timestamp): current time

#### Create Riddles:
- Collection ID: `riddles`
- Click **Add document** (auto-generate ID)
- Add fields:
  - `id` (number): `1`, `2`, `3`, etc.
  - `riddle` (string): riddle question
  - `answer` (string): correct answer
  - `hint` (string): hint text
  - `createdAt` (timestamp): current time
  - `updatedAt` (timestamp): current time

### Option 3: Using Admin Panel (After Initial Setup)

Once users are set up, you can use the admin panel to manage data:

1. Go to `admin.html`
2. Login with admin password
3. Use commands:
   - `add "challenge text"` - Add new dare
   - `riddle add <id> "riddle" "answer" "hint"` - Add new riddle
   - `user add <role>` - Add new user
   - `user pass <id> <password>` - Change password
   - `list` - View all dares
   - `list riddles` - View all riddles
   - `list users` - View all users

## Visual Structure in Firebase Console

```
Firestore Database
├── admin (collection)
│   └── state (document)
│       ├── unlocked: false
│       └── updatedAt: timestamp
│
├── users (collection)
│   ├── Dani (document)
│   │   ├── role: "Dani"
│   │   ├── username: "Dani"
│   │   ├── password: "your_password"
│   │   ├── active: true
│   │   └── updatedAt: timestamp
│   ├── JT (document)
│   ├── Alana (document)
│   └── admin (document)
│
├── dares (collection)
│   ├── {auto-id-1} (document)
│   │   ├── id: 1
│   │   ├── challenge: "Take a picture in a fountain"
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│   ├── {auto-id-2} (document)
│   └── ...
│
└── riddles (collection)
    ├── {auto-id-1} (document)
    │   ├── id: 1
    │   ├── riddle: "What has keys but no locks?"
    │   ├── answer: "piano"
    │   ├── hint: "It's a musical instrument"
    │   ├── createdAt: timestamp
    │   └── updatedAt: timestamp
    ├── {auto-id-2} (document)
    └── ...
```

## Important Notes

1. **Document IDs**: 
   - For `users`: Use role names as document IDs (`Dani`, `JT`, `Alana`, `admin`)
   - For `dares` and `riddles`: Use auto-generated IDs (Firebase will create them)

2. **Ordering**: 
   - Dares and riddles are ordered by their `id` field (number)
   - Make sure `id` values are unique and sequential

3. **Passwords**: 
   - Currently stored in plaintext (security risk)
   - Consider changing passwords regularly using admin panel
   - For production, consider implementing password hashing

4. **Timestamps**: 
   - Use Firebase server timestamps (`serverTimestamp()`) when possible
   - This ensures consistent time across all clients

5. **Points**: 
   - Points are stored in `localStorage`, NOT in Firestore
   - Each user's points are stored as: `points_Dani`, `points_JT`, `points_Alana`, etc.

## Quick Setup Checklist

- [ ] Admin state created (`admin/state` document)
- [ ] All users created (`users` collection with 4 documents)
- [ ] Dares imported from JSON or created manually
- [ ] Riddles imported from JSON or created manually
- [ ] All passwords changed from defaults
- [ ] Security rules updated (see `firestore.rules`)

