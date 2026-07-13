/**
 * ScrollStory Runtime v0.2 - Tiny scroll animation engine (<2KB)
 * Standalone IIFE - include with <script src="scrollstory.js"></script>
 * Supports both inline styles and CSS variables
 */
(function() {
    'use strict';

    const DEFAULTS = {
        inOffset: -100,
        outOffset: 100,
        inAlpha: 0,
        outAlpha: 0,
        animDuration: 1,
        ease: 'easeOutQuad'
    };

    let config = {...DEFAULTS};
    let actors = [];
    let scrollTimeout = null;

    // Penner easing functions
    const EASE = {
        linear: t => t,
        ease: t => t,
        easeInQuad: t => t*t,
        easeOutQuad: t => t*(2-t),
        easeInOutQuad: t => t<.5?2*t*t:-1+(4-2*t)*t,
        easeInCubic: t => t*t*t,
        easeOutCubic: t => (--t)*t*t+1,
        easeInOutCubic: t => t<.5?4*t*t*t:(t-1)*(2*t-2)*(2*t-2)+1,
        easeInQuart: t => t*t*t*t,
        easeOutQuart: t => 1-Math.pow(1-t,4),
        easeInOutQuart: t => t<.5?8*t*t*t*t:1-Math.pow(-2*t+2,4)/2,
        easeInSine: t => 1-Math.cos(t*Math.PI/2),
        easeOutSine: t => Math.sin(t*Math.PI/2),
        spring: t => 1+(Math.pow(2,-10*t)*Math.sin((t-0.075)*(2*Math.PI)/0.3))
    };

    function init(options = {}) {
        config = {...config, ...options};
        actors = Array.from(document.querySelectorAll('[data-actor]'));
        
        actors.forEach(actor => {
            const rect = actor.getBoundingClientRect();
            actor.dataset.ssTop = rect.top + window.scrollY;
            actor.dataset.ssLeft = rect.left + window.scrollX;
            actor.dataset.ssHeight = rect.height;
        });
        
        window.addEventListener('scroll', handleScroll, {passive: true});
        handleScroll();
    }

    function getInProgress(actor, scrollY) {
        const onPos = parseFloat(actor.dataset.ssTop) || 0;
        const windowHeight = window.innerHeight;
        const inStart = onPos - windowHeight;
        const inEnd = onPos;
        
        if (scrollY <= inStart) return 0;
        if (scrollY >= inEnd) return 1;
        return (scrollY - inStart) / (inEnd - inStart);
    }

    function getOutProgress(actor, scrollY) {
        const onPos = parseFloat(actor.dataset.ssTop) || 0;
        const actorHeight = parseFloat(actor.dataset.ssHeight) || actor.offsetHeight;
        const windowHeight = window.innerHeight;
        const outStart = onPos;
        const outEnd = onPos + actorHeight + windowHeight;
        
        if (scrollY <= outStart) return 0;
        if (scrollY >= outEnd) return 1;
        return (scrollY - outStart) / (outEnd - outStart);
    }

    function handleScroll() {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        updateActors();
        scrollTimeout = setTimeout(() => { scrollTimeout = null; }, 16);
    }

    function updateActors() {
        const scrollY = window.scrollY || window.pageYOffset;
        const easeFn = EASE[config.ease] || EASE.easeOutQuad;
        
        actors.forEach(actor => {
            const inProgress = getInProgress(actor, scrollY);
            const outProgress = getOutProgress(actor, scrollY);
            
            let progress, isIn, isOut;
            
            if (inProgress < 1 && outProgress === 0) {
                progress = inProgress;
                isIn = true;
                isOut = false;
            } else if (outProgress > 0 && inProgress >= 1) {
                progress = outProgress;
                isIn = false;
                isOut = true;
            } else {
                progress = 1;
                isIn = false;
                isOut = false;
            }
            
            const eased = easeFn(progress);
            
            if (isIn) {
                const offset = config.inOffset * (1 - eased);
                const opacity = config.inAlpha + (1 - config.inAlpha) * eased;
                applyTransform(actor, offset, 0, 1, opacity);
            } else if (isOut) {
                const offset = config.outOffset * eased;
                const opacity = 1 - (1 - config.outAlpha) * eased;
                applyTransform(actor, offset, 0, 1, opacity);
            } else {
                // On stage - reset to natural position
                applyTransform(actor, 0, 0, 1, 1);
            }
        });
    }

    function applyTransform(actor, tx, ty, scale, opacity) {
        // Support both CSS variables and inline styles
        if (actor.style.setProperty) {
            // Try CSS variables first (for editor compatibility)
            actor.style.setProperty('--tx', tx + 'px');
            actor.style.setProperty('--ty', ty + 'px');
            actor.style.setProperty('--s', scale);
            actor.style.setProperty('--a', opacity);
            actor.style.setProperty('--r', '0deg');
        }
        // Fallback to inline styles
        actor.style.transform = `translateX(${tx}px) translateY(${ty}px) scale(${scale})`;
        actor.style.opacity = opacity;
    }

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

    // Auto-init if data-actor elements exist
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.querySelector('[data-actor]')) init();
        });
    } else if (document.querySelector('[data-actor]')) {
        init();
    }
})();
