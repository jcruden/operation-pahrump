# Importing Riddles and Dares from JSON Files

Since `riddles.json` and `dares.json` are in `.gitignore`, you need to import them from your local files using Node.js scripts.

## Setup

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Set up Firebase Admin credentials:**

   You have two options:

   **Option A: Service Account Key (Recommended)**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `serviceAccountKey.json` in the project root
   - **⚠️ IMPORTANT: Add `serviceAccountKey.json` to `.gitignore`!**

   **Option B: Application Default Credentials**
   ```bash
   gcloud auth application-default login
   ```
   Or set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to your service account key.

## Import Riddles

Run the import script:

```bash
npm run import-riddles
```

Or directly:

```bash
node import-riddles.js
```

The script will:
1. Delete all existing riddles from Firestore
2. Import all riddles from `riddles.json` in order
3. Assign IDs 1, 2, 3, etc. based on the order in the JSON file
4. Include all fields: `riddle`, `hint`, `answer`, and `instruction`

## Import Dares

Run the import script:

```bash
npm run import-dares
```

Or directly:

```bash
node import-dares.js
```

The script will:
1. Delete all existing dares from Firestore
2. Import all dares from `dares.json` in order
3. Assign IDs 1, 2, 3, etc. based on the order in the JSON file
4. Each dare will have a `challenge` field with the dare text

## Import Clues

Run the import script:

```bash
npm run import-clues
```

Or directly:

```bash
node import-clues.js
```

The script will:
1. Delete all existing clues from Firestore
2. Import all clues from `riddles.json` in order
3. Determine clue type based on `assignedTo` field:
   - If `assignedTo` exists → person-specific clue
   - If `assignedTo` doesn't exist → global clue
4. Map old player names (player1, player2, player3) to new names (Zoe, JT, Alana)
5. Group consecutive clues with the same type at the same order
6. Include all fields: `riddle`, `hint`, `answer`, `instruction`, and `assignedTo` (if applicable)

**Important:** For global clues, when one person completes, gets a hint, or gets a wrong answer, **all players** will get/lose the same points in real-time.

## Import Both

To import both riddles and dares at once:

```bash
npm run import-all
```

## What Gets Imported

### Riddles

Each riddle in `riddles.json` will be imported with:
- `id`: Sequential number (1, 2, 3, ...)
- `riddle`: The riddle text
- `hint`: The hint text
- `answer`: The correct answer
- `instruction`: The instruction text (shown in the instruction box on dashboard)
- `createdAt`: Server timestamp
- `updatedAt`: Server timestamp

### Dares

Each dare in `dares.json` will be imported with:
- `id`: Sequential number (1, 2, 3, ...)
- `challenge`: The dare text (string from the array)
- `createdAt`: Server timestamp
- `updatedAt`: Server timestamp

**Note:** `dares.json` can be either:
- An array of strings: `["Dare 1", "Dare 2", ...]`
- An array of objects: `[{"id": 1, "challenge": "Dare 1"}, ...]`

### Clues

Each clue in `riddles.json` will be imported with:
- `order`: Sequential number (determined by position and grouping)
- `type`: `"global"` or `"person-specific"` (based on `assignedTo` field)
- `riddle`: The clue/riddle text
- `hint`: The hint text
- `answer`: The correct answer
- `instruction`: The instruction text (shown in the instruction box on dashboard)
- `assignedTo`: Array of user IDs (only for person-specific clues, e.g., `["Zoe", "JT"]`)
- `createdAt`: Server timestamp
- `updatedAt`: Server timestamp

**Order Logic:**
- Consecutive clues with `assignedTo` (person-specific) share the same order
- Consecutive clues without `assignedTo` (global) each get their own sequential order
- When transitioning between types, the order increments

**Example:**
```json
[
  {"riddle": "...", "assignedTo": "player1"},  // Order 1, person-specific
  {"riddle": "...", "assignedTo": "player2"},  // Order 1, person-specific
  {"riddle": "...", "assignedTo": "player3"},  // Order 1, person-specific
  {"riddle": "..."},                           // Order 2, global
  {"riddle": "..."},                           // Order 3, global
]
```

**Shared Points for Global Clues:**
- When any player completes a global clue correctly: **All players** get +50 points
- When any player gets a hint on a global clue: **All players** lose -30 points
- When any player gets a wrong answer on a global clue: **All players** lose -5 points
- Points sync in real-time across all users

## Troubleshooting

- **"riddles.json not found"** or **"dares.json not found"**: Make sure the JSON files exist in the project root
- **"Error initializing Firebase Admin"**: Make sure you've set up credentials (see Setup above)
- **Permission errors**: Make sure your service account has Firestore read/write permissions
- **Invalid format errors**: Make sure `riddles.json` is an array of objects and `dares.json` is an array of strings or objects

