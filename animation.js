/**
 * ScrollStory Animation Configuration
 * Simple predefined animations for testing
 */
(function() {
    'use strict';

    // Simple animation config with in/on/out states
    const animationConfig = {
        config: {
            inOffset: -100,
            outOffset: 100,
            inAlpha: 0,
            outAlpha: 0,
            animDuration: 1,
            ease: 'easeOutQuad'
        },
        actors: [
            { id: 'title', inOffset: -100, outOffset: 100, inAlpha: 0, outAlpha: 0 },
            { id: 'heading1', inOffset: -100, outOffset: 100, inAlpha: 0, outAlpha: 0 },
            { id: 'text1', inOffset: -100, outOffset: 100, inAlpha: 0, outAlpha: 0 },
            { id: 'heading2', inOffset: -100, outOffset: 100, inAlpha: 0, outAlpha: 0 },
            { id: 'text2', inOffset: -100, outOffset: 100, inAlpha: 0, outAlpha: 0 },
            { id: 'heading3', inOffset: -100, outOffset: 100, inAlpha: 0, outAlpha: 0 },
            { id: 'text3', inOffset: -100, outOffset: 100, inAlpha: 0, outAlpha: 0 },
            { id: 'heading4', inOffset: -100, outOffset: 100, inAlpha: 0, outAlpha: 0 },
            { id: 'text4', inOffset: -100, outOffset: 100, inAlpha: 0, outAlpha: 0 }
        ]
    };

    // Load config when runtime is ready
    function loadWhenReady() {
        if (window.ScrollStory) {
            window.ScrollStory.loadConfig(animationConfig);
        } else {
            setTimeout(loadWhenReady, 50);
        }
    }

    // Start loading
    loadWhenReady();

    // Expose config for editor
    window.ScrollStoryConfig = animationConfig;
})();
