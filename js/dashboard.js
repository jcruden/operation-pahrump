/**
 * Dashboard JavaScript for operation-water-rock.
 * Handles dashboard UI, points management, and dare interactions.
 */

// Import Firebase service (only for dares)
import { 
    getAllDares, 
    subscribeToDares, 
    subscribeToAdminState
} from './firebase-service.js';

// Dashboard state
let dashboardState = {
    role: null,
    userId: null,
    points: 0,
    unlocked: false,
    activeDares: [],
    allDares: [],
    selectedDare: null
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
    
    // Render active dares
    renderActiveDares();
    
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
            dashboardState.activeDares = getRandomDares(5);
            renderActiveDares();
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
        
        // Initialize active dares (first 5 or random if more than 5)
        if (dashboardState.activeDares.length === 0 && dashboardState.allDares.length > 0) {
            dashboardState.activeDares = getRandomDares(5);
        }
    } catch (error) {
        console.error('Error loading dares:', error);
        // Fallback: try to load from JSON
        try {
            const response = await fetch('data/dares.json');
            const data = await response.json();
            dashboardState.allDares = data.dares || [];
            if (dashboardState.activeDares.length === 0) {
                dashboardState.activeDares = getRandomDares(5);
            }
        } catch (jsonError) {
            console.error('Error loading dares from JSON:', jsonError);
            dashboardState.allDares = [];
            dashboardState.activeDares = [];
        }
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
    
    const title = dare.title || `Dare ${dare.id}`;
    const description = dare.description || '';
    const difficulty = dare.difficulty || 'unknown';
    const category = dare.category || 'general';
    
    div.innerHTML = `
        <div class="dare-header">
            <span class="dare-number">#${index + 1}</span>
            <span class="dare-title">${title}</span>
            <span class="dare-difficulty difficulty-${difficulty}">${difficulty.toUpperCase()}</span>
        </div>
        <div class="dare-body">
            <div class="dare-description">${description}</div>
            ${dare.riddle ? `<div class="dare-riddle" style="display: none;" data-riddle="${escapeHtml(dare.riddle)}">RIDDLE: ${escapeHtml(dare.riddle)}</div>` : ''}
            ${dare.hint ? `<div class="dare-hint" style="display: none;" data-hint="${escapeHtml(dare.hint)}">HINT: ${escapeHtml(dare.hint)}</div>` : ''}
            <div class="dare-category">CATEGORY: ${category.toUpperCase()}</div>
        </div>
        <div class="dare-actions">
            <button class="dare-action-btn" data-action="select" data-index="${index}">SELECT</button>
            <button class="dare-action-btn" data-action="request-hint" data-index="${index}">HINT</button>
            <button class="dare-action-btn danger" data-action="complete" data-index="${index}">COMPLETE</button>
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
    const buttons = document.querySelectorAll('.control-btn');
    buttons.forEach(btn => {
        if (dashboardState.unlocked) {
            btn.classList.remove('locked');
            btn.disabled = false;
            btn.querySelector('.btn-status').textContent = 'UNLOCKED';
        } else {
            btn.classList.add('locked');
            btn.disabled = true;
            btn.querySelector('.btn-status').textContent = 'LOCKED';
        }
    });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Complete dare button
    document.getElementById('completeDareBtn').addEventListener('click', handleCompleteDare);
    
    // Next hint button
    document.getElementById('nextHintBtn').addEventListener('click', handleNextHint);
    
    // Enter answer button
    document.getElementById('enterAnswerBtn').addEventListener('click', handleEnterAnswer);
    
    // Trash all dares button
    document.getElementById('trashAllBtn').addEventListener('click', handleTrashAllDares);
    
    // Dare action buttons (delegated)
    document.getElementById('daresList').addEventListener('click', handleDareAction);
    
    // Answer modal buttons
    document.getElementById('submitAnswerBtn').addEventListener('click', handleSubmitAnswer);
    document.getElementById('cancelAnswerBtn').addEventListener('click', closeAnswerModal);
    
    // Handle Enter key in answer input
    document.getElementById('answerInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSubmitAnswer();
        }
    });
}

/**
 * Handle complete dare action
 */
function handleCompleteDare() {
    if (!dashboardState.unlocked) return;
    if (!dashboardState.selectedDare) {
        showMessage('Please select a dare first', 'error');
        return;
    }
    
    const dareIndex = dashboardState.selectedDare.index;
    const dare = dashboardState.activeDares[dareIndex];
    
    // Award points
    dashboardState.points += 10;
    updatePointsDisplay();
    
    // Remove dare
    dashboardState.activeDares.splice(dareIndex, 1);
    dashboardState.selectedDare = null;
    
    // Re-render dares
    renderActiveDares();
    
    showMessage(`Dare completed! +10 points`, 'success');
}

/**
 * Handle next hint action
 */
function handleNextHint() {
    if (!dashboardState.unlocked) return;
    if (!dashboardState.selectedDare) {
        showMessage('Please select a dare first', 'error');
        return;
    }
    
    const dareIndex = dashboardState.selectedDare.index;
    const dare = dashboardState.activeDares[dareIndex];
    
    // Reveal hint if available
    const dareElement = document.querySelector(`[data-dare-index="${dareIndex}"]`);
    const hintElement = dareElement.querySelector('.dare-hint');
    
    if (hintElement) {
        hintElement.style.display = 'block';
        showMessage('Hint revealed', 'info');
    } else {
        showMessage('No hint available for this dare', 'error');
    }
}

/**
 * Handle enter answer action
 */
function handleEnterAnswer() {
    if (!dashboardState.unlocked) return;
    if (!dashboardState.selectedDare) {
        showMessage('Please select a dare first', 'error');
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
    
    const dareIndex = dashboardState.selectedDare.index;
    const dare = dashboardState.activeDares[dareIndex];
    
    // Subtract points
    dashboardState.points -= 5;
    if (dashboardState.points < 0) dashboardState.points = 0;
    updatePointsDisplay();
    
    // Check correctness
    const correctAnswer = (dare.answer || '').toLowerCase();
    const isCorrect = answer === correctAnswer;
    
    closeAnswerModal();
    
    if (isCorrect) {
        showMessage('CORRECT! Answer accepted.', 'success');
        // Optionally reveal riddle if available
        const dareElement = document.querySelector(`[data-dare-index="${dareIndex}"]`);
        const riddleElement = dareElement.querySelector('.dare-riddle');
        if (riddleElement) {
            riddleElement.style.display = 'block';
        }
    } else {
        showMessage('INCORRECT. Answer rejected.', 'error');
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
 * Handle trash all dares
 */
function handleTrashAllDares() {
    if (dashboardState.points < 10) {
        showMessage('Insufficient points. Need 10 points to trash all dares.', 'error');
        return;
    }
    
    // Confirm action
    if (!confirm('Trash all dares? This will cost 10 points.')) {
        return;
    }
    
    // Subtract points
    dashboardState.points -= 10;
    updatePointsDisplay();
    
    // Replace with new random dares
    dashboardState.activeDares = getRandomDares(5);
    dashboardState.selectedDare = null;
    
    // Re-render dares
    renderActiveDares();
    
    showMessage('All dares trashed. New dares loaded.', 'info');
}

/**
 * Handle dare action clicks
 */
function handleDareAction(e) {
    const button = e.target.closest('.dare-action-btn');
    if (!button) return;
    
    const action = button.dataset.action;
    const index = parseInt(button.dataset.index, 10);
    
    if (action === 'select') {
        // Deselect previous
        document.querySelectorAll('.dare-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Select new
        const dareElement = button.closest('.dare-item');
        dareElement.classList.add('selected');
        
        dashboardState.selectedDare = {
            index: index,
            dare: dashboardState.activeDares[index]
        };
        
        showMessage(`Dare #${index + 1} selected`, 'info');
    } else if (action === 'request-hint') {
        const dareElement = button.closest('.dare-item');
        const hintElement = dareElement.querySelector('.dare-hint');
        
        if (hintElement) {
            hintElement.style.display = 'block';
            showMessage('Hint revealed', 'info');
        } else {
            showMessage('No hint available for this dare', 'error');
        }
    } else if (action === 'complete') {
        if (!dashboardState.unlocked) {
            showMessage('Controls are locked', 'error');
            return;
        }
        
        // Award points
        dashboardState.points += 10;
        updatePointsDisplay();
        
        // Remove dare
        dashboardState.activeDares.splice(index, 1);
        
        // Clear selection if this was selected
        if (dashboardState.selectedDare && dashboardState.selectedDare.index === index) {
            dashboardState.selectedDare = null;
        }
        
        // Re-render dares
        renderActiveDares();
        
        showMessage(`Dare completed! +10 points`, 'success');
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
