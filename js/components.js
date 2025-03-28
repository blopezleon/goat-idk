/**
 * FluentForm - Reusable Components
 * This module provides components that can be reused across different pages
 */

// Create global namespace for FluentForm
window.FluentForm = window.FluentForm || {};

/**
 * Adds the application header to any page that includes this script
 */
FluentForm.initHeader = function(activePage = '') {
    const header = document.createElement('header');
    header.className = 'header';
    
    header.innerHTML = `
        <div class="container header-container">
            <div class="logo">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 16C15.59 16.41 15.01 16.64 14.4 16.64C13.79 16.64 13.21 16.41 12.8 16L9 12.19V15C9 16.1 8.1 17 7 17C5.9 17 5 16.1 5 15V9C5 7.9 5.9 7 7 7C8.1 7 9 7.9 9 9V11.81L12.8 8C13.21 7.59 13.79 7.36 14.4 7.36C15.01 7.36 15.59 7.59 16 8C16.41 8.41 16.64 8.99 16.64 9.6C16.64 10.21 16.41 10.79 16 11.2L13.19 14L16 16.8C16.41 17.21 16.64 17.79 16.64 18.4C16.64 19.01 16.41 19.59 16 20" fill="#0078d4"/>
                </svg>
                <span class="logo-text">FluentForm</span>
            </div>
            <nav class="main-nav">
                <button class="mobile-menu-toggle" aria-label="Toggle menu" id="menuToggle">
                    <span class="menu-icon"></span>
                </button>
                <ul class="nav-links" id="navLinks">
                    <li><a href="index.html" ${activePage === 'home' ? 'class="active"' : ''}>Dashboard</a></li>
                    <li><a href="proficiency.html" ${activePage === 'proficiency' ? 'class="active"' : ''}>Proficiency Test</a></li>
                    <li><a href="practice.html" ${activePage === 'practice' ? 'class="active"' : ''}>Practice</a></li>
                    <li><a href="analyze.html" ${activePage === 'analyze' ? 'class="active"' : ''}>Analyze</a></li>
                </ul>
            </nav>
        </div>
    `;
    
    // Insert at the beginning of the body
    document.body.insertBefore(header, document.body.firstChild);
    
    // Add mobile menu toggle functionality
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('nav-open');
            menuToggle.classList.toggle('open');
        });
    }
};

/**
 * Adds the application footer to any page that includes this script
 */
FluentForm.initFooter = function() {
    const footer = document.createElement('footer');
    footer.className = 'footer';
    
    footer.innerHTML = `
        <div class="container">
            <div class="footer-content">
                <div class="footer-logo">
                    <span class="logo-text">FluentForm</span>
                    <p>Your AI speech therapy assistant</p>
                </div>
                <div class="footer-links">
                    <ul>
                        <li><a href="index.html">Dashboard</a></li>
                        <li><a href="proficiency.html">Proficiency Test</a></li>
                        <li><a href="practice.html">Practice</a></li>
                        <li><a href="analyze.html">Analyze</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; ${new Date().getFullYear()} FluentForm - AI Speech Therapy</p>
            </div>
        </div>
    `;
    
    // Append to the end of the body
    document.body.appendChild(footer);
};

/**
 * Initializes a page with standard wrapper, header, footer and main content
 * @param {string} activePage - The active page for navigation highlighting
 * @param {boolean} includeDarkMode - Whether to include dark mode toggle 
 */
FluentForm.initPage = function(activePage = '', includeDarkMode = true) {
    // Create the page wrapper if it doesn't exist
    let pageWrapper = document.querySelector('.page-wrapper');
    if (!pageWrapper) {
        pageWrapper = document.createElement('div');
        pageWrapper.className = 'page-wrapper';
        
        // Move all body content into the wrapper
        while (document.body.firstChild) {
            pageWrapper.appendChild(document.body.firstChild);
        }
        
        document.body.appendChild(pageWrapper);
    }
    
    // Add accessibility skip link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Initialize header and footer
    FluentForm.initHeader(activePage);
    
    // Create main content area if not exists
    let mainContent = document.querySelector('.main-content');
    if (!mainContent) {
        mainContent = document.createElement('main');
        mainContent.className = 'main-content';
        mainContent.id = 'main-content';
        
        // Find appropriate place to insert (after header)
        const header = document.querySelector('.header');
        if (header && header.nextSibling) {
            pageWrapper.insertBefore(mainContent, header.nextSibling);
        } else {
            pageWrapper.appendChild(mainContent);
        }
        
        // Move remaining body content into main
        while (pageWrapper.childNodes.length > 2) { // Header + main already in wrapper
            if (pageWrapper.childNodes[2] !== mainContent) {
                mainContent.appendChild(pageWrapper.childNodes[2]);
            } else {
                // Skip the main content itself
                if (pageWrapper.childNodes.length > 3) {
                    mainContent.appendChild(pageWrapper.childNodes[3]);
                }
            }
        }
    }
    
    // Add container to main if not exists
    if (!mainContent.querySelector('.container')) {
        const container = document.createElement('div');
        container.className = 'container';
        
        // Move all main content into container
        while (mainContent.firstChild) {
            container.appendChild(mainContent.firstChild);
        }
        
        mainContent.appendChild(container);
    }
    
    // Add dark mode toggle if requested
    if (includeDarkMode) {
        FluentForm.addDarkModeToggle();
    }
    
    // Initialize footer last
    FluentForm.initFooter();
};

/**
 * Adds a dark mode toggle to the header
 */
FluentForm.addDarkModeToggle = function() {
    const nav = document.querySelector('.main-nav');
    if (!nav) return;
    
    const darkModeToggle = document.createElement('button');
    darkModeToggle.className = 'dark-mode-toggle';
    darkModeToggle.setAttribute('aria-label', 'Toggle dark mode');
    darkModeToggle.innerHTML = `
        <i class="bi bi-moon-fill dark-icon"></i>
        <i class="bi bi-sun-fill light-icon"></i>
    `;
    
    nav.appendChild(darkModeToggle);
    
    // Check for dark mode preference
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedMode = localStorage.getItem('fluentform-dark-mode');
    
    if (savedMode === 'dark' || (savedMode !== 'light' && prefersDarkMode)) {
        document.body.classList.add('dark-mode');
        darkModeToggle.classList.add('active');
    }
    
    // Toggle dark mode
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        darkModeToggle.classList.toggle('active');
        
        // Save preference
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('fluentform-dark-mode', 'dark');
        } else {
            localStorage.setItem('fluentform-dark-mode', 'light');
        }
    });
};

/**
 * Creates a progress visualization for a phoneme
 * @param {string} phoneme - The phoneme to visualize
 * @param {number} score - The score (0-100)
 * @param {string} word - Example word containing the phoneme
 * @param {boolean} isFocus - Whether this is a focus phoneme
 */
FluentForm.createPhonemeCard = function(phoneme, score, word, isFocus = false) {
    const card = document.createElement('div');
    card.className = `phoneme-card ${isFocus ? 'phoneme-focus' : ''}`;
    
    // Determine score class
    let scoreClass;
    if (score >= 90) scoreClass = 'excellent';
    else if (score >= 75) scoreClass = 'good';
    else if (score >= 60) scoreClass = 'average';
    else if (score >= 40) scoreClass = 'needs-work';
    else scoreClass = 'poor';
    
    card.innerHTML = `
        <div class="phoneme-symbol">${phoneme}</div>
        <div class="phoneme-score ${scoreClass}">${score}%</div>
        <div class="progress-container">
            <div class="progress-bar progress-bar-${scoreClass}" style="width:${score}%"></div>
        </div>
        <div class="phoneme-word">"${word}"</div>
        ${isFocus ? '<div class="phoneme-focus-tag">Focus Sound</div>' : ''}
    `;
    
    return card;
};

/**
 * Creates a practice exercise card
 * @param {string} title - Exercise title
 * @param {string} description - Exercise description
 * @param {string} phoneme - Target phoneme
 * @param {string} level - Difficulty level
 */
FluentForm.createExerciseCard = function(title, description, phoneme, level = 'Beginner') {
    const card = document.createElement('div');
    card.className = 'exercise-card card';
    
    card.innerHTML = `
        <div class="exercise-header">
            <h3 class="exercise-title">${title}</h3>
            <div class="exercise-meta">
                <span class="exercise-level">${level}</span>
                <span class="exercise-phoneme">Focus: "${phoneme}"</span>
            </div>
        </div>
        <div class="exercise-content">
            <p>${description}</p>
            <div class="exercise-footer">
                <a href="practice.html?phoneme=${phoneme}&exercise=${encodeURIComponent(title)}" class="btn btn-primary">
                    <i class="bi bi-play-fill btn-icon"></i>
                    Start Exercise
                </a>
            </div>
        </div>
    `;
    
    return card;
};

/**
 * Handles all form accessibility enhancements
 */
FluentForm.enhanceForms = function() {
    // Find all form elements
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        // Find all inputs
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // Ensure all inputs have labels and ids
            if (!input.id) {
                input.id = `input-${Math.random().toString(36).substring(2, 9)}`;
            }
            
            // Find associated label or create one if missing
            let label = form.querySelector(`label[for="${input.id}"]`);
            if (!label && input.previousElementSibling && input.previousElementSibling.tagName !== 'LABEL') {
                const newLabel = document.createElement('label');
                newLabel.setAttribute('for', input.id);
                newLabel.textContent = input.placeholder || 'Input';
                input.parentNode.insertBefore(newLabel, input);
            }
            
            // Add ARIA attributes where appropriate
            if (input.required) {
                input.setAttribute('aria-required', 'true');
            }
            
            // Add validation events
            input.addEventListener('invalid', () => {
                input.classList.add('invalid');
            });
            
            input.addEventListener('input', () => {
                if (input.validity.valid) {
                    input.classList.remove('invalid');
                }
            });
        });
        
        // Add form submission handling
        form.addEventListener('submit', (e) => {
            const invalidInputs = form.querySelectorAll(':invalid');
            
            if (invalidInputs.length > 0) {
                e.preventDefault();
                invalidInputs[0].focus();
                
                // Add error summary at the top of the form
                let errorSummary = form.querySelector('.error-summary');
                if (!errorSummary) {
                    errorSummary = document.createElement('div');
                    errorSummary.className = 'error-summary';
                    errorSummary.setAttribute('role', 'alert');
                    form.insertBefore(errorSummary, form.firstChild);
                }
                
                errorSummary.innerHTML = `
                    <h3>Please fix the following errors:</h3>
                    <ul>
                        ${Array.from(invalidInputs).map(input => {
                            const label = form.querySelector(`label[for="${input.id}"]`);
                            return `<li><a href="#${input.id}">${label ? label.textContent : 'Input'} is required</a></li>`;
                        }).join('')}
                    </ul>
                `;
            }
        });
    });
};

// Initialize on document load if window is defined (browser)
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        // If auto-initialization is enabled through data attribute
        if (document.body.dataset.autoInit === 'true') {
            const activePage = document.body.dataset.activePage || '';
            FluentForm.initPage(activePage);
        }
        
        // Enhance all forms
        FluentForm.enhanceForms();
    });
} 