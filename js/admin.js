/**
 * Admin panel JavaScript for operation pahrump.
 * Handles administrative functions for managing dares data, users, and admin state.
 */

// Import Firebase service
import {
    getAllDares,
    addDare,
    updateDare,
    deleteDare,
    getAllUsers,
    saveUser,
    getUserPoints,
    updateAdminState,
    subscribeToAdminState,
    subscribeToDares,
    validatePassword,
    getAllRiddles,
    addRiddle,
    updateRiddle,
    deleteRiddle,
    getAllDrinkChoices,
    deleteDrinkChoice,
    getAllClues,
    addClue,
    updateClue,
    deleteClue,
    getAllUsersClueProgress,
    updateUserClueProgress
} from './firebase-service.js';

// Admin state
let adminState = {
    dares: [],
    users: [],
    adminState: { unlocked: false },
    currentView: 'dares', // 'dares', 'users', 'settings'
    loginHandlerAttached: false
};

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin panel initialized');
    
    // Check if already authenticated
    const adminAuth = sessionStorage.getItem('adminAuthenticated');
    if (adminAuth === 'true') {
        showAdminPanel();
    } else {
        showLoginPrompt();
    }
});

/**
 * Show login prompt
 */
function showLoginPrompt() {
    document.getElementById('adminLoginContainer').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    
    const passwordInput = document.getElementById('adminPasswordInput');
    const errorDiv = document.getElementById('adminLoginError');
    
    // Clear any previous value and error
    if (passwordInput) {
        passwordInput.value = '';
        passwordInput.disabled = false;
        passwordInput.readOnly = false;
    }
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
    
    // Remove previous event listeners by cloning the element
    // This ensures we start fresh with no lingering listeners
    if (!passwordInput) {
        console.error('Password input not found');
        return;
    }
    
    const newInput = passwordInput.cloneNode(true);
    passwordInput.parentNode.replaceChild(newInput, passwordInput);
    adminState.loginHandlerAttached = false;
    
    // Get reference to the new input element
    const input = document.getElementById('adminPasswordInput');
    
    if (!input) {
        console.error('Password input not found after cloning');
        return;
    }
    
    // Ensure input is fully enabled and focusable
    input.disabled = false;
    input.readOnly = false;
    input.removeAttribute('disabled');
    input.removeAttribute('readonly');
    input.style.display = 'block';
    input.style.visibility = 'visible';
    input.style.opacity = '1';
    
    // Ensure input can receive keyboard events
    input.setAttribute('tabindex', '0');
    input.setAttribute('autofocus', '');
    
    // Force input to be interactive
    input.contentEditable = false;
    
    // Handle password input - attach fresh listeners
    const handleKeyPress = async function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const password = input.value.trim();
            if (errorDiv) errorDiv.style.display = 'none';
            
            if (!password) {
                return;
            }
            
            // Validate admin password
            const userInfo = await validatePassword(password);
            
            if (userInfo && userInfo.role === 'admin') {
                // Authenticated
                sessionStorage.setItem('adminAuthenticated', 'true');
                sessionStorage.setItem('adminUserInfo', JSON.stringify(userInfo));
                input.removeEventListener('keypress', handleKeyPress);
                adminState.loginHandlerAttached = false;
                showAdminPanel();
            } else {
                // Access denied
                if (errorDiv) errorDiv.style.display = 'block';
                input.value = '';
                setTimeout(() => {
                    if (errorDiv) errorDiv.style.display = 'none';
                }, 3000);
            }
        }
    };
    
    // Attach event listeners - always attach after cloning
    input.addEventListener('keypress', handleKeyPress);
    
    // Also listen for keydown events to catch all keys (some browsers don't fire keypress for all keys)
    input.addEventListener('keydown', function(e) {
        // Allow all keys to work normally - don't prevent default
        // Only handle Enter in keypress to avoid double-firing
        if (e.key === 'Enter') {
            // Let keypress handle it, but ensure it's not blocked
        }
    });
    
    // Listen for input events to ensure typing works
    input.addEventListener('input', function(e) {
        // Input is working - ensure visibility
        input.style.display = 'block';
        input.style.visibility = 'visible';
        input.style.opacity = '1';
    });
    
    adminState.loginHandlerAttached = true;
    
    // Focus input - use multiple methods for reliability
    setTimeout(() => {
        input.focus();
        // Double-check focus
        if (document.activeElement !== input) {
            input.focus();
        }
    }, 50);
}

/**
 * Show admin panel
 */
async function showAdminPanel() {
    document.getElementById('adminLoginContainer').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    
    const adminInput = document.getElementById('adminInput');
    const adminOutput = document.getElementById('adminOutput');
    
    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', function() {
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('adminUserInfo');
        showLoginPrompt();
    });
    
    // Initialize admin interface
    await initializeAdmin();
    
    // Set up command handlers
    setupCommandHandlers();
    
    // Set up real-time subscriptions
    setupRealtimeSubscriptions();
    
    // Display welcome message
    addOutputLine('Admin panel initialized. Type "help" for available commands.', 'info');
}

/**
 * Initialize admin panel
 */
async function initializeAdmin() {
    try {
        // Load initial data
        adminState.dares = await getAllDares();
        adminState.users = await getAllUsers();
        
        // Display current state
        displayDaresList();
    } catch (error) {
        console.error('Error initializing admin:', error);
        addOutputLine('Note: Firebase may not be configured. Dares will fallback to JSON file.', 'info');
        // Try to load from JSON
        try {
            const response = await fetch('data/dares.json');
            const data = await response.json();
            adminState.dares = data.dares || [];
            displayDaresList();
        } catch (jsonError) {
            addOutputLine('Error loading dares from JSON:', 'error');
        }
    }
}

/**
 * Set up real-time subscriptions
 */
function setupRealtimeSubscriptions() {
    // Subscribe to dares changes
    subscribeToDares((dares) => {
        adminState.dares = dares;
        if (adminState.currentView === 'dares') {
            displayDaresList();
        }
    });
    
    // Subscribe to admin state changes
    subscribeToAdminState((state) => {
        adminState.adminState = state;
        if (adminState.currentView === 'settings') {
            displaySettings();
        }
    });
}

/**
 * Set up command handlers
 */
function setupCommandHandlers() {
    const adminInput = document.getElementById('adminInput');
    
    if (adminInput) {
        adminInput.addEventListener('keypress', async function(e) {
            if (e.key === 'Enter') {
                const command = adminInput.value.trim();
                adminInput.value = '';
                
                if (command) {
                    await processCommand(command);
                }
            }
        });
    }
}

/**
 * Process admin command
 */
async function processCommand(command) {
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    addOutputLine(`> ${command}`, 'command');
    
    try {
        switch (cmd) {
            case 'help':
                showHelp();
                break;
            case 'list':
            case 'ls':
                if (args[0] === 'users') {
                    await displayUsersList();
                } else if (args[0] === 'points') {
                    await displayPointsList();
                } else if (args[0] === 'riddles') {
                    await displayRiddlesList();
                } else if (args[0] === 'clues') {
                    await displayCluesList();
                } else if (args[0] === 'progress') {
                    await displayClueProgress();
                } else {
                    displayDaresList();
                }
                break;
            case 'points':
                await displayPointsList();
                break;
            case 'drinks':
            case 'drink':
                await displayDrinkChoices();
                break;
            case 'add':
                await handleAddDare(args);
                break;
            case 'riddle':
                await handleRiddleCommand(args);
                break;
            case 'clue':
                await handleClueCommand(args);
                break;
            case 'edit':
                await handleEditDare(args);
                break;
            case 'delete':
            case 'del':
                await handleDeleteDare(args);
                break;
            case 'user':
                await handleUserCommand(args);
                break;
            case 'unlock':
                await handleUnlock(args);
                break;
            case 'proceed':
                await handleProceed(args);
                break;
            case 'reset':
            case 'resetvote':
                await handleResetVote(args);
                break;
            case 'settings':
                displaySettings();
                break;
            case 'clear':
                clearOutput();
                break;
            default:
                addOutputLine(`Unknown command: ${cmd}. Type "help" for available commands.`, 'error');
        }
    } catch (error) {
        console.error('Error processing command:', error);
        addOutputLine(`Error: ${error.message}`, 'error');
    }
}

/**
 * Show help message
 */
function showHelp() {
    const helpText = `
Available commands:
  help              - Show this help message\n
  list              - List all dares\n
  list users        - List all users\n
  list points       - List all player points\n
  list riddles      - List all riddles\n
  list clues        - List all clues\n
  list progress     - List all user clue progress\n
  points            - List all player points (shortcut)\n
  drinks            - List all drink choices\n
  add "challenge"   - Add a new dare (simple one-line challenge)\n
  edit <id> challenge "<value>" - Edit dare challenge\n
  delete <id>       - Delete a dare by ID\n
  riddle add <id> "riddle" "answer" "hint" ["instruction"] - Add a new riddle\n
  riddle edit <id> <field> "<value>" - Edit riddle (field: riddle, answer, hint, or instruction)\n
  riddle delete <id> - Delete a riddle by ID\n
  clue add <order> <type> "riddle" "answer" "hint" [assignedTo] - Add a clue\n
  clue edit <id> <field> "<value>" - Edit clue\n
  clue delete <id> - Delete a clue\n
  clue reset <userId> - Reset user's clue progress\n  
  user add <role>   - Add a new user\n
  user list         - List all users\n
  user pass <id>    - Change user password\n
  unlock <true|false> - Set unlocked state\n
  proceed <true|false> - Allow users to proceed from instructions to dashboard\n
  reset vote <userId>  - Reset drink vote for a user (e.g., reset vote Zoe)\n
  settings          - Show admin settings\n
  clear             - Clear output    
`;
    addOutputLine(helpText, 'info');
}

/**
 * Display dares list
 */
function displayDaresList() {
    adminState.currentView = 'dares';
    const output = document.getElementById('adminOutput');
    
    if (adminState.dares.length === 0) {
        addOutputLine('No dares found. Use "add" to create a new dare.', 'info');
        return;
    }
    
    addOutputLine(`\nTotal dares: ${adminState.dares.length}\n`, 'info');
    
    adminState.dares.forEach((dare, index) => {
        const challenge = dare.challenge || dare.title || dare.description || 'Untitled';
        const line = `[${dare.id || index + 1}] ${challenge}`;
        addOutputLine(line, 'dare');
    });
}

/**
 * Display users list
 */
async function displayUsersList() {
    adminState.currentView = 'users';
    adminState.users = await getAllUsers();
    
    if (adminState.users.length === 0) {
        addOutputLine('No users found. Use "user add <role>" to create a new user.', 'info');
        return;
    }
    
    addOutputLine(`\nTotal users: ${adminState.users.length}\n`, 'info');
    
    adminState.users.forEach((user) => {
        const active = user.active !== false ? 'active' : 'inactive';
        // Don't show password in list
        const line = `[${user.id}] ${user.role || 'unknown'} - ${user.username || 'N/A'} (${active})`;
        addOutputLine(line, 'user');
    });
}

/**
 * Display points list for all users
 */
async function displayPointsList() {
    adminState.currentView = 'points';
    const users = await getAllUsers();
    const usersWithPoints = users.map(user => ({
        ...user,
        points: getUserPoints(user.id)
    }));
    
    if (usersWithPoints.length === 0) {
        addOutputLine('No users found.', 'info');
        return;
    }
    
    addOutputLine(`\nPlayer Points:\n`, 'info');
    
    usersWithPoints.forEach((user) => {
        const points = user.points || 0;
        const line = `[${user.id}] ${user.role || 'unknown'} - ${points} points`;
        addOutputLine(line, 'user');
    });
}

/**
 * Display settings
 */
function displaySettings() {
    adminState.currentView = 'settings';
    const unlocked = adminState.adminState.unlocked ? 'true' : 'false';
    const canProceed = adminState.adminState.canProceedToDashboard ? 'true' : 'false';
    addOutputLine(`\nAdmin Settings:\n  Unlocked: ${unlocked}\n  Can Proceed to Dashboard: ${canProceed}\n`, 'info');
    addOutputLine('Use "unlock true" or "unlock false" to change unlock state.', 'info');
    addOutputLine('Use "proceed true" or "proceed false" to allow users to proceed from instructions.', 'info');
}

/**
 * Display riddles list
 */
async function displayRiddlesList() {
    adminState.currentView = 'riddles';
    try {
        const riddles = await getAllRiddles();
        const sortedRiddles = [...riddles].sort((a, b) => (a.id || 0) - (b.id || 0));
        
        if (sortedRiddles.length === 0) {
            addOutputLine('No riddles found. Use "riddle add" to create a new riddle.', 'info');
            return;
        }
        
        addOutputLine(`\nTotal riddles: ${sortedRiddles.length}\n`, 'info');
        
        sortedRiddles.forEach((riddle) => {
            const line = `[${riddle.id}] ${riddle.riddle || 'No riddle text'} -> ${riddle.answer || 'No answer'}`;
            addOutputLine(line, 'riddle');
            if (riddle.instruction) {
                addOutputLine(`  Instruction: ${riddle.instruction}`, 'info');
            }
        });
    } catch (error) {
        addOutputLine(`Error loading riddles: ${error.message}`, 'error');
    }
}

/**
 * Display drink choices list
 */
async function displayDrinkChoices() {
    adminState.currentView = 'drinks';
    try {
        const drinkChoices = await getAllDrinkChoices();
        
        if (drinkChoices.length === 0) {
            addOutputLine('No drink choices found yet.', 'info');
            return;
        }
        
        addOutputLine(`\nTotal drink choices: ${drinkChoices.length}\n`, 'info');
        
        // Group by drink type
        const drinksByType = {};
        drinkChoices.forEach(choice => {
            const drink = choice.drink || 'Not chosen';
            if (!drinksByType[drink]) {
                drinksByType[drink] = [];
            }
            drinksByType[drink].push(choice);
        });
        
        // Display grouped by drink type
        Object.entries(drinksByType).forEach(([drink, choices]) => {
            addOutputLine(`\n${drink}:`, 'info');
            choices.forEach(choice => {
                const role = choice.role || choice.userId || 'unknown';
                const userId = choice.userId || 'N/A';
                const line = `  - ${role} (${userId})`;
                addOutputLine(line, 'user');
            });
        });
    } catch (error) {
        addOutputLine(`Error loading drink choices: ${error.message}`, 'error');
    }
}

/**
 * Handle riddle command
 */
async function handleRiddleCommand(args) {
    if (args.length < 1) {
        addOutputLine('Usage: riddle <command> [args]', 'error');
        addOutputLine('Commands: add <id> "riddle" "answer" "hint" ["instruction"], edit <id> <field> "<value>", delete <id>', 'info');
        return;
    }
    
    const subCmd = args[0].toLowerCase();
    
    if (subCmd === 'add') {
        if (args.length < 5) {
            addOutputLine('Usage: riddle add <id> "riddle" "answer" "hint" ["instruction"]', 'error');
            addOutputLine('Example: riddle add 1 "What has keys?" "piano" "It\'s a musical instrument" "All lowercase. One word."', 'info');
            return;
        }
        const id = parseInt(args[1], 10);
        const riddle = args[2].replace(/"/g, '');
        const answer = args[3].replace(/"/g, '');
        const hint = args[4].replace(/"/g, '');
        const instruction = args[5] ? args[5].replace(/"/g, '') : '';
        
        try {
            const riddleData = {
                id: id,
                riddle: riddle,
                answer: answer,
                hint: hint
            };
            if (instruction) {
                riddleData.instruction = instruction;
            }
            await addRiddle(riddleData);
            addOutputLine(`Riddle ${id} added successfully.`, 'success');
            await displayRiddlesList();
        } catch (error) {
            addOutputLine(`Error adding riddle: ${error.message}`, 'error');
        }
    } else if (subCmd === 'edit') {
        if (args.length < 4) {
            addOutputLine('Usage: riddle edit <id> <field> "<value>"', 'error');
            addOutputLine('Fields: riddle, answer, hint, instruction', 'info');
            return;
        }
        const riddleId = args[1];
        const field = args[2];
        const value = args.slice(3).join(' ').replace(/"/g, '');
        
        if (!['riddle', 'answer', 'hint', 'instruction'].includes(field)) {
            addOutputLine('Field must be: riddle, answer, hint, or instruction', 'error');
            return;
        }
        
        try {
            await updateRiddle(riddleId, { [field]: value });
            addOutputLine(`Riddle ${riddleId} updated successfully.`, 'success');
            await displayRiddlesList();
        } catch (error) {
            addOutputLine(`Error updating riddle: ${error.message}`, 'error');
        }
    } else if (subCmd === 'delete') {
        if (args.length < 2) {
            addOutputLine('Usage: riddle delete <id>', 'error');
            return;
        }
        const riddleId = args[1];
        
        if (!confirm(`Are you sure you want to delete riddle ${riddleId}?`)) {
            return;
        }
        
        try {
            await deleteRiddle(riddleId);
            addOutputLine(`Riddle ${riddleId} deleted successfully.`, 'success');
            await displayRiddlesList();
        } catch (error) {
            addOutputLine(`Error deleting riddle: ${error.message}`, 'error');
        }
    } else {
        addOutputLine('Unknown riddle command. Use: add, edit, or delete', 'error');
    }
}

/**
 * Handle clue command
 */
async function handleClueCommand(args) {
    if (args.length < 1) {
        addOutputLine('Usage: clue <command> [args]', 'error');
        addOutputLine('Commands: add, edit, delete, reset', 'info');
        addOutputLine('  clue add <order> global "riddle" "answer" "hint"', 'info');
        addOutputLine('  clue add <order> person "riddle" "answer" "hint" Zoe,JT,Alana', 'info');
        addOutputLine('  clue edit <id> <field> "<value>"', 'info');
        addOutputLine('  clue delete <id>', 'info');
        addOutputLine('  clue reset <userId>', 'info');
        return;
    }
    
    const subCmd = args[0].toLowerCase();
    
    if (subCmd === 'add') {
        if (args.length < 6) {
            addOutputLine('Usage: clue add <order> <type> "riddle" "answer" "hint" [assignedTo]', 'error');
            addOutputLine('Types: global, person', 'info');
            addOutputLine('Example: clue add 1 global "What has keys?" "piano" "musical instrument"', 'info');
            addOutputLine('Example: clue add 2 person "Zoe\'s clue" "answer" "hint" Zoe', 'info');
            return;
        }
        
        const order = parseInt(args[1], 10);
        const type = args[2].toLowerCase();
        const riddle = args[3].replace(/"/g, '');
        const answer = args[4].replace(/"/g, '');
        const hint = args[5].replace(/"/g, '');
        const assignedTo = args[6] ? args[6].split(',').map(s => s.trim()) : [];
        
        if (type !== 'global' && type !== 'person') {
            addOutputLine('Type must be "global" or "person"', 'error');
            return;
        }
        
        const clueData = {
            order: order,
            type: type === 'person' ? 'person-specific' : 'global',
            riddle: riddle,
            answer: answer,
            hint: hint
        };
        
        if (type === 'person' && assignedTo.length > 0) {
            clueData.assignedTo = assignedTo;
        }
        
        try {
            const id = await addClue(clueData);
            addOutputLine(`Clue added successfully with ID: ${id}`, 'success');
            await displayCluesList();
        } catch (error) {
            addOutputLine(`Error adding clue: ${error.message}`, 'error');
        }
    } else if (subCmd === 'edit') {
        if (args.length < 4) {
            addOutputLine('Usage: clue edit <id> <field> "<value>"', 'error');
            addOutputLine('Fields: riddle, answer, hint, order, type, assignedTo', 'info');
            addOutputLine('Example: clue edit abc123 riddle "New riddle text"', 'info');
            return;
        }
        
        const clueId = args[1];
        const field = args[2];
        const value = args.slice(3).join(' ').replace(/"/g, '');
        
        const updates = {};
        
        if (field === 'order') {
            updates.order = parseInt(value, 10);
        } else if (field === 'assignedTo') {
            updates.assignedTo = value.split(',').map(s => s.trim());
        } else {
            updates[field] = value;
        }
        
        try {
            await updateClue(clueId, updates);
            addOutputLine(`Clue ${clueId} updated successfully.`, 'success');
            await displayCluesList();
        } catch (error) {
            addOutputLine(`Error updating clue: ${error.message}`, 'error');
        }
    } else if (subCmd === 'delete') {
        if (args.length < 2) {
            addOutputLine('Usage: clue delete <id>', 'error');
            return;
        }
        
        const clueId = args[1];
        
        if (!confirm(`Are you sure you want to delete clue ${clueId}?`)) {
            return;
        }
        
        try {
            await deleteClue(clueId);
            addOutputLine(`Clue ${clueId} deleted successfully.`, 'success');
            await displayCluesList();
        } catch (error) {
            addOutputLine(`Error deleting clue: ${error.message}`, 'error');
        }
    } else if (subCmd === 'reset') {
        if (args.length < 2) {
            addOutputLine('Usage: clue reset <userId>', 'error');
            addOutputLine('Example: clue reset Zoe', 'info');
            return;
        }
        
        const userId = args[1];
        
        try {
            await updateUserClueProgress(userId, {
                currentClueOrder: 0,
                completedClueIds: [],
                waitingForOthers: false
            });
            addOutputLine(`Clue progress reset for ${userId}`, 'success');
            await displayClueProgress();
        } catch (error) {
            addOutputLine(`Error resetting clue progress: ${error.message}`, 'error');
        }
    } else {
        addOutputLine('Unknown clue command. Use: add, edit, delete, or reset', 'error');
    }
}

/**
 * Display clues list
 */
async function displayCluesList() {
    adminState.currentView = 'clues';
    try {
        const clues = await getAllClues();
        const sortedClues = [...clues].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        if (sortedClues.length === 0) {
            addOutputLine('No clues found. Use "clue add" to create a new clue.', 'info');
            return;
        }
        
        addOutputLine(`\nTotal clues: ${sortedClues.length}\n`, 'info');
        
        sortedClues.forEach((clue) => {
            const line = `[${clue.id}] Order ${clue.order}: ${clue.type}`;
            addOutputLine(line, 'clue');
            addOutputLine(`  Riddle: ${clue.riddle || 'No riddle text'}`, 'info');
            addOutputLine(`  Answer: ${clue.answer || 'No answer'}`, 'info');
            if (clue.hint) {
                addOutputLine(`  Hint: ${clue.hint}`, 'info');
            }
            if (clue.type === 'person-specific' && clue.assignedTo && clue.assignedTo.length > 0) {
                addOutputLine(`  Assigned to: ${clue.assignedTo.join(', ')}`, 'info');
            }
            addOutputLine('', 'info');
        });
    } catch (error) {
        addOutputLine(`Error loading clues: ${error.message}`, 'error');
    }
}

/**
 * Display clue progress for all users
 */
async function displayClueProgress() {
    adminState.currentView = 'progress';
    try {
        const progress = await getAllUsersClueProgress();
        
        if (progress.length === 0) {
            addOutputLine('No user progress found.', 'info');
            return;
        }
        
        addOutputLine(`\nUser Clue Progress:\n`, 'info');
        
        progress.forEach((prog) => {
            addOutputLine(`${prog.userId}:`, 'info');
            addOutputLine(`  Current Order: ${prog.currentClueOrder || 0}`, 'info');
            addOutputLine(`  Completed Clues: ${prog.completedClueIds?.length || 0}`, 'info');
            addOutputLine(`  Waiting for Others: ${prog.waitingForOthers ? 'Yes' : 'No'}`, 'info');
            if (prog.completedClueIds && prog.completedClueIds.length > 0) {
                addOutputLine(`  Completed IDs: ${prog.completedClueIds.join(', ')}`, 'info');
            }
            addOutputLine('', 'info');
        });
    } catch (error) {
        addOutputLine(`Error loading clue progress: ${error.message}`, 'error');
    }
}

/**
 * Handle add dare command
 */
async function handleAddDare(args) {
    // Simple format: add "challenge text"
    if (args.length < 1) {
        addOutputLine('Usage: add "challenge text"', 'error');
        addOutputLine('Example: add "Take a picture in a fountain"', 'info');
        return;
    }
    
    const challenge = args.join(' ').replace(/"/g, '');
    
    const dareData = {
        challenge: challenge,
        id: adminState.dares.length + 1
    };
    
    try {
        const id = await addDare(dareData);
        addOutputLine(`Dare added successfully with ID: ${id}`, 'success');
        adminState.dares = await getAllDares();
        displayDaresList();
    } catch (error) {
        addOutputLine(`Error adding dare: ${error.message}`, 'error');
    }
}

/**
 * Handle edit dare command
 */
async function handleEditDare(args) {
    if (args.length < 3) {
        addOutputLine('Usage: edit <id> <field> "<value>"', 'error');
        addOutputLine('Example: edit 1 title "New Title"', 'info');
        return;
    }
    
    const dareId = args[0];
    const field = args[1];
    const value = args.slice(2).join(' ').replace(/"/g, '');
    
    try {
        await updateDare(dareId, { [field]: value });
        addOutputLine(`Dare ${dareId} updated successfully.`, 'success');
        adminState.dares = await getAllDares();
        displayDaresList();
    } catch (error) {
        addOutputLine(`Error updating dare: ${error.message}`, 'error');
    }
}

/**
 * Handle delete dare command
 */
async function handleDeleteDare(args) {
    if (args.length < 1) {
        addOutputLine('Usage: delete <id>', 'error');
        return;
    }
    
    const dareId = args[0];
    
    if (!confirm(`Are you sure you want to delete dare ${dareId}?`)) {
        return;
    }
    
    try {
        await deleteDare(dareId);
        addOutputLine(`Dare ${dareId} deleted successfully.`, 'success');
        adminState.dares = await getAllDares();
        displayDaresList();
    } catch (error) {
        addOutputLine(`Error deleting dare: ${error.message}`, 'error');
    }
}

/**
 * Handle user commands
 */
async function handleUserCommand(args) {
    if (args.length < 1) {
        addOutputLine('Usage: user <command> [args]', 'error');
        addOutputLine('Commands: add <role>, list, pass <id> <password>', 'info');
        return;
    }
    
    const subCmd = args[0].toLowerCase();
    
    if (subCmd === 'add') {
        if (args.length < 2) {
            addOutputLine('Usage: user add <role>', 'error');
            return;
        }
        const role = args[1];
        const password = prompt(`Enter password for ${role}:`) || role;
        
        try {
            await saveUser(role, {
                role: role,
                username: role,
                password: password,
                active: true
            });
            addOutputLine(`User ${role} added successfully.`, 'success');
            adminState.users = await getAllUsers();
            await displayUsersList();
        } catch (error) {
            addOutputLine(`Error adding user: ${error.message}`, 'error');
        }
    } else if (subCmd === 'list') {
        adminState.users = await getAllUsers();
        await displayUsersList();
    } else if (subCmd === 'pass') {
        if (args.length < 3) {
            addOutputLine('Usage: user pass <id> <password>', 'error');
            return;
        }
        const userId = args[1];
        const password = args[2];
        
        try {
            await saveUser(userId, { password: password });
            addOutputLine(`Password updated for user ${userId}.`, 'success');
        } catch (error) {
            addOutputLine(`Error updating password: ${error.message}`, 'error');
        }
    }
}

/**
 * Handle unlock command
 */
async function handleUnlock(args) {
    if (args.length < 1) {
        addOutputLine('Usage: unlock <true|false>', 'error');
        return;
    }
    
    const unlocked = args[0].toLowerCase() === 'true';
    
    try {
        await updateAdminState({ unlocked: unlocked });
        addOutputLine(`Unlocked state set to: ${unlocked}`, 'success');
        adminState.adminState.unlocked = unlocked;
    } catch (error) {
        addOutputLine(`Error updating unlock state: ${error.message}`, 'error');
    }
}

/**
 * Handle proceed command - unlock progression from instructions to dashboard
 */
async function handleProceed(args) {
    if (args.length < 1) {
        addOutputLine('Usage: proceed <true|false>', 'error');
        return;
    }
    
    const canProceed = args[0].toLowerCase() === 'true';
    
    try {
        await updateAdminState({ canProceedToDashboard: canProceed });
        addOutputLine(`Users can proceed to dashboard: ${canProceed}`, 'success');
        adminState.adminState.canProceedToDashboard = canProceed;
    } catch (error) {
        addOutputLine(`Error updating proceed state: ${error.message}`, 'error');
    }
}

/**
 * Handle reset vote command - reset drink vote for a user
 */
async function handleResetVote(args) {
    if (args.length < 2 || args[0].toLowerCase() !== 'vote') {
        addOutputLine('Usage: reset vote <userId>', 'error');
        addOutputLine('Example: reset vote Zoe', 'info');
        return;
    }
    
    const userId = args[1];
    
    try {
        const deleted = await deleteDrinkChoice(userId);
        if (deleted) {
            addOutputLine(`Drink vote reset for ${userId}`, 'success');
            // Refresh drink choices display if currently viewing
            if (adminState.currentView === 'drinks') {
                await displayDrinkChoices();
            }
        } else {
            addOutputLine(`No vote found for ${userId}`, 'info');
        }
    } catch (error) {
        addOutputLine(`Error resetting vote: ${error.message}`, 'error');
    }
}

/**
 * Add output line
 */
function addOutputLine(text, type = 'info') {
    const output = document.getElementById('adminOutput');
    
    // Split by newlines and create a line for each
    const lines = text.split('\n');
    
    lines.forEach((lineText, index) => {
        // Skip empty lines at the end
        if (index === lines.length - 1 && !lineText.trim()) {
            return;
        }
        
        const line = document.createElement('div');
        line.className = `terminal-line line-${type}`;
        
        const prompt = document.createElement('span');
        prompt.className = 'prompt';
        prompt.textContent = type === 'command' ? '>' : '#';
        
        const content = document.createElement('span');
        content.textContent = lineText;
        
        line.appendChild(prompt);
        line.appendChild(content);
        output.appendChild(line);
    });
    
    // Auto-scroll to bottom
    output.scrollTop = output.scrollHeight;
}

/**
 * Clear output
 */
function clearOutput() {
    const output = document.getElementById('adminOutput');
    output.innerHTML = '';
    addOutputLine('Output cleared.', 'info');
}