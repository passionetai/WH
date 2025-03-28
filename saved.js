// Function to initialize particles.js with subtle configuration
function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            "particles": {
                "number": {
                    "value": 100,
                    "density": {
                        "enable": true,
                        "value_area": 1000
                    }
                },
                "color": {
                    "value": "#007AFF"
                },
                "shape": {
                    "type": "circle",
                    "stroke": {
                        "width": 0,
                        "color": "#000000"
                    }
                },
                "opacity": {
                    "value": 0.5,
                    "random": false,
                    "anim": {
                        "enable": false,
                        "speed": 0.5,
                        "opacity_min": 0.1,
                        "sync": false
                    }
                },
                "size": {
                    "value": 2,
                    "random": true,
                    "anim": {
                        "enable": false,
                        "speed": 20,
                        "size_min": 0.1,
                        "sync": false
                    }
                },
                "line_linked": {
                    "enable": true,
                    "distance": 150,
                    "color": "#34C759",
                    "opacity": 0.3,
                    "width": 0.5
                },
                "move": {
                    "enable": true,
                    "speed": 1,
                    "direction": "none",
                    "random": false,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false,
                    "attract": {
                        "enable": false,
                        "rotateX": 600,
                        "rotateY": 1200
                    }
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": {
                        "enable": true,
                        "mode": "grab"
                    },
                    "onclick": {
                        "enable": true,
                        "mode": "push"
                    },
                    "resize": true
                },
                "modes": {
                    "grab": {
                        "distance": 140,
                        "line_linked": {
                            "opacity": 1
                        }
                    },
                    "push": {
                        "particles_nb": 3
                    }
                }
            },
            "retina_detect": true
        });
    }
}

// saved.js - Script for handling saved hustles page functionality

document.addEventListener("DOMContentLoaded", function() {
    // Initialize particles
    initParticles();
    
    // Load and display saved hustles when the page loads
    loadSavedHustles();

    // Setup scroll to top button
    setupScrollToTop();
});

/**
 * Loads saved hustles from localStorage and renders them in the saved-hustles-output container
 */
function loadSavedHustles() {
    const savedHustlesOutput = document.getElementById("saved-hustles-output");
    const savedHustles = getSavedHustlesFromStorage();
    
    if (savedHustles.length === 0) {
        renderEmptyState(savedHustlesOutput);
        return;
    }
    
    // Create page structure
    renderPageStructure(savedHustlesOutput, savedHustles);
}

/**
 * Retrieves saved hustles from localStorage
 * @returns {Array} Array of saved hustle objects
 */
function getSavedHustlesFromStorage() {
    return localStorage.getItem("savedHustles") ? 
        JSON.parse(localStorage.getItem("savedHustles")) : [];
}

/**
 * Renders an empty state message when no hustles are saved
 * @param {HTMLElement} container - The container to render the empty state in
 */
function renderEmptyState(container) {
    container.innerHTML = `
        <div class="no-saved-hustles">
            <p>You haven't saved any hustles yet!</p>
            <a href="index.html" class="back-to-home">Find hustles to save</a>
        </div>
    `;
}

/**
 * Creates the main page structure with filter and cards container
 * @param {HTMLElement} container - The main container
 * @param {Array} hustles - Array of hustle objects
 */
function renderPageStructure(container, hustles) {
    // Create header section
    const headerSection = document.createElement("div");
    headerSection.className = "saved-hustles-header";
    headerSection.innerHTML = `
        <p>${hustles.length} hustle${hustles.length !== 1 ? 's' : ''} saved</p>
    `;
    container.appendChild(headerSection);
    
    // Create filter container
    const filterContainer = document.createElement("div");
    filterContainer.id = "filter-container";
    filterContainer.innerHTML = `
        <label for="difficulty-filter">Filter by Difficulty:</label>
        <select id="difficulty-filter">
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
        </select>
    `;
    container.appendChild(filterContainer);
    
    // Create hustle cards container
    const cardsContainer = document.createElement("div");
    cardsContainer.className = "hustle-cards-container";
    container.appendChild(cardsContainer);
    
    // Render initial hustles
    renderFilteredHustles(hustles, cardsContainer);
    
    // Setup filter event listener
    document.getElementById("difficulty-filter").addEventListener("change", function() {
        const selectedDifficulty = this.value;
        
        let filteredHustles = selectedDifficulty === "all" ? 
            hustles : 
            hustles.filter(hustle => hustle.difficulty.toLowerCase() === selectedDifficulty);
        
        renderFilteredHustles(filteredHustles, cardsContainer);
    });
}

/**
 * Renders a filtered list of hustle cards
 * @param {Array} hustles - Array of hustle objects to render
 * @param {HTMLElement} container - The container to render cards in
 */
function renderFilteredHustles(hustles, container) {
    // Clear container
    container.innerHTML = "";
    
    // If no hustles match the filter, show a message
    if (hustles.length === 0) {
        container.innerHTML = `
            <div class="missing-section" style="width: 100%;">
                <p class="missing-text">No hustles found with the selected difficulty</p>
            </div>
        `;
        return;
    }
    
    // Create cards for each hustle
    hustles.forEach((hustle, index) => {
        const card = createSimplifiedHustleCard(hustle, index);
        container.appendChild(card);
    });
    
    // Add event listeners to the cards
    setupSavedHustlesEventListeners(hustles);
}

/**
 * Creates a simplified hustle card
 * @param {Object} hustle - The hustle object
 * @param {number} index - The index of the hustle in the array
 * @returns {HTMLElement} The created card element
 */
function createSimplifiedHustleCard(hustle, index) {
    const card = document.createElement("div");
    card.className = "hustle-card";
    card.setAttribute("data-difficulty", hustle.difficulty.toLowerCase());
    
    card.innerHTML = `
        <div class="copy-button-container">
            <button class="copy-hustle-btn" data-hustle-index="${index}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
            </button>
            <button class="delete-hustle-btn" data-hustle-index="${index}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                Delete
            </button>
            <button class="share-hustle-btn" data-hustle-index="${index}">
                Share This Hustle
            </button>
        </div>
        <h3>${hustle.name.replace(/['"*\n]/g, " ").trim()}</h3>
        <div class="hustle-details">
            <p><strong>Executive Summary:</strong> ${hustle.summary}</p>
            
            <div class="hustle-metrics">
                <span class="metric"><strong>Difficulty:</strong> ${hustle.difficulty}</span>
                <span class="metric"><strong>Profitability:</strong> <span class="profit-badge">${hustle.profitability}</span></span>
                <span class="metric"><strong>Initial Cost:</strong> ${hustle.cost}</span>
            </div>
            
            <div class="metrics-section">
                <h4>Key Metrics</h4>
                <div class="metrics-grid">
                    <div class="metric-item">
                        <strong>Startup Time:</strong><br>${hustle.metrics.startupTime}
                    </div>
                    <div class="metric-item">
                        <strong>Break-even:</strong><br>${hustle.metrics.breakEven}
                    </div>
                    <div class="metric-item">
                        <strong>Scalability:</strong><br>${hustle.metrics.scalability}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Sets up event listeners for the hustle cards
 * @param {Array} hustles - Array of hustle objects
 */
function setupSavedHustlesEventListeners(hustles) {
    // Copy hustle buttons
    document.querySelectorAll('.copy-hustle-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-hustle-index'));
            const hustle = hustles[index];
            
            if (hustle) {
                const hustleText = formatHustleForCopy(hustle);
                
                // Copy to clipboard
                navigator.clipboard.writeText(hustleText).then(
                    function() {
                        // Success feedback
                        button.classList.add('copied');
                        button.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Copied!
                        `;
                        
                        setTimeout(() => {
                            button.classList.remove('copied');
                            button.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                Copy
                            `;
                        }, 2000);
                    },
                    function(err) {
                        console.error('Could not copy text: ', err);
                    }
                );
            }
        });
    });
    
    // Delete hustle buttons
    document.querySelectorAll('.delete-hustle-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-hustle-index'));
            const hustle = hustles[index];
            
            if (hustle && confirm(`Are you sure you want to delete "${hustle.name}" from your saved hustles?`)) {
                // Remove from saved hustles in localStorage
                let savedHustles = JSON.parse(localStorage.getItem('savedHustles') || '[]');
                savedHustles = savedHustles.filter(saved => saved.name !== hustle.name);
                localStorage.setItem('savedHustles', JSON.stringify(savedHustles));
                
                // Reload saved hustles
                loadSavedHustles();
            }
        });
    });
    
    // Share hustle buttons
    document.querySelectorAll('.share-hustle-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-hustle-index'));
            const hustle = hustles[index];
            
            if (hustle) {
                // Create shareable content
                const title = `Check out this hustle idea: ${hustle.name}`;
                const text = `${hustle.summary}\n\nProfitability: ${hustle.profitability}\nDifficulty: ${hustle.difficulty}`;
                const hustleTitle = hustle.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                const shareUrl = `https://wehustle.it.com/?hustle=${encodeURIComponent(hustleTitle)}`;
                
                // Use Web Share API if available
                if (navigator.share) {
                    navigator.share({
                        title: title,
                        text: text,
                        url: shareUrl
                    })
                    .then(() => {
                        console.log('Shared successfully');
                    })
                    .catch(err => {
                        console.error('Share failed:', err);
                        // Fall back to clipboard if share fails
                        fallbackToClipboard();
                    });
                } else {
                    // Fallback for browsers without Web Share API
                    fallbackToClipboard();
                }
                
                // Fallback function to copy to clipboard
                function fallbackToClipboard() {
                    const shareText = `${title}\n\n${text}\n\n${shareUrl}`;
                    navigator.clipboard.writeText(shareText)
                        .then(() => {
                            alert("Link copied to clipboard!");
                            
                            // Success feedback on button
                            button.textContent = 'Link Copied!';
                            setTimeout(() => {
                                button.textContent = 'Share This Hustle';
                            }, 2000);
                        })
                        .catch(err => {
                            console.error('Could not copy link: ', err);
                            alert('Error copying link to clipboard');
                        });
                }
            }
        });
    });
}

/**
 * Formats a hustle object for copying to clipboard
 * @param {Object} hustle - The hustle object to format
 * @returns {string} Formatted text representation of the hustle
 */
function formatHustleForCopy(hustle) {
    let text = `HUSTLE IDEA: ${hustle.name}\n\n`;
    text += `EXECUTIVE SUMMARY:\n${hustle.summary}\n\n`;
    text += `DIFFICULTY: ${hustle.difficulty}\n`;
    text += `PROFITABILITY: ${hustle.profitability}\n`;
    text += `INITIAL COST: ${hustle.cost}\n\n`;
    text += "KEY METRICS:\n";
    text += `- Startup Time: ${hustle.metrics.startupTime}\n`;
    text += `- Break-even: ${hustle.metrics.breakEven}\n`;
    text += `- Scalability: ${hustle.metrics.scalability}\n\n`;
    
    if (hustle.actionPlan && hustle.actionPlan.length > 0) {
        text += "ACTION PLAN (FIRST MONTH):\n";
        hustle.actionPlan.forEach((plan, index) => {
            text += `- ${plan}\n`;
        });
        text += "\n";
    }
    
    if (hustle.resources) {
        text += "RESOURCES:\n";
        if (hustle.resources.tools && hustle.resources.tools.length > 0) {
            text += `- Tools: ${hustle.resources.tools.join(", ")}\n`;
        }
        if (hustle.resources.platforms && hustle.resources.platforms.length > 0) {
            text += `- Platforms: ${hustle.resources.platforms.join(", ")}\n`;
        }
        if (hustle.resources.communities && hustle.resources.communities.length > 0) {
            text += `- Communities: ${hustle.resources.communities.join(", ")}\n`;
        }
        text += "\n";
    }
    
    if (hustle.monetization && hustle.monetization.length > 0) {
        text += "MONETIZATION STREAMS:\n";
        hustle.monetization.forEach((stream, index) => {
            text += `${index + 1}. ${stream}\n`;
        });
        text += "\n";
    }
    
    if (hustle.risks && hustle.risks.length > 0) {
        text += "RISK ANALYSIS:\n";
        hustle.risks.forEach(risk => {
            text += `- Challenge: ${risk.challenge}\n`;
            text += `  Solution: ${risk.solution}\n`;
        });
    }
    
    return text;
}

/**
 * Sets up the scroll to top button functionality
 */
function setupScrollToTop() {
    const scrollTopBtn = document.querySelector(".scroll-top-btn");
    
    if (!scrollTopBtn) return;
    
    // Show/hide button based on scroll position
    window.addEventListener("scroll", () => {
        if (window.pageYOffset > 100) {
            scrollTopBtn.style.display = "block";
        } else {
            scrollTopBtn.style.display = "none";
        }
    });
    
    // Scroll to top when clicked
    scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
} 