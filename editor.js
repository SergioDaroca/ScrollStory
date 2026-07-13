/**
 * ScrollStory Editor v0.1 - Tiny visual editor (<10KB)
 * Combined with runtime, total should stay under 10KB
 */
(function() {
    'use strict';

    // State
    let actors = [];
    let activeActor = null;
    let isAutoplaying = false;
    let autoplayInterval = null;
    let scrollStep = 0;
    let config = {
        inOffset: -100,
        outOffset: 100,
        inAlpha: 0,
        outAlpha: 0,
        animDuration: 1,
        ease: 'easeOutQuad'
    };

    // DOM elements
    const canvas = document.getElementById('canvas');
    const timelineDots = document.getElementById('timelineDots');
    const orientationSwitch = document.getElementById('orientationSwitch');
    const aligner = document.getElementById('aligner');
    const autoplayBtn = document.getElementById('autoplayBtn');
    const exportBtn = document.getElementById('exportBtn');
    const exportPanel = document.getElementById('exportPanel');
    const exportText = document.getElementById('exportText');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const closeExportBtn = document.getElementById('closeExportBtn');
    const inValue = document.getElementById('inValue');
    const outValue = document.getElementById('outValue');
    const inMarker = document.getElementById('inMarker');
    const onMarker = document.getElementById('onMarker');
    const outMarker = document.getElementById('outMarker');

    // Sample content to load
    const sampleContent = `
        <section id="s1">
            <h1>ScrollStory</h1>
            <p class="actor" data-actor="title">A tiny Editor and Runtime for creating Scroll Stories.</p>
        </section>
        <section id="s2">
            <h2 class="actor" data-actor="heading1">The Vision</h2>
            <p class="actor" data-actor="text1">The simplest scroll-based animation engine.</p>
        </section>
        <section id="s3">
            <h2 class="actor" data-actor="heading2">How It Works</h2>
            <p class="actor" data-actor="text2">Each actor has in, on, and out states.</p>
        </section>
        <section id="s4">
            <h2 class="actor" data-actor="heading3">The Magic</h2>
            <p class="actor" data-actor="text3">Scroll to see animations.</p>
        </section>
    `;

    // Initialize
    function init() {
        // Load sample content
        canvas.innerHTML = sampleContent;
        
        // Find all actors
        actors = Array.from(canvas.querySelectorAll('.actor'));
        
        // Setup event listeners
        setupEventListeners();
        
        // Create timeline dots
        createTimelineDots();
        
        // Initialize runtime with editor config
        window.ScrollStory.init(config);
        
        // Highlight first actor
        if (actors.length > 0) {
            setActiveActor(actors[0]);
        }
    }

    function setupEventListeners() {
        // Actor selection
        actors.forEach(actor => {
            actor.addEventListener('click', (e) => {
                e.stopPropagation();
                setActiveActor(actor);
            });
        });

        // Orientation switch
        orientationSwitch.addEventListener('click', () => {
            orientationSwitch.classList.toggle('vertical');
            orientationSwitch.classList.toggle('horizontal');
            // TODO: Implement horizontal scroll mode
        });

        // Aligner
        aligner.addEventListener('click', (e) => {
            if (e.target.classList.contains('aligner-dot')) {
                const align = e.target.dataset.align;
                alignActiveActor(align);
            }
        });

        // Autoplay
        autoplayBtn.addEventListener('click', toggleAutoplay);

        // Export
        exportBtn.addEventListener('click', showExport);
        copyBtn.addEventListener('click', copyToClipboard);
        downloadBtn.addEventListener('click', downloadJSON);
        closeExportBtn.addEventListener('click', hideExport);

        // Animation values
        inValue.addEventListener('change', () => {
            config.animDuration = parseFloat(inValue.value);
            updateRuntime();
        });
        outValue.addEventListener('change', () => {
            config.animDuration = parseFloat(outValue.value);
            updateRuntime();
        });

        // Timeline markers
        inMarker.addEventListener('click', () => scrollToIn());
        onMarker.addEventListener('click', () => scrollToOn());
        outMarker.addEventListener('click', () => scrollToOut());

        // Canvas scroll
        canvas.parentElement.addEventListener('scroll', updateTimelineDots);
    }

    function createTimelineDots() {
        timelineDots.innerHTML = '';
        
        actors.forEach((actor, index) => {
            const dot = document.createElement('div');
            dot.className = 'dot';
            dot.dataset.index = index;
            dot.addEventListener('click', () => {
                setActiveActor(actor);
                scrollToActor(actor);
            });
            timelineDots.appendChild(dot);
        });
        
        updateTimelineDots();
    }

    function updateTimelineDots() {
        const scrollTop = canvas.parentElement.scrollTop;
        const canvasHeight = canvas.offsetHeight;
        const containerHeight = canvas.parentElement.clientHeight;
        const scale = containerHeight / canvasHeight;
        
        const dots = timelineDots.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            const actor = actors[index];
            const rect = actor.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            const top = rect.top - canvasRect.top + scrollTop;
            
            dot.style.top = `${top * scale}px`;
            dot.classList.toggle('active', actor === activeActor);
        });
        
        // Update scrubber position
        const scrubber = document.querySelector('.scrubber');
        scrubber.style.top = `${scrollTop * scale}px`;
    }

    function setActiveActor(actor) {
        if (activeActor) {
            activeActor.classList.remove('active');
        }
        activeActor = actor;
        actor.classList.add('active');
        
        // Update timeline dots
        const dots = timelineDots.querySelectorAll('.dot');
        dots.forEach(dot => {
            dot.classList.toggle('active', dot.dataset.index === actors.indexOf(actor));
        });
        
        // Scroll to actor
        scrollToActor(actor);
    }

    function scrollToActor(actor) {
        const rect = actor.getBoundingClientRect();
        const container = canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        const scrollTop = container.scrollTop + rect.top - containerRect.top - container.clientHeight / 2 + rect.height / 2;
        container.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }

    function scrollToIn() {
        if (!activeActor) return;
        const rect = activeActor.getBoundingClientRect();
        const container = canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        // Scroll so actor is at bottom of viewport
        const scrollTop = container.scrollTop + rect.top - containerRect.top - container.clientHeight + rect.height;
        container.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }

    function scrollToOn() {
        if (!activeActor) return;
        scrollToActor(activeActor);
    }

    function scrollToOut() {
        if (!activeActor) return;
        const rect = activeActor.getBoundingClientRect();
        const container = canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        // Scroll so actor is at top of viewport
        const scrollTop = container.scrollTop + rect.top - containerRect.top;
        container.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }

    function alignActiveActor(position) {
        if (!activeActor) return;
        
        const container = canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        let top, left;
        
        switch (position) {
            case 'TL': top = 0; left = 0; break;
            case 'TC': top = 0; left = containerWidth / 2; break;
            case 'TR': top = 0; left = containerWidth; break;
            case 'ML': top = containerHeight / 2; left = 0; break;
            case 'C': top = containerHeight / 2; left = containerWidth / 2; break;
            case 'MR': top = containerHeight / 2; left = containerWidth; break;
            case 'BL': top = containerHeight; left = 0; break;
            case 'BC': top = containerHeight; left = containerWidth / 2; break;
            case 'BR': top = containerHeight; left = containerWidth; break;
        }
        
        activeActor.style.position = 'absolute';
        activeActor.style.top = `${top}px`;
        activeActor.style.left = `${left}px`;
        activeActor.style.transform = 'translate(-50%, -50%)';
    }

    function toggleAutoplay() {
        isAutoplaying = !isAutoplaying;
        autoplayBtn.textContent = isAutoplaying ? 'STOP' : 'AUTOPLAY';
        
        if (isAutoplaying) {
            startAutoplay();
        } else {
            stopAutoplay();
        }
    }

    function startAutoplay() {
        const container = canvas.parentElement;
        const maxScroll = container.scrollHeight - container.clientHeight;
        
        autoplayInterval = setInterval(() => {
            scrollStep += 1;
            if (scrollStep > maxScroll) scrollStep = 0;
            container.scrollTo({ top: scrollStep, behavior: 'smooth' });
        }, 50);
    }

    function stopAutoplay() {
        if (autoplayInterval) {
            clearInterval(autoplayInterval);
            autoplayInterval = null;
        }
        scrollStep = 0;
    }

    function showExport() {
        const exportConfig = generateExportConfig();
        exportText.value = JSON.stringify(exportConfig, null, 2);
        exportPanel.classList.add('visible');
    }

    function hideExport() {
        exportPanel.classList.remove('visible');
    }

    function copyToClipboard() {
        exportText.select();
        document.execCommand('copy');
        alert('Copied to clipboard!');
    }

    function downloadJSON() {
        const exportConfig = generateExportConfig();
        const data = JSON.stringify(exportConfig, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scrollstory-animation.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    function generateExportConfig() {
        const actorsConfig = actors.map(actor => {
            const rect = actor.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            
            return {
                id: actor.dataset.actor,
                inOffset: config.inOffset,
                outOffset: config.outOffset,
                inAlpha: config.inAlpha,
                outAlpha: config.outAlpha,
                top: rect.top - canvasRect.top,
                left: rect.left - canvasRect.left
            };
        });
        
        return {
            config: {...config},
            actors: actorsConfig
        };
    }

    function updateRuntime() {
        window.ScrollStory.loadConfig({ config });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging
    window.ScrollStoryEditor = {
        actors: () => actors,
        activeActor: () => activeActor,
        config: () => config
    };
})();
