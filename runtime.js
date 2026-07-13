/**
 * ScrollStory Runtime v0.1 - Tiny scroll animation engine (<10KB)
 * Standalone IIFE - include with <script src="runtime.js"></script>
 */
(function() {
    'use strict';

    // Config defaults
    const DEFAULTS = {
        inOffset: -100,      // pixels left for in state
        outOffset: 100,      // pixels right for out state
        inAlpha: 0,          // alpha for in state
        outAlpha: 0,         // alpha for out state
        animDuration: 1,     // seconds for in/out animations
        ease: 'ease'         // CSS easing
    };

    // State
    let config = {...DEFAULTS};
    let actors = [];
    let scrollTimeout = null;

    // Penner easing functions (tiny subset)
    const EASE = {
        ease: t => t,
        easeInQuad: t => t*t,
        easeOutQuad: t => t*(2-t),
        easeInOutQuad: t => t<.5?2*t*t: -1+(4-2*t)*t,
        easeInCubic: t => t*t*t,
        easeOutCubic: t => (--t)*t*t+1,
        easeInOutCubic: t => t<.5?4*t*t*t: (t-1)*(2*t-2)*(2*t-2)+1,
        easeInSine: t => 1-Math.cos(t*Math.PI/2),
        easeOutSine: t => Math.sin(t*Math.PI/2)
    };

    /**
     * Initialize ScrollStory runtime
     * @param {Object} options - Configuration options
     */
    function init(options = {}) {
        config = {...config, ...options};
        
        // Find all actors
        actors = Array.from(document.querySelectorAll('[data-actor]'));
        
        // Store original styles
        actors.forEach(actor => {
            const rect = actor.getBoundingClientRect();
            actor.dataset.ssLeft = rect.left + window.scrollX;
            actor.dataset.ssTop = rect.top + window.scrollY;
            actor.dataset.ssOpacity = actor.style.opacity || 1;
        });
        
        // Setup scroll listener
        window.addEventListener('scroll', handleScroll, {passive: true});
        
        // Initial update
        handleScroll();
    }

    /**
     * Calculate progress (0-1) for in animation
     * @param {HTMLElement} actor
     * @param {number} scrollY
     * @returns {number} Progress 0-1
     */
    function getInProgress(actor, scrollY) {
        const onPos = parseFloat(actor.dataset.ssTop) || 0;
        const windowHeight = window.innerHeight;
        
        // in starts when actor is windowHeight away from viewport bottom
        const inStart = onPos - windowHeight;
        const inEnd = onPos;
        
        if (scrollY <= inStart) return 0;
        if (scrollY >= inEnd) return 1;
        return (scrollY - inStart) / (inEnd - inStart);
    }

    /**
     * Calculate progress (0-1) for out animation
     * @param {HTMLElement} actor
     * @param {number} scrollY
     * @returns {number} Progress 0-1
     */
    function getOutProgress(actor, scrollY) {
        const onPos = parseFloat(actor.dataset.ssTop) || 0;
        const actorHeight = actor.offsetHeight;
        const windowHeight = window.innerHeight;
        
        // out starts when actor top reaches viewport top
        const outStart = onPos;
        const outEnd = onPos + actorHeight + windowHeight;
        
        if (scrollY <= outStart) return 0;
        if (scrollY >= outEnd) return 1;
        return (scrollY - outStart) / (outEnd - outStart);
    }

    /**
     * Handle scroll events with debouncing
     */
    function handleScroll() {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        updateActors();
        scrollTimeout = setTimeout(() => {
            scrollTimeout = null;
        }, 16);
    }

    /**
     * Update all actors based on current scroll position
     */
    function updateActors() {
        const scrollY = window.scrollY || window.pageYOffset;
        const easeFn = EASE[config.ease] || EASE.ease;
        
        actors.forEach(actor => {
            const inProgress = getInProgress(actor, scrollY);
            const outProgress = getOutProgress(actor, scrollY);
            
            // Determine which animation to apply
            let progress, isIn, isOut;
            
            if (inProgress < 1 && outProgress === 0) {
                // In animation
                progress = inProgress;
                isIn = true;
                isOut = false;
            } else if (outProgress > 0 && inProgress >= 1) {
                // Out animation
                progress = outProgress;
                isIn = false;
                isOut = true;
            } else {
                // On stage
                progress = 1;
                isIn = false;
                isOut = false;
            }
            
            // Apply easing
            const eased = easeFn(progress);
            
            // Calculate styles
            let transform = '';
            let opacity = 1;
            
            if (isIn) {
                // Animate from in state to on state
                const offset = config.inOffset * (1 - eased);
                opacity = config.inAlpha + (1 - config.inAlpha) * eased;
                transform = `translateX(${offset}px)`;
            } else if (isOut) {
                // Animate from on state to out state
                const offset = config.outOffset * eased;
                opacity = 1 - (1 - config.outAlpha) * eased;
                transform = `translateX(${offset}px)`;
            }
            
            // Apply styles
            actor.style.transform = transform;
            actor.style.opacity = opacity;
        });
    }

    /**
     * Load animation configuration from JSON
     * @param {Object} animationConfig
     */
    function loadConfig(animationConfig) {
        if (animationConfig.config) {
            config = {...config, ...animationConfig.config};
        }
        if (animationConfig.actors) {
            animationConfig.actors.forEach(actorConfig => {
                const actor = document.querySelector(`[data-actor="${actorConfig.id}"]`);
                if (actor) {
                    if (actorConfig.inOffset !== undefined) actor.dataset.ssInOffset = actorConfig.inOffset;
                    if (actorConfig.outOffset !== undefined) actor.dataset.ssOutOffset = actorConfig.outOffset;
                    if (actorConfig.inAlpha !== undefined) actor.dataset.ssInAlpha = actorConfig.inAlpha;
                    if (actorConfig.outAlpha !== undefined) actor.dataset.ssOutAlpha = actorConfig.outAlpha;
                }
            });
        }
        updateActors();
    }

    // Expose API globally
    window.ScrollStory = {
        init,
        loadConfig,
        update: updateActors,
        config: DEFAULTS,
        ease: EASE
    };

    // Auto-init if data-actor elements exist on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.querySelector('[data-actor]')) {
                init();
            }
        });
    } else if (document.querySelector('[data-actor]')) {
        init();
    }
})();
