/**
 * Main application JavaScript for operation-water-rock.
 * Handles terminal interface with typewriter effect and password prompt.
 */

// Import Firebase service (only for admin state subscription)
import { validatePassword, subscribeToAdminState } from './firebase-service.js';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const typewriterText = document.getElementById('typewriterText');
    const typewriterContainer = document.getElementById('typewriterContainer');
    const passwordPromptContainer = document.getElementById('passwordPromptContainer');
    const passwordInput = document.getElementById('passwordInput');
    const cursorBlink = document.getElementById('cursorBlink');
    
    // The text to type out
    const introText = 'operation water rock';
    
    // Typewriter effect function
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
    
    // Show password prompt
    function showPasswordPrompt() {
        typewriterContainer.style.display = 'none';
        passwordPromptContainer.style.display = 'block';
        
        // Show "operation water rock" header at top
        const passwordHeader = document.getElementById('passwordHeader');
        passwordHeader.style.display = 'block';
        
        // Focus the password input
        setTimeout(() => {
            passwordInput.focus();
            updateCursorPosition();
        }, 100);
    }
    
    // Update cursor position based on input text width
    function updateCursorPosition() {
        // Create a temporary span to measure text width
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.position = 'absolute';
        tempSpan.style.whiteSpace = 'pre';
        tempSpan.style.font = window.getComputedStyle(passwordInput).font;
        tempSpan.style.fontSize = window.getComputedStyle(passwordInput).fontSize;
        tempSpan.style.fontFamily = window.getComputedStyle(passwordInput).fontFamily;
        tempSpan.style.letterSpacing = window.getComputedStyle(passwordInput).letterSpacing;
        
        // Use asterisks to represent password characters
        const displayText = '*'.repeat(passwordInput.value.length);
        tempSpan.textContent = displayText || 'M'; // Use 'M' as baseline for empty input
        
        document.body.appendChild(tempSpan);
        const textWidth = tempSpan.offsetWidth;
        document.body.removeChild(tempSpan);
        
        // Position cursor after the text
        cursorBlink.style.marginLeft = `${textWidth}px`;
    }
    
    // Show access denied message with animation
    function showAccessDenied() {
        passwordPromptContainer.style.display = 'none';
        const passwordHeader = document.getElementById('passwordHeader');
        passwordHeader.style.display = 'none';
        
        const accessDeniedDiv = document.createElement('div');
        accessDeniedDiv.id = 'accessDeniedMessage';
        accessDeniedDiv.className = 'access-denied-message';
        accessDeniedDiv.textContent = 'ACCESS DENIED';
        
        typewriterContainer.appendChild(accessDeniedDiv);
        typewriterContainer.style.display = 'block';
        
        // Reset after animation
        setTimeout(() => {
            passwordPromptContainer.style.display = 'block';
            passwordHeader.style.display = 'block';
            typewriterContainer.style.display = 'none';
            accessDeniedDiv.remove();
            passwordInput.value = '';
            passwordInput.focus();
            updateCursorPosition();
        }, 3000);
    }
    
    // Redirect to dashboard with role and token
    function redirectToDashboard(userInfo) {
        // Store user info in sessionStorage for dashboard
        sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
        window.location.href = `dashboard.html?role=${userInfo.role}&rid=${userInfo.userId}`;
    }
    
    // Handle password input
    function handlePasswordInput(e) {
        // Update cursor visibility based on input focus
        if (passwordInput.value.length > 0) {
            cursorBlink.style.opacity = '1';
        }
        
        // Update cursor position after keypress (for backspace/delete)
        setTimeout(() => {
            updateCursorPosition();
        }, 0);
        
        // Handle Enter key
        if (e.key === 'Enter') {
            e.preventDefault();
            const password = passwordInput.value.trim();
            
            if (!password) {
                return; // Don't process empty passwords
            }
            
            // Validate password via Firebase
            handleLogin(password);
        }
    }
    
    // Handle login with simple password validation
    async function handleLogin(password) {
        const userInfo = await validatePassword(password);
        
        if (userInfo) {
            // Success: redirect to dashboard
            redirectToDashboard(userInfo);
        } else {
            // Failure: show access denied message
            showAccessDenied();
        }
    }
    
    // Handle input focus/blur for cursor visibility
    passwordInput.addEventListener('focus', function() {
        cursorBlink.style.opacity = '1';
    });
    
    passwordInput.addEventListener('blur', function() {
        // Keep cursor visible even when blurred for accessibility
        cursorBlink.style.opacity = '1';
    });
    
    // Handle input changes
    passwordInput.addEventListener('input', function() {
        // Cursor stays visible during input
        cursorBlink.style.opacity = '1';
        // Update cursor position as text changes
        updateCursorPosition();
    });
    
    // Handle keydown events
    passwordInput.addEventListener('keydown', handlePasswordInput);
    
    // Start the typewriter effect
    typeWriter(introText, typewriterText, 80, showPasswordPrompt);
    
    // Ensure keyboard focus works properly
    // Focus the password input when it becomes visible
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'style' &&
                passwordPromptContainer.style.display === 'block') {
                passwordInput.focus();
            }
        });
    });
    
    observer.observe(passwordPromptContainer, {
        attributes: true,
        attributeFilter: ['style']
    });
    
    // Make sure password input is accessible via keyboard
    passwordInput.setAttribute('tabindex', '0');
    
    // Handle window focus to re-focus input if needed
    window.addEventListener('focus', function() {
        if (passwordPromptContainer.style.display === 'block') {
            passwordInput.focus();
        }
    });
});
