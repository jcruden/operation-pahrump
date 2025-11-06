/**
 * Instructions page JavaScript for operation pahrump.
 * Handles typewriter effect for instructions and drink selection.
 */

import { saveDrinkChoice, getDrinkChoice, subscribeToAdminState } from './firebase-service.js';

// Instructions text
const instructionsText = "Access granted. Pack light: pajamas, one outfit (shorts/shirt), swimsuit, sunscreen, toothbrush & toothpaste, water bottle, good walking shoes. Optional: Portable charger, Swiss Army knife, flashlight, helmet.\nEverything must fit in one backpack";

// Get user info from sessionStorage
let userInfo = null;

// Initialize instructions page when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Get user info from sessionStorage
        const userInfoStr = sessionStorage.getItem('userInfo');
        if (!userInfoStr) {
            // If no user info, redirect to login
            window.location.href = 'index.html';
            return;
        }
        
        userInfo = JSON.parse(userInfoStr);
        
        // Check if user already has a drink choice
        const existingChoice = await getDrinkChoice(userInfo.userId);
        
        // Set up admin state subscription to check when to proceed
        setupAdminStateSubscription(existingChoice);
        
        const instructionsTextEl = document.getElementById('instructionsText');
        const drinkSelectionContainer = document.getElementById('drinkSelectionContainer');
        const closingMessageEl = document.getElementById('closingMessage');
        
        // If user already voted, show their selection
        if (existingChoice) {
            // Show instructions immediately
            instructionsTextEl.textContent = instructionsText;
            drinkSelectionContainer.style.display = 'flex';
            closingMessageEl.style.display = 'block';
            
            // Mark the selected button
            const drinkButtons = document.querySelectorAll('.drink-button');
            drinkButtons.forEach(btn => {
                btn.disabled = true;
                if (btn.dataset.drink === existingChoice) {
                    btn.classList.add('selected');
                }
            });
            
            // Show waiting message
            const waitingMessage = document.createElement('div');
            waitingMessage.className = 'waiting-message';
            waitingMessage.style.cssText = 'margin-top: 20px; font-size: clamp(0.9rem, 2vw, 1.1rem); color: #00ff00; text-shadow: 0 0 5px #00ff00, 0 0 10px #00ff00; text-align: center;';
            waitingMessage.textContent = 'Vote submitted.';
            drinkSelectionContainer.appendChild(waitingMessage);
        } else {
            // Start typewriter effect for new users
            typeWriter(instructionsText, instructionsTextEl, 50, () => {
                // After typing completes, show drink buttons
                setTimeout(() => {
                    drinkSelectionContainer.style.display = 'flex';
                    setupDrinkButtons();
                    // Show closing message after drink buttons
                    if (closingMessageEl) {
                        closingMessageEl.style.display = 'block';
                    }
                }, 500);
            });
        }
    } catch (error) {
        console.error('Error initializing instructions:', error);
        // Fallback: show content immediately
        const instructionsTextEl = document.getElementById('instructionsText');
        const drinkSelectionContainer = document.getElementById('drinkSelectionContainer');
        const closingMessageEl = document.getElementById('closingMessage');
        if (instructionsTextEl) {
            instructionsTextEl.textContent = instructionsText;
        }
        if (drinkSelectionContainer) {
            drinkSelectionContainer.style.display = 'flex';
            setupDrinkButtons();
        }
        if (closingMessageEl) {
            closingMessageEl.style.display = 'block';
        }
    }
});

/**
 * Typewriter effect function
 */
function typeWriter(text, element, speed = 100, callback) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            // Add a brief pause after typing completes
            setTimeout(() => {
                if (callback) callback();
            }, 500);
        }
    }
    
    type();
}

/**
 * Set up drink button event listeners
 */
function setupDrinkButtons() {
    const drinkButtons = document.querySelectorAll('.drink-button');
    
    drinkButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const drink = this.dataset.drink;
            
            // Disable all buttons
            drinkButtons.forEach(btn => {
                btn.disabled = true;
            });
            
            // Mark selected button
            this.classList.add('selected');
            
            try {
                // Save drink choice to Firebase
                await saveDrinkChoice(userInfo.userId, userInfo.role, drink);
                
                // Show confirmation message
                const instructionsTextEl = document.getElementById('instructionsText');
                const drinkSelectionContainer = document.getElementById('drinkSelectionContainer');
                
                // Remove any existing waiting message
                const existingWaiting = drinkSelectionContainer.querySelector('.waiting-message');
                if (existingWaiting) {
                    existingWaiting.remove();
                }
                
                // Add waiting message
                const waitingMessage = document.createElement('div');
                waitingMessage.className = 'waiting-message';
                waitingMessage.style.cssText = 'margin-top: 20px; font-size: clamp(0.9rem, 2vw, 1.1rem); color: #00ff00; text-shadow: 0 0 5px #00ff00, 0 0 10px #00ff00; text-align: center;';
                waitingMessage.textContent = 'Vote submitted. Waiting for admin to proceed...';
                drinkSelectionContainer.appendChild(waitingMessage);
            } catch (error) {
                console.error('Error saving drink choice:', error);
                // Show error message but stay on page
                const drinkSelectionContainer = document.getElementById('drinkSelectionContainer');
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.style.cssText = 'margin-top: 20px; font-size: clamp(0.9rem, 2vw, 1.1rem); color: #ff0000; text-shadow: 0 0 5px #ff0000, 0 0 10px #ff0000; text-align: center;';
                errorMessage.textContent = 'Error saving vote. Please try again.';
                drinkSelectionContainer.appendChild(errorMessage);
                
                // Re-enable buttons on error
                drinkButtons.forEach(btn => {
                    btn.disabled = false;
                });
                this.classList.remove('selected');
            }
        });
    });
}

/**
 * Set up admin state subscription to check when to proceed to dashboard
 */
function setupAdminStateSubscription(hasVoted) {
    subscribeToAdminState(async (state) => {
        // Check if admin has unlocked progression to dashboard
        if (state.instructionsComplete === true || state.canProceedToDashboard === true) {
            // Always check current vote status (in case user just voted)
            const choice = await getDrinkChoice(userInfo.userId);
            if (choice) {
                window.location.href = `dashboard.html?role=${userInfo.role}&rid=${userInfo.userId}`;
            }
        }
    });
}

