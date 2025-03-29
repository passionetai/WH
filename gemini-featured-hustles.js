// Keep track of previously shown featured hustles to ensure uniqueness
const seenFeaturedHustles = new Set();

// List of popular cities (can be dynamically fetched from DOM if needed)
const popularCities = [
    "New York", "London", "Tokyo", "Paris", "Sydney", "Los Angeles", 
    "Dubai", "Singapore", "Hong Kong", "Toronto", "Mumbai", "Seoul", 
    "São Paulo", "Berlin", "Cape Town", "Cairo", "Nairobi", "Amsterdam", 
    "Barcelona", "Vancouver", "Melbourne", "Lagos", "Rome", "Madrid", 
    "Vienna", "Bangkok", "Shanghai", "Istanbul"
];

// Fetches featured hustle summaries from Gemini API with random popular cities
async function fetchFeaturedHustles() {
    console.log("Fetching featured hustles from Gemini API with random cities...");
    
    // Select 3 unique random popular cities
    const shuffledCities = popularCities.sort(() => 0.5 - Math.random());
    const selectedCities = shuffledCities.slice(0, 3);
    
    try {
        // Prompt asks for general ideas, city will be assigned later
        const prompt = `Generate 3 unique and innovative side hustle ideas that are different from each other. Each should have a distinct business model and target different markets or skills.

For each hustle, provide:
1. A catchy name (10 words or less)
2. A brief description (20 words or less)
3. An ID format: a short unique identifier (e.g., "unique-crafts", "virtual-assistant", "tech-repair")
4. A relevant icon suggestion (described as an SVG icon)

Format EXACTLY like this JSON array:
[
  {
    "id": "unique-identifier",
    "title": "Hustle Name",
    "snippet": "Brief description of the hustle",
    "iconType": "brief description of icon (e.g. camera, food, computer)"
  },
  {...},
  {...}
]

Make sure each hustle ID is truly unique and not similar to: ${Array.from(seenFeaturedHustles).join(', ')}`;

        // Make the API call (using existing GEMINI_CONFIG from script.js)
        const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ],
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_ONLY_HIGH"
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 1024,
                    temperature: 0.85, // Slightly higher for more variety
                    topP: 0.95,
                    topK: 40
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (!jsonMatch) {
            throw new Error("Could not parse JSON from API response");
        }
        
        let hustles = JSON.parse(jsonMatch[0]);
        
        // Assign random cities and ensure uniqueness
        const finalHustles = [];
        hustles.forEach((hustle, index) => {
            if (hustle && hustle.id && !seenFeaturedHustles.has(hustle.id)) {
                seenFeaturedHustles.add(hustle.id);
                const iconSvg = getIconSvgForType(hustle.iconType);
                finalHustles.push({
                    id: hustle.id,
                    title: hustle.title,
                    location: selectedCities[index % selectedCities.length], // Assign city
                    snippet: hustle.snippet,
                    icon: iconSvg
                });
            }
        });
        
        // If we didn't get enough unique ideas, fill with fallbacks (adjust as needed)
        while (finalHustles.length < 3) {
             const fallback = getFallbackHustle(selectedCities[finalHustles.length % selectedCities.length]);
             if (!seenFeaturedHustles.has(fallback.id)) {
                 seenFeaturedHustles.add(fallback.id);
                 finalHustles.push(fallback);
             }
        }

        return finalHustles.slice(0, 3); // Ensure only 3 are returned

    } catch (error) {
        console.error("Error fetching featured hustles:", error);
        // Fallback to 3 basic ideas with random cities if API fails
        return selectedCities.map((city, index) => getFallbackHustle(city, index));
    }
}

// Helper function to get a single fallback hustle
function getFallbackHustle(city, index = 0) {
    const fallbacks = [
        {
            id: `local-guide-${city.toLowerCase().replace(/\s+/g, '-')}`,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
            title: 'Local Walking Tours',
            location: city,
            snippet: `Show tourists the hidden gems of ${city}.`
        },
        {
            id: `social-media-mgr-${city.toLowerCase().replace(/\s+/g, '-')}`,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>`,
            title: 'Local Business Social Media',
            location: city,
            snippet: `Manage social profiles for small businesses in ${city}.`
        },
        {
            id: `event-setup-${city.toLowerCase().replace(/\s+/g, '-')}`,
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>`,
            title: 'Event Setup/Takedown Crew',
            location: city,
            snippet: `Help vendors and planners set up for events in ${city}.`
        }
    ];
    return fallbacks[index % fallbacks.length];
}

// Helper function to get appropriate SVG icon based on type description (Keep existing)
function getIconSvgForType(iconType) {
    // ... (previous implementation remains the same) ...
    // Lowercase and simplify the icon type
    const type = (iconType || '').toLowerCase().trim();
    
    // Map of common keywords to SVG icons
    const iconMap = {
        // Photography/Camera related
        camera: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
        photo: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
        
        // Food related
        food: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`,
        cook: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`,
        bake: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"></path></svg>`,
        
        // Tech/Coding related
        tech: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
        code: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
        computer: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
        
        // Travel/Location related
        travel: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 11l0 6"></path><path d="M12 7l0-1"></path></svg>`,
        map: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>`,
        location: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 11l0 6"></path><path d="M12 7l0-1"></path></svg>`,
        
        // Pet related
        pet: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5"></path><path d="M14.5 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-2.344-2.5"></path><path d="M8 14v.5"></path><path d="M16 14v.5"></path><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"></path><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.304"></path></svg>`,
        dog: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5"></path><path d="M14.5 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-2.344-2.5"></path><path d="M8 14v.5"></path><path d="M16 14v.5"></path><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"></path><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.304"></path></svg>`,
        
        // Design related
        design: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>`,
        art: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>`,
        
        // Fitness related
        fitness: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M15 10v4"></path><path d="M9 10v4"></path><path d="M12 8v8"></path></svg>`,
        exercise: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M15 10v4"></path><path d="M9 10v4"></path><path d="M12 8v8"></path></svg>`,
        
        // Education related
        teach: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10L4 6l8-4 8 4-8 4z"></path><path d="M4 6v6c0 3.314 3.582 6 8 6s8-2.686 8-6V6"></path><line x1="12" y1="22" x2="12" y2="16"></line></svg>`,
        tutor: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10L4 6l8-4 8 4-8 4z"></path><path d="M4 6v6c0 3.314 3.582 6 8 6s8-2.686 8-6V6"></path><line x1="12" y1="22" x2="12" y2="16"></line></svg>`,
        education: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10L4 6l8-4 8 4-8 4z"></path><path d="M4 6v6c0 3.314 3.582 6 8 6s8-2.686 8-6V6"></path><line x1="12" y1="22" x2="12" y2="16"></line></svg>`,
    };
    
    // Try to match icon type with our map
    for (const [key, svg] of Object.entries(iconMap)) {
        if (type.includes(key)) {
            return svg;
        }
    }
    
    // Default icon if no match
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
}

// Fetches full details for a specific hustle ID and location from Gemini API
async function fetchFullHustleDetails(hustleId, location) { // Added location parameter
    console.log(`Fetching full details for hustle: ${hustleId} in ${location}`);
    
    try {
        // Create a prompt for Gemini to generate detailed information, now including the location
        const prompt = `Generate detailed business information for a side hustle with ID "${hustleId}".
        
Focus on making this hustle viable specifically in ${location}.

Format your response with this HTML structure:
<h3 id="modal-title">[Catchy Business Name (${location})]</h3>
<div>
  <p>[Detailed 2-3 sentence description of what this business does and why it's viable in ${location}]</p>
  <strong>Key Steps (for ${location}):</strong>
  <ul>
    <li>[Step 1 - specific to ${location} if possible]</li>
    <li>[Step 2 - specific to ${location} if possible]</li>
    <li>[Step 3 - specific to ${location} if possible]</li>
    <li>[Step 4 - specific to ${location} if possible]</li>
  </ul>
  <strong>Potential Earnings (in ${location}):</strong> [Realistic income range with local currency context if possible]
</div>

Make the content practical, realistic, and detailed enough for someone to actually start this business in ${location}.`;

        // Make the API call
        const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ],
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_ONLY_HIGH"
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 1024,
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 40
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        const titleMatch = text.match(/<h3[^>]*>(.*?)<\/h3>/s);
        const contentMatch = text.match(/<div[^>]*>([\s\S]*?)<\/div>/s);
        
        if (titleMatch && contentMatch) {
            return {
                title: titleMatch[1],
                content: contentMatch[1]
            };
        } else {
            return {
                title: `Hustle Details (${location})`,
                content: text
            };
        }
    } catch (error) {
        console.error("Error fetching hustle details:", error);
        return { 
            title: `Details Temporarily Unavailable (${location})`,
            content: `<p>We couldn\'t load the details for this hustle in ${location} right now. Please try again later.</p>`
        };
    }
}

// Override the existing functions in script.js
window.addEventListener('DOMContentLoaded', () => {
    // Replace simulateFetchFeaturedHustles with our real implementation
    window.simulateFetchFeaturedHustles = fetchFeaturedHustles;
    
    // Replace simulateFetchFullHustleDetails with our real implementation
    window.simulateFetchFullHustleDetails = fetchFullHustleDetails;
    
    // **Important**: We also need to override openHustleModal to pass the location
    const originalOpenModal = window.openHustleModal; // Store original if needed elsewhere
    
    window.openHustleModal = async function(hustleId, cardElement) { // Accept cardElement
        if (!hustleModal || !modalBody || !cardElement) return;

        const location = cardElement.dataset.location; // Get location from data attribute
        if (!location) {
            console.error("Location data attribute missing from card:", cardElement);
            return;
        }

        // Show modal and initial loader
        modalBody.innerHTML = '<div class="loading-spinner"></div>'; 
        hustleModal.hidden = false;
        document.body.style.overflow = 'hidden';
        setTimeout(() => hustleModal.classList.add('is-visible'), 10);

        try {
            // Fetch full details using BOTH id and location
            const details = await fetchFullHustleDetails(hustleId, location);
            
            modalBody.innerHTML = `
                <h3 id="modal-title">${details.title}</h3>
                <div>${details.content}</div>
            `;
        } catch (error) {
            console.error("Error fetching hustle details:", error);
            modalBody.innerHTML = '<p class="error-text">Could not load details. Please try again later.</p>';
        }
    };

    // Need to update renderFeaturedHustles to add data-location and pass element to modal trigger
    const originalRenderFeatured = window.renderFeaturedHustles;
    window.renderFeaturedHustles = function(hustles) {
        if (!inspirationContainer) return;
        inspirationContainer.innerHTML = ''; // Clear existing

        if (!hustles || hustles.length === 0) {
            inspirationContainer.innerHTML = '<p class="inspiration-error">Could not load inspiration ideas.</p>';
            return;
        }

        hustles.forEach(hustle => {
            const card = document.createElement('div');
            card.className = 'inspiration-card';
            card.setAttribute('data-hustle-id', hustle.id);
            card.setAttribute('data-location', hustle.location); // *** ADD LOCATION DATA ***
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.innerHTML = `
                <div class="inspiration-card-icon">
                    ${hustle.icon || '<i>?</i>'} 
                </div>
                <div class="inspiration-card-content">
                    <h4>${hustle.title || 'Hustle Idea'}</h4>
                    ${hustle.location ? `<p>in ${hustle.location}</p>` : ''}
                    ${hustle.snippet ? `<span>${hustle.snippet}</span>` : ''}
                </div>
            `;
            
            // Pass the card element itself to the modal function
            card.addEventListener('click', () => window.openHustleModal(hustle.id, card)); 
            card.addEventListener('keydown', (event) => {
                 if (event.key === 'Enter' || event.key === ' ') {
                     window.openHustleModal(hustle.id, card);
                 }
             });

            inspirationContainer.appendChild(card);
        });
    };
    
    console.log("Gemini API integration for featured hustles loaded and functions overridden!");
}); 