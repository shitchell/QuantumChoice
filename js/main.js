// =====================================================
// GenQ - Quantum Random Generator
// =====================================================

const rng = new QRNG(20480);
const loadingTimeout = 5; // seconds before showing loading message
const morphSpeed = 100;   // ms between morphify animation frames
const morphChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -',." +
                   "ΨΩαβγδεζηθικλμνξοπρστυφχфхцчГДЁЖЗЙКЛΦΛΘΔэю";

const magicAnswers = [
    "It is certain.",
    "It is decidedly so.",
    "Without a doubt.",
    "Yes - definitely.",
    "You may rely on it.",
    "As I see it, yes.",
    "Most likely.",
    "Outlook good.",
    "Yes.",
    "Signs point to yes.",
    "Reply hazy, try again.",
    "Ask again later.",
    "Better not tell you now.",
    "Cannot predict now.",
    "Concentrate and ask again.",
    "Don't count on it.",
    "My reply is no.",
    "My sources say no.",
    "Outlook not so good.",
    "Very doubtful."
];

// ----- DOM Ready -----
document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const particlesEl = $('#particles-js');
    const mainCard = $('main.card');
    const aboutModal = $('#about-modal');
    const toastContainer = $('#toast-container');

    // ----- Theme Initialization -----
    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        const isDark = theme === 'dark';
        particlesEl.classList.toggle('dark', isDark);
        mainCard.classList.toggle('dark', isDark);
        document.body.classList.toggle('dark', isDark);
        $('#theme-toggle').textContent = isDark ? 'light' : 'dark';

        // Update particle line color
        if (window.pJSDom && window.pJSDom[0]) {
            pJSDom[0].pJS.particles.line_linked.color_rgb_line = isDark
                ? {r: 129, g: 140, b: 248}
                : {r: 255, g: 255, b: 255};
        }
    }

    // Load saved theme or use system preference
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme || getSystemTheme();
    applyTheme(initialTheme);

    // ----- Tabs (Swipeable) -----
    const tabs = $$('.tab');
    const panels = $$('.tab-panel');
    const tabPanels = $('.tab-panels');

    // Scroll to panel by ID
    function scrollToPanel(panelId, smooth = true) {
        const targetPanel = $(`#${panelId}`);
        if (targetPanel) {
            targetPanel.scrollIntoView({
                behavior: smooth ? 'smooth' : 'instant',
                inline: 'start',
                block: 'nearest'
            });
        }
    }

    // Click tab → scroll to panel and update hash
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;
            scrollToPanel(targetId);
            history.replaceState(null, '', `#${targetId}`);
        });
    });

    // Observe panels to update active tab on swipe
    const panelObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                const panelId = entry.target.id;

                // Update hash without scrolling
                history.replaceState(null, '', `#${panelId}`);

                // Update tabs
                tabs.forEach(t => {
                    const isActive = t.dataset.tab === panelId;
                    t.classList.toggle('active', isActive);
                    t.setAttribute('aria-selected', isActive ? 'true' : 'false');

                    // Scroll active tab into view
                    if (isActive) {
                        t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    }
                });
            }
        });
    }, {
        root: tabPanels,
        threshold: 0.5
    });

    panels.forEach(panel => panelObserver.observe(panel));

    // Load tab from hash on page load
    const initialHash = window.location.hash.slice(1);
    if (initialHash && $(`#${initialHash}`)) {
        // Scroll instantly (no animation) then reveal
        scrollToPanel(initialHash, false);
    }
    // Reveal panels after positioning
    requestAnimationFrame(() => tabPanels.classList.add('ready'));

    // ----- Modal -----
    $('#about-trigger').addEventListener('click', (e) => {
        e.preventDefault();
        aboutModal.showModal();
    });

    $('#about-close').addEventListener('click', () => {
        aboutModal.close();
    });

    // Close on backdrop click
    aboutModal.addEventListener('click', (e) => {
        if (e.target === aboutModal) {
            aboutModal.close();
        }
    });

    // ----- Theme Toggle -----
    $('#theme-toggle').addEventListener('click', (e) => {
        e.preventDefault();
        const newTheme = e.target.textContent === 'dark' ? 'dark' : 'light';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // ----- Fullscreen Toggle -----
    $('#toggle-fs').addEventListener('click', (e) => {
        e.preventDefault();
        const el = particlesEl;
        const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen;
        if (req) req.call(el);
    });

    // ----- RNG Form (Numbers) -----
    $('#rng-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const min = parseInt($('#rng-min').value) || 0;
        const max = parseInt($('#rng-max').value) || 1000;
        const result = rng.getInteger(min, max + 1);

        $('#rng-result').textContent = result.toLocaleString();
    });

    // ----- RCG Form (Choices) -----
    const choicesContainer = $('#rcg-choices');

    $('#rcg-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = $('#rcg-input');
        const text = input.value.trim();

        if (text) {
            addChoice(text);
            input.value = '';
        } else {
            // Empty input + Enter = pick a random choice
            $('#rcg-choose-button').click();
        }
    });

    $('#rcg-choose-button').addEventListener('click', () => {
        const chips = choicesContainer.querySelectorAll('.chip');
        if (chips.length === 0) return;

        // Clear previous selection
        chips.forEach(c => c.classList.remove('selected'));

        // Pick random chip
        const choice = rng.getChoice(Array.from(chips));
        choice.classList.add('selected');
    });

    $('#rcg-clear-button').addEventListener('click', () => {
        choicesContainer.innerHTML = '';
    });

    function addChoice(text) {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.innerHTML = `${escapeHtml(text)}<button type="button" class="chip-close" aria-label="Remove">&times;</button>`;

        chip.querySelector('.chip-close').addEventListener('click', () => {
            chip.remove();
        });

        choicesContainer.prepend(chip);
    }

    // ----- 8-Ball -----
    $('#eight-ball-button').addEventListener('click', (e) => {
        e.preventDefault();
        const answer = rng.getChoice(magicAnswers);
        morphifyText($('#eight-ball-result'), answer);
    });

    // ----- Compass -----
    const compassNeedle = $('#compass-needle');
    const compassDegrees = $('#compass-degrees');
    let currentRotation = 0;

    $('#compass-button').addEventListener('click', (e) => {
        e.preventDefault();

        // Get random final angle (0-359)
        const targetDegree = rng.getInteger(0, 360);

        // Add 2-4 full spins plus the target angle
        const extraSpins = rng.getInteger(2, 5) * 360;
        const totalRotation = currentRotation + extraSpins + (targetDegree - (currentRotation % 360));

        // Apply rotation
        compassNeedle.classList.add('spinning');
        compassNeedle.style.transform = `rotate(${totalRotation}deg)`;

        // Update display with animation
        const startDegree = currentRotation % 360;
        const duration = 3000;
        const startTime = performance.now();

        function updateDegrees(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentDeg = Math.round((startDegree + (totalRotation - currentRotation) * eased) % 360);

            compassDegrees.textContent = `${(currentDeg + 360) % 360}°`;

            if (progress < 1) {
                requestAnimationFrame(updateDegrees);
            } else {
                compassDegrees.textContent = `${targetDegree}°`;
                compassNeedle.classList.remove('spinning');
            }
        }

        requestAnimationFrame(updateDegrees);
        currentRotation = totalRotation;
    });

    // ----- QRNG Callbacks -----
    const qrngButtons = $$('.qrng');

    rng.onCacheEmpty = () => {
        qrngButtons.forEach(btn => btn.disabled = true);
        console.log('rng.onCacheEmpty()');
    };

    rng.onReady = () => {
        qrngButtons.forEach(btn => btn.disabled = false);
        console.log('rng.onReady()');
    };

    // Disable buttons until ready
    if (!rng.isReady()) {
        qrngButtons.forEach(btn => btn.disabled = true);
    }

    // Show loading message if taking too long
    setTimeout(() => {
        if (!rng.isReady()) {
            showToast('Quantum flux hyperdrives reloading...');
            const oldOnReady = rng.onReady;
            rng.onReady = () => {
                oldOnReady();
                showToast('Quantum randomness achieved!');
            };
        }
    }, loadingTimeout * 1000);

    // ----- Toast Notifications -----
    function showToast(message, duration = 4000) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => toast.remove());
        }, duration);
    }

    // ----- Morphify Text Animation -----
    function morphifyText(el, text, indices, morphText) {
        // Generate index countdown values if first call
        if (typeof indices === 'undefined') {
            indices = {};
            for (let i = 0; i < text.length; i++) {
                indices[i] = rng.getInteger(1, 5);
            }
        }

        // Generate random starting text if first call
        if (typeof morphText === 'undefined') {
            morphText = '';
            for (let i = 0; i < text.length; i++) {
                morphText += rng.getChoice(morphChars);
            }
        }

        let indicesKeys = Object.keys(indices);
        let indexNum = rng.getInteger(1, 4);
        indexNum = Math.min(indexNum, indicesKeys.length);

        if (indexNum > 0) {
            for (let i = 0; i < indexNum; i++) {
                const indexIndex = rng.getInteger(0, indicesKeys.length);
                const index = parseInt(indicesKeys.splice(indexIndex, 1)[0]);
                indices[index] -= 1;

                let newChar;
                if (indices[index] <= 0) {
                    newChar = text[index];
                    delete indices[index];
                } else {
                    newChar = rng.getChoice(morphChars);
                    if (newChar === text[index]) {
                        delete indices[index];
                    }
                }

                morphText = replaceChar(morphText, index, newChar);
            }

            el.textContent = morphText;

            if (Object.keys(indices).length > 0) {
                setTimeout(() => morphifyText(el, text, indices, morphText), morphSpeed);
            }
        }

        el.textContent = morphText;
    }

    function replaceChar(str, index, char) {
        if (index >= str.length) return str;
        return str.substring(0, index) + char + str.substring(index + 1);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
