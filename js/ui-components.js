/**
 * FluentForm - UI Components
 * This module provides specialized UI components for speech visualization,
 * accessibility features, and animated user feedback.
 */

// Create global namespace for FluentForm
window.FluentForm = window.FluentForm || {};
window.FluentForm.UI = {};

/**
 * Creates a visual transcription display with color-coded letters based on accuracy
 * @param {string} containerId - ID of the container element
 * @param {string} text - The transcription text
 * @param {Array} phonemes - Array of phoneme objects with scores
 */
FluentForm.UI.createVisualTranscription = function(containerId, text, phonemes = []) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID ${containerId} not found`);
        return;
    }
    
    // Create transcription display
    const transcriptionHtml = document.createElement('div');
    transcriptionHtml.className = 'visual-transcription';
    
    // Create a map of letter positions to phonemes
    const letterToPhoneme = new Map();
    let currentPosition = 0;
    
    // First, normalize the phoneme data
    const normalizedPhonemes = phonemes.map(p => ({
        ...p,
        phoneme: p.phoneme.toLowerCase(),
        fromWord: p.fromWord ? p.fromWord.toLowerCase() : ''
    }));

    // Enhanced phoneme-to-letter mappings
    const phonemeMap = {
        // Vowels
        'iy': 'i|y|ee|ea|e',
        'ih': 'i|y|e',
        'eh': 'e|ea|a',
        'ae': 'a|ai',
        'ah': 'u|o|a',
        'uw': 'oo|u|o',
        'uh': 'oo|u|o',
        'ao': 'o|au|aw|a',
        'aa': 'a|o',
        'ey': 'a|ay|ai|ei',
        'ay': 'i|y|ie',
        'oy': 'oi|oy',
        'ow': 'o|ow',
        'aw': 'ow|ou|au',
        'ax': 'a|e|i|o|u', // Schwa sound
        // Consonants
        'p': 'p',
        'b': 'b',
        't': 't',
        'd': 'd',
        'k': 'k|c|ck|ch',
        'g': 'g',
        'ch': 'ch|tch',
        'jh': 'j|g|dge',
        'f': 'f|ph|gh',
        'v': 'v',
        'th': 'th',
        'dh': 'th',
        's': 's|c|ce|ss',
        'z': 'z|s|ss',
        'sh': 'sh|ti|ci',
        'zh': 's|si',
        'hh': 'h',
        'm': 'm|mm',
        'n': 'n|nn|kn',
        'ng': 'ng',
        'l': 'l|ll',
        'r': 'r|rr|wr',
        'y': 'y|i',
        'w': 'w|wh',
        'dx': 't|tt|dd', // Flap T
        'er': 'er|ir|ur|or|ar'
    };

    // Map words to phonemes
    if (text && text.length > 0) {
        text.split(' ').forEach(word => {
            const wordLower = word.toLowerCase();
            const wordPhonemes = normalizedPhonemes.filter(p => p.fromWord === wordLower);
            
            // Map each letter to its corresponding phoneme
            word.split('').forEach(letter => {
                const letterLower = letter.toLowerCase();
                let matchFound = false;
                
                // First try: exact phoneme match
                for (const phoneme of wordPhonemes) {
                    if (phoneme.phoneme === letterLower) {
                        letterToPhoneme.set(currentPosition, phoneme);
                        matchFound = true;
                        break;
                    }
                }
                
                // Second try: phoneme mapping
                if (!matchFound) {
                    for (const phoneme of wordPhonemes) {
                        for (const [phone, letters] of Object.entries(phonemeMap)) {
                            if (phoneme.phoneme.includes(phone) && letters.split('|').includes(letterLower)) {
                                letterToPhoneme.set(currentPosition, phoneme);
                                matchFound = true;
                                break;
                            }
                        }
                        if (matchFound) break;
                    }
                }
                
                // Third try: fuzzy match
                if (!matchFound) {
                    const bestMatch = wordPhonemes.find(p => 
                        p.phoneme.includes(letterLower) || 
                        letterLower.includes(p.phoneme) ||
                        Object.entries(phonemeMap).some(([phone, letters]) => 
                            p.phoneme.includes(phone) && letters.includes(letterLower)
                        )
                    );
                    if (bestMatch) {
                        letterToPhoneme.set(currentPosition, bestMatch);
                    } else {
                        // Last resort: assign to the closest phoneme in the word
                        if (wordPhonemes.length > 0) {
                            letterToPhoneme.set(currentPosition, wordPhonemes[0]);
                        }
                    }
                }
                
                currentPosition++;
            });
            currentPosition++; // Account for space between words
        });
    }
    
    // Color each letter based on its phoneme accuracy
    let position = 0;
    let chars = '';
    
    if (text && text.length > 0) {
        text.split('').forEach(letter => {
            const phoneme = letterToPhoneme.get(position);
            // Default to perfect score color unless we have a specific lower score
            const scoreClass = (phoneme && phoneme.accuracyScore < 90) ? 
                FluentForm.UI.getScoreClass(phoneme.accuracyScore) : 
                'excellent';
            
            if (letter === ' ') {
                chars += '<span class="char-space"> </span>';
            } else {
                chars += `<span class="char ${scoreClass}" data-phoneme="${phoneme ? phoneme.phoneme : ''}" data-score="${phoneme ? phoneme.accuracyScore : 100}">${letter}</span>`;
            }
            position++;
        });
    } else {
        chars = '<span class="char-placeholder">No transcription available</span>';
    }
    
    transcriptionHtml.innerHTML = chars;
    
    // Clear container and append new content
    container.innerHTML = '';
    container.appendChild(transcriptionHtml);
    
    return transcriptionHtml;
};

/**
 * Initializes interactions for the visual transcription
 * @param {string} containerId - Optional container ID if not using the default
 */
FluentForm.UI.initVisualTranscriptionInteractions = function(containerId = null) {
    const container = containerId ? document.getElementById(containerId) : document.querySelector('.visual-transcription');
    if (!container) return;
    
    const chars = container.querySelectorAll('.char');
    
    chars.forEach(char => {
        char.addEventListener('mouseenter', () => {
            const phoneme = char.getAttribute('data-phoneme');
            const score = char.getAttribute('data-score');
            
            if (phoneme) {
                // Create or update tooltip
                let tooltip = document.getElementById('phoneme-tooltip');
                if (!tooltip) {
                    tooltip = document.createElement('div');
                    tooltip.id = 'phoneme-tooltip';
                    tooltip.className = 'phoneme-tooltip';
                    document.body.appendChild(tooltip);
                }
                
                // Set tooltip content
                tooltip.innerHTML = `
                    <div class="tooltip-phoneme">${phoneme}</div>
                    <div class="tooltip-score ${FluentForm.UI.getScoreClass(score)}">${score}%</div>
                `;
                
                // Position tooltip
                const rect = char.getBoundingClientRect();
                tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
                tooltip.style.display = 'block';
                
                // Add animation
                tooltip.classList.remove('tooltip-fade-in');
                void tooltip.offsetWidth; // Trigger reflow
                tooltip.classList.add('tooltip-fade-in');
            }
        });
        
        char.addEventListener('mouseleave', () => {
            const tooltip = document.getElementById('phoneme-tooltip');
            if (tooltip) {
                tooltip.style.display = 'none';
            }
        });
        
        // Add click event to show details
        char.addEventListener('click', () => {
            const phoneme = char.getAttribute('data-phoneme');
            if (phoneme) {
                FluentForm.UI.showPhonemeDetails(phoneme);
            }
        });
    });
};

/**
 * Shows detailed information about a phoneme in a modal dialog
 * @param {string} phoneme - The phoneme to show details for
 */
FluentForm.UI.showPhonemeDetails = function(phoneme) {
    // Check if there's an existing modal
    let modal = document.getElementById('phoneme-detail-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'phoneme-detail-modal';
        modal.className = 'phoneme-detail-modal';
        document.body.appendChild(modal);
    }
    
    // Get phoneme information
    const phonemeInfo = FluentForm.UI.getPhonemeInfo(phoneme);
    
    // Set modal content
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" aria-label="Close">×</button>
            <h3 class="modal-title">Phoneme: ${phoneme}</h3>
            
            <div class="phoneme-pronunciation">
                <h4>How to Pronounce</h4>
                <p>${phonemeInfo.pronunciation}</p>
            </div>
            
            <div class="phoneme-examples">
                <h4>Example Words</h4>
                <ul>
                    ${phonemeInfo.examples.map(ex => `<li>${ex}</li>`).join('')}
                </ul>
            </div>
            
            <div class="phoneme-tips">
                <h4>Practice Tips</h4>
                <p>${phonemeInfo.tips}</p>
            </div>
            
            <button class="show-model-btn btn btn-primary" data-phoneme="${phoneme}">
                <i class="bi bi-box"></i> Show 3D Model
            </button>
        </div>
    `;
    
    // Show modal
    modal.style.display = 'flex';
    
    // Add close button event
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Add 3D model button event
    modal.querySelector('.show-model-btn').addEventListener('click', (event) => {
        const phoneValue = event.currentTarget.getAttribute('data-phoneme');
        
        // Check if mouthModel exists globally
        if (window.mouthModel) {
            const modelContainer = document.getElementById('mouthModelContainer');
            if (modelContainer) {
                modelContainer.style.display = 'flex';
                window.mouthModel.showPhonemePosition(phoneValue);
            }
        } else {
            // If no global mouth model, create a temporary 3D visualization
            FluentForm.UI.create2DMouthVisualization(phoneValue);
        }
        
        modal.style.display = 'none';
    });
    
    // Close modal if user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};

/**
 * Creates a 2D mouth visualization for a phoneme (fallback for 3D)
 * @param {string} phoneme - The phoneme to visualize
 */
FluentForm.UI.create2DMouthVisualization = function(phoneme) {
    // Create modal for 2D visualization
    let modal = document.getElementById('mouth-viz-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'mouth-viz-modal';
        modal.className = 'phoneme-detail-modal';
        document.body.appendChild(modal);
    }
    
    // Create SVG visualization based on phoneme
    let svgContent;
    
    switch(phoneme.toLowerCase()) {
        case 'r':
            // R sound - tongue curled back
            svgContent = `
                <svg width="300" height="200" viewBox="0 0 300 200">
                    <ellipse cx="150" cy="80" rx="120" ry="60" fill="#ffcccc" stroke="#e74c3c" stroke-width="2" /> <!-- lips -->
                    <rect x="70" y="80" width="160" height="10" fill="#ffffff" /> <!-- teeth top -->
                    <rect x="70" y="130" width="160" height="10" fill="#ffffff" /> <!-- teeth bottom -->
                    <path d="M110,150 Q150,90 190,130" fill="#ff9999" stroke="#e74c3c" stroke-width="2" /> <!-- tongue -->
                    <path d="M70,50 Q150,0 230,50" fill="none" stroke="#e74c3c" stroke-width="2" /> <!-- roof of mouth -->
                    <text x="150" y="190" text-anchor="middle" font-size="16">Tongue curled back for "r"</text>
                </svg>
            `;
            break;
        case 'th':
            // TH sound - tongue between teeth
            svgContent = `
                <svg width="300" height="200" viewBox="0 0 300 200">
                    <ellipse cx="150" cy="80" rx="120" ry="60" fill="#ffcccc" stroke="#e74c3c" stroke-width="2" /> <!-- lips -->
                    <rect x="70" y="90" width="160" height="10" fill="#ffffff" /> <!-- teeth top -->
                    <rect x="70" y="120" width="160" height="10" fill="#ffffff" /> <!-- teeth bottom -->
                    <path d="M110,125 Q150,95 190,125" fill="#ff9999" stroke="#e74c3c" stroke-width="2" /> <!-- tongue -->
                    <path d="M70,50 Q150,0 230,50" fill="none" stroke="#e74c3c" stroke-width="2" /> <!-- roof of mouth -->
                    <text x="150" y="190" text-anchor="middle" font-size="16">Tongue between teeth for "th"</text>
                </svg>
            `;
            break;
        case 's':
            // S sound - tongue behind teeth, narrow channel
            svgContent = `
                <svg width="300" height="200" viewBox="0 0 300 200">
                    <ellipse cx="150" cy="80" rx="120" ry="60" fill="#ffcccc" stroke="#e74c3c" stroke-width="2" /> <!-- lips -->
                    <rect x="70" y="80" width="160" height="10" fill="#ffffff" /> <!-- teeth top -->
                    <rect x="70" y="130" width="160" height="10" fill="#ffffff" /> <!-- teeth bottom -->
                    <path d="M110,120 Q150,90 190,120" fill="#ff9999" stroke="#e74c3c" stroke-width="2" /> <!-- tongue -->
                    <path d="M70,50 Q150,0 230,50" fill="none" stroke="#e74c3c" stroke-width="2" /> <!-- roof of mouth -->
                    <text x="150" y="190" text-anchor="middle" font-size="16">Tongue behind teeth for "s"</text>
                </svg>
            `;
            break;
        default:
            // Default mouth shape
            svgContent = `
                <svg width="300" height="200" viewBox="0 0 300 200">
                    <ellipse cx="150" cy="80" rx="120" ry="60" fill="#ffcccc" stroke="#e74c3c" stroke-width="2" /> <!-- lips -->
                    <rect x="70" y="80" width="160" height="10" fill="#ffffff" /> <!-- teeth top -->
                    <rect x="70" y="130" width="160" height="10" fill="#ffffff" /> <!-- teeth bottom -->
                    <path d="M110,160 Q150,130 190,160" fill="#ff9999" stroke="#e74c3c" stroke-width="2" /> <!-- tongue -->
                    <path d="M70,50 Q150,0 230,50" fill="none" stroke="#e74c3c" stroke-width="2" /> <!-- roof of mouth -->
                    <text x="150" y="190" text-anchor="middle" font-size="16">Mouth position for "${phoneme}"</text>
                </svg>
            `;
    }
    
    // Set modal content
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" aria-label="Close">×</button>
            <h3 class="modal-title">Mouth Position: ${phoneme}</h3>
            
            <div class="mouth-visualization">
                ${svgContent}
            </div>
            
            <div class="visualization-tips">
                <h4>How to Position Your Mouth</h4>
                <p>${FluentForm.UI.getPhonemeInfo(phoneme).pronunciation}</p>
            </div>
        </div>
    `;
    
    // Show modal
    modal.style.display = 'flex';
    
    // Add close button event
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Close modal if user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};

/**
 * Returns information about a specific phoneme
 * @param {string} phoneme - The phoneme to get information for
 * @returns {object} - Object with phoneme information
 */
FluentForm.UI.getPhonemeInfo = function(phoneme) {
    const phonemeData = {
        'r': {
            pronunciation: "Curl your tongue back without touching the roof of your mouth. The sides of your tongue should touch your upper back teeth.",
            examples: ["red", "car", "train", "grow"],
            tips: "Practice making the 'r' sound in isolation first, then try it at the beginning, middle, and end of words."
        },
        'th': {
            pronunciation: "Place the tip of your tongue between your front teeth and blow air out gently.",
            examples: ["think", "three", "bath", "with"],
            tips: "There are two 'th' sounds - one is voiceless (as in 'think') and one is voiced (as in 'this'). Practice both."
        },
        's': {
            pronunciation: "Position your tongue behind your top front teeth, but not touching them. Create a narrow channel for air to flow through.",
            examples: ["sun", "bus", "cats", "smile"],
            tips: "Keep your tongue centered in your mouth and maintain a consistent airflow."
        },
        'sh': {
            pronunciation: "Round your lips slightly and position your tongue near the roof of your mouth, but not touching it.",
            examples: ["ship", "wish", "ocean", "nation"],
            tips: "The 'sh' sound should be smooth and continuous, without any stopping of airflow."
        },
        'l': {
            pronunciation: "Touch the tip of your tongue to the ridge behind your upper front teeth.",
            examples: ["light", "ball", "play", "along"],
            tips: "Practice both light 'l' sounds (at the beginning of words) and dark 'l' sounds (at the end of words)."
        },
        'k': {
            pronunciation: "Raise the back of your tongue to touch the soft palate (back of the roof of your mouth).",
            examples: ["cat", "take", "school", "back"],
            tips: "The 'k' sound is a sharp, quick release of air. Practice controlling this release."
        },
        'g': {
            pronunciation: "Raise the back of your tongue to touch the soft palate, similar to 'k' but with voice.",
            examples: ["go", "big", "eagle", "dog"],
            tips: "The 'g' sound is similar to 'k', but your vocal cords vibrate when making it."
        }
    };
    
    // Default information if specific phoneme not found
    return phonemeData[phoneme.toLowerCase()] || {
        pronunciation: "Position your mouth and tongue appropriately for the sound.",
        examples: ["Example words not available"],
        tips: "Practice this sound in different word positions (beginning, middle, end)."
    };
};

/**
 * Creates a grid of phoneme cards from analysis results
 * @param {Array} phonemes - Array of phoneme objects with scores
 * @returns {string} - HTML for the phoneme grid
 */
FluentForm.UI.createPhonemeGrid = function(phonemes) {
    if (!phonemes || phonemes.length === 0) {
        return `
            <div class="empty-state">
                <i class="bi bi-emoji-frown"></i>
                <p>No phoneme analysis available.</p>
                <p>Please try speaking more clearly or check your microphone.</p>
            </div>
        `;
    }
    
    // Group phonemes by word
    const phonemesByWord = {};
    phonemes.forEach(phoneme => {
        if (!phoneme.fromWord) return;
        
        if (!phonemesByWord[phoneme.fromWord]) {
            phonemesByWord[phoneme.fromWord] = [];
        }
        phonemesByWord[phoneme.fromWord].push(phoneme);
    });
    
    let html = '<div class="phoneme-analysis">';
    
    // For each word
    Object.entries(phonemesByWord).forEach(([word, wordPhonemes]) => {
        html += `
            <div class="word-phoneme-card card">
                <div class="word-header">
                    <h4 class="word-text">"${word}"</h4>
                </div>
                <div class="phoneme-grid">
        `;
        
        // For each phoneme in the word
        wordPhonemes.forEach(phoneme => {
            const scoreClass = FluentForm.UI.getScoreClass(phoneme.accuracyScore);
            
            html += `
                <div class="phoneme-card" data-phoneme="${phoneme.phoneme}" data-score="${phoneme.accuracyScore}">
                    <div class="phoneme-symbol">${phoneme.phoneme}</div>
                    <div class="phoneme-score ${scoreClass}">${phoneme.accuracyScore}%</div>
                    <div class="progress-container">
                        <div class="progress-bar progress-bar-${scoreClass}" style="width:${phoneme.accuracyScore}%"></div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    return html;
};

/**
 * Creates animated feedback based on user performance
 * @param {string} containerId - ID of the container element
 * @param {number} score - Performance score (0-100)
 * @param {string} message - Optional feedback message
 */
FluentForm.UI.createPerformanceFeedback = function(containerId, score, message = null) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID ${containerId} not found`);
        return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Determine feedback type based on score
    let feedbackType, icon, defaultMessage;
    
    if (score >= 90) {
        feedbackType = 'excellent';
        icon = 'bi-emoji-laughing-fill';
        defaultMessage = 'Excellent pronunciation!';
    } else if (score >= 75) {
        feedbackType = 'good';
        icon = 'bi-emoji-smile-fill';
        defaultMessage = 'Good job!';
    } else if (score >= 60) {
        feedbackType = 'average';
        icon = 'bi-emoji-neutral-fill';
        defaultMessage = 'Keep practicing!';
    } else {
        feedbackType = 'needs-work';
        icon = 'bi-emoji-frown-fill';
        defaultMessage = 'Needs improvement.';
    }
    
    // Create feedback element
    const feedbackElement = document.createElement('div');
    feedbackElement.className = `performance-feedback ${feedbackType}`;
    feedbackElement.innerHTML = `
        <div class="feedback-icon">
            <i class="bi ${icon}"></i>
        </div>
        <div class="feedback-message">
            ${message || defaultMessage}
        </div>
    `;
    
    // Add animation
    feedbackElement.classList.add('feedback-animation');
    
    // Append to container
    container.appendChild(feedbackElement);
    
    return feedbackElement;
};

/**
 * Gets the CSS class name based on a score value
 * @param {number} score - The score value (0-100)
 * @returns {string} - The CSS class name
 */
FluentForm.UI.getScoreClass = function(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'average';
    if (score >= 40) return 'needs-work';
    return 'poor';
};

// Add these styles to the document when the script loads
document.addEventListener('DOMContentLoaded', function() {
    // Add styles for the components if not already added
    if (!document.getElementById('fluentform-ui-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'fluentform-ui-styles';
        styleSheet.innerHTML = `
            /* Visual Transcription */
            .visual-transcription {
                font-size: var(--font-size-lg);
                line-height: var(--line-height-loose);
                letter-spacing: 0.5px;
                padding: var(--space-md);
            }
            
            .char {
                display: inline-block;
                position: relative;
                font-weight: 500;
                margin: 0 1px;
                transition: all var(--transition-normal) var(--transition-timing-ease);
                cursor: pointer;
            }
            
            .char:hover, .char:focus {
                transform: scale(1.2);
                z-index: 5;
            }
            
            .char.excellent { color: var(--score-excellent); }
            .char.good { color: var(--score-good); }
            .char.average { color: var(--score-average); }
            .char.needs-work { color: var(--score-needs-work); }
            .char.poor { color: var(--score-poor); }
            
            .char-space {
                display: inline-block;
                width: 0.5em;
            }
            
            .char-placeholder {
                color: var(--neutral-light);
                font-style: italic;
            }
            
            /* Phoneme Tooltip */
            .phoneme-tooltip {
                position: fixed;
                z-index: 1000;
                background: var(--neutral-dark);
                color: white;
                padding: var(--space-xs) var(--space-sm);
                border-radius: var(--border-radius-medium);
                font-size: var(--font-size-sm);
                text-align: center;
                box-shadow: var(--shadow-medium);
                pointer-events: none;
                display: none;
            }
            
            .phoneme-tooltip:after {
                content: '';
                position: absolute;
                bottom: -5px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 5px solid transparent;
                border-right: 5px solid transparent;
                border-top: 5px solid var(--neutral-dark);
            }
            
            .tooltip-phoneme {
                font-weight: bold;
                font-size: var(--font-size-md);
                margin-bottom: var(--space-xxs);
            }
            
            .tooltip-score {
                font-weight: 500;
            }
            
            .tooltip-score.excellent { color: var(--score-excellent); }
            .tooltip-score.good { color: var(--score-good); }
            .tooltip-score.average { color: var(--score-average); }
            .tooltip-score.needs-work { color: var(--score-needs-work); }
            .tooltip-score.poor { color: var(--score-poor); }
            
            .tooltip-fade-in {
                animation: tooltipFadeIn 0.2s forwards;
            }
            
            @keyframes tooltipFadeIn {
                from { opacity: 0; transform: translateY(5px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            /* Phoneme Detail Modal */
            .phoneme-detail-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                align-items: center;
                justify-content: center;
            }
            
            .modal-content {
                background-color: var(--neutral-white);
                border-radius: var(--border-radius-large);
                box-shadow: var(--shadow-large);
                padding: var(--space-lg);
                max-width: 500px;
                width: 90%;
                position: relative;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            .modal-close {
                position: absolute;
                top: var(--space-sm);
                right: var(--space-sm);
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: var(--neutral-light);
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all var(--transition-fast) ease;
            }
            
            .modal-close:hover {
                background-color: var(--background-light);
                color: var(--neutral-dark);
            }
            
            .modal-title {
                margin-top: 0;
                color: var(--fluent-primary);
                border-bottom: 1px solid var(--background-light);
                padding-bottom: var(--space-sm);
                margin-bottom: var(--space-md);
            }
            
            .phoneme-pronunciation, .phoneme-examples, .phoneme-tips {
                margin-bottom: var(--space-md);
            }
            
            .phoneme-examples ul {
                padding-left: var(--space-lg);
            }
            
            /* Phoneme Grid */
            .phoneme-analysis {
                display: flex;
                flex-direction: column;
                gap: var(--space-lg);
            }
            
            .word-phoneme-card {
                overflow: hidden;
            }
            
            .word-header {
                padding: var(--space-md) var(--space-lg);
                background-color: var(--info-color-light);
                border-bottom: 1px solid var(--background-light);
            }
            
            .word-text {
                margin: 0;
                color: var(--fluent-primary);
            }
            
            .phoneme-grid {
                display: flex;
                flex-wrap: wrap;
                gap: var(--space-md);
                padding: var(--space-lg);
            }
            
            /* Performance Feedback */
            .performance-feedback {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                padding: var(--space-lg);
                border-radius: var(--border-radius-large);
                margin: var(--space-lg) 0;
            }
            
            .performance-feedback.excellent {
                background-color: var(--success-color-light);
                color: var(--success-color);
            }
            
            .performance-feedback.good {
                background-color: #d0f0f0;
                color: var(--score-good);
            }
            
            .performance-feedback.average {
                background-color: #ffefd0;
                color: var(--score-average);
            }
            
            .performance-feedback.needs-work {
                background-color: var(--warning-color-light);
                color: var(--warning-color);
            }
            
            .feedback-icon {
                font-size: 2.5rem;
                margin-bottom: var(--space-md);
            }
            
            .feedback-message {
                font-size: var(--font-size-lg);
                font-weight: 500;
            }
            
            .feedback-animation {
                animation: feedbackPop 0.5s var(--transition-timing-bounce) forwards;
            }
            
            @keyframes feedbackPop {
                0% { transform: scale(0.8); opacity: 0; }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); opacity: 1; }
            }
            
            /* Mouth Visualization */
            .mouth-visualization {
                display: flex;
                justify-content: center;
                margin: var(--space-lg) 0;
            }
            
            /* Responsive Adjustments */
            @media (max-width: 768px) {
                .word-phoneme-card {
                    max-width: 100%;
                }
                
                .phoneme-grid {
                    justify-content: center;
                }
                
                .modal-content {
                    width: 95%;
                    padding: var(--space-md);
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }
});

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize any active transcriptions on the page
    const transcriptions = document.querySelectorAll('.visual-transcription');
    if (transcriptions.length > 0) {
        FluentForm.UI.initVisualTranscriptionInteractions();
    }
    
    // Make phoneme cards clickable to show details
    document.body.addEventListener('click', function(event) {
        const phonemeCard = event.target.closest('.phoneme-card');
        if (phonemeCard) {
            const phoneme = phonemeCard.getAttribute('data-phoneme');
            if (phoneme) {
                FluentForm.UI.showPhonemeDetails(phoneme);
            }
        }
    });
}); 