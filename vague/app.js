const translations = {
    fr: {
        title: "Respiration Guidée",
        newbie: "Débutant",
        medium: "Intermédiaire",
        expert: "Expert",
        ready: "Prêt",
        inhaling: "Inspirez",
        holding: "Retenez",
        exhaling: "Expirez",
        install: "Installer l'application",
        settings: "Paramètres",
        language: "Langue",
        level: "Niveau",
        bibliography: "Bibliographie",
        about: "À propos",
        aboutTextStart: "Cette application est codée par l'IA de pseudoxia (",
        aboutTextEnd: ") et inspirée de plusieurs publications. Elle permet de s'entraîner à la respiration contrôlée dans le but de libérer des endorphines et de réguler le stress."
    },
    en: {
        title: "Guided Breathing",
        newbie: "Beginner",
        medium: "Intermediate",
        expert: "Expert",
        ready: "Ready",
        inhaling: "Inhale",
        holding: "Hold",
        exhaling: "Exhale",
        install: "Install App",
        settings: "Settings",
        language: "Language",
        level: "Level",
        bibliography: "Bibliography",
        about: "About",
        aboutTextStart: "This application is coded by pseudoxia's AI (",
        aboutTextEnd: ") and inspired by several publications. It allows training in controlled breathing to release endorphins and regulate stress."
    }
};

class BreathingApp {
    constructor() {
        this.loadPreferences();
        this.isRunning = false;
        this.cycles = 0;
        this.startTime = null;
        this.totalElapsed = 0;
        this.animationId = null;
        this.currentPhase = null;
        
        this.initElements();
        this.initEventListeners();
        this.initPWA();
        this.updateLanguage();
        this.updateTimer();
        this.updateTriangle();
    }
    
    detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage || 'en';
        return browserLang.startsWith('fr') ? 'fr' : 'en';
    }
    
    loadPreferences() {
        const savedPrefs = localStorage.getItem('breathing-app-prefs');
        if (savedPrefs) {
            const prefs = JSON.parse(savedPrefs);
            this.currentLang = prefs.language || this.detectBrowserLanguage();
            this.currentMode = prefs.mode || 'expert';
        } else {
            this.currentLang = this.detectBrowserLanguage();
            this.currentMode = 'expert';
        }
        
        // Set pattern based on mode
        const patterns = {
            'newbie': [2, 4, 4],
            'medium': [3, 5, 6],
            'expert': [4, 7, 8]
        };
        this.pattern = patterns[this.currentMode];
    }
    
    savePreferences() {
        const prefs = {
            language: this.currentLang,
            mode: this.currentMode
        };
        localStorage.setItem('breathing-app-prefs', JSON.stringify(prefs));
    }
    
    initElements() {
        this.startBtn = document.getElementById('startBtn');
        this.playIcon = document.getElementById('playIcon');
        this.pauseIcon = document.getElementById('pauseIcon');
        this.cursor = document.getElementById('cursor');
        this.phaseIndicator = document.getElementById('phaseIndicator');
        this.cycleCount = document.getElementById('cycleCount');
        this.totalTime = document.getElementById('totalTime');
        this.modeBtns = document.querySelectorAll('.mode-btn');
        this.installBtn = document.getElementById('installBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettings = document.getElementById('closeSettings');
        this.langFr = document.getElementById('langFr');
        this.langEn = document.getElementById('langEn');
        this.biblioBtn = document.getElementById('biblioBtn');
        this.biblioSection = document.getElementById('biblioSection');
        this.closeBiblio = document.getElementById('closeBiblio');
        this.triangleSvg = document.getElementById('triangleSvg');
        this.countdownOverlay = document.getElementById('countdownOverlay');
        this.countdownNumber = document.getElementById('countdownNumber');
        this.infoBtn = document.getElementById('infoBtn');
        this.infoModal = document.getElementById('infoModal');
        this.closeInfo = document.getElementById('closeInfo');
        
        // Set initial button states based on saved preferences
        this.updateLanguageButtons();
        this.updateModeButtons();
    }
    
    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.toggleBreathing());
        
        this.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.isRunning) {
                    this.setMode(btn);
                }
            });
        });
        
        // Settings modal events
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeSettings.addEventListener('click', () => this.closeSettingsModal());
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettingsModal();
            }
        });
        
        // Language selection events
        this.langFr.addEventListener('click', () => this.setLanguage('fr'));
        this.langEn.addEventListener('click', () => this.setLanguage('en'));
        
        // Bibliography events
        this.biblioBtn.addEventListener('click', () => this.showBibliography());
        this.closeBiblio.addEventListener('click', () => this.hideBibliography());
        
        // Info modal events
        this.infoBtn.addEventListener('click', () => this.showInfo());
        this.closeInfo.addEventListener('click', () => this.hideInfo());
        this.infoModal.addEventListener('click', (e) => {
            if (e.target === this.infoModal) {
                this.hideInfo();
            }
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning) {
                this.stopBreathing();
            }
        });
        
        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.settingsModal.style.display !== 'none') {
                    this.closeSettingsModal();
                }
                if (this.infoModal.style.display !== 'none') {
                    this.hideInfo();
                }
            }
        });
    }
    
    openSettings() {
        this.settingsModal.style.display = 'flex';
    }
    
    closeSettingsModal() {
        this.settingsModal.style.display = 'none';
    }
    
    setLanguage(lang) {
        this.currentLang = lang;
        this.updateLanguageButtons();
        this.updateLanguage();
        this.savePreferences();
    }
    
    updateLanguageButtons() {
        this.langFr.classList.toggle('active', this.currentLang === 'fr');
        this.langEn.classList.toggle('active', this.currentLang === 'en');
    }
    
    updateModeButtons() {
        this.modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.currentMode);
        });
    }
    
    showBibliography() {
        $(this.biblioSection).fadeIn(300);
    }
    
    hideBibliography() {
        $(this.biblioSection).fadeOut(300);
    }
    
    showInfo() {
        this.infoModal.style.display = 'flex';
    }
    
    hideInfo() {
        this.infoModal.style.display = 'none';
    }
    
    updateLanguage() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[this.currentLang][key]) {
                el.textContent = translations[this.currentLang][key];
            }
        });
        
        document.documentElement.lang = this.currentLang;
        document.title = translations[this.currentLang].title;
    }
    
    setMode(btn) {
        this.modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.currentMode = btn.dataset.mode;
        const pattern = btn.dataset.pattern.split('-').map(Number);
        this.pattern = pattern;
        this.updateTriangle();
        this.savePreferences();
    }
    
    updateTriangle() {
        const [inhale, hold, exhale] = this.pattern;
        
        const width = 400;
        const height = 260;
        const margin = 30;
        const baseWidth = 300;
        
        const baseY = height - margin;
        const topY = margin;
        
        const scale = baseWidth / Math.sqrt(inhale * inhale + exhale * exhale);
        
        const inhaleWidth = inhale * scale;
        const holdWidth = hold * scale;
        const exhaleWidth = exhale * scale;
        
        const startX = (width - holdWidth) / 2;
        const topLeftX = startX;
        const topRightX = startX + holdWidth;
        const baseX = startX + (holdWidth / 2);
        
        // Simple clean triangle
        const trianglePath = `M ${baseX} ${baseY} L ${topLeftX} ${topY} L ${topRightX} ${topY} Z`;
        
        // Separate paths for each edge (for highlighting)
        const leftPath = `M ${baseX} ${baseY} L ${topLeftX} ${topY}`;
        const topPath = `M ${topLeftX} ${topY} L ${topRightX} ${topY}`;
        const rightPath = `M ${topRightX} ${topY} L ${baseX} ${baseY}`;
        
        document.getElementById('trianglePath').setAttribute('d', trianglePath);
        document.getElementById('trianglePathLeft').setAttribute('d', leftPath);
        document.getElementById('trianglePathTop').setAttribute('d', topPath);
        document.getElementById('trianglePathRight').setAttribute('d', rightPath);
        
        // Reset all overlay edges
        document.getElementById('trianglePathLeft').setAttribute('opacity', '0');
        document.getElementById('trianglePathTop').setAttribute('opacity', '0');
        document.getElementById('trianglePathRight').setAttribute('opacity', '0');
        
        this.cursor.setAttribute('cx', baseX);
        this.cursor.setAttribute('cy', baseY);
    }
    
    toggleBreathing() {
        if (this.isRunning) {
            this.stopBreathing();
        } else {
            this.startBreathing();
        }
    }
    
    startBreathing() {
        this.playIcon.style.display = 'none';
        this.pauseIcon.style.display = 'block';
        this.modeBtns.forEach(btn => btn.disabled = true);
        
        // Start countdown before breathing
        this.startCountdown();
    }
    
    startCountdown() {
        let count = 3;
        this.countdownOverlay.style.display = 'flex';
        this.countdownNumber.textContent = count;
        
        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                this.countdownNumber.textContent = count;
                // Restart animation
                this.countdownNumber.style.animation = 'none';
                setTimeout(() => {
                    this.countdownNumber.style.animation = 'countdownPulse 1s ease-in-out';
                }, 10);
            } else {
                clearInterval(countdownInterval);
                // Hide countdown and start breathing
                $(this.countdownOverlay).fadeOut(300, () => {
                    this.beginBreathing();
                });
            }
        }, 1000);
    }
    
    beginBreathing() {
        this.isRunning = true;
        
        // Reset points system
        this.activePoints = new Map();
        this.lastPhase = null;
        
        // Show triangle with fade-in
        this.triangleSvg.classList.add('visible');
        
        if (!this.startTime) {
            this.startTime = Date.now();
        }
        
        this.animateBreathingCycle();
    }
    
    stopBreathing() {
        this.isRunning = false;
        this.playIcon.style.display = 'block';
        this.pauseIcon.style.display = 'none';
        
        // Hide countdown if visible
        this.countdownOverlay.style.display = 'none';
        
        // Hide triangle with fade-out
        this.triangleSvg.classList.remove('visible');
        
        // Clear all active points
        if (this.activePoints) {
            for (let [key, point] of this.activePoints.entries()) {
                point.remove();
            }
            this.activePoints.clear();
        }
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.modeBtns.forEach(btn => btn.disabled = false);
        
        this.cursor.style.opacity = '0';
        this.phaseIndicator.querySelector('span').setAttribute('data-i18n', 'ready');
        this.updateLanguage();
        
        // Reset all overlay edges
        document.getElementById('trianglePathLeft').setAttribute('opacity', '0');
        document.getElementById('trianglePathTop').setAttribute('opacity', '0');
        document.getElementById('trianglePathRight').setAttribute('opacity', '0');
        
        if (this.startTime) {
            this.totalElapsed += Date.now() - this.startTime;
            this.startTime = null;
        }
    }
    
    animateBreathingCycle() {
        const [inhale, hold, exhale] = this.pattern;
        const total = inhale + hold + exhale;
        const totalDuration = total * 1000;
        const cycleStartTime = Date.now();
        
        this.cursor.style.opacity = '1';
        
        const width = 400;
        const height = 260;
        const margin = 30;
        const baseWidth = 300;
        
        const baseY = height - margin;
        const topY = margin;
        
        const scale = baseWidth / Math.sqrt(inhale * inhale + exhale * exhale);
        const holdWidth = hold * scale;
        
        const startX = (width - holdWidth) / 2;
        const topLeftX = startX;
        const topRightX = startX + holdWidth;
        const baseX = startX + (holdWidth / 2);
        
        const animate = () => {
            if (!this.isRunning) return;
            
            const elapsed = Date.now() - cycleStartTime;
            const progress = elapsed / totalDuration;
            
            if (progress >= 1) {
                this.cycles++;
                this.cycleCount.textContent = this.cycles;
                // Clear all points for new cycle
                if (this.activePoints) {
                    for (let [key, point] of this.activePoints.entries()) {
                        $(point).animate({ opacity: 0 }, 400, () => {
                            point.remove();
                        });
                    }
                    this.activePoints.clear();
                }
                this.lastPhase = null;
                this.animateBreathingCycle();
                return;
            }
            
            const inhaleEnd = inhale / total;
            const holdEnd = (inhale + hold) / total;
            
            let x, y, phase;
            
            if (progress < inhaleEnd) {
                const inhaleProgress = progress / inhaleEnd;
                x = baseX + (topLeftX - baseX) * inhaleProgress;
                y = baseY + (topY - baseY) * inhaleProgress;
                phase = 'inhaling';
            } else if (progress < holdEnd) {
                const holdProgress = (progress - inhaleEnd) / (holdEnd - inhaleEnd);
                x = topLeftX + (topRightX - topLeftX) * holdProgress;
                y = topY;
                phase = 'holding';
            } else {
                const exhaleProgress = (progress - holdEnd) / (1 - holdEnd);
                x = topRightX + (baseX - topRightX) * exhaleProgress;
                y = topY + (baseY - topY) * exhaleProgress;
                phase = 'exhaling';
            }
            
            this.cursor.setAttribute('cx', x);
            this.cursor.setAttribute('cy', y);
            
            // Check for intermediate points and show brief flash
            this.checkIntermediatePoints(phase, progress, inhaleEnd, holdEnd, x, y);
            
            if (phase !== this.currentPhase) {
                this.currentPhase = phase;
                this.phaseIndicator.querySelector('span').setAttribute('data-i18n', phase);
                this.updateLanguage();
                
                // Reset all overlay edges
                document.getElementById('trianglePathLeft').setAttribute('opacity', '0');
                document.getElementById('trianglePathTop').setAttribute('opacity', '0');
                document.getElementById('trianglePathRight').setAttribute('opacity', '0');
                
                // Show the active edge
                if (phase === 'inhaling') {
                    document.getElementById('trianglePathLeft').setAttribute('opacity', '1');
                } else if (phase === 'holding') {
                    document.getElementById('trianglePathTop').setAttribute('opacity', '1');
                } else if (phase === 'exhaling') {
                    document.getElementById('trianglePathRight').setAttribute('opacity', '1');
                }
            }
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    checkIntermediatePoints(phase, progress, inhaleEnd, holdEnd, x, y) {
        const [inhale, hold, exhale] = this.pattern;
        const total = inhale + hold + exhale;
        
        // Initialize active points if needed
        if (!this.activePoints) this.activePoints = new Map();
        
        // Define intermediate points for each phase
        let intermediatePoints = [];
        
        if (phase === 'inhaling') {
            const phaseProgress = progress / inhaleEnd;
            intermediatePoints = [0.25, 0.5, 0.75];
        } else if (phase === 'holding') {
            const phaseProgress = (progress - inhaleEnd) / (holdEnd - inhaleEnd);
            if (hold >= 5) {
                intermediatePoints = [0.2, 0.4, 0.6, 0.8];
            } else if (hold >= 3) {
                intermediatePoints = [0.33, 0.66];
            }
        } else if (phase === 'exhaling') {
            const phaseProgress = (progress - holdEnd) / (1 - holdEnd);
            if (exhale >= 6) {
                intermediatePoints = [0.17, 0.33, 0.5, 0.67, 0.83];
            } else {
                intermediatePoints = [0.25, 0.5, 0.75];
            }
        }
        
        // Check if we're close to any intermediate point
        const currentPhaseProgress = this.getCurrentPhaseProgress(phase, progress, inhaleEnd, holdEnd);
        
        for (let point of intermediatePoints) {
            const tolerance = 0.05; // 5% tolerance around the point
            const pointKey = `${phase}-${point}`;
            
            if (Math.abs(currentPhaseProgress - point) < tolerance) {
                if (!this.activePoints.has(pointKey)) {
                    const flash = this.createIntermediatePoint(x, y);
                    this.activePoints.set(pointKey, flash);
                }
            }
        }
        
        // Remove points when phase changes
        if (phase !== this.lastPhase && this.lastPhase) {
            this.clearPhasePoints(this.lastPhase);
        }
        this.lastPhase = phase;
    }
    
    getCurrentPhaseProgress(phase, totalProgress, inhaleEnd, holdEnd) {
        if (phase === 'inhaling') {
            return totalProgress / inhaleEnd;
        } else if (phase === 'holding') {
            return (totalProgress - inhaleEnd) / (holdEnd - inhaleEnd);
        } else if (phase === 'exhaling') {
            return (totalProgress - holdEnd) / (1 - holdEnd);
        }
        return 0;
    }
    
    createIntermediatePoint(x, y) {
        // Create a persistent point - smaller radius
        const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        point.setAttribute('cx', x);
        point.setAttribute('cy', y);
        point.setAttribute('r', '3');
        point.setAttribute('fill', '#60a5fa');
        point.setAttribute('opacity', '0');
        
        // Add to SVG
        const svg = document.getElementById('triangleSvg');
        svg.appendChild(point);
        
        // Fade in
        $(point).animate({ opacity: 1 }, 600);
        
        return point;
    }
    
    clearPhasePoints(phase) {
        // Remove all points for the given phase
        const keysToRemove = [];
        for (let [key, point] of this.activePoints.entries()) {
            if (key.startsWith(phase + '-')) {
                // Fade out and remove
                $(point).animate({ opacity: 0 }, 800, () => {
                    point.remove();
                });
                keysToRemove.push(key);
            }
        }
        
        // Clean up the map
        keysToRemove.forEach(key => this.activePoints.delete(key));
    }
    
    updateTimer() {
        setInterval(() => {
            if (this.isRunning && this.startTime) {
                const total = this.totalElapsed + (Date.now() - this.startTime);
                const minutes = Math.floor(total / 60000);
                const seconds = Math.floor((total % 60000) / 1000);
                this.totalTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else if (this.totalElapsed > 0) {
                const minutes = Math.floor(this.totalElapsed / 60000);
                const seconds = Math.floor((this.totalElapsed % 60000) / 1000);
                this.totalTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    initPWA() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').catch(err => {
                console.log('Service Worker registration failed:', err);
            });
        }
        
        // Initialiser le système de mise à jour (non-bloquant)
        setTimeout(() => {
            new UpdateManager();
        }, 500);
        
        // Initialiser le nouveau système d'installation PWA
        setTimeout(() => {
            new PWAInstaller();
        }, 1500);
        
        // Cacher le bouton d'installation par défaut - le nouveau système le gère
        this.installBtn.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BreathingApp();
});