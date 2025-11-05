/**
 * Admin panel JavaScript for operation-water-rock.
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
    validatePassword
} from './firebase-service.js';

// Admin state
let adminState = {
    dares: [],
    users: [],
    adminState: { unlocked: false },
    currentView: 'dares' // 'dares', 'users', 'settings'
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
    
    // Handle password input
    passwordInput.addEventListener('keypress', async function(e) {
        if (e.key === 'Enter') {
            const password = passwordInput.value.trim();
            errorDiv.style.display = 'none';
            
            if (!password) {
                return;
            }
            
            // Validate admin password
            const userInfo = await validatePassword(password);
            
            if (userInfo && userInfo.role === 'admin') {
                // Authenticated
                sessionStorage.setItem('adminAuthenticated', 'true');
                sessionStorage.setItem('adminUserInfo', JSON.stringify(userInfo));
                showAdminPanel();
            } else {
                // Access denied
                errorDiv.style.display = 'block';
                passwordInput.value = '';
                setTimeout(() => {
                    errorDiv.style.display = 'none';
                }, 3000);
            }
        }
    });
    
    // Focus input
    setTimeout(() => passwordInput.focus(), 100);
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
                } else {
                    displayDaresList();
                }
                break;
            case 'points':
                await displayPointsList();
                break;
            case 'add':
                await handleAddDare(args);
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
  help              - Show this help message
  list              - List all dares
  list users        - List all users
  list points       - List all player points
  points            - List all player points (shortcut)
  add               - Add a new dare
  edit <id>         - Edit a dare by ID
  delete <id>       - Delete a dare by ID
  user add <role>   - Add a new user
  user list         - List all users
  user pass <id>    - Change user password
  unlock <true|false> - Set unlocked state
  settings          - Show admin settings
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
        const line = `[${dare.id || index + 1}] ${dare.title || 'Untitled'} - ${dare.difficulty || 'unknown'} (${dare.category || 'general'})`;
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
    addOutputLine(`\nAdmin Settings:\n  Unlocked: ${unlocked}\n`, 'info');
    addOutputLine('Use "unlock true" or "unlock false" to change.', 'info');
}

/**
 * Handle add dare command
 */
async function handleAddDare(args) {
    // For now, use a simple format: add "title" "description" "difficulty" "category" "riddle" "answer" "hint"
    if (args.length < 7) {
        addOutputLine('Usage: add "title" "description" "difficulty" "category" "riddle" "answer" "hint"', 'error');
        addOutputLine('Example: add "Test Dare" "Test description" "easy" "riddle" "What is it?" "test" "Test hint"', 'info');
        return;
    }
    
    const dareData = {
        title: args[0].replace(/"/g, ''),
        description: args[1].replace(/"/g, ''),
        difficulty: args[2].replace(/"/g, ''),
        category: args[3].replace(/"/g, ''),
        riddle: args[4].replace(/"/g, ''),
        answer: args[5].replace(/"/g, ''),
        hint: args[6].replace(/"/g, ''),
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
 * Add output line
 */
function addOutputLine(text, type = 'info') {
    const output = document.getElementById('adminOutput');
    const line = document.createElement('div');
    line.className = `terminal-line line-${type}`;
    
    const prompt = document.createElement('span');
    prompt.className = 'prompt';
    prompt.textContent = type === 'command' ? '>' : '#';
    
    const content = document.createElement('span');
    content.textContent = text;
    
    line.appendChild(prompt);
    line.appendChild(content);
    output.appendChild(line);
    
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