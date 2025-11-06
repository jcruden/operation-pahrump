/**
 * Main application JavaScript for operation pahrump.
 * Handles terminal interface with typewriter effect and password prompt.
 */

// Import Firebase service (only for admin state subscription)
import { validatePassword, subscribeToAdminState } from './firebase-service.js';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        const typewriterText = document.getElementById('typewriterText');
        const typewriterContainer = document.getElementById('typewriterContainer');
        const passwordPromptContainer = document.getElementById('passwordPromptContainer');
        const passwordInput = document.getElementById('passwordInput');
        const cursorBlink = document.getElementById('cursorBlink');
        
        // Ensure typewriter container is visible initially
        if (typewriterContainer) {
            typewriterContainer.style.display = 'block';
            typewriterContainer.style.visibility = 'visible';
        }
        if (typewriterText) {
            typewriterText.style.display = 'block';
            typewriterText.style.visibility = 'visible';
        }
        
        // The text to type out
        const introText = 'operation pahrump';
    
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
        if (!typewriterContainer || !passwordPromptContainer) return;
        
        typewriterContainer.style.display = 'none';
        passwordPromptContainer.style.display = 'block';
        
        // Show "operation pahrump" header at top
        const passwordHeader = document.getElementById('passwordHeader');
        if (passwordHeader) passwordHeader.style.display = 'block';
        
        // Focus the password input
        setTimeout(() => {
            if (passwordInput) {
                passwordInput.focus();
                updateCursorPosition();
            }
        }, 100);
    }
    
    // Update cursor position based on input text width
    function updateCursorPosition() {
        if (!passwordInput || !cursorBlink) return;
        
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
        if (!passwordPromptContainer || !typewriterContainer) return;
        
        passwordPromptContainer.style.display = 'none';
        const passwordHeader = document.getElementById('passwordHeader');
        if (passwordHeader) passwordHeader.style.display = 'none';
        
        const accessDeniedDiv = document.createElement('div');
        accessDeniedDiv.id = 'accessDeniedMessage';
        accessDeniedDiv.className = 'access-denied-message';
        accessDeniedDiv.textContent = 'ACCESS DENIED';
        
        typewriterContainer.appendChild(accessDeniedDiv);
        typewriterContainer.style.display = 'block';
        
        // Reset after animation
        setTimeout(() => {
            if (passwordPromptContainer) passwordPromptContainer.style.display = 'block';
            if (passwordHeader) passwordHeader.style.display = 'block';
            if (typewriterContainer) typewriterContainer.style.display = 'none';
            accessDeniedDiv.remove();
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }
            updateCursorPosition();
        }, 3000);
    }
    
    // Redirect to instructions page with role and token
    function redirectToDashboard(userInfo) {
        // Store user info in sessionStorage for instructions page
        sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
        window.location.href = `instructions.html?role=${userInfo.role}&rid=${userInfo.userId}`;
    }
    
    // Handle password input
    function handlePasswordInput(e) {
        if (!passwordInput || !cursorBlink) return;
        
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
    if (passwordInput && cursorBlink) {
        passwordInput.addEventListener('focus', function() {
            if (cursorBlink) cursorBlink.style.opacity = '1';
        });
        
        passwordInput.addEventListener('blur', function() {
            // Keep cursor visible even when blurred for accessibility
            if (cursorBlink) cursorBlink.style.opacity = '1';
        });
        
        // Handle input changes
        passwordInput.addEventListener('input', function() {
            // Cursor stays visible during input
            if (cursorBlink) cursorBlink.style.opacity = '1';
            // Update cursor position as text changes
            updateCursorPosition();
        });
        
        // Handle keydown events
        passwordInput.addEventListener('keydown', handlePasswordInput);
        
        // Make sure password input is accessible via keyboard
        passwordInput.setAttribute('tabindex', '0');
    }
    
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
    
    if (passwordPromptContainer) {
        observer.observe(passwordPromptContainer, {
            attributes: true,
            attributeFilter: ['style']
        });
    }
    
    // Handle window focus to re-focus input if needed
    window.addEventListener('focus', function() {
        if (passwordPromptContainer.style.display === 'block') {
            passwordInput.focus();
        }
    });
    
    // Start the typewriter effect
    if (typewriterText) {
        typeWriter(introText, typewriterText, 80, showPasswordPrompt);
    } else {
        console.error('Typewriter text element not found');
        // Fallback: show password prompt immediately
        if (passwordPromptContainer) {
            passwordPromptContainer.style.display = 'block';
            const passwordHeader = document.getElementById('passwordHeader');
            if (passwordHeader) passwordHeader.style.display = 'block';
        }
    }
    } catch (error) {
        console.error('Error initializing app:', error);
        // Fallback: show password prompt
        const passwordPromptContainer = document.getElementById('passwordPromptContainer');
        if (passwordPromptContainer) {
            passwordPromptContainer.style.display = 'block';
            const passwordHeader = document.getElementById('passwordHeader');
            if (passwordHeader) passwordHeader.style.display = 'block';
        }
    }
});
