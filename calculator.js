// calculator.js - Hustle Calculator Functionality with Gemini API Integration

document.addEventListener('DOMContentLoaded', function() {
    // Initialize particles
    if (typeof particlesJS !== 'undefined') {
        initParticles();
    }
    
    // Set up calculator form
    setupCalculator();
    
    // Set up scroll to top button
    initScrollToTopButton();
});

// Function to set up calculator form
function setupCalculator() {
    const calculatorForm = document.getElementById('calculator-form');
    const resultsContainer = document.getElementById('calculator-results');
    
    if (calculatorForm) {
        calculatorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get input values from the form for potential fallback
            const inputInitialInvestment = parseFloat(document.getElementById('initial-investment').value) || 0;
            const inputHoursPerWeek = parseFloat(document.getElementById('hours-per-week').value) || 0;
            const inputHourlyRate = parseFloat(document.getElementById('hourly-rate').value) || 0;
            
            // If user has entered all values, use those instead of API
            const useInputValues = inputInitialInvestment > 0 && inputHoursPerWeek > 0 && inputHourlyRate > 0;
            
            if (useInputValues) {
                console.log('Using user-provided values instead of API');
                // Calculate results with user-provided values
                const weeklyEarnings = inputHoursPerWeek * inputHourlyRate;
                const monthlyEarnings = weeklyEarnings * 4;
                const breakEvenTime = inputInitialInvestment > 0 ? 
                    inputInitialInvestment / monthlyEarnings : 0;
                
                // Display results using user values
                displaySimpleResults({
                    initialInvestment: inputInitialInvestment,
                    hoursPerWeek: inputHoursPerWeek,
                    hourlyRate: inputHourlyRate,
                    weeklyEarnings,
                    monthlyEarnings,
                    breakEvenTime
                }, resultsContainer);
                
                return;
            }
            
            // Show loading state
            resultsContainer.innerHTML = `
                <div class="loading">
                    <div class="loader-circle"></div>
                    <p style="margin-top: 1rem;">Generating calculator values...</p>
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">This may take a few seconds...</p>
                </div>
            `;
            
            resultsContainer.classList.add('show');
            
            // Animate progress bar
            const progressFill = document.querySelector('.progress-fill');
            if (progressFill) {
                progressFill.style.width = '100%';
            }
            
            // Get business type from form or default
            const businessType = document.getElementById('initial-investment').placeholder || 'small business';
            
            // Call the API to get values
            getCalculatorValues(businessType)
                .then(values => {
                    // Calculate results
                    const weeklyEarnings = values.hoursPerWeek * values.hourlyRate;
                    const monthlyEarnings = weeklyEarnings * 4;
                    const breakEvenTime = values.initialInvestment > 0 ?
                        values.initialInvestment / monthlyEarnings : 0;
                    
                    // Display simple results
                    displaySimpleResults({
                        initialInvestment: values.initialInvestment,
                        hoursPerWeek: values.hoursPerWeek,
                        hourlyRate: values.hourlyRate,
                        weeklyEarnings,
                        monthlyEarnings,
                        breakEvenTime
                    }, resultsContainer);
                })
                .catch(error => {
                    console.error('Error getting calculator values:', error);
                    
                    // Get example values based on business type as fallback
                    const exampleValues = getExampleValues(businessType);
                    
                    // Calculate results with example values
                    const weeklyEarnings = exampleValues.hoursPerWeek * exampleValues.hourlyRate;
                    const monthlyEarnings = weeklyEarnings * 4;
                    const breakEvenTime = exampleValues.initialInvestment / monthlyEarnings;
                    
                    // Display example results
                    displaySimpleResults({
                        initialInvestment: exampleValues.initialInvestment,
                        hoursPerWeek: exampleValues.hoursPerWeek,
                        hourlyRate: exampleValues.hourlyRate,
                        weeklyEarnings,
                        monthlyEarnings,
                        breakEvenTime
                    }, resultsContainer);
                });
        });
    }
}

// Function to get example values
function getExampleValues(businessType) {
    // Different example values for different business types
    const businessExamples = {
        small: {
            initialInvestment: 1500,
            hoursPerWeek: 15,
            hourlyRate: 25
        },
        medium: {
            initialInvestment: 3500,
            hoursPerWeek: 25,
            hourlyRate: 35
        },
        large: {
            initialInvestment: 7500,
            hoursPerWeek: 35,
            hourlyRate: 50
        }
    };
    
    // Determine business size from input value or investment amount
    let businessSize = 'small';
    
    if (typeof businessType === 'string') {
        if (businessType.includes('large')) {
            businessSize = 'large';
        } else if (businessType.includes('medium')) {
            businessSize = 'medium';
        }
    } else {
        // Parse as number (if possible)
        const value = parseInt(businessType);
        if (!isNaN(value)) {
            if (value > 5000) {
                businessSize = 'large';
            } else if (value > 2000) {
                businessSize = 'medium';
            }
        }
    }
    
    return businessExamples[businessSize];
}

// Function to get calculator values from Gemini API
async function getCalculatorValues(businessType) {
    try {
        console.log('Making API request to Gemini...');
        
        // Create prompt for Gemini
        const prompt = `Generate realistic values for a business calculator with the following:
        
        1. Initial investment amount in dollars (a realistic amount between $500 and $10,000)
        2. Hours per week someone would work (between 5 and 40)
        3. Expected hourly rate in dollars (between $15 and $100)
        
        Return ONLY these three values in exactly this format with no additional text:
        Initial Investment: $X
        Hours Per Week: Y
        Hourly Rate: $Z
        
        Make sure the values are realistic and reasonable for a small business or side hustle.`;
        
        console.log('Using prompt:', prompt);
        
        // Make API request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        try {
            const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.1, // Lower temperature for more consistent results
                        maxOutputTokens: 200
                    }
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log('API response status:', response.status);
            
            // Check for errors
            if (!response.ok) {
                console.error('API error with status:', response.status);
                throw new Error(`API error: ${response.status}`);
            }
            
            // Parse response
            const data = await response.json();
            console.log('API response data:', data);
            
            // Get generated text
            const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            console.log('Generated text:', generatedText);
            
            if (!generatedText) {
                console.error('Empty response from API');
                throw new Error('Empty response from API');
            }
            
            // Parse the values from the response
            const parsedValues = parseGeminiValues(generatedText);
            console.log('Parsed values:', parsedValues);
            return parsedValues;
        } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                console.error('API request timed out');
                throw new Error('API request timed out');
            }
            throw fetchError;
        }
    } catch (error) {
        console.error('Gemini API error:', error);
        throw error;
    }
}

// Function to parse Gemini response values
function parseGeminiValues(text) {
    try {
        console.log('Parsing text:', text);
        
        // Extract values using more flexible regex patterns
        // Initial Investment can be formatted as $X,XXX or $XXX
        const initialInvestmentMatch = text.match(/Initial Investment:?\s*\$?([0-9,.]+)/i);
        console.log('Initial investment match:', initialInvestmentMatch);
        
        // Hours can be a decimal or integer
        const hoursPerWeekMatch = text.match(/Hours Per Week:?\s*([0-9.]+)/i);
        console.log('Hours per week match:', hoursPerWeekMatch);
        
        // Hourly Rate can be formatted as $XX or $XX.XX
        const hourlyRateMatch = text.match(/Hourly Rate:?\s*\$?([0-9.]+)/i);
        console.log('Hourly rate match:', hourlyRateMatch);
        
        // Use a fallback approach if the exact format isn't found
        // First try to find the values in the expected format
        // If that fails, look for numbers in the text
        
        let initialInvestment, hoursPerWeek, hourlyRate;
        
        if (initialInvestmentMatch) {
            initialInvestment = parseFloat(initialInvestmentMatch[1].replace(/,/g, ''));
        } else {
            // Try to find a dollar amount that looks like an investment
            const fallbackInvestment = text.match(/\$([0-9,]+)/);
            initialInvestment = fallbackInvestment ? 
                parseFloat(fallbackInvestment[1].replace(/,/g, '')) : 1000;
        }
        
        // Validate the range
        initialInvestment = Math.min(Math.max(initialInvestment, 500), 10000);
        
        if (hoursPerWeekMatch) {
            hoursPerWeek = parseFloat(hoursPerWeekMatch[1]);
        } else {
            // Default to a reasonable value
            hoursPerWeek = 20;
        }
        
        // Validate the range
        hoursPerWeek = Math.min(Math.max(hoursPerWeek, 5), 40);
        
        if (hourlyRateMatch) {
            hourlyRate = parseFloat(hourlyRateMatch[1]);
        } else {
            // Default to a reasonable value
            hourlyRate = 25;
        }
        
        // Validate the range
        hourlyRate = Math.min(Math.max(hourlyRate, 15), 100);
        
        console.log('Parsed and validated values:', { initialInvestment, hoursPerWeek, hourlyRate });
        
        return {
            initialInvestment,
            hoursPerWeek,
            hourlyRate
        };
    } catch (error) {
        console.error('Error parsing Gemini values:', error);
        // Provide default values if parsing fails
        return {
            initialInvestment: 1000,
            hoursPerWeek: 20,
            hourlyRate: 25
        };
    }
}

// Function to display simple results
function displaySimpleResults(results, container) {
    // Format numbers as currency
    const formatCurrency = (amount) => {
        return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    };
    
    // Format break-even time
    const formatBreakEven = (months) => {
        if (months === 0) return 'N/A (no initial investment)';
        return months.toFixed(1) + ' months';
    };
    
    // Create simple results HTML
    const resultsHTML = `
        <div class="result-card">
            <h3>Calculator Results</h3>
            <p><strong>Initial Investment:</strong> ${formatCurrency(results.initialInvestment)}</p>
            <p><strong>Hours Per Week:</strong> ${results.hoursPerWeek}</p>
            <p><strong>Hourly Rate:</strong> ${formatCurrency(results.hourlyRate)}</p>
            <p><strong>Weekly Earnings:</strong> <span class="result-value">${formatCurrency(results.weeklyEarnings)}</span></p>
            <p><strong>Monthly Earnings:</strong> <span class="result-value">${formatCurrency(results.monthlyEarnings)}</span></p>
            <p><strong>Break-Even Time:</strong> <span class="result-value">${formatBreakEven(results.breakEvenTime)}</span></p>
        </div>
        
        <div class="calculator-info">
            <p>Note: These calculations are estimates based on WeHustle It suggestions. Actual earnings may vary based on various factors.</p>
        </div>
    `;
    
    // Update results container
    container.innerHTML = resultsHTML;
    container.classList.add('show');
    
    // Scroll to results
    container.scrollIntoView({ behavior: 'smooth' });
}

// Function to initialize scroll to top button
function initScrollToTopButton() {
    const scrollTopBtn = document.querySelector('.scroll-top-btn');
    if (!scrollTopBtn) return;
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 100) {
            scrollTopBtn.style.display = 'block';
        } else {
            scrollTopBtn.style.display = 'none';
        }
    });
    
    // Scroll to top when clicked
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Function to initialize particles.js
function initParticles() {
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