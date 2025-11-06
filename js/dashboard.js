/**
 * Dashboard JavaScript for operation pahrump.
 * Handles dashboard UI, points management, and dare interactions.
 */

// Import Firebase service (only for dares)
import { 
    getAllDares, 
    subscribeToDares, 
    subscribeToAdminState,
    getAllRiddles,
    subscribeToRiddles
} from './firebase-service.js';

// Dashboard state
let dashboardState = {
    role: null,
    userId: null,
    points: 0,
    unlocked: false,
    activeDares: [],
    allDares: [],
    selectedDare: null,
    currentRiddle: null,
    currentRiddleIndex: 0,
    riddles: [],
    riddleHintShown: false,
    pendingDareIndex: null  // Track which dare is pending confirmation
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Read role from URL params
    const urlParams = new URLSearchParams(window.location.search);
    dashboardState.role = urlParams.get('role') || 'unknown';
    dashboardState.userId = urlParams.get('rid') || dashboardState.role;
    
    // Try to get user info from sessionStorage
    try {
        const userInfoStr = sessionStorage.getItem('userInfo');
        if (userInfoStr) {
            const userInfo = JSON.parse(userInfoStr);
            dashboardState.userId = userInfo.userId || dashboardState.userId;
        }
    } catch (e) {
        console.error("Error reading user info:", e);
    }
    
    // Initialize unlocked status from localStorage
    dashboardState.unlocked = localStorage.getItem('unlocked') === 'true';
    
    // Initialize points from localStorage (per user)
    const pointsKey = `points_${dashboardState.userId}`;
    dashboardState.points = parseInt(localStorage.getItem(pointsKey) || '0', 10);
    
    // Initialize dashboard
    await initializeDashboard();
    
    // Set up real-time subscriptions
    setupRealtimeSubscriptions();
});

/**
 * Initialize the dashboard
 */
async function initializeDashboard() {
    // Display role
    document.getElementById('roleDisplay').textContent = dashboardState.role.toUpperCase();
    
    // Update points display
    updatePointsDisplay();
    
    // Update button states
    updateButtonStates();
    
    // Load dares (from Firestore if available, else JSON)
    await loadDares();
    
    // Load riddles
    await loadRiddles();
    
    // Render active dares
    renderActiveDares();
    
    // Render riddle
    renderRiddle();
    
    // Set up event listeners
    setupEventListeners();
}

/**
 * Set up real-time subscriptions
 */
function setupRealtimeSubscriptions() {
    // Subscribe to dares changes
    subscribeToDares((dares) => {
        dashboardState.allDares = dares;
        // Refresh active dares if needed
        if (dashboardState.activeDares.length === 0 && dares.length > 0) {
            dashboardState.activeDares = getRandomDares(3);
            renderActiveDares();
        }
    });
    
    // Subscribe to riddles changes
    subscribeToRiddles((riddles) => {
        const sortedRiddles = [...riddles].sort((a, b) => (a.id || 0) - (b.id || 0));
        dashboardState.riddles = sortedRiddles;
        // If current riddle index is out of bounds, reset it
        if (dashboardState.currentRiddleIndex >= sortedRiddles.length) {
            dashboardState.currentRiddleIndex = 0;
        }
        // Refresh current riddle if we don't have one
        if (!dashboardState.currentRiddle && sortedRiddles.length > 0) {
            dashboardState.currentRiddle = getNextRiddle();
            renderRiddle();
        }
    });
    
    // Subscribe to admin state changes
    subscribeToAdminState((state) => {
        dashboardState.unlocked = state.unlocked || false;
        localStorage.setItem('unlocked', dashboardState.unlocked.toString());
        updateButtonStates();
    });
}

/**
 * Load dares from Firestore
 */
async function loadDares() {
    try {
        dashboardState.allDares = await getAllDares();
        
        // Initialize active dares (first 3 or random if more than 3)
        if (dashboardState.activeDares.length === 0 && dashboardState.allDares.length > 0) {
            dashboardState.activeDares = getRandomDares(3);
        }
    } catch (error) {
        console.error('Error loading dares:', error);
        // Fallback: try to load from JSON
        try {
            const response = await fetch('data/dares.json');
            const data = await response.json();
            dashboardState.allDares = data.dares || [];
            if (dashboardState.activeDares.length === 0) {
                dashboardState.activeDares = getRandomDares(3);
            }
        } catch (jsonError) {
            console.error('Error loading dares from JSON:', jsonError);
            dashboardState.allDares = [];
            dashboardState.activeDares = [];
        }
    }
}

/**
 * Load riddles from Firestore (with JSON fallback)
 */
async function loadRiddles() {
    try {
        // Try Firebase first
        dashboardState.riddles = await getAllRiddles();
        // Sort riddles by id to ensure order
        dashboardState.riddles.sort((a, b) => (a.id || 0) - (b.id || 0));
        dashboardState.currentRiddleIndex = 0;
    } catch (error) {
        console.error('Error loading riddles from Firebase:', error);
        // Fallback: try to load from JSON
        try {
            const response = await fetch('data/riddles.json');
            const data = await response.json();
            dashboardState.riddles = data.riddles || [];
            // Sort riddles by id to ensure order
            dashboardState.riddles.sort((a, b) => (a.id || 0) - (b.id || 0));
            dashboardState.currentRiddleIndex = 0;
        } catch (jsonError) {
            console.error('Error loading riddles from JSON:', jsonError);
            // Fallback: use default riddles
            dashboardState.riddles = [
                {
                    id: 1,
                    riddle: "What has keys but no locks?",
                    answer: "piano",
                    hint: "It's a musical instrument"
                },
                {
                    id: 2,
                    riddle: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
                    answer: "echo",
                    hint: "Think about sound and reflection"
                },
                {
                    id: 3,
                    riddle: "What has hands but cannot clap?",
                    answer: "clock",
                    hint: "You check it to know the time"
                }
            ];
            dashboardState.currentRiddleIndex = 0;
        }
    }
}

/**
 * Get next riddle in order
 */
function getNextRiddle() {
    if (dashboardState.riddles.length === 0) return null;
    if (dashboardState.currentRiddleIndex >= dashboardState.riddles.length) {
        // All riddles completed, reset to start
        dashboardState.currentRiddleIndex = 0;
    }
    return dashboardState.riddles[dashboardState.currentRiddleIndex];
}

/**
 * Render riddle
 */
function renderRiddle() {
    const riddleContent = document.getElementById('riddleContent');
    const riddleHint = document.getElementById('riddleHint');
    const hintBtn = document.getElementById('hintBtn');
    const enterAnswerBtn = document.getElementById('enterAnswerBtn');
    
    if (!dashboardState.unlocked) {
        riddleContent.textContent = 'COME BACK LATER';
        riddleHint.style.display = 'none';
        hintBtn.disabled = true;
        enterAnswerBtn.disabled = true;
        dashboardState.currentRiddle = null;
        dashboardState.riddleHintShown = false;
        return;
    }
    
    // Get the next riddle in order if we don't have one
    if (!dashboardState.currentRiddle) {
        dashboardState.currentRiddle = getNextRiddle();
    }
    
    if (dashboardState.currentRiddle) {
        riddleContent.textContent = dashboardState.currentRiddle.riddle;
        riddleHint.style.display = 'none';
        dashboardState.riddleHintShown = false;
        hintBtn.disabled = false;
        enterAnswerBtn.disabled = false;
    } else {
        riddleContent.textContent = 'COME BACK LATER';
        riddleHint.style.display = 'none';
        hintBtn.disabled = true;
        enterAnswerBtn.disabled = true;
    }
}

/**
 * Get random dares from all dares
 */
function getRandomDares(count) {
    const shuffled = [...dashboardState.allDares].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Render active dares to the UI
 */
function renderActiveDares() {
    const daresList = document.getElementById('daresList');
    daresList.innerHTML = '';
    
    if (dashboardState.activeDares.length === 0) {
        daresList.innerHTML = '<div class="no-dares">No active dares</div>';
        return;
    }
    
    dashboardState.activeDares.forEach((dare, index) => {
        const dareElement = createDareElement(dare, index);
        daresList.appendChild(dareElement);
    });
}

/**
 * Create a dare element
 */
function createDareElement(dare, index) {
    const div = document.createElement('div');
    div.className = 'dare-item';
    div.dataset.dareId = dare.id;
    div.dataset.dareIndex = index;
    
    const challenge = dare.challenge || dare.title || dare.description || `Dare ${dare.id}`;
    
    div.innerHTML = `
        <div class="dare-challenge">${escapeHtml(challenge)}</div>
        <div class="dare-actions">
            <button class="dare-action-btn complete" data-action="complete" data-index="${index}">COMPLETE (+10)</button>
            <button class="dare-action-btn trash" data-action="trash" data-index="${index}">TRASH</button>
        </div>
    `;
    
    return div;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Update points display
 */
function updatePointsDisplay() {
    document.getElementById('pointsDisplay').textContent = dashboardState.points;
    // Store points in localStorage (per user)
    const pointsKey = `points_${dashboardState.userId}`;
    localStorage.setItem(pointsKey, dashboardState.points.toString());
}

/**
 * Update button states based on unlocked flag
 */
function updateButtonStates() {
    // Update clue buttons
    const riddleButtons = document.querySelectorAll('.riddle-btn');
    riddleButtons.forEach(btn => {
        if (dashboardState.unlocked) {
            btn.classList.remove('locked');
            btn.disabled = false;
        } else {
            btn.classList.add('locked');
            btn.disabled = true;
        }
    });
    
    // Update riddle display
    renderRiddle();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Clue hint button
    document.getElementById('hintBtn').addEventListener('click', handleRiddleHint);
    
    // Enter answer button
    document.getElementById('enterAnswerBtn').addEventListener('click', handleEnterAnswer);
    
    // Dare action buttons (delegated)
    document.getElementById('daresList').addEventListener('click', handleDareAction);
    
    // Answer modal buttons
    document.getElementById('submitAnswerBtn').addEventListener('click', handleSubmitAnswer);
    document.getElementById('cancelAnswerBtn').addEventListener('click', closeAnswerModal);
    
    // Complete dare modal buttons
    document.getElementById('confirmCompleteBtn').addEventListener('click', handleConfirmComplete);
    document.getElementById('cancelCompleteBtn').addEventListener('click', closeCompleteModal);
    
    // Trash dare modal buttons
    document.getElementById('confirmTrashBtn').addEventListener('click', handleConfirmTrash);
    document.getElementById('cancelTrashBtn').addEventListener('click', closeTrashModal);
    
    // Hint modal buttons
    document.getElementById('confirmHintBtn').addEventListener('click', handleConfirmHint);
    document.getElementById('cancelHintBtn').addEventListener('click', closeHintModal);
    
    // Handle Enter key in answer input
    document.getElementById('answerInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSubmitAnswer();
        }
    });
}

/**
 * Show hint modal
 */
function showHintModal() {
    const modal = document.getElementById('hintModal');
    modal.style.display = 'flex';
}

/**
 * Close hint modal
 */
function closeHintModal() {
    const modal = document.getElementById('hintModal');
    modal.style.display = 'none';
}

/**
 * Handle confirm hint action
 */
function handleConfirmHint() {
    if (!dashboardState.unlocked) return;
    if (!dashboardState.currentRiddle) {
        showMessage('No riddle available', 'error');
        closeHintModal();
        return;
    }
    
    // Check if hint is already shown
    if (dashboardState.riddleHintShown) {
        showMessage('Hint already shown', 'info');
        closeHintModal();
        return;
    }
    
    // Deduct points for hint
    dashboardState.points -= 30;
    updatePointsDisplay();
    
    // Show hint
    const riddleHint = document.getElementById('riddleHint');
    if (dashboardState.currentRiddle.hint) {
        riddleHint.textContent = `HINT: ${dashboardState.currentRiddle.hint}`;
        riddleHint.style.display = 'block';
        dashboardState.riddleHintShown = true;
        closeHintModal();
        showMessage('Hint revealed. -30 points', 'info');
    } else {
        showMessage('No hint available for this riddle', 'error');
        closeHintModal();
        // Refund points if no hint available
        dashboardState.points += 30;
        updatePointsDisplay();
    }
}

/**
 * Handle clue hint action
 */
function handleRiddleHint() {
    if (!dashboardState.unlocked) return;
    if (!dashboardState.currentRiddle) {
        showMessage('No riddle available', 'error');
        return;
    }
    
    // Check if hint is already shown
    if (dashboardState.riddleHintShown) {
        showMessage('Hint already shown', 'info');
        return;
    }
    
    // Show hint confirmation modal
    showHintModal();
}

/**
 * Handle enter answer action
 */
function handleEnterAnswer() {
    if (!dashboardState.unlocked) return;
    if (!dashboardState.currentRiddle) {
        showMessage('No riddle available', 'error');
        return;
    }
    
    const modal = document.getElementById('answerModal');
    modal.style.display = 'flex';
    document.getElementById('answerInput').focus();
}

/**
 * Handle submit answer
 */
function handleSubmitAnswer() {
    const answerInput = document.getElementById('answerInput');
    const answer = answerInput.value.trim().toLowerCase();
    
    if (!answer) {
        showMessage('Please enter an answer', 'error');
        return;
    }
    
    if (!dashboardState.currentRiddle) {
        showMessage('No riddle available', 'error');
        closeAnswerModal();
        return;
    }
    
    // Check correctness
    const correctAnswer = (dashboardState.currentRiddle.answer || '').toLowerCase();
    const isCorrect = answer === correctAnswer;
    
    closeAnswerModal();
    
    if (isCorrect) {
        showMessage('CORRECT! Answer accepted.', 'success');
        // Award points for correct riddle answer
        dashboardState.points += 50;
        updatePointsDisplay();
        
        // Move to next riddle in order
        dashboardState.currentRiddleIndex++;
        dashboardState.currentRiddle = getNextRiddle();
        dashboardState.riddleHintShown = false;
        renderRiddle();
    } else {
        showMessage('INCORRECT. Answer rejected.', 'error');
        // Subtract points for incorrect answer
        dashboardState.points -= 5;
        updatePointsDisplay();
    }
}

/**
 * Close answer modal
 */
function closeAnswerModal() {
    const modal = document.getElementById('answerModal');
    modal.style.display = 'none';
    document.getElementById('answerInput').value = '';
}

/**
 * Show complete dare modal
 */
function showCompleteModal(index) {
    dashboardState.pendingDareIndex = index;
    const modal = document.getElementById('completeDareModal');
    modal.style.display = 'flex';
}

/**
 * Close complete dare modal
 */
function closeCompleteModal() {
    const modal = document.getElementById('completeDareModal');
    modal.style.display = 'none';
    dashboardState.pendingDareIndex = null;
}

/**
 * Show trash dare modal
 */
function showTrashModal(index) {
    dashboardState.pendingDareIndex = index;
    const modal = document.getElementById('trashDareModal');
    modal.style.display = 'flex';
}

/**
 * Close trash dare modal
 */
function closeTrashModal() {
    const modal = document.getElementById('trashDareModal');
    modal.style.display = 'none';
    dashboardState.pendingDareIndex = null;
}

/**
 * Handle confirm complete dare
 */
function handleConfirmComplete() {
    const index = dashboardState.pendingDareIndex;
    if (index === null || index === undefined) return;
    
    closeCompleteModal();
    
    // Award points
    dashboardState.points += 10;
    updatePointsDisplay();
    
    // Remove dare
    dashboardState.activeDares.splice(index, 1);
    
    // Clear selection if this was selected
    if (dashboardState.selectedDare && dashboardState.selectedDare.index === index) {
        dashboardState.selectedDare = null;
    }
    
    // Replace with a new random dare from the available dares list
    if (dashboardState.allDares.length > 0) {
        // Get dares that aren't already in activeDares
        // Compare by id (Firestore document ID or data id field)
        const usedIds = new Set(dashboardState.activeDares.map(d => d.id || d.challenge));
        const availableDares = dashboardState.allDares.filter(d => {
            const dareId = d.id || d.challenge;
            return !usedIds.has(dareId);
        });
        
        if (availableDares.length > 0) {
            // Pick a random dare from available ones
            const randomIndex = Math.floor(Math.random() * availableDares.length);
            dashboardState.activeDares.push(availableDares[randomIndex]);
        } else {
            // If all dares are used, pick a random one from all dares
            const randomIndex = Math.floor(Math.random() * dashboardState.allDares.length);
            dashboardState.activeDares.push(dashboardState.allDares[randomIndex]);
        }
    }
    
    // Re-render dares
    renderActiveDares();
    
    showMessage(`Dare completed! +10 points`, 'success');
}

/**
 * Handle confirm trash dare
 */
function handleConfirmTrash() {
    const index = dashboardState.pendingDareIndex;
    if (index === null || index === undefined) return;
    
    closeTrashModal();
    
    // Deduct points for trashing
    dashboardState.points -= 5;
    updatePointsDisplay();
    
    // Remove dare
    dashboardState.activeDares.splice(index, 1);
    
    // Clear selection if this was selected
    if (dashboardState.selectedDare && dashboardState.selectedDare.index === index) {
        dashboardState.selectedDare = null;
    }
    
    // Replace with a new random dare from the available dares list
    if (dashboardState.allDares.length > 0) {
        // Get dares that aren't already in activeDares
        // Compare by id (Firestore document ID or data id field)
        const usedIds = new Set(dashboardState.activeDares.map(d => d.id || d.challenge));
        const availableDares = dashboardState.allDares.filter(d => {
            const dareId = d.id || d.challenge;
            return !usedIds.has(dareId);
        });
        
        if (availableDares.length > 0) {
            // Pick a random dare from available ones
            const randomIndex = Math.floor(Math.random() * availableDares.length);
            dashboardState.activeDares.push(availableDares[randomIndex]);
        } else {
            // If all dares are used, pick a random one from all dares
            const randomIndex = Math.floor(Math.random() * dashboardState.allDares.length);
            dashboardState.activeDares.push(dashboardState.allDares[randomIndex]);
        }
    }
    
    // Re-render dares
    renderActiveDares();
    
    showMessage('Dare trashed. -5 points', 'info');
}

/**
 * Handle dare action clicks
 */
function handleDareAction(e) {
    const button = e.target.closest('.dare-action-btn');
    if (!button) return;
    
    const action = button.dataset.action;
    const index = parseInt(button.dataset.index, 10);
    
    if (action === 'complete') {
        if (!dashboardState.unlocked) {
            showMessage('Controls are locked', 'error');
            return;
        }
        
        // Show completion confirmation modal
        showCompleteModal(index);
    } else if (action === 'trash') {
        if (!dashboardState.unlocked) {
            showMessage('Controls are locked', 'error');
            return;
        }
        
        // Show trash confirmation modal
        showTrashModal(index);
    }
}

/**
 * Show message to user
 */
function showMessage(message, type = 'info') {
    // Create or update message element
    let messageEl = document.getElementById('dashboardMessage');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'dashboardMessage';
        messageEl.className = 'dashboard-message';
        document.querySelector('.dashboard-container').appendChild(messageEl);
    }
    
    messageEl.textContent = message;
    messageEl.className = `dashboard-message message-${type}`;
    messageEl.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}
