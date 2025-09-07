class UpdateManager {
    constructor() {
        this.currentVersion = '2.0.0'; // Version actuelle de l'app
        this.updateAvailable = false;
        this.updateBanner = null;
        this.checkInterval = 60 * 60 * 1000; // Vérifier toutes les heures
        this.lastCheck = parseInt(localStorage.getItem('last-update-check') || '0');
        
        // Initialiser les vérifications
        this.init();
    }
    
    init() {
        // Vérifier immédiatement de manière asynchrone
        this.checkForUpdates();
        
        // Configurer les vérifications périodiques
        this.setupPeriodicCheck();
        
        // Écouter les événements du service worker
        this.setupServiceWorkerListeners();
        
        // Injecter les styles
        this.injectStyles();
    }
    
    async checkForUpdates() {
        // Ne pas bloquer - exécuter en arrière-plan
        try {
            // Vérifier la connectivité
            if (!navigator.onLine) {
                console.log('Hors ligne - vérification des mises à jour ignorée');
                return;
            }
            
            // Limiter la fréquence des vérifications
            const now = Date.now();
            if (now - this.lastCheck < 5 * 60 * 1000) { // Minimum 5 minutes entre les vérifications
                return;
            }
            
            // Récupérer la version depuis le serveur avec cache-busting
            const response = await fetch(`/version.json?t=${Date.now()}`, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });
            
            if (!response.ok) {
                throw new Error('Impossible de récupérer les informations de version');
            }
            
            const versionInfo = await response.json();
            
            // Sauvegarder le timestamp de la dernière vérification
            localStorage.setItem('last-update-check', now.toString());
            this.lastCheck = now;
            
            // Comparer les versions
            if (this.isNewerVersion(versionInfo.version, this.currentVersion)) {
                this.updateAvailable = true;
                this.showUpdateNotification(versionInfo);
            }
            
        } catch (error) {
            console.log('Vérification des mises à jour échouée (non-critique):', error.message);
            // Ne pas afficher d'erreur à l'utilisateur - c'est non-bloquant
        }
    }
    
    isNewerVersion(remoteVersion, localVersion) {
        const remote = remoteVersion.split('.').map(Number);
        const local = localVersion.split('.').map(Number);
        
        for (let i = 0; i < 3; i++) {
            if (remote[i] > local[i]) return true;
            if (remote[i] < local[i]) return false;
        }
        
        return false;
    }
    
    setupPeriodicCheck() {
        // Vérifier périodiquement les mises à jour
        setInterval(() => {
            this.checkForUpdates();
        }, this.checkInterval);
        
        // Vérifier quand l'app redevient active
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForUpdates();
            }
        });
        
        // Vérifier quand la connexion est rétablie
        window.addEventListener('online', () => {
            setTimeout(() => this.checkForUpdates(), 2000);
        });
    }
    
    setupServiceWorkerListeners() {
        if (!('serviceWorker' in navigator)) return;
        
        // Écouter les mises à jour du service worker
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            // Un nouveau service worker a pris le contrôle
            console.log('Nouveau service worker activé');
        });
        
        // Vérifier s'il y a une mise à jour en attente
        navigator.serviceWorker.ready.then(registration => {
            // Écouter les mises à jour
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Nouvelle version disponible
                        this.showUpdateNotification({
                            version: 'Nouvelle version',
                            features: ['Améliorations de performance', 'Corrections de bugs'],
                            critical: false
                        });
                    }
                });
            });
            
            // Vérifier manuellement les mises à jour du SW
            if (registration.waiting) {
                // Il y a déjà une mise à jour en attente
                this.showServiceWorkerUpdatePrompt(registration.waiting);
            }
        });
    }
    
    showUpdateNotification(versionInfo) {
        // Ne pas afficher plusieurs fois
        if (this.updateBanner && !this.updateBanner.classList.contains('hidden')) {
            return;
        }
        
        // Créer le banner de mise à jour
        if (!this.updateBanner) {
            this.createUpdateBanner();
        }
        
        // Mettre à jour le contenu
        const title = this.updateBanner.querySelector('.update-banner-title');
        const subtitle = this.updateBanner.querySelector('.update-banner-subtitle');
        
        title.textContent = `Version ${versionInfo.version} disponible`;
        
        if (versionInfo.features && versionInfo.features.length > 0) {
            subtitle.textContent = versionInfo.features[0];
        } else {
            subtitle.textContent = 'Nouvelles fonctionnalités et améliorations';
        }
        
        // Afficher avec animation
        this.updateBanner.classList.remove('hidden');
        setTimeout(() => {
            this.updateBanner.classList.add('visible');
        }, 100);
        
        // Si mise à jour critique, insister davantage
        if (versionInfo.critical) {
            this.updateBanner.classList.add('critical');
        }
    }
    
    showServiceWorkerUpdatePrompt(worker) {
        if (!this.updateBanner) {
            this.createUpdateBanner();
        }
        
        const title = this.updateBanner.querySelector('.update-banner-title');
        const subtitle = this.updateBanner.querySelector('.update-banner-subtitle');
        const updateBtn = this.updateBanner.querySelector('.update-banner-update');
        
        title.textContent = 'Mise à jour prête';
        subtitle.textContent = 'Cliquez pour appliquer les dernières améliorations';
        
        // Modifier le comportement du bouton pour cette mise à jour SW
        updateBtn.onclick = () => {
            worker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        };
        
        this.updateBanner.classList.remove('hidden');
        setTimeout(() => {
            this.updateBanner.classList.add('visible');
        }, 100);
    }
    
    createUpdateBanner() {
        const banner = document.createElement('div');
        banner.className = 'update-banner hidden';
        banner.innerHTML = `
            <div class="update-banner-content">
                <div class="update-banner-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <path d="M12 8V12L14 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <path d="M4 4L4 8L8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="update-banner-text">
                    <div class="update-banner-title">Mise à jour disponible</div>
                    <div class="update-banner-subtitle">Nouvelles fonctionnalités disponibles</div>
                </div>
                <button class="update-banner-close" aria-label="Fermer">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
            <div class="update-banner-actions">
                <button class="update-banner-update">Mettre à jour</button>
                <button class="update-banner-later">Plus tard</button>
            </div>
        `;
        
        document.body.appendChild(banner);
        this.updateBanner = banner;
        
        // Event listeners
        const closeBtn = banner.querySelector('.update-banner-close');
        const updateBtn = banner.querySelector('.update-banner-update');
        const laterBtn = banner.querySelector('.update-banner-later');
        
        closeBtn.addEventListener('click', () => this.hideUpdateBanner());
        laterBtn.addEventListener('click', () => this.hideUpdateBanner());
        
        updateBtn.addEventListener('click', () => {
            this.performUpdate();
        });
    }
    
    hideUpdateBanner() {
        if (!this.updateBanner) return;
        
        this.updateBanner.classList.remove('visible');
        setTimeout(() => {
            this.updateBanner.classList.add('hidden');
        }, 300);
    }
    
    async performUpdate() {
        try {
            // Afficher un indicateur de chargement
            const updateBtn = this.updateBanner.querySelector('.update-banner-update');
            const originalText = updateBtn.textContent;
            updateBtn.textContent = 'Mise à jour...';
            updateBtn.disabled = true;
            
            // Forcer le service worker à se mettre à jour
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                await registration.update();
                
                // Attendre un peu pour que le SW se mette à jour
                setTimeout(() => {
                    // Recharger la page pour obtenir la nouvelle version
                    window.location.reload(true);
                }, 1000);
            } else {
                // Pas de service worker, juste recharger
                window.location.reload(true);
            }
            
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            // Recharger quand même
            window.location.reload(true);
        }
    }
    
    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .update-banner {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%) translateY(-150%);
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                padding: 12px;
                z-index: 9999;
                transition: transform 0.3s ease-out;
                max-width: 380px;
                width: calc(100% - 40px);
                border: 2px solid transparent;
                background-clip: padding-box;
            }
            
            .update-banner.visible {
                transform: translateX(-50%) translateY(0);
            }
            
            .update-banner.hidden {
                display: none;
            }
            
            .update-banner.critical {
                border-color: #ef4444;
                animation: pulse-border 2s infinite;
            }
            
            @keyframes pulse-border {
                0%, 100% { border-color: #ef4444; }
                50% { border-color: #fca5a5; }
            }
            
            .update-banner-content {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
                position: relative;
            }
            
            .update-banner-icon {
                width: 36px;
                height: 36px;
                background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                margin-right: 10px;
                flex-shrink: 0;
                animation: rotate 4s linear infinite;
            }
            
            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .update-banner-text {
                flex: 1;
                padding-right: 20px;
            }
            
            .update-banner-title {
                font-weight: 600;
                font-size: 14px;
                color: #1f2937;
                margin-bottom: 2px;
            }
            
            .update-banner-subtitle {
                font-size: 12px;
                color: #6b7280;
            }
            
            .update-banner-close {
                position: absolute;
                top: -4px;
                right: -4px;
                width: 20px;
                height: 20px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: #6b7280;
                transition: all 0.2s;
            }
            
            .update-banner-close:hover {
                color: #374151;
                border-color: #d1d5db;
            }
            
            .update-banner-actions {
                display: flex;
                gap: 8px;
            }
            
            .update-banner-update, .update-banner-later {
                flex: 1;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                border: none;
            }
            
            .update-banner-update {
                background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
                color: white;
            }
            
            .update-banner-update:hover:not(:disabled) {
                transform: scale(1.02);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            }
            
            .update-banner-update:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }
            
            .update-banner-later {
                background: #f3f4f6;
                color: #4b5563;
            }
            
            .update-banner-later:hover {
                background: #e5e7eb;
            }
            
            /* Animation de pulsation pour attirer l'attention */
            @keyframes subtle-pulse {
                0%, 100% { transform: translateX(-50%) translateY(0) scale(1); }
                50% { transform: translateX(-50%) translateY(0) scale(1.02); }
            }
            
            .update-banner.visible:not(.critical) {
                animation: subtle-pulse 3s ease-in-out infinite;
            }
        `;
        document.head.appendChild(style);
    }
}

// Exporter pour utilisation
window.UpdateManager = UpdateManager;