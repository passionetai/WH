const GEMINI_CONFIG={API_URL:"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",API_KEY:"AIzaSyAd27ptuNgUsenf_vw2eQodBmm9kE-D8cE",IMAGE_API_URL:"https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent",IMAGE_API_KEY:"AIzaSyAd27ptuNgUsenf_vw2eQodBmm9kE-D8cE"};function scrollToHustleOutput(){const e=document.getElementById("hustle-output");setTimeout((()=>{e.scrollIntoView({behavior:"smooth",block:"start"})}),100)}async function fetchHustleData(city) {
    // Prevent multiple concurrent searches
    if (window.searchInProgress) {
        console.log("Search already in progress, ignoring new request");
        return;
    }
    
    window.searchInProgress = true;
    
    try {
        // Show initial loading state
        document.getElementById("hustle-output").innerHTML = `
            <div class="hustle-cards-container"></div>
            <div class="loading">
                <div class="loader-circle"></div>
                <span>Scanning hustle opportunities in <span id="loading-city">${city}</span>...</span>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div style="font-size: 0.8em; margin-top: 10px; color: #666;">
                    We are scanning for the best hustles and this takes up to 30 seconds. Please be patient.
                </div>
            </div>
        `;
        
        // Display the output element
        document.getElementById("hustle-output").style.display = "block";
        scrollToHustleOutput();
            
            // Start progress bar animation
            updateProgressBar();
            
        // Then fetch the hustle data
        let hustleResults;
        let isGeminiResponse = false;
        
        hustleResults = await fetchHustleFromGemini(city);
        isGeminiResponse = true;
        
        renderHustles(hustleResults, city, isGeminiResponse, document.getElementById("hustle-output"));
        const cityBtn = document.querySelector(`.city-btn[data-city="${city}"]`);
        if (cityBtn) {
            cityBtn.classList.add("active");
        }
    } catch (e) {
        showError(e.message || "An unexpected error occurred");
    } finally {
        window.searchInProgress = false;
    }
}

// Function to create a hustle card element
function createHustleCard(hustle, city, isGeminiResponse = true) {
    // Get index from the current context instead of using hustlesArray directly
    const card = document.createElement("div");
    card.className = "hustle-card";
    card.setAttribute("data-difficulty", hustle.difficulty.toLowerCase());
    
    // Check if the hustle is already saved
    let savedHustles = JSON.parse(localStorage.getItem('savedHustles') || '[]');
    const isAlreadySaved = savedHustles.some(saved => saved.name === hustle.name);
    
    // Classify hustle for tags
    const physicalDigital = classifyPhysicalDigital(hustle);
    const businessCustomer = classifyBusinessCustomer(hustle);
    
    // Create HTML for card
    card.innerHTML = `
            <div class="copy-button-container">
            <button class="copy-hustle-btn" data-hustle-index="0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                </button>
            <button class="save-hustle-btn ${isAlreadySaved ? 'saved' : ''}" data-hustle-index="0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${isAlreadySaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                ${isAlreadySaved ? 'Saved' : 'Save'}
                </button>
            <button class="share-hustle-btn" data-hustle-index="0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                Share
                </button>
            </div>
            <h3>${hustle.name.replace(/['"*\n]/g, " ").trim()}</h3>
            <div class="hustle-tags">
                <span class="hustle-diversity-tag tag-${physicalDigital}">${physicalDigital}</span>
                <span class="hustle-diversity-tag tag-${businessCustomer}">${businessCustomer.toUpperCase()}</span>
            </div>
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
                
                <div class="action-plan-section">
                    <h4>Action Plan (First Month)</h4>
                        <div class="timeline">
                            ${hustle.actionPlan.map(((plan, planIndex) => `
                                <div class="timeline-item">
                                    <div class="timeline-marker">S${planIndex + 1}</div>
                                    <div class="timeline-content">${plan}</div>
                                </div>
                            `)).join("")}
                        </div>
                </div>
                
                <div class="resources-section">
                    <h4>Resources</h4>
                    <div class="resources-grid">
                        <div class="resource-item">
                            <strong>🛠️ Tools:</strong>
                            <ul>${hustle.resources.tools.map((tool => `<li>${tool}</li>`)).join("")}</ul>
                        </div>
                        <div class="resource-item">
                            <strong>💻 Platforms:</strong>
                            <ul>${hustle.resources.platforms.map((platform => `<li>${platform}</li>`)).join("")}</ul>
                        </div>
                        <div class="resource-item">
                            <strong>👥 Communities:</strong>
                            <ul>${hustle.resources.communities.map((community => `<li>${community}</li>`)).join("")}</ul>
                        </div>
                    </div>
                </div>
                
                <div class="monetization-section">
                    <h4>Monetization Streams</h4>
                        <div class="monetization-list">
                            ${hustle.monetization.map(((stream, streamIndex) => `
                                <div class="monetization-item">
                                    <span class="monetization-number">${streamIndex + 1}</span>
                                    <span class="monetization-content">${stream}</span>
                                </div>
                            `)).join("")}
                        </div>
                </div>
                
                <div class="risks-section">
                    <h4>Risk Analysis</h4>
                        ${hustle.risks.map((risk => `
                            <div class="risk-item">
                                <div class="risk-challenge">
                                    <strong>⚠️ Challenge:</strong> ${risk.challenge}
                                </div>
                                ${risk.impact ? `<div class="risk-impact"><strong>📊 Impact:</strong> ${risk.impact}</div>` : ''}
                                <div class="risk-solution">
                                    <strong>💡 Solution:</strong> ${risk.solution}
                                </div>
                                ${risk.expected ? `<div class="risk-expected"><strong>📈 Expected:</strong> ${risk.expected}</div>` : ''}
                            </div>
                        `)).join("")}
                </div>
            </div>
        `;
    
    return card;
}

// Display hustle cards
function displayHustleCards(hustles, city) {
    // Get the hustle cards container
    const hustleCardsContainer = document.querySelector(".hustle-cards-container");
    
    // Clear loading element
    const loadingElement = document.querySelector(".loading");
    if (loadingElement) loadingElement.remove();
    
    // Update hustle cards container
    hustleCardsContainer.innerHTML = "";
    
    // Create heading
    const heading = document.createElement("h2");
    heading.classList.add("hustles-heading");
    heading.setAttribute("tabindex", "0");
    heading.textContent = `Here's Your Money Making Hustles in ${city}`;
    hustleCardsContainer.appendChild(heading);
    
    // Create subtitle
    const subtitle = document.createElement("p");
    subtitle.classList.add("hustles-subheading");
    subtitle.textContent = "Study Your Hustle, Copy, Save or Share. Refresh Hustle to get new ideas. Start Today!";
    hustleCardsContainer.appendChild(subtitle);
    
    // Create cards grid container
    const cardsGrid = document.createElement("div");
    cardsGrid.classList.add("cards-grid");
    hustleCardsContainer.appendChild(cardsGrid);
    
    // Add each hustle card
    hustles.forEach((hustle) => {
        const card = createHustleCard(hustle, city);
        cardsGrid.appendChild(card);
    });
}

function renderHustles(hustles, city, isGeminiResponse, outputElement) {
    // Clear progress interval if it exists
    if (window.progressInterval) {
        clearInterval(window.progressInterval);
        window.progressInterval = null;
    }
    
    // Store the current hustles and city
    currentDisplayedHustles = hustles;
    currentCity = city;
    
    const output = outputElement || document.getElementById("hustle-output");
    output.innerHTML = '';

    const heading = document.createElement("h2");
    heading.className = "hustles-heading";
    heading.textContent = `${city} Hustle Ideas`;
    
    const subheading = document.createElement("span");
    subheading.className = "hustles-subheading";
    subheading.textContent = `Unique Side Business Opportunities for ${city}`;
    heading.appendChild(subheading);
    
    output.appendChild(heading);
    
    const cardsContainer = document.createElement("div");
    cardsContainer.className = "hustle-cards-container";
    output.appendChild(cardsContainer);
    
    hustles.forEach((hustle, index) => {
        const card = createHustleCard(hustle, city, isGeminiResponse);
        
        // Update data index on buttons to match current array position
        const copyBtn = card.querySelector(".copy-hustle-btn");
        if (copyBtn) copyBtn.setAttribute("data-hustle-index", index);
        
        const saveBtn = card.querySelector(".save-hustle-btn");
        if (saveBtn) saveBtn.setAttribute("data-hustle-index", index);
        
        const shareBtn = card.querySelector(".share-hustle-btn");
        if (shareBtn) shareBtn.setAttribute("data-hustle-index", index);
        
        cardsContainer.appendChild(card);
    });
    
    // Add refresh button container
    const refreshBtnContainer = document.createElement("div");
    refreshBtnContainer.className = "refresh-button-container";
    
    // Add refresh button
    const refreshBtn = document.createElement("button");
    refreshBtn.className = "refresh-btn";
    refreshBtn.id = "refresh-btn";
    refreshBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
        </svg>
        Refresh Ideas
    `;
    refreshBtnContainer.appendChild(refreshBtn);
    
    // Add more diverse hustle button
    const moreDiverseBtn = document.createElement("button");
    moreDiverseBtn.className = "refresh-btn";
    moreDiverseBtn.id = "more-diverse-btn";
    moreDiverseBtn.style = "margin-left: 10px; background: linear-gradient(135deg, var(--accent-color) 0%, var(--secondary-color) 100%);";
    moreDiverseBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
        Get More Diverse Hustle
    `;
    refreshBtnContainer.appendChild(moreDiverseBtn);
    
    output.appendChild(refreshBtnContainer);
    
    // Setup button listeners
    setupButtonListeners(hustles, city);
    
    // Add event listeners for hustle cards
    setupHustleCardListeners(hustles);
}

// Function to set up button listeners
function setupButtonListeners(hustles, city) {
    // Refresh button handler
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function() {
            if (!city) return;
            
            this.disabled = true;
            this.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spinning">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                    </svg>
                Refreshing...
            `;
            
            try {
                await fetchHustleData(city);
            } catch (error) {
                console.error("Error refreshing hustles:", error);
            } finally {
                this.disabled = false;
                this.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                    </svg>
                    Refresh Ideas
                `;
            }
        });
    }
    
    // More Diverse button handler
    const moreDiverseBtn = document.querySelector('#more-diverse-btn');
    if (moreDiverseBtn) {
        moreDiverseBtn.addEventListener('click', async () => {
            if (!city) {
                console.error("No city selected yet");
                return;
            }
            
            // Show loading state
            moreDiverseBtn.disabled = true;
            moreDiverseBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spinning">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
                Generating...
            `;
            
            // Show a loading section 
            const cardsContainer = document.querySelector('.hustle-cards-container');
            if (cardsContainer) {
                // Save the current scroll position
                const scrollPosition = window.scrollY;
                
                // Add loading section
                cardsContainer.innerHTML = `
                    <div class="missing-section" style="width: 100%;">
                        <div class="loading-spinner"></div>
                        <p class="missing-text">Generating diverse hustles for ${city}...</p>
                        <p>Creating three unique business opportunities tailored to your area</p>
                    </div>
                `;
                
                // Restore the scroll position
                window.scrollTo({top: scrollPosition});
            }
            
            try {
                // Use the existing models and audiences to know what to avoid
                const seenModels = new Set();
                const seenAudiences = new Set();
                
                if (hustles && hustles.length > 0) {
                    hustles.forEach(hustle => {
                        seenModels.add(classifyBusinessModel(hustle.monetization));
                        seenAudiences.add(classifyAudience(hustle.summary));
                    });
                }
                
                // Generate 3 new diverse hustles
                const updatedHustles = [];
                
                // Create a progress indicator
                let progress = 0;
                const updateProgress = () => {
                    if (cardsContainer) {
                        progress += 1;
                        cardsContainer.innerHTML = `
                            <div class="missing-section" style="width: 100%;">
                                <div class="loading-spinner"></div>
                                <p class="missing-text">Generating diverse hustles for ${city}...</p>
                                <p>Creating hustle ${progress} of 3</p>
                            </div>
                        `;
                    }
                };
                
                // Generate first hustle
                updateProgress();
                const firstHustle = await generateAlternativeHustle(
                    city,
                    hustles || [],
                    seenModels,
                    seenAudiences
                );
                
                if (firstHustle) {
                    updatedHustles.push(firstHustle);
                    seenModels.add(classifyBusinessModel(firstHustle.monetization));
                    seenAudiences.add(classifyAudience(firstHustle.summary));
                    
                    // Generate second hustle
                    updateProgress();
                    const secondHustle = await generateAlternativeHustle(
                        city,
                        [...(hustles || []), firstHustle],
                        seenModels,
                        seenAudiences
                    );
                    
                    if (secondHustle) {
                        updatedHustles.push(secondHustle);
                        seenModels.add(classifyBusinessModel(secondHustle.monetization));
                        seenAudiences.add(classifyAudience(secondHustle.summary));
                        
                        // Generate third hustle
                        updateProgress();
                        const thirdHustle = await generateAlternativeHustle(
                            city,
                            [...(hustles || []), firstHustle, secondHustle],
                            seenModels,
                            seenAudiences
                        );
                        
                        if (thirdHustle) {
                            updatedHustles.push(thirdHustle);
                        }
                    }
                }
                
                if (updatedHustles.length > 0) {
                    // Update display with all the new hustles
                    renderHustles(updatedHustles, city, true);
                    console.log("Generated new diverse hustles:", updatedHustles.map(h => h.name).join(', '));
                } else {
                    console.error("Failed to generate alternative hustles");
                    showError("Failed to generate diverse hustles. Please try again.");
                }
            } catch (error) {
                console.error("Error generating diverse hustles:", error);
                showError("Error generating diverse hustles: " + error.message);
            } finally {
                // Reset button state
                moreDiverseBtn.disabled = false;
                moreDiverseBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                        <line x1="9" y1="9" x2="9.01" y2="9"></line>
                        <line x1="15" y1="9" x2="15.01" y2="9"></line>
                    </svg>
                    Get More Diverse Hustles
                `;
            }
        });
    }
}

// Show error message function
function showError(message) {
    // Clear progress interval if it exists
    if (window.progressInterval) {
        clearInterval(window.progressInterval);
        window.progressInterval = null;
    }
    
    const hustleOutput = document.getElementById("hustle-output");
    hustleOutput.style.display = "block";
    hustleOutput.innerHTML = `<div class="error">${message}</div>`;
    scrollToHustleOutput();
}

function parseHustles(e,t){const n=[],i=e.split(/Name:/g).filter((e=>e.trim()));for(const e of i.slice(0,3)){const t="Name:"+e,i={name:"",summary:"",difficulty:"",profitability:"",cost:"",metrics:{startupTime:"",breakEven:"",scalability:""},actionPlan:[],resources:{tools:[],platforms:[],communities:[]},monetization:[],risks:[]},s=t.match(/Name:\s*(.+?)(?=\n|Executive)/);s&&(i.name=s[1].trim());const o=t.match(/Executive Summary:\s*(.+?)(?=\n|Difficulty)/s);o&&(i.summary=o[1].trim());const a=t.match(/Difficulty:\s*(.+?)(?=\n|Profitability)/);a&&(i.difficulty=a[1].trim());const r=t.match(/Profitability:\s*(.+?)(?=\n|Cost)/);r&&(i.profitability=r[1].trim());const l=t.match(/Cost:\s*(.+?)(?=\n|Key Metrics)/);l&&(i.cost=l[1].trim());const c=t.match(/Key Metrics:\s*(.+?)(?=\n\nAction Plan)/s);if(c){const e=c[1],t=e.match(/Startup Time:\s*(.+?)(?=\n|-)/);t&&(i.metrics.startupTime=t[1].trim());const n=e.match(/Break-even Point:\s*(.+?)(?=\n|-)/);n&&(i.metrics.breakEven=n[1].trim());const s=e.match(/Scalability:\s*(.+?)(?=\n|$)/);s&&(i.metrics.scalability=s[1].trim())}const m=t.match(/Action Plan \(First Month\):\s*(.+?)(?=\n\nResources)/s);if(m){const e=m[1].match(/Week \d+:.*?(?=\n|$)/g);e&&(i.actionPlan=e.map((e=>e.trim())))}const u=t.match(/Resources:\s*(.+?)(?=\n\nMonetization)/s);if(u){const e=u[1],t=e.match(/Tools:\s*(.+?)(?=\n|Platforms)/);t&&(i.resources.tools=t[1].split(",").map((e=>e.trim())).filter((e=>e)));const n=e.match(/Platforms:\s*(.+?)(?=\n|Communities)/);n&&(i.resources.platforms=n[1].split(",").map((e=>e.trim())).filter((e=>e)));const s=e.match(/Communities:\s*(.+?)(?=\n|$)/);s&&(i.resources.communities=s[1].split(",").map((e=>e.trim())).filter((e=>e)))}const d=t.match(/Monetization:\s*(.+?)(?=\n\nRisk Analysis)/s);if(d){const e=d[1].match(/\d+\.\s*.*?(?=\n|$)/g);e&&(i.monetization=e.map((e=>e.replace(/^\d+\.\s*/,"").trim())))}const p=t.match(/Risk Analysis:\s*(.+?)(?=$)/s);if(p){
    const e=p[1],
    challenges=e.match(/Challenge:\s*(.*?)(?:\s*→\s*Impact:|$)/g),
    impacts=e.match(/Impact:\s*(.*?)(?:\s*\n\s*Solution:|$)/g),
    solutions=e.match(/Solution:\s*(.*?)(?:\s*→\s*Expected:|$)/g),
    expected=e.match(/Expected:\s*(.*?)(?=\n|-|$)/g);
    
    if(challenges && solutions) {
        for(let idx=0; idx < Math.min(challenges.length, solutions.length); idx++) {
            const impact = impacts && idx < impacts.length ? impacts[idx].replace(/Impact:\s*/, "").trim() : "";
            const expect = expected && idx < expected.length ? expected[idx].replace(/Expected:\s*/, "").trim() : "";
            i.risks.push({
                challenge: challenges[idx].replace(/Challenge:\s*/, "").replace(/\s*→\s*Impact:.*$/, "").trim(),
                impact: impact,
                solution: solutions[idx].replace(/Solution:\s*/, "").replace(/\s*→\s*Expected:.*$/, "").trim(),
                expected: expect
            });
        }
    }
}i.name&&i.summary&&n.push(i)}return n.length>0?n:null}

/**
 * Validates risk analysis sections meet completeness requirements
 * @param {string} text - Risk analysis text block 
 * @returns {boolean} - True if all risk-solution pairs are complete
 */
function validateRiskAnalysis(text) {
  if (!text || typeof text !== 'string') return false;
  
  // Split into individual risks
  const risks = text.split(/\n\s*-/).filter(pair => pair.trim());
  
  // Must have at least 2 risk items
  if (risks.length < 2) return false;
  
  // Each risk must follow the pattern with Challenge, Impact, Solution, and Expected
  return risks.every(pair => {
    const hasChallenge = /Challenge:/.test(pair);
    const hasImpact = /Impact:/.test(pair) || /→\s*Impact:/.test(pair);
    const hasSolution = /Solution:/.test(pair);
    const hasExpected = /Expected:/.test(pair) || /→\s*Expected:/.test(pair);
    const solutionHasArrow = /Solution:.*\+.*→/.test(pair);
    return hasChallenge && hasImpact && hasSolution && hasExpected && solutionHasArrow;
  });
}

// Validate diversity of hustle ideas
function validateDiversity(hustles) {
  const seenModels = new Set();
  const seenAudiences = new Set();
  
  const isDiverse = hustles.every(hustle => {
    // Check business model diversity
    const modelType = classifyBusinessModel(hustle.monetization);
    if (seenModels.has(modelType)) return false;
    seenModels.add(modelType);
    
    // Check audience diversity
    const audience = classifyAudience(hustle.summary); 
    if (seenAudiences.has(audience)) return false;
    seenAudiences.add(audience);
    
    return true;
  });
  
  return {
    isDiverse,
    seenModels,
    seenAudiences
  };
}

// Helper functions for diversity validation
function classifyBusinessModel(monetization) {
  if (!monetization || !Array.isArray(monetization)) return 'unknown';
  
  const monetizationText = monetization.join(' ').toLowerCase();
  
  if (monetizationText.includes('subscription')) return 'subscription';
  if (monetizationText.includes('commission') || monetizationText.includes('marketplace') || monetizationText.includes('platform fee')) return 'marketplace';
  if (monetizationText.includes('service') || monetizationText.includes('consulting') || monetizationText.includes('hourly')) return 'service';
  if (monetizationText.includes('product') || monetizationText.includes('merchandise') || monetizationText.includes('retail')) return 'product';
  if (monetizationText.includes('advertising') || monetizationText.includes('sponsorship')) return 'advertising';
  if (monetizationText.includes('rental') || monetizationText.includes('leasing')) return 'rental';
  if (monetizationText.includes('workshop') || monetizationText.includes('training') || monetizationText.includes('course')) return 'education';
  
  return 'other';
}

function classifyAudience(summary) {
  if (!summary || typeof summary !== 'string') return 'unknown';
  
  const text = summary.toLowerCase();
  
  if (text.includes('student') || text.includes('college') || text.includes('university') || text.includes('school')) return 'students';
  if (text.includes('professional') || text.includes('executive') || text.includes('business owner') || text.includes('entrepreneur')) return 'professionals';
  if (text.includes('senior') || text.includes('retiree') || text.includes('elderly') || text.includes('older adult')) return 'seniors';
  if (text.includes('tourist') || text.includes('traveler') || text.includes('visitor')) return 'tourists';
  if (text.includes('parent') || text.includes('family') || text.includes('child') || text.includes('kid')) return 'families';
  if (text.includes('pet owner') || text.includes('animal')) return 'pet owners';
  if (text.includes('homeowner') || text.includes('property owner')) return 'homeowners';
  if (text.includes('business') || text.includes('b2b') || text.includes('corporate')) return 'businesses';
  
  return 'general';
}

// Classify hustle as digital or physical based on content
function classifyPhysicalDigital(hustle) {
  if (!hustle) return 'unknown';
  
  // Combine all text fields for analysis
  const allText = [
    hustle.summary || '', 
    hustle.monetization?.join(' ') || '',
    hustle.resources?.tools?.join(' ') || '',
    hustle.resources?.platforms?.join(' ') || ''
  ].join(' ').toLowerCase();
  
  // Physical indicators
  const physicalIndicators = [
    'store', 'shop', 'physical', 'location', 'space', 'venue', 'equipment',
    'in-person', 'hands-on', 'material', 'build', 'craft', 'product', 'manufacture',
    'delivery', 'transport', 'vehicle', 'restaurant', 'food', 'retail', 'brick'
  ];
  
  // Digital indicators
  const digitalIndicators = [
    'online', 'digital', 'virtual', 'remote', 'website', 'app', 'platform',
    'software', 'content', 'social media', 'e-commerce', 'subscription', 'web',
    'internet', 'tech', 'digital product', 'saas', 'blog', 'podcast', 'stream'
  ];
  
  let physicalScore = 0;
  let digitalScore = 0;
  
  physicalIndicators.forEach(term => {
    if (allText.includes(term)) physicalScore++;
  });
  
  digitalIndicators.forEach(term => {
    if (allText.includes(term)) digitalScore++;
  });
  
  if (physicalScore > digitalScore) return 'physical';
  if (digitalScore > physicalScore) return 'digital';
  
  return 'hybrid'; // Default when the scores are equal
}

// Classify hustle as B2B or B2C based on audience and description
function classifyBusinessCustomer(hustle) {
  if (!hustle) return 'unknown';
  
  // Combine text for analysis
  const allText = [hustle.summary || '', hustle.monetization?.join(' ') || ''].join(' ').toLowerCase();
  
  // B2B indicators
  const b2bIndicators = [
    'business', 'corporate', 'company', 'enterprise', 'organization',
    'b2b', 'client', 'professional', 'agency', 'commercial', 'wholesale',
    'industry', 'vendor', 'supplier', 'service provider', 'consultant'
  ];
  
  // B2C indicators
  const b2cIndicators = [
    'consumer', 'customer', 'individual', 'people', 'personal', 'user',
    'b2c', 'retail', 'public', 'direct-to-consumer', 'household', 'resident',
    'family', 'student', 'parent', 'senior', 'general public'
  ];
  
  let b2bScore = 0;
  let b2cScore = 0;
  
  b2bIndicators.forEach(term => {
    if (allText.includes(term)) b2bScore++;
  });
  
  b2cIndicators.forEach(term => {
    if (allText.includes(term)) b2cScore++;
  });
  
  // Also check audience type
  const audience = classifyAudience(hustle.summary || '');
  if (audience === 'businesses' || audience === 'professionals') b2bScore += 2;
  if (['students', 'families', 'seniors', 'tourists', 'pet owners', 'homeowners', 'general'].includes(audience)) b2cScore += 2;
  
  if (b2bScore > b2cScore) return 'b2b';
  if (b2cScore > b2bScore) return 'b2c';
  
  return 'mixed'; // Default when equal
}

// Generate an alternative hustle when diversity validation fails
async function generateAlternativeHustle(city, previousHustles, seenModels, seenAudiences) {
  const exclusionPrompt = `
  Previous ideas to avoid:
  ${previousHustles.map(h => h.name).join(', ')}
  
  Generate a COMPLETELY DIFFERENT hustle for ${city} that:
  - Uses none of these business models: ${[...seenModels].join(', ')}
  - Targets none of these audiences: ${[...seenAudiences].join(', ')}
  - Must include one unusual monetization method
  
  Format EXACTLY like:
  
  Name: [Business Name]
  Executive Summary: [2-3 sentences describing the opportunity]
  Difficulty: [Easy/Medium/Hard]
  Profitability: [$/month range with specific numbers]
  Cost: [Initial cost breakdown with specific numbers]
  
  Key Metrics:
  - Startup Time: [X weeks based on complexity, must be specific]
  - Break-even Point: [Y months with calculation based on costs and revenue]
  - Scalability: [Low/Medium/High with detailed explanation]
  
  Action Plan (First Month):
  Week 1: [specific actionable milestone with measurable outcome]
  Week 2: [specific actionable milestone with measurable outcome]
  Week 3: [specific actionable milestone with measurable outcome]
  Week 4: [specific actionable milestone with measurable outcome]
  
  Resources:
  - Tools: [List exactly 3-5 specific tools with actual names and brief purpose]
  - Platforms: [List exactly 2-3 specific platforms with actual names]
  - Communities: [1 specific local community in ${city} + 1 specific online community]
  
  Monetization:
  1. [Primary revenue stream with exact pricing and volume estimates]
  2. [Secondary revenue stream with exact pricing and volume estimates]
  3. [UNUSUAL revenue stream with exact pricing and volume estimates]
  
  Risk Analysis:
  - Challenge: [specific issue] → Impact: [quantifiable effect]
    Solution: [action 1] + [action 2] → Expected: [% improvement]
  - Challenge: [specific issue] → Impact: [quantifiable effect]
    Solution: [action 1] + [action 2] → Expected: [% improvement]
  `;
  
  // Call Gemini with higher temperature for more creative results
  const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: exclusionPrompt }] }],
      safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 1.4,
        topP: 0.95,
        topK: 60
      }
    })
  });
  
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  
  const result = await response.json();
  const alternativeText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  // Parse the single hustle
  const parsedHustles = parseHustles("Name:" + alternativeText, city);
  if (!parsedHustles || parsedHustles.length === 0) {
    console.error("Failed to parse alternative hustle");
    return null;
  }
  
  return parsedHustles[0];
}


// Track current displayed hustles and city globally
let currentDisplayedHustles = [];
let currentCity = "";

// Function to get currently displayed hustles
function getDisplayedHustles() {
    return currentDisplayedHustles;
}

// Define the diversity prompt to ensure diverse hustle ideas
const diversityPrompt = `
DIVERSITY REQUIREMENTS: Generate hustles that are diverse across these dimensions:
- BUSINESS MODELS: Include variety (subscription, marketplace, service, product, etc.)
- TARGET AUDIENCES: Target different demographics (students, professionals, seniors, etc.)
- REVENUE STREAMS: Each hustle must have at least 3 distinct revenue streams
- AVOID SIMILARITY: No two hustles should have similar business models or target audiences

Ensure each hustle uses a different monetization strategy and appeals to a different audience.
`;

let previousHustleNames=[];
async function fetchHustleFromGemini(e,t=0){
    try{
        const n=`Generate 3 highly unique and unconventional side hustles tailored to ${e}'s local economy, culture, demographics, and untapped opportunities. Avoid common ideas like food delivery, tutoring, or generic freelancing. ${previousHustleNames.length>0?`Do not repeat these previous ideas: ${previousHustleNames.join(", ")}.`:""} 

${diversityPrompt}

Format EXACTLY like:\n\nName: [Business Name]\nExecutive Summary: [2-3 sentences describing the opportunity]\nDifficulty: [Easy/Medium/Hard]\nProfitability: [$/month range with specific numbers]\nCost: [Initial cost breakdown with specific numbers]\n\nKey Metrics:\n- Startup Time: [X weeks based on complexity, must be specific]\n- Break-even Point: [Y months with calculation based on costs and revenue]\n- Scalability: [Low/Medium/High with detailed explanation]\n\nAction Plan (First Month):\nWeek 1: [specific actionable milestone with measurable outcome]\nWeek 2: [specific actionable milestone with measurable outcome]\nWeek 3: [specific actionable milestone with measurable outcome]\nWeek 4: [specific actionable milestone with measurable outcome]\n\nResources:\n- Tools: [List exactly 3-5 specific tools with actual names and brief purpose]\n- Platforms: [List exactly 2-3 specific platforms with actual names]\n- Communities: [1 specific local community in ${e} + 1 specific online community]\n\nMonetization:\n1. [Primary revenue stream with exact pricing and volume estimates]\n2. [Secondary revenue stream with exact pricing and volume estimates]\n3. [Additional revenue stream with exact pricing and volume estimates]\n\nRisk Analysis:\n- Challenge: [specific issue] → Impact: [quantifiable effect]\n  Solution: [action 1] + [action 2] → Expected: [% improvement]\n- Challenge: [specific issue] → Impact: [quantifiable effect]\n  Solution: [action 1] + [action 2] → Expected: [% improvement]\n\nCRITICAL INSTRUCTION: You MUST provide complete, specific, and realistic details for EVERY section of ALL 3 hustles. Omitting or providing vague details for any section will force a retry. Each hustle must be distinct, creative, and rooted in ${e}'s unique characteristics (e.g., local industries, climate, population trends, or subcultures). Every metric must include specific numbers, every action must be measurable, and every solution must be actionable. Responses with placeholders, generic answers, or incomplete sections will be rejected.`;

        console.log("Making API request to Gemini...");
        const i=await fetch(`${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
                contents:[{parts:[{text:n}]}],
                safetySettings:[{category:"HARM_CATEGORY_DANGEROUS_CONTENT",threshold:"BLOCK_ONLY_HIGH"}],
                generationConfig:{maxOutputTokens:1500,temperature:1.2,topP:.9,topK:50}
            })
        });
        
        if(!i.ok) {
            const errorResponse = await i.text();
            console.error(`API Error (${i.status}): ${errorResponse}`);
            throw new Error(`API Error (${i.status}): ${i.statusText}. Check your network connection and API key.`);
        }
        
        const s=await i.json();
        
        if(!s || !s.candidates || !s.candidates[0] || !s.candidates[0].content || !s.candidates[0].content.parts || !s.candidates[0].content.parts[0]) {
            console.error("Invalid API response structure:", s);
            throw new Error("Invalid response from Gemini API. Please try again later.");
        }
        
        const responseText = s.candidates[0].content.parts[0].text || "";
        console.log("API response received, parsing hustles...");
        
        const o=parseHustles(responseText, e);
        if(!o) {
            console.error("Failed to parse hustles from response:", responseText);
            throw new Error("Could not understand the hustle data format. Please try again.");
        }
        
        const a=o.map((e=>validateHustleQuality(e))),r=a.some((e=>e.completeness<.9)),l=a.reduce(((e,t)=>e+t.completeness),0)/a.length;
        
        // Extract and validate the risk analysis section
        let responseTextForRisk = responseText;
        const riskSection = responseTextForRisk.match(/Risk Analysis:([\s\S]+?)(?=\n\n|$)/);
        let riskValidation = riskSection ? validateRiskAnalysis(riskSection[1]) : false;
        
        // Check for diversity validation
        const diversityCheck = validateDiversity(o);
        const diversityValid = diversityCheck.isDiverse;
        
        // Try to repair incomplete risk solutions before retrying completely
        if (riskSection && !riskValidation) {
            console.log("Risk validation failed. Attempting to repair incomplete risk solutions...");
            
            // Extract the risk analysis section
            let riskText = riskSection[1];
            
            // Find incomplete solutions (those without . or ! at the end)
            const incompleteSolutions = riskText.match(/Solution:.*?(?:(?=[^\.\!]$)|(?=\n)|(?=$))/g) || [];
            
            if (incompleteSolutions.length > 0) {
                let repairedCount = 0;
                
                // Fix each incomplete solution
                for (const incompleteSolution of incompleteSolutions) {
                    const fixedSolution = await repairIncompleteRisks(incompleteSolution, e);
                    if (fixedSolution) {
                        riskText = riskText.replace(incompleteSolution, incompleteSolution + fixedSolution);
                        repairedCount++;
                    }
                }
                
                if (repairedCount > 0) {
                    console.warn(`Auto-repaired ${repairedCount} incomplete risk solutions.`);
                    
                    // Update the risk section in the response
                    responseTextForRisk = responseText.replace(riskSection[0], `Risk Analysis:${riskText}`);
                    
                    // Re-validate the updated risk section
                    riskValidation = validateRiskAnalysis(riskText);
                }
            }
        }
        
        // Try to fix diversity issues by replacing one of the hustles
        if (!diversityValid && t < 2) {
            console.warn("Diversity check failed. Generating alternative hustle...");
            try {
                // Generate an alternative hustle
                const alternativeHustle = await generateAlternativeHustle(
                    e, 
                    o, 
                    diversityCheck.seenModels, 
                    diversityCheck.seenAudiences
                );
                
                if (alternativeHustle) {
                    console.log("Generated alternative hustle:", alternativeHustle.name);
                    
                    // Find the least complete hustle to replace
                    const leastCompleteIndex = a.findIndex(h => 
                        h.completeness === Math.min(...a.map(val => val.completeness))
                    );
                    
                    // Replace the least complete hustle with the alternative
                    if (leastCompleteIndex >= 0) {
                        o[leastCompleteIndex] = alternativeHustle;
                        
                        // Recheck diversity
                        const newDiversityCheck = validateDiversity(o);
                        if (newDiversityCheck.isDiverse) {
                            console.log("Diversity issue resolved with alternative hustle.");
                            return o;
                        }
                    }
                }
                } catch (error) {
                console.error("Error generating alternative hustle:", error);
            }
        }
        
        // Make a decision based on validation results
        if ((riskValidation || t >= 2) && l > .8 && (diversityValid || t >= 2)) {
            console.log("Validation passed on attempt", t + 1);
            
            // Store hustle names to avoid repetition
            o.forEach(h => {
                if (h.name && !previousHustleNames.includes(h.name)) {
                    previousHustleNames.push(h.name);
                }
                // Limit to last 9 names
                if (previousHustleNames.length > 9) {
                    previousHustleNames = previousHustleNames.slice(-9);
                }
            });
            
            // Success - return the hustles
            return o;
        } else if (t < 2) {
            // Retry up to 2 times (3 attempts total)
            console.warn(`Validation failed on attempt ${t + 1}. Reason: ${!riskValidation ? 'Risk format invalid' : !diversityValid ? 'Diversity check failed' : 'Quality too low'}`);
            console.log(`Average completeness: ${l.toFixed(2)}`);
            return fetchHustleFromGemini(e, t + 1);
        } else {
            console.error("All attempts failed. Using fallback hustles.");
            return getFallbackHustles(e);
        }
        
    } catch(error) {
        console.error("API Error:", error);
        if (error.message && error.message.includes("API Error")) {
            throw new Error(`Connection error: ${error.message}`);
        } else if (error.message && error.message.includes("Invalid response")) {
            throw new Error("Unable to process Gemini API response. Please try again.");
        } else {
            throw new Error("Failed to connect to hustle database. Please check your internet connection and try again.");
        }
    }
}

function validateHustleQuality(e){const t={name:.05,summary:.1,difficulty:.05,profitability:.05,cost:.05,metrics:{startupTime:.05,breakEven:.05,scalability:.05},actionPlan:.15,resources:{tools:.05,platforms:.05,communities:.05},monetization:.2,risks:.2};let n=0;for(const[i,s]of Object.entries(t))if("object"==typeof s)for(const[t,o]of Object.entries(s))e[i][t]&&("string"==typeof e[i][t]?e[i][t].length>0:!Array.isArray(e[i][t])||e[i][t].length>0)&&(n+=o);else e[i]&&("string"==typeof e[i]?e[i].length>0:!Array.isArray(e[i])||e[i].length>0)&&(n+=s);return Array.isArray(e.actionPlan)&&e.actionPlan.length>=4&&(n+=.025),Array.isArray(e.monetization)&&e.monetization.length>=3&&(n+=.05),Array.isArray(e.risks)&&e.risks.length>=2&&(n+=.05),Array.isArray(e.resources.tools)&&e.resources.tools.length>=3&&(n+=.025),Array.isArray(e.resources.platforms)&&e.resources.platforms.length>=2&&(n+=.025),Array.isArray(e.resources.communities)&&e.resources.communities.length>=2&&(n+=.025),{hustle:e,completeness:n,isHighQuality:n>=.9}}function getFallbackHustles(e){return[{name:`${e} Local Experiences Tour Guide`,summary:`Offer unique, themed walking tours focused on specific areas or interests in ${e}, appealing to tourists and locals. Leverage local knowledge and create memorable experiences beyond typical tourist traps.`,difficulty:"Medium",profitability:"$500 - $2000/month",cost:"$150 (Website domain, initial marketing materials)",metrics:{startupTime:"4-6 weeks",breakEven:"2-3 months",scalability:"Medium - Can expand to multiple tour themes and hire additional guides"},actionPlan:['Week 1: Define tour themes (e.g., "Hidden Gems of Downtown", "Literary History Tour", "Local Cuisine Experience"). Research routes and points of interest.',"Week 2: Create website or landing page with tour descriptions, schedules, and booking information.","Week 3: Market tours online through social media and local listings. Offer introductory discounts.","Week 4: Conduct initial tours, gather feedback, and refine the tour experience."],resources:{tools:["Booking software","Portable microphone/speaker","Digital camera"],platforms:["TripAdvisor","Airbnb Experiences"],communities:[`${e} Tourism Board`,"Facebook Group: Tour Guides Worldwide"]},monetization:["Standard tours: $25-40 per person for 2-hour experiences","Premium/private tours: $150-200 for groups up to 6 people","Custom corporate team-building tours: $400-600 per event"],risks:[{challenge:"Seasonal tourism fluctuations",solution:"Develop special off-season tours targeting locals and business travelers"},{challenge:"Competition from established tour companies",solution:"Focus on unique niches and specialized knowledge that larger companies don't cover"}]},{name:`${e} Mobile Pet Grooming Service`,summary:`Provide convenient, stress-free pet grooming services directly at customers' homes in ${e}. Cater to busy pet owners who value convenience and pets that experience anxiety in traditional grooming environments.`,difficulty:"Medium",profitability:"$1,500 - $4,000/month",cost:"$2,000 - $5,000 (Equipment, supplies, vehicle modifications)",metrics:{startupTime:"6-8 weeks",breakEven:"4-6 months",scalability:"High - Can add additional mobile units and groomers"},actionPlan:["Week 1: Research local pet demographics and competitors. Obtain necessary licenses and insurance.","Week 2: Purchase equipment and supplies. Set up booking and payment system.","Week 3: Create website and social media presence. Begin targeted marketing to pet owners.","Week 4: Offer promotional pricing for initial customers to build reviews and referrals."],resources:{tools:["Mobile grooming equipment","Scheduling software","Pet-friendly cleaning supplies"],platforms:["Instagram","NextDoor"],communities:[`${e} Pet Owners Association`,"Online Pet Groomers Network"]},monetization:["Basic grooming package: $65-85 per small dog, $85-120 per large dog","Premium spa packages: $100-150 including specialized treatments","Membership subscriptions: $50/month discount for recurring monthly appointments"],risks:[{challenge:"Vehicle and equipment maintenance issues",solution:"Establish relationships with reliable mechanics and keep backup equipment"},{challenge:"Handling difficult or aggressive pets",solution:"Obtain specialized training in animal behavior and implement clear policies for pet evaluation"}]},{name:`${e} Local Food Delivery Collective`,summary:`Create a cooperative delivery service exclusively for local, independent restaurants in ${e} that can't afford high fees from mainstream delivery apps. Provide fair pricing for restaurants and better compensation for drivers.`,difficulty:"Hard",profitability:"$2,000 - $6,000/month",cost:"$3,000 - $8,000 (App development, marketing, legal setup)",metrics:{startupTime:"10-12 weeks",breakEven:"8-10 months",scalability:"Medium - Limited to local market but can expand to neighboring areas"},actionPlan:["Week 1: Survey local restaurants about pain points with current delivery services. Begin legal formation of cooperative structure.","Week 2: Develop initial version of ordering platform or app. Begin recruiting delivery drivers.","Week 3: Onboard first 5-10 restaurant partners and conduct platform testing.","Week 4: Soft launch with limited service area and hours. Gather feedback for improvements."],resources:{tools:["Order management software","Route optimization tools","Payment processing system"],platforms:["Custom mobile app","Instagram"],communities:[`${e} Restaurant Association`,"Independent Restaurant Alliance"]},monetization:["Restaurant commission: 10-15% of order value (versus 25-35% from major apps)","Customer delivery fee: $3.99-5.99 based on distance","Premium membership option: $9.99/month for free delivery and priority service"],risks:[{challenge:"Competition from well-funded delivery apps",solution:"Emphasize local ownership, better restaurant economics, and community support in marketing"},{challenge:"Technology reliability issues",solution:"Implement backup systems and clear manual processes for when technical issues arise"}]}]}const scrollTopBtn=document.querySelector(".scroll-top-btn");function scrollToHustleOutput(){const e=document.getElementById("hustle-output");e&&e.scrollIntoView({behavior:"smooth",block:"start"})}async function reloadSectionFromGemini(e,t,n){const i={"action-plan":`Generate a detailed Action Plan (First Month) for the side hustle "${t}" in ${e}. Format EXACTLY like:\n    Action Plan (First Month):\n    Week 1: [specific milestone]\n    Week 2: [specific milestone]\n    Week 3: [specific milestone]\n    Week 4: [specific milestone]\n    Provide 4 specific, realistic milestones tailored to ${e}.`,monetization:`Generate a detailed Monetization plan for the side hustle "${t}" in ${e}. Format EXACTLY like:\n    Monetization:\n    1. [Primary revenue stream with detailed pricing]\n    2. [Secondary revenue stream with detailed pricing]\n    3. [Additional revenue stream with detailed pricing]\n    Provide 3 specific, realistic revenue streams tailored to ${e}.`,"risk-analysis":`Generate a detailed Risk Analysis for the side hustle "${t}" in ${e}. Format EXACTLY like:\n    Risk Analysis:\n    - Challenge: [specific issue] → Impact: [quantifiable effect]\n      Solution: [action 1] + [action 2] → Expected: [% improvement]\n    - Challenge: [specific issue] → Impact: [quantifiable effect]\n      Solution: [action 1] + [action 2] → Expected: [% improvement]\n    Provide 2 specific, realistic risks and solutions tailored to ${e}.`}[n];if(!i)throw new Error("Invalid section");const s=await fetch(`${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:i}]}],safetySettings:[{category:"HARM_CATEGORY_DANGEROUS_CONTENT",threshold:"BLOCK_ONLY_HIGH"}],generationConfig:{maxOutputTokens:500,temperature:1.2,topP:.9,topK:50}})});if(!s.ok)throw new Error(`API Error: ${s.status}`);const o=await s.json(),a=o?.candidates?.[0]?.content?.parts?.[0]?.text||"";switch(n){case"action-plan":return(a.match(/Week \d+:.*?(?=\n|$)/g)||[]).map((e=>e.trim()));case"monetization":return(a.match(/\d+\.\s*.*?(?=\n|$)/g)||[]).map((e=>e.replace(/^\d+\.\s*/,"").trim()));case"risk-analysis":
    const e=a.match(/Challenge:\s*(.*?)(?:\s*→\s*Impact:|$)/g)||[],
          impacts=a.match(/Impact:\s*(.*?)(?:\s*\n\s*Solution:|$)/g)||[],
          t=a.match(/Solution:\s*(.*?)(?:\s*→\s*Expected:|$)/g)||[],
          expected=a.match(/Expected:\s*(.*?)(?=\n|-|$)/g)||[];
    
    return e.map(((e,n)=>({
        challenge:e.replace(/Challenge:\s*/, "").replace(/\s*→\s*Impact:.*$/, "").trim(),
        impact: impacts[n]?.replace(/Impact:\s*/, "").trim() || "",
        solution:t[n]?.replace(/Solution:\s*/, "").replace(/\s*→\s*Expected:.*$/, "").trim()||"N/A",
        expected: expected[n]?.replace(/Expected:\s*/, "").trim() || ""
    })));
default:return[]}}

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

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
    // Initialize particles
    initParticles();
    
    // Clear and hide the hustle output on initial load
    const hustleOutput = document.getElementById("hustle-output");
    if (hustleOutput) {
        hustleOutput.innerHTML = "";
        hustleOutput.style.display = "none";
    }
    
    // Setup event listeners for main page
    setupMainPageListeners();
    
    // Check if we're on the saved hustles page
    const savedHustlesOutput = document.getElementById("saved-hustles-output");
    if (savedHustlesOutput) {
        loadSavedHustles();
    }
});

function setupMainPageListeners() {
    const cityInput = document.getElementById("city-input");
    const getHustleBtn = document.getElementById("get-hustle-btn");
    const cityBtns = document.querySelectorAll(".city-btn");
    
    if (!cityInput || !getHustleBtn) return; // Not on the main page
    
    // Prevent any form submission
    const searchForm = cityInput.closest('form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            return false;
        });
    }
    
    // Debounce the search button click
    let lastClickTime = 0;
    getHustleBtn.addEventListener("click", function(e) {
        e.preventDefault(); // Prevent any default actions
        
        // Debounce: ignore clicks that happen too quickly
        const now = Date.now();
        if (now - lastClickTime < 500) { // 500ms debounce time
            return;
        }
        lastClickTime = now;
        
        const cityName = cityInput.value.trim();
        if (cityName) {
            document.getElementById("hustle-output").style.display = "block";
            fetchHustleData(cityName);
        } else {
            showError("Please enter a city name");
            scrollToHustleOutput();
        }
    });
    
    cityBtns.forEach(btn => {
        btn.addEventListener("click", async function(e) {
            e.preventDefault(); // Prevent any default actions
            
            // If a search is already in progress, ignore
            if (window.searchInProgress) {
                return;
            }
            
            const originalText = this.textContent;
            cityBtns.forEach(b => {
                b.disabled = true;
                b.style.cursor = "not-allowed";
            });
            this.textContent = "Loading...";
            this.classList.add("loading");
            
            cityBtns.forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            
            const cityName = this.getAttribute("data-city");
            cityInput.value = cityName;
            
            try {
                document.getElementById("hustle-output").style.display = "block";
                await fetchHustleData(cityName);
                document.getElementById("hustle-output").scrollIntoView({behavior: "smooth"});
            } finally {
                this.textContent = originalText;
                this.classList.remove("loading");
                cityBtns.forEach(b => {
                    b.disabled = false;
                    b.style.cursor = "pointer";
                });
            }
        });
    });
    
    cityInput.addEventListener("keypress", async function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            // Don't trigger if a search is already in progress
            if (!window.searchInProgress) {
                document.getElementById("get-hustle-btn").click();
                scrollToHustleOutput();
            }
        }
    });
}

// Function to load and display saved hustles
function loadSavedHustles() {
    const savedHustlesOutput = document.getElementById("saved-hustles-output");
    const savedHustles = localStorage.getItem("savedHustles") ? 
        JSON.parse(localStorage.getItem("savedHustles")) : [];
    
    if (savedHustles.length === 0) {
        savedHustlesOutput.innerHTML = `
            <div class="no-saved-hustles">
                <p>You haven't saved any hustles yet!</p>
                <a href="index.html" class="back-to-home">Find hustles to save</a>
            </div>
        `;
        return;
    }
    
    // Create container for the cards
    const cardsContainer = document.createElement("div");
    cardsContainer.className = "hustle-cards-container";
    savedHustlesOutput.appendChild(cardsContainer);
    
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
    savedHustlesOutput.insertBefore(filterContainer, cardsContainer);
    
    // Render the saved hustles
    renderFilteredHustles(savedHustles, cardsContainer, savedHustles);
    
    // Setup event listener for difficulty filter
    document.getElementById("difficulty-filter").addEventListener("change", function() {
        const selectedDifficulty = this.value;
        
        let filteredHustles = selectedDifficulty === "all" ? 
            savedHustles : 
            savedHustles.filter(hustle => hustle.difficulty.toLowerCase() === selectedDifficulty);
        
        renderFilteredHustles(filteredHustles, cardsContainer, savedHustles);
        setupSavedHustlesEventListeners(savedHustles);
    });
    
    // Setup event listeners for the cards
    setupSavedHustlesEventListeners(savedHustles);
}

// Function to set up event listeners for saved hustles
function setupSavedHustlesEventListeners(hustlesArray) {
    // Set up copy button event listeners
    document.querySelectorAll(".copy-hustle-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            const index = parseInt(this.getAttribute("data-hustle-index"));
            const hustle = hustlesArray[index];
            if (hustle) {
                const copyText = formatHustleForCopy(hustle);
                navigator.clipboard.writeText(copyText).then(() => {
                    const originalHTML = this.innerHTML;
                    this.classList.add("copied");
                    this.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Copied!
                    `;
                    setTimeout(() => {
                        this.innerHTML = originalHTML;
                        this.classList.remove("copied");
                    }, 2000);
                }).catch(error => {
                    console.error("Failed to copy text: ", error);
                });
            }
        });
    });
    
    // Set up share button event listeners
    document.querySelectorAll('.share-hustle-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-hustle-index'));
            const hustle = hustlesArray[index];
            
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
                            const originalHTML = button.innerHTML;
                            button.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Copied!
                            `;
                            setTimeout(() => {
                                button.innerHTML = originalHTML;
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
    
    // Set up delete button event listeners
    document.querySelectorAll(".delete-hustle-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            const index = parseInt(this.getAttribute("data-hustle-index"));
            const hustle = hustlesArray[index];
            
            if (hustle && confirm(`Are you sure you want to delete "${hustle.name}"?`)) {
                // Remove hustle from array
                const savedHustles = localStorage.getItem("savedHustles") ? 
                    JSON.parse(localStorage.getItem("savedHustles")) : [];
                
                const updatedHustles = savedHustles.filter(h => h.name !== hustle.name);
                localStorage.setItem("savedHustles", JSON.stringify(updatedHustles));
                
                // Reload the page to refresh the list
                window.location.reload();
            }
        });
    });
}

// Function to render hustles based on filter
function renderFilteredHustles(filteredHustles, container, allHustles) {
    // Clear container
    container.innerHTML = "";
    
    // If no hustles match the filter, show a message
    if (filteredHustles.length === 0) {
        container.innerHTML = `
            <div class="missing-section" style="width: 100%;">
                <p class="missing-text">No hustles found with the selected difficulty</p>
            </div>
        `;
        return;
    }
    
    // Determine if we're on the saved hustles page
    const isOnSavedPage = document.getElementById("saved-hustles-output") !== null;
    
    // Create cards for each filtered hustle
    filteredHustles.forEach(hustle => {
        // Normalize difficulty to lowercase
        const normalizedDifficulty = hustle.difficulty.toLowerCase();
        
        const card = document.createElement("div");
        card.className = "hustle-card";
        card.setAttribute("data-difficulty", normalizedDifficulty);
        
        // Generate different HTML for saved page (with delete button)
        if (isOnSavedPage) {
            card.innerHTML = createSavedCardHTML(hustle, allHustles);
        } else {
            card.innerHTML = createCardHTML(hustle, allHustles);
        }
        
        container.appendChild(card);
    });
}

// Function to create saved card HTML with delete button
function createSavedCardHTML(hustle, hustlesArray) {
    const hustleIndex = hustlesArray.indexOf(hustle);
    
    // Classify hustle for tags
    const physicalDigital = classifyPhysicalDigital(hustle);
    const businessCustomer = classifyBusinessCustomer(hustle);
    
    return `
        <div class="copy-button-container">
            <button class="copy-hustle-btn" data-hustle-index="${hustleIndex}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
            </button>
            <button class="share-hustle-btn" data-hustle-index="${hustleIndex}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                Share
            </button>
            <button class="delete-hustle-btn" data-hustle-index="${hustleIndex}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                Delete
            </button>
        </div>
        <h3>${hustle.name.replace(/['"*\n]/g, " ").trim()}</h3>
        <div class="hustle-tags">
            <span class="hustle-diversity-tag tag-${physicalDigital}">${physicalDigital}</span>
            <span class="hustle-diversity-tag tag-${businessCustomer}">${businessCustomer.toUpperCase()}</span>
        </div>
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
            
            <div class="action-plan-section">
                <h4>Action Plan (First Month)</h4>
                <div class="timeline">
                    ${hustle.actionPlan.map(((plan, planIndex) => `
                        <div class="timeline-item">
                            <div class="timeline-marker">S${planIndex + 1}</div>
                            <div class="timeline-content">${plan}</div>
                        </div>
                    `)).join("")}
                </div>
            </div>
            
            <div class="resources-section">
                <h4>Resources</h4>
                <div class="resources-grid">
                    <div class="resource-item">
                        <strong>🛠️ Tools:</strong>
                        <ul>${hustle.resources.tools.map((tool => `<li>${tool}</li>`)).join("")}</ul>
                    </div>
                    <div class="resource-item">
                        <strong>💻 Platforms:</strong>
                        <ul>${hustle.resources.platforms.map((platform => `<li>${platform}</li>`)).join("")}</ul>
                    </div>
                    <div class="resource-item">
                        <strong>👥 Communities:</strong>
                        <ul>${hustle.resources.communities.map((community => `<li>${community}</li>`)).join("")}</ul>
                    </div>
                </div>
            </div>
            
            <div class="monetization-section">
                <h4>Monetization Streams</h4>
                <div class="monetization-list">
                    ${hustle.monetization.map(((stream, streamIndex) => `
                        <div class="monetization-item">
                            <span class="monetization-number">${streamIndex + 1}</span>
                            <span class="monetization-content">${stream}</span>
                        </div>
                    `)).join("")}
                </div>
            </div>
            
            <div class="risks-section">
                <h4>Risk Analysis</h4>
                ${hustle.risks.map((risk => `
                    <div class="risk-item">
                        <div class="risk-challenge">
                            <strong>⚠️ Challenge:</strong> ${risk.challenge}
                        </div>
                        ${risk.impact ? `<div class="risk-impact"><strong>📊 Impact:</strong> ${risk.impact}</div>` : ''}
                        <div class="risk-solution">
                            <strong>💡 Solution:</strong> ${risk.solution}
                        </div>
                        ${risk.expected ? `<div class="risk-expected"><strong>📈 Expected:</strong> ${risk.expected}</div>` : ''}
                    </div>
                `)).join("")}
            </div>
        </div>
    `;
}

// Function to simulate progress bar updates
function updateProgressBar() {
    const progressFill = document.querySelector('.progress-fill');
    if (!progressFill) return;
    
    // Reset the progress bar to 0%
    progressFill.style.width = '0%';
    
    // For mobile, use a smoother animation with smaller increments
    const isMobile = window.innerWidth <= 768;
    const incrementSize = isMobile ? 10 : 20;
    const intervalTime = isMobile ? 700 : 1000;
    
    // Start with lower progress on mobile for a more gradual feeling
    let progress = isMobile ? 5 : 0;
    
    const interval = setInterval(() => {
        progress += incrementSize;
        
        if (progress > 100) {
            progress = 100;
            clearInterval(interval);
        }
        
        progressFill.style.width = `${progress}%`;
        
        // Add pulsing effect for mobile after 50% progress
        if (isMobile && progress >= 50 && !progressFill.classList.contains('pulsing')) {
            progressFill.style.animation = 'pulse-animation 1.5s infinite';
        }
        
        // Clear interval after reaching 100%
        if (progress >= 100) {
            clearInterval(interval);
            window.progressInterval = null;
        }
    }, intervalTime);
    
    // Store the interval ID so it can be cleared if needed
    window.progressInterval = interval;
}

// Function to repair incomplete risk solutions by adding missing details
async function repairIncompleteRisks(incompleteSolution, city) {
  // Only attempt to repair if the solution seems incomplete
  if (!incompleteSolution || incompleteSolution.includes(" → Expected:")) {
    return null;
  }
  
  try {
    // Create a prompt to fix the incomplete solution
    const prompt = `
    The following risk solution for a side hustle in ${city} is incomplete:
    "${incompleteSolution.trim()}"
    
    Please provide ONLY the missing part to complete this solution with the format:
    " → Expected: [% improvement]"
    
    For example:
    " → Expected: 85% reduction in customer acquisition cost"
    
    Keep it concise, specific, and directly related to the solution provided.
    `;
    
    const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }],
        generationConfig: {
          maxOutputTokens: 100,
          temperature: 0.3
        }
      })
    });
    
    if (!response.ok) return null;
    
    const result = await response.json();
    const fixedText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Extract just the expected outcome part
    const expectedMatch = fixedText.match(/→\s*Expected:\s*[^"]+/);
    return expectedMatch ? expectedMatch[0] : null;
  } catch (error) {
    console.error("Error repairing risk solution:", error);
    return null;
  }
}

// Function to set up event listeners for hustle cards
function setupHustleCardListeners(hustles) {
    if (!hustles || !Array.isArray(hustles)) {
        console.error("Cannot setup hustle card listeners: hustles is undefined or not an array");
        return;
    }

    // Set up copy button event listeners
    document.querySelectorAll(".copy-hustle-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            const index = parseInt(this.getAttribute("data-hustle-index"));
            const hustle = hustles[index];
            if (hustle) {
                const copyText = formatHustleForCopy(hustle);
                navigator.clipboard.writeText(copyText).then(() => {
                    const originalHTML = this.innerHTML;
                    this.classList.add("copied");
                    this.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Copied!
                    `;
                    setTimeout(() => {
                        this.innerHTML = originalHTML;
                        this.classList.remove("copied");
                    }, 2000);
                }).catch(error => {
                    console.error("Failed to copy text: ", error);
                });
            }
        });
    });
    
    // Set up save button event listeners
    document.querySelectorAll(".save-hustle-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            const index = parseInt(this.getAttribute("data-hustle-index"));
            const hustle = hustles[index];
            
            if (hustle) {
                // Get current saved hustles
                const savedHustles = localStorage.getItem("savedHustles") ? 
                    JSON.parse(localStorage.getItem("savedHustles")) : [];
                
                // Check if this hustle is already saved
                const isAlreadySaved = savedHustles.some(saved => saved.name === hustle.name);
                
                if (isAlreadySaved) {
                    // If already saved, remove it
                    const updatedHustles = savedHustles.filter(saved => saved.name !== hustle.name);
                    localStorage.setItem("savedHustles", JSON.stringify(updatedHustles));
                    
                    // Update button UI
                    this.classList.remove("saved");
                    this.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Save
                    `;
                } else {
                    // If not saved yet, add it
                    savedHustles.push(hustle);
                    localStorage.setItem("savedHustles", JSON.stringify(savedHustles));
                    
                    // Update button UI
                    this.classList.add("saved");
                    this.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Saved
                    `;
                }
            }
        });
    });
    
    // Set up share button event listeners
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
                            const originalHTML = button.innerHTML;
                            button.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Copied!
                            `;
                            setTimeout(() => {
                                button.innerHTML = originalHTML;
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

// Function to format hustle data for copying
function formatHustleForCopy(hustle) {
    if (!hustle) return "";
    
    return `
${hustle.name}

${hustle.summary}

Difficulty: ${hustle.difficulty}
Profitability: ${hustle.profitability}
Cost: ${hustle.cost}

Key Metrics:
- Startup Time: ${hustle.metrics.startupTime}
- Break-even Point: ${hustle.metrics.breakEven}
- Scalability: ${hustle.metrics.scalability}

Action Plan (First Month):
${hustle.actionPlan.map((plan, i) => `Week ${i+1}: ${plan}`).join('\n')}

Resources:
- Tools: ${hustle.resources.tools.join(', ')}
- Platforms: ${hustle.resources.platforms.join(', ')}
- Communities: ${hustle.resources.communities.join(', ')}

Monetization:
${hustle.monetization.map((stream, i) => `${i+1}. ${stream}`).join('\n')}

Risk Analysis:
${hustle.risks.map(risk => `- Challenge: ${risk.challenge}
  Impact: ${risk.impact || 'N/A'}
  Solution: ${risk.solution}
  Expected: ${risk.expected || 'N/A'}`).join('\n')}
`;
}

// Function to create standard card HTML
function createCardHTML(hustle, hustlesArray) {
    const hustleIndex = hustlesArray.indexOf(hustle);
    
    // Classify hustle for tags
    const physicalDigital = classifyPhysicalDigital(hustle);
    const businessCustomer = classifyBusinessCustomer(hustle);
    
    // Check if the hustle is already saved
    let savedHustles = JSON.parse(localStorage.getItem('savedHustles') || '[]');
    const isAlreadySaved = savedHustles.some(saved => saved.name === hustle.name);
    
    return `
        <div class="copy-button-container">
            <button class="copy-hustle-btn" data-hustle-index="${hustleIndex}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
            </button>
            <button class="save-hustle-btn ${isAlreadySaved ? 'saved' : ''}" data-hustle-index="${hustleIndex}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${isAlreadySaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                ${isAlreadySaved ? 'Saved' : 'Save'}
            </button>
            <button class="share-hustle-btn" data-hustle-index="${hustleIndex}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                Share
            </button>
        </div>
        <h3>${hustle.name.replace(/['"*\n]/g, " ").trim()}</h3>
        <div class="hustle-tags">
            <span class="hustle-diversity-tag tag-${physicalDigital}">${physicalDigital}</span>
            <span class="hustle-diversity-tag tag-${businessCustomer}">${businessCustomer.toUpperCase()}</span>
        </div>
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
            
            <div class="action-plan-section">
                <h4>Action Plan (First Month)</h4>
                <div class="timeline">
                    ${hustle.actionPlan.map(((plan, planIndex) => `
                        <div class="timeline-item">
                            <div class="timeline-marker">S${planIndex + 1}</div>
                            <div class="timeline-content">${plan}</div>
                        </div>
                    `)).join("")}
                </div>
            </div>
            
            <div class="resources-section">
                <h4>Resources</h4>
                <div class="resources-grid">
                    <div class="resource-item">
                        <strong>🛠️ Tools:</strong>
                        <ul>${hustle.resources.tools.map((tool => `<li>${tool}</li>`)).join("")}</ul>
                    </div>
                    <div class="resource-item">
                        <strong>💻 Platforms:</strong>
                        <ul>${hustle.resources.platforms.map((platform => `<li>${platform}</li>`)).join("")}</ul>
                    </div>
                    <div class="resource-item">
                        <strong>👥 Communities:</strong>
                        <ul>${hustle.resources.communities.map((community => `<li>${community}</li>`)).join("")}</ul>
                    </div>
                </div>
            </div>
            
            <div class="monetization-section">
                <h4>Monetization Streams</h4>
                <div class="monetization-list">
                    ${hustle.monetization.map(((stream, streamIndex) => `
                        <div class="monetization-item">
                            <span class="monetization-number">${streamIndex + 1}</span>
                            <span class="monetization-content">${stream}</span>
                        </div>
                    `)).join("")}
                </div>
            </div>
            
            <div class="risks-section">
                <h4>Risk Analysis</h4>
                ${hustle.risks.map((risk => `
                    <div class="risk-item">
                        <div class="risk-challenge">
                            <strong>⚠️ Challenge:</strong> ${risk.challenge}
                        </div>
                        ${risk.impact ? `<div class="risk-impact"><strong>📊 Impact:</strong> ${risk.impact}</div>` : ''}
                        <div class="risk-solution">
                            <strong>💡 Solution:</strong> ${risk.solution}
                        </div>
                        ${risk.expected ? `<div class="risk-expected"><strong>📈 Expected:</strong> ${risk.expected}</div>` : ''}
                    </div>
                `)).join("")}
            </div>
        </div>
    `;
}

// Update the function that shows loading state in hustle output
function showHustleLoading(city) {
    const hustleOutput = document.getElementById('hustle-output');
    hustleOutput.style.display = 'block';
    hustleOutput.innerHTML = `
        <div class="loading" aria-live="polite">
            <div>
                Scanning <span class="scanning-text">hustle opportunities</span> in 
                <span id="loading-city">${city}</span><span class="scanning-dots"></span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
        </div>
        <p class="loading-subtext">Analyzing local markets and demographics...</p>
    `;
    
    // Start progress bar animation
    setTimeout(() => {
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = '30%';
        }
    }, 500);
    
    setTimeout(() => {
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = '70%';
        }
    }, 1500);
}

// After the DOMContentLoaded event listener section, add a function to handle mobile menu scrolling

// Store scroll position when menu opens
let scrollPosition = 0;

// Mobile menu setup with improved event handling
function setupMobileMenu() {
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    let scrollPosition = 0;

    if (!menuToggle || !navLinks) return;

    menuToggle.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event bubbling
        this.classList.toggle('is-active');
        navLinks.classList.toggle('active');
        
        // Toggle body scroll
        if (navLinks.classList.contains('active')) {
            scrollPosition = window.scrollY;
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            window.scrollTo(0, scrollPosition);
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (navLinks.classList.contains('active') && 
            !navLinks.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('is-active');
            document.body.style.overflow = '';
            window.scrollTo(0, scrollPosition);
        }
    });
}

// Call the function when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupMobileMenu();
    // ... other existing code ...
});

// Add this function to fetch featured hustles from Gemini API
async function loadFeaturedHustles() {
    const inspirationSection = document.getElementById('inspiration-section');
    if (!inspirationSection) return;
    
    const cardsContainer = inspirationSection.querySelector('.inspiration-cards-container');
    if (!cardsContainer) return;
    
    try {
        // Try to fetch featured hustles from Gemini API
        const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "Generate 3 brief hustle ideas in this EXACT format (nothing before or after):\n" +
                              "1. Hustle: [hustle name]\n" +
                              "   Location: [random major city]\n" +
                              "   Description: [single short sentence]\n" +
                              "   Icon: [one of: camera, map-pin, code, paint, coffee, book, truck, leaf, music]\n\n" +
                              "2. Hustle: [hustle name]\n" +
                              "   Location: [different random major city]\n" +
                              "   Description: [single short sentence]\n" +
                              "   Icon: [one of: camera, map-pin, code, paint, coffee, book, truck, leaf, music]\n\n" +
                              "3. Hustle: [hustle name]\n" +
                              "   Location: [different random major city]\n" +
                              "   Description: [single short sentence]\n" +
                              "   Icon: [one of: camera, map-pin, code, paint, coffee, book, truck, leaf, music]"
                    }]
                }],
                safetySettings: [{
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_ONLY_HIGH"
                }],
                generationConfig: {
                    maxOutputTokens: 250,
                    temperature: 1.0,
                    topP: 0.9,
                    topK: 40
                }
            })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const data = await response.json();
        const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        // Parse the response
        const hustleItems = textResponse.split(/\d+\.\s+/).filter(item => item.trim().length > 0);
        
        if (hustleItems && hustleItems.length > 0) {
            // Clear existing cards
            cardsContainer.innerHTML = '';
            
            // Process each hustle idea
            hustleItems.forEach(item => {
                const hustleMatch = item.match(/Hustle:\s*(.+?)(?:\n|$)/);
                const locationMatch = item.match(/Location:\s*(.+?)(?:\n|$)/);
                const descriptionMatch = item.match(/Description:\s*(.+?)(?:\n|$)/);
                const iconMatch = item.match(/Icon:\s*(.+?)(?:\n|$)/);
                
                if (hustleMatch && locationMatch && descriptionMatch) {
                    const hustleName = hustleMatch[1].trim();
                    const location = locationMatch[1].trim();
                    const description = descriptionMatch[1].trim();
                    const icon = (iconMatch && iconMatch[1].trim()) || "camera";
                    
                    // Create card with the data
                    createFeaturedHustleCard(hustleName, location, description, icon, cardsContainer);
                }
            });
            
            // Add click handlers to the cards
            setupFeaturedHustleCardListeners();
        } else {
            throw new Error("Failed to parse featured hustles");
        }
    } catch (error) {
        console.warn("Failed to load featured hustles:", error);
        // Fallback to placeholder hustles - keep existing content
    }
}

// Function to create a featured hustle card
function createFeaturedHustleCard(hustleName, location, description, iconType, container) {
    // Define icon SVG based on iconType
    let iconSvg = '';
    
    switch (iconType.toLowerCase()) {
        case 'camera':
            iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
            break;
        case 'map-pin':
            iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 11l0 6"></path><path d="M12 7l0-1"></path></svg>';
            break;
        case 'code':
            iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>';
            break;
        case 'paint':
            iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>';
            break;
        case 'coffee':
            iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><line x1="6" y1="2" x2="6" y2="4"></line><line x1="10" y1="2" x2="10" y2="4"></line><line x1="14" y1="2" x2="14" y2="4"></line></svg>';
            break;
        case 'book':
            iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>';
            break;
        case 'truck':
            iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"></path><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L16 6h-4v11h3"></path><circle cx="7.5" cy="17.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>';
            break;
        case 'leaf':
            iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22c1.25-1.25 2.5-2.5 3.5-4.5 1.17 2.25 2.92 3.5 5 4 2.97.7 6.14.56 9-1.5C15 16 11.5 9.5 9.5 6.5c-1.5 3.5-2 7-1.5 10.5-2.5-2.5-2.5-6.5-1.5-9.5-1.5 1.5-3.5 3.5-5 6.5-.5-1.5-1-4.5-2.5-7.5C.5 16 1 19.5 2 22z"/></svg>';
            break;
        case 'music':
            iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/><path d="M20 2v10c0 1.1-.9 2-2 2h-1l-6-4H5.5C4.12 10 3 8.88 3 7.5S4.12 5 5.5 5H10l6-3h2c1.1 0 2 .9 2 2z"/></svg>';
            break;
        default:
            iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
    }
    
    // Create the card HTML
    const cardDiv = document.createElement('div');
    cardDiv.className = 'inspiration-card';
    cardDiv.setAttribute('data-hustle-name', hustleName);
    cardDiv.setAttribute('data-location', location);
    cardDiv.setAttribute('data-description', description);
    
    cardDiv.innerHTML = `
        <div class="inspiration-card-icon">
            ${iconSvg}
        </div>
        <div class="inspiration-card-content">
            <h4>${hustleName}</h4>
            <p>in ${location}</p>
            <span>${description}</span>
        </div>
    `;
    
    // Add the card to the container
    container.appendChild(cardDiv);
}

// Set up click listeners for featured hustle cards
function setupFeaturedHustleCardListeners() {
    const cards = document.querySelectorAll('.inspiration-card');
    const popupOverlay = document.getElementById('hustle-popup-overlay');
    const popupContent = document.querySelector('.hustle-popup-content');
    const closeBtn = document.querySelector('.popup-close-btn');
    
    // Close popup when clicking the close button
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            popupOverlay.classList.remove('active');
            // Enable body scroll
            document.body.style.overflow = '';
        });
    }
    
    // Close popup when clicking outside the popup
    if (popupOverlay) {
        popupOverlay.addEventListener('click', (e) => {
            if (e.target === popupOverlay) {
                popupOverlay.classList.remove('active');
                // Enable body scroll
                document.body.style.overflow = '';
            }
        });
    }
    
    cards.forEach(card => {
        card.addEventListener('click', async function() {
            const hustleName = this.getAttribute('data-hustle-name');
            const location = this.getAttribute('data-location');
            const description = this.getAttribute('data-description');
            
            // Show loading state in the popup
            if (popupContent) {
                popupContent.innerHTML = `
                    <div class="loading-spinner" style="margin: 40px auto; text-align: center;">
                        <div class="loader-circle"></div>
                        <p>Loading hustle details for "${hustleName}" in ${location}...</p>
                    </div>
                `;
                
                // Show the popup
                popupOverlay.classList.add('active');
                // Disable body scroll when popup is open
                document.body.style.overflow = 'hidden';
            }
            
            try {
                // More structured prompt with clear formatting instructions
                const hustlePrompt = `Create a complete hustle opportunity profile for "${hustleName}" in ${location}. 
Brief description: ${description || "A local business opportunity"}

Follow this EXACT format with NO DEVIATIONS:

Name: ${hustleName}

Executive Summary: 
[2-3 sentences describing the hustle in detail]

Difficulty: [Easy/Medium/Hard]

Profitability: [$X-$Y/month]

Cost: [$Z initial investment (what this covers)]

Key Metrics:
Startup Time: [X-Y weeks/months]
Break-even Point: [X-Y months]
Scalability: [Low/Medium/High - brief explanation]

Action Plan (First Month):
Week 1: [specific action]
Week 2: [specific action]
Week 3: [specific action]
Week 4: [specific action]

Resources:
Tools: [tool 1], [tool 2], [tool 3]
Platforms: [platform 1], [platform 2]
Communities: [community 1], [community 2]

Monetization:
1. [primary revenue stream with pricing]
2. [secondary revenue stream with pricing]
3. [tertiary revenue stream with pricing]

Risk Analysis:
- Challenge: [specific issue]
  Solution: [specific approach]
- Challenge: [specific issue]
  Solution: [specific approach]`;
                
                // Call Gemini API to get the full hustle details
                const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: hustlePrompt }]
                        }],
                        safetySettings: [{
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_ONLY_HIGH"
                        }],
                        generationConfig: {
                            maxOutputTokens: 1024,
                            temperature: 0.7,
                            topP: 0.9,
                            topK: 40
                        }
                    })
                });

                if (!response.ok) throw new Error(`API Error: ${response.status}`);
                
                const data = await response.json();
                const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                
                // Parse the response into a hustle object
                const hustle = parseHustleText(textResponse);
                
                // Render the hustle in the popup
                renderHustleInPopup(hustle, location);
                
            } catch (error) {
                console.error("Failed to load full hustle details:", error);
                
                // Fallback: Create a generic hustle based on the card data
                const fallbackHustle = createFallbackHustleFromCard(hustleName, location, this.getAttribute('data-description'));
                
                // Render the fallback hustle in the popup
                renderHustleInPopup(fallbackHustle, location);
            }
        });
    });
}

// Render hustle details in the popup
function renderHustleInPopup(hustle, location) {
    const popupContent = document.querySelector('.hustle-popup-content');
    if (!popupContent) return;
    
    // Create the HTML content for the popup
    let html = `
        <div class="popup-hustle-card">
            <div class="popup-hustle-header">
                <h2 id="popup-title">${hustle.name || 'Hustle Opportunity'}</h2>
                <div class="popup-hustle-location">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        <circle cx="12" cy="7" r="1"></circle>
                    </svg>
                    ${location || 'Location not specified'}
                </div>
                <div class="popup-hustle-summary">${hustle.summary || 'A unique business opportunity with growth potential.'}</div>
                <div class="popup-hustle-metrics">
                    <div class="popup-metric">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                        <span><strong>Difficulty:</strong> ${hustle.difficulty || 'Medium'}</span>
                    </div>
                    <div class="popup-metric">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="1" x2="12" y2="23"></line>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                        <span><strong>Profit:</strong> ${hustle.profitability || '$500-$2000/month'}</span>
                    </div>
                    <div class="popup-metric">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                        <span><strong>Cost:</strong> ${hustle.cost || '$200-$1000 (initial setup)'}</span>
                    </div>
                </div>
            </div>
            <div class="popup-hustle-body">
                <div class="popup-section">
                    <h3>Key Metrics</h3>
                    <div class="popup-resources">
                        <div class="popup-resource-item">
                            <strong>Startup Time</strong>
                            <p>${hustle.metrics?.startupTime || '4-6 weeks'}</p>
                        </div>
                        <div class="popup-resource-item">
                            <strong>Break-even Point</strong>
                            <p>${hustle.metrics?.breakEven || '3-6 months'}</p>
                        </div>
                        <div class="popup-resource-item">
                            <strong>Scalability</strong>
                            <p>${hustle.metrics?.scalability || 'Medium - Can grow with additional resources'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="popup-section">
                    <h3>Action Plan (First Month)</h3>
                    <div class="popup-timeline">
                        ${hustle.actionPlan && hustle.actionPlan.length > 0 ? 
                            hustle.actionPlan.map((plan, index) => `
                                <div class="popup-timeline-item">
                                    <div class="popup-timeline-marker">${index + 1}</div>
                                    <div class="popup-timeline-content">${plan}</div>
                                </div>
                            `).join('') : 
                            '<div class="empty-message">No action plan available</div>'
                        }
                    </div>
                </div>
                
                <div class="popup-section">
                    <h3>Resources</h3>
                    <div class="popup-resources">
                        <div class="popup-resource-item">
                            <strong>🛠️ Tools</strong>
                            <ul>
                                ${hustle.resources?.tools && hustle.resources.tools.length > 0 ? 
                                    hustle.resources.tools.map(tool => `<li>${tool}</li>`).join('') :
                                    '<li>Basic equipment</li><li>Social media management tools</li>'
                                }
                            </ul>
                        </div>
                        <div class="popup-resource-item">
                            <strong>💻 Platforms</strong>
                            <ul>
                                ${hustle.resources?.platforms && hustle.resources.platforms.length > 0 ? 
                                    hustle.resources.platforms.map(platform => `<li>${platform}</li>`).join('') :
                                    '<li>Social media</li><li>Local online marketplace</li>'
                                }
                            </ul>
                        </div>
                        <div class="popup-resource-item">
                            <strong>👥 Communities</strong>
                            <ul>
                                ${hustle.resources?.communities && hustle.resources.communities.length > 0 ? 
                                    hustle.resources.communities.map(community => `<li>${community}</li>`).join('') :
                                    '<li>Local business network</li><li>Online entrepreneur forums</li>'
                                }
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="popup-section">
                    <h3>Monetization Streams</h3>
                    <div class="popup-monetization">
                        ${hustle.monetization && hustle.monetization.length > 0 ? 
                            hustle.monetization.map((stream, index) => `
                                <div class="popup-monetization-item">
                                    <div class="popup-monetization-number">${index + 1}</div>
                                    <div class="popup-monetization-content">${stream}</div>
                                </div>
                            `).join('') :
                            '<div class="empty-message">Monetization details not available</div>'
                        }
                    </div>
                </div>
                
                <div class="popup-section">
                    <h3>Risk Analysis</h3>
                    <div class="popup-risks">
                        ${hustle.risks && hustle.risks.length > 0 ? 
                            hustle.risks.map(risk => `
                                <div class="popup-risk-item">
                                    <div class="popup-risk-challenge">
                                        <strong>⚠️ Challenge:</strong> ${risk.challenge || 'Market competition'}
                                    </div>
                                    ${risk.impact ? `<div class="popup-risk-impact"><strong>📊 Impact:</strong> ${risk.impact}</div>` : ''}
                                    <div class="popup-risk-solution">
                                        <strong>💡 Solution:</strong> ${risk.solution || 'Develop a unique value proposition'}
                                    </div>
                                    ${risk.expected ? `<div class="popup-risk-expected"><strong>📈 Expected:</strong> ${risk.expected}</div>` : ''}
                                </div>
                            `).join('') :
                            '<div class="empty-message">Risk analysis not available</div>'
                        }
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <button class="save-popup-hustle-btn" style="background: var(--primary-color); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Save This Hustle
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Set the HTML content
    popupContent.innerHTML = html;
    
    // Add event listener to save button
    const saveButton = popupContent.querySelector('.save-popup-hustle-btn');
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            // Save hustle to local storage
            saveHustle(hustle);
            
            // Update button
            this.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                Saved!
            `;
            this.style.background = 'var(--success-color)';
        });
    }
}

// Save hustle to local storage
function saveHustle(hustle) {
    try {
        // Get existing saved hustles
        let savedHustles = JSON.parse(localStorage.getItem('savedHustles') || '[]');
        
        // Check if hustle already exists
        const hustleExists = savedHustles.some(saved => saved.name === hustle.name);
        
        // If it doesn't exist, add it
        if (!hustleExists) {
            savedHustles.push(hustle);
            localStorage.setItem('savedHustles', JSON.stringify(savedHustles));
        }
    } catch (error) {
        console.error('Error saving hustle:', error);
    }
}

// Parse hustle text from Gemini API response
function parseHustleText(text) {
    // Create an empty hustle object
    const hustle = {
        name: "",
        summary: "",
        difficulty: "",
        profitability: "",
        cost: "",
        metrics: {
            startupTime: "",
            breakEven: "",
            scalability: ""
        },
        actionPlan: [],
        resources: {
            tools: [],
            platforms: [],
            communities: []
        },
        monetization: [],
        risks: []
    };
    
    // Check if we have valid response text
    if (!text || text.trim().length === 0) {
        console.error("Empty or invalid text response from API");
        return hustle;
    }
    
    console.log("Raw text from API:", text.substring(0, 100) + "..."); // Debug logging
    
    // Extract data with regex - improved patterns for better matching
    const nameMatch = text.match(/Name:\s*(.+?)(?=\n|Executive|$)/i);
    if (nameMatch) hustle.name = nameMatch[1].trim();
    
    const summaryMatch = text.match(/Executive Summary:\s*(.+?)(?=\n\s*Difficulty|Difficulty:|$)/is);
    if (summaryMatch) hustle.summary = summaryMatch[1].trim();
    
    const difficultyMatch = text.match(/Difficulty:\s*(.+?)(?=\n\s*Profitability|Profitability:|$)/i);
    if (difficultyMatch) hustle.difficulty = difficultyMatch[1].trim();
    
    const profitabilityMatch = text.match(/Profitability:\s*(.+?)(?=\n\s*Cost|Cost:|$)/i);
    if (profitabilityMatch) hustle.profitability = profitabilityMatch[1].trim();
    
    const costMatch = text.match(/Cost:\s*(.+?)(?=\n\s*Key Metrics|Key Metrics:|$)/i);
    if (costMatch) hustle.cost = costMatch[1].trim();
    
    // Extract metrics - improved pattern to better handle multiline content
    const metricsSection = text.match(/Key Metrics:(.+?)(?=\n\s*Action Plan|Action Plan \(First Month\):|$)/is);
    if (metricsSection) {
        const metrics = metricsSection[1];
        console.log("Metrics section:", metrics); // Debug logging
        
        const startupMatch = metrics.match(/Startup Time:\s*(.+?)(?=\n\s*Break-even|Break-even Point:|$)/i);
        if (startupMatch) hustle.metrics.startupTime = startupMatch[1].trim();
        
        const breakEvenMatch = metrics.match(/Break-even Point:\s*(.+?)(?=\n\s*Scalability|Scalability:|$)/i);
        if (breakEvenMatch) hustle.metrics.breakEven = breakEvenMatch[1].trim();
        
        const scalabilityMatch = metrics.match(/Scalability:\s*(.+?)(?=\n\n|$)/is);
        if (scalabilityMatch) hustle.metrics.scalability = scalabilityMatch[1].trim();
    }
    
    // Extract action plan - improved to handle different formatting
    const actionPlanSection = text.match(/Action Plan \(?First Month\)?:(.+?)(?=\n\s*Resources|Resources:|$)/is);
    if (actionPlanSection) {
        const actionPlan = actionPlanSection[1];
        console.log("Action Plan section:", actionPlan.substring(0, 100) + "..."); // Debug logging
        
        // Match both Week X: format and numbered list format (1., 2., etc.)
        const weekActions = actionPlan.match(/(?:Week \d+:|^\d+\.)\s*.*?(?=\n\s*(?:Week \d+:|^\d+\.)|$)/gm);
        if (weekActions && weekActions.length > 0) {
            hustle.actionPlan = weekActions.map(action => action.trim());
        } else {
            // Fallback to simpler line-by-line extraction if no week pattern is found
            const lines = actionPlan.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            if (lines.length > 0) hustle.actionPlan = lines;
        }
    }
    
    // Extract resources - improved to handle different formatting
    const resourcesSection = text.match(/Resources:(.+?)(?=\n\s*Monetization|Monetization:|$)/is);
    if (resourcesSection) {
        const resources = resourcesSection[1];
        console.log("Resources section:", resources.substring(0, 100) + "..."); // Debug logging
        
        const toolsMatch = resources.match(/Tools:\s*(.+?)(?=\n\s*Platforms|Platforms:|$)/i);
        if (toolsMatch) {
            hustle.resources.tools = toolsMatch[1]
                .split(/,|\n/)
                .map(tool => tool.trim())
                .filter(tool => tool.length > 0);
        }
        
        const platformsMatch = resources.match(/Platforms:\s*(.+?)(?=\n\s*Communities|Communities:|$)/i);
        if (platformsMatch) {
            hustle.resources.platforms = platformsMatch[1]
                .split(/,|\n/)
                .map(platform => platform.trim())
                .filter(platform => platform.length > 0);
        }
        
        const communitiesMatch = resources.match(/Communities:\s*(.+?)(?=\n\n|$)/is);
        if (communitiesMatch) {
            hustle.resources.communities = communitiesMatch[1]
                .split(/,|\n/)
                .map(community => community.trim())
                .filter(community => community.length > 0);
        }
    }
    
    // Extract monetization - improved to handle different formatting
    const monetizationSection = text.match(/Monetization:(.+?)(?=\n\s*Risk Analysis|Risk Analysis:|$)/is);
    if (monetizationSection) {
        const monetization = monetizationSection[1];
        console.log("Monetization section:", monetization.substring(0, 100) + "..."); // Debug logging
        
        // Try to match numbered items (e.g., "1. Item")
        const streams = monetization.match(/\d+\.\s*.*?(?=\n\s*\d+\.|$)/gs);
        if (streams && streams.length > 0) {
            hustle.monetization = streams.map(stream => 
                stream.replace(/^\d+\.\s*/, '').trim()
            );
        } else {
            // Fallback to line-by-line if no numbered format
            const lines = monetization.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0 && !line.match(/^\s*Monetization:/i));
            if (lines.length > 0) hustle.monetization = lines;
        }
    }
    
    // Extract risk analysis - improved to handle different formatting
    const riskAnalysisSection = text.match(/Risk Analysis:(.+?)(?=$)/is);
    if (riskAnalysisSection) {
        const riskText = riskAnalysisSection[1];
        console.log("Risk Analysis section:", riskText.substring(0, 100) + "..."); // Debug logging
        
        // Try to match challenge/solution pairs in various formats
        const challenges = riskText.match(/(?:Challenge:|[-•])\s*(.+?)(?:\n\s*Solution:|\n\s*→\s*Solution:)(.+?)(?=\n\s*(?:Challenge:|[-•])|$)/gs);
        
        if (challenges && challenges.length > 0) {
            challenges.forEach(challengeBlock => {
                const challengeMatch = challengeBlock.match(/(?:Challenge:|[-•])\s*(.+?)(?:\n\s*Solution:|\n\s*→\s*Solution:)/s);
                const solutionMatch = challengeBlock.match(/(?:Solution:|\n\s*→\s*Solution:)\s*(.+?)(?=$)/s);
                
                if (challengeMatch && solutionMatch) {
                    hustle.risks.push({
                        challenge: challengeMatch[1].trim(),
                        solution: solutionMatch[1].trim()
                    });
                }
            });
        } else {
            // Fallback to simpler extraction by line pairs
            const lines = riskText.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            
            for (let i = 0; i < lines.length; i += 2) {
                if (i + 1 < lines.length) {
                    hustle.risks.push({
                        challenge: lines[i].replace(/^[-•]\s*/, ''),
                        solution: lines[i + 1]
                    });
                }
            }
        }
    }
    
    // If we have empty fields after parsing, let's provide fallbacks for critical sections
    if (hustle.metrics.startupTime === "") hustle.metrics.startupTime = "4-6 weeks";
    if (hustle.metrics.breakEven === "") hustle.metrics.breakEven = "3-6 months";
    if (hustle.metrics.scalability === "") hustle.metrics.scalability = "Medium - Can grow with additional resources";
    
    if (hustle.actionPlan.length === 0) {
        hustle.actionPlan = [
            "Week 1: Research the market and competition",
            "Week 2: Set up necessary accounts and infrastructure",
            "Week 3: Create initial marketing materials and online presence",
            "Week 4: Launch initial services and gather feedback"
        ];
    }
    
    if (hustle.resources.tools.length === 0) {
        hustle.resources.tools = ["Basic equipment", "Social media management tools", "Accounting software"];
    }
    
    if (hustle.resources.platforms.length === 0) {
        hustle.resources.platforms = ["Instagram", "Local online marketplace"];
    }
    
    if (hustle.resources.communities.length === 0) {
        hustle.resources.communities = ["Local business network", "Online industry forums"];
    }
    
    if (hustle.monetization.length === 0) {
        hustle.monetization = [
            "Direct sales of products/services: $25-75 per transaction",
            "Subscription model: $15-30/month for premium offerings",
            "Partnerships with complementary businesses: 10-15% commission"
        ];
    }
    
    if (hustle.risks.length === 0) {
        hustle.risks = [
            {
                challenge: "Market competition",
                solution: "Focus on unique value proposition and exceptional customer service"
            },
            {
                challenge: "Seasonal demand fluctuations",
                solution: "Develop diversified offerings to maintain consistent revenue"
            }
        ];
    }
    
    console.log("Parsed hustle object:", hustle); // Debug the final object
    
    return hustle;
}

// Create a fallback hustle if API fails
function createFallbackHustleFromCard(name, location, description) {
    return {
        name: name,
        summary: description || `A unique business opportunity in ${location} that offers potential for growth and profitability.`,
        difficulty: "Medium",
        profitability: "$500 - $2000/month",
        cost: "$200 - $1000 (initial setup)",
        metrics: {
            startupTime: "4-6 weeks",
            breakEven: "3-6 months",
            scalability: "Medium - Can grow with additional resources"
        },
        actionPlan: [
            "Week 1: Research the market and identify target customers in " + location,
            "Week 2: Create a basic business plan and secure necessary permits",
            "Week 3: Set up online presence and begin initial marketing",
            "Week 4: Soft launch and gather initial feedback from customers"
        ],
        resources: {
            tools: ["Social media management tools", "Basic accounting software", "Customer relationship management system"],
            platforms: ["Instagram", "Facebook", "Local online marketplace"],
            communities: [`${location} Business Association`, "Online entrepreneur groups"]
        },
        monetization: [
            "Direct sales of products/services: $25-75 per transaction",
            "Subscription model: $15-30/month for premium offerings",
            "Partnerships with complementary businesses: 10-15% commission"
        ],
        risks: [
            {
                challenge: "Market competition in " + location,
                solution: "Focus on unique value proposition and exceptional customer service"
            },
            {
                challenge: "Seasonal demand fluctuations",
                solution: "Develop diversified offerings to maintain consistent revenue throughout the year"
            }
        ]
    };
}

// Add event listener for when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up listeners for the main page
    setupMainPageListeners();
    
    // Handle mobile menu
    setupMobileMenu();
    
    // Initialize particles.js
    if (document.getElementById('particles-js')) {
        initParticles();
    }
    
    // Load featured hustles
    loadFeaturedHustles();
    
    // Set up quick search functionality
    setupQuickSearch();
});

// Set up quick search functionality
function setupQuickSearch() {
    const quickSearchBtn = document.getElementById('quick-search-btn');
    const quickCityInput = document.getElementById('quick-city-input');
    
    if (quickSearchBtn && quickCityInput) {
        quickSearchBtn.addEventListener('click', function() {
            const city = quickCityInput.value.trim();
            if (city) {
                // Instead of triggering the main search, refresh the featured hustles
                // for the specific city
                refreshFeaturedHustlesForCity(city);
                
                // Show a small success message
                quickSearchBtn.innerHTML = 'Refreshed!';
                setTimeout(() => {
                    quickSearchBtn.innerHTML = 'Find Trending Hustles';
                }, 2000);
            } else {
                // Show a small hint if empty
                quickCityInput.placeholder = "Please enter a city";
                setTimeout(() => {
                    quickCityInput.placeholder = "Your City";
                }, 2000);
            }
        });
        
        // Allow pressing Enter in the input field to trigger search
        quickCityInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                quickSearchBtn.click();
            }
        });
    }
}

// Function to refresh featured hustles for a specific city
async function refreshFeaturedHustlesForCity(city) {
    const inspirationSection = document.getElementById('inspiration-section');
    if (!inspirationSection) return;
    
    const cardsContainer = inspirationSection.querySelector('.inspiration-cards-container');
    if (!cardsContainer) return;
    
    // Add loading indicator to the cards container
    cardsContainer.innerHTML = `
        <div style="text-align: center; padding: 30px; width: 100%;">
            <div class="loading-spinner" style="margin: 0 auto 15px;"></div>
            <p>Finding trending hustles in ${city}...</p>
        </div>
    `;
    
    try {
        // Create a more specific prompt that targets the city
        const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Generate 3 trending hustle ideas specifically for ${city} in this EXACT format (nothing before or after):
                        
1. Hustle: [hustle name appropriate for ${city}]
   Location: ${city}
   Description: [single short sentence explaining why this is a good hustle for ${city}]
   Icon: [one of: camera, map-pin, code, paint, coffee, book, truck, leaf, music]

2. Hustle: [different hustle name appropriate for ${city}]
   Location: ${city}
   Description: [single short sentence explaining why this is a good hustle for ${city}]
   Icon: [one of: camera, map-pin, code, paint, coffee, book, truck, leaf, music]

3. Hustle: [different hustle name appropriate for ${city}]
   Location: ${city}
   Description: [single short sentence explaining why this is a good hustle for ${city}]
   Icon: [one of: camera, map-pin, code, paint, coffee, book, truck, leaf, music]`
                    }]
                }],
                safetySettings: [{
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_ONLY_HIGH"
                }],
                generationConfig: {
                    maxOutputTokens: 350,
                    temperature: 1.0,
                    topP: 0.9,
                    topK: 40
                }
            })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const data = await response.json();
        const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        // Parse the response
        const hustleItems = textResponse.split(/\d+\.\s+/).filter(item => item.trim().length > 0);
        
        if (hustleItems && hustleItems.length > 0) {
            // Clear existing cards
            cardsContainer.innerHTML = '';
            
            // Process each hustle idea
            hustleItems.forEach(item => {
                const hustleMatch = item.match(/Hustle:\s*(.+?)(?:\n|$)/);
                const locationMatch = item.match(/Location:\s*(.+?)(?:\n|$)/);
                const descriptionMatch = item.match(/Description:\s*(.+?)(?:\n|$)/);
                const iconMatch = item.match(/Icon:\s*(.+?)(?:\n|$)/);
                
                if (hustleMatch && locationMatch && descriptionMatch) {
                    const hustleName = hustleMatch[1].trim();
                    const location = locationMatch[1].trim();
                    const description = descriptionMatch[1].trim();
                    const icon = (iconMatch && iconMatch[1].trim()) || "camera";
                    
                    // Create card with the data
                    createFeaturedHustleCard(hustleName, location, description, icon, cardsContainer);
                }
            });
            
            // Add a small indication this was refreshed for this city
            const titleElement = document.getElementById('inspiration-title');
            if (titleElement) {
                titleElement.textContent = `Trending Hustle Ideas in ${city}`;
            }
            
            // Update the placeholder of the quick search input
            const quickCityInput = document.getElementById('quick-city-input');
            if (quickCityInput) {
                quickCityInput.placeholder = city;
            }
            
            // Add click handlers to the cards
            setupFeaturedHustleCardListeners();
        } else {
            throw new Error("Failed to parse featured hustles");
        }
    } catch (error) {
        console.warn("Failed to load featured hustles for city:", error);
        
        // Show an error message
        cardsContainer.innerHTML = `
            <div style="text-align: center; padding: 30px; width: 100%;">
                <p>Could not find trending hustles for ${city}. Please try again.</p>
                <button onclick="loadFeaturedHustles()" style="margin-top: 15px; padding: 8px 15px; background: var(--primary-color); color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Restore Default Hustles
                </button>
            </div>
        `;
    }
}

// ... rest of existing code ...
