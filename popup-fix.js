// Fix for featured hustle popup issues on mobile

document.addEventListener('DOMContentLoaded', function() {
    // References to popup elements
    const popupOverlay = document.getElementById('hustle-popup-overlay');
    const popupContainer = document.querySelector('.hustle-popup-container');
    const closeBtn = document.querySelector('.popup-close-btn');
    
    // Make the renderHustleInPopup function globally accessible so our fix can use it
    if (typeof window.renderHustleInPopup !== 'function') {
        // Create a reference to the original function if it doesn't exist globally
        window.renderHustleInPopup = window.renderHustleInPopup || function() {
            console.log('renderHustleInPopup not found');
        };
    }
    
    // State variable to track popup state
    let isPopupOpen = false;
    
    // Fix the issue with class mismatch - use both 'visible' and 'active' classes consistently
    function showPopup() {
        popupOverlay.classList.add('visible');
        popupOverlay.classList.add('active'); // Support both class names
        
        // Update state and lock scrolling
        isPopupOpen = true;
        document.body.classList.add('body-scroll-locked');
        
        // For mobile, save the scroll position for later restoration
        if (window.innerWidth <= 768) {
            window.popupScrollPos = window.scrollY;
        }
    }
    
    function hidePopup() {
        popupOverlay.classList.remove('visible');
        popupOverlay.classList.remove('active');
        
        // Update state and unlock scrolling
        isPopupOpen = false;
        document.body.classList.remove('body-scroll-locked');
        
        // Restore scroll position on mobile
        if (window.innerWidth <= 768 && window.popupScrollPos !== undefined) {
            window.scrollTo(0, window.popupScrollPos);
        }
    }
    
    // Override the existing listeners for the close button
    if (closeBtn) {
        // Remove existing listeners by cloning and replacing
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        
        // Add new listener
        newCloseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hidePopup();
        });
    }
    
    // Override the overlay click behavior
    if (popupOverlay) {
        // Prevent clicks on the popup container from closing the popup
        popupContainer.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        // Close when clicking outside the container
        popupOverlay.addEventListener('click', function(e) {
            if (e.target === popupOverlay) {
                hidePopup();
            }
        });
    }
    
    // Find and update featured hustle card listeners if they exist
    setTimeout(function() {
        const inspirationCards = document.querySelectorAll('.inspiration-card');
        
        if (inspirationCards.length > 0) {
            console.log('Adding mobile-friendly event listeners to inspiration cards');
            
            inspirationCards.forEach(card => {
                // Preserve original click behavior but enhance with our mobile fixes
                card.addEventListener('click', function(event) {
                    // Get all the required attributes
                    const hustleName = this.getAttribute('data-hustle-name');
                    const location = this.getAttribute('data-location');
                    const description = this.getAttribute('data-description');
                    
                    // Show loading first
                    const popupContent = document.querySelector('.hustle-popup-content');
                    if (popupContent) {
                        popupContent.innerHTML = `
                            <div class="loading-spinner" style="margin: 40px auto; text-align: center;">
                                <div class="loader-circle"></div>
                                <p>Loading hustle details for "${hustleName}" in ${location}...</p>
                            </div>
                        `;
                        
                        // Show the popup with our scroll locking mechanism
                        showPopup();
                    }
                    
                    // Let the original click event proceed for data fetching
                    // This won't create duplicate popups because showPopup has already been called
                });
            });
        }
    }, 1000); // Wait for other scripts to initialize
});
