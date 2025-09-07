class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = null;
        this.installBanner = null;
        this.platform = this.detectPlatform();
        this.isStandalone = this.checkStandalone();
        
        // Vérifier si l'utilisateur a déjà refusé l'installation
        this.installDismissed = localStorage.getItem('pwa-install-dismissed');
        this.installDismissedTime = localStorage.getItem('pwa-install-dismissed-time');
        
        // Ne pas montrer le prompt pendant 7 jours après refus
        this.dismissDuration = 7 * 24 * 60 * 60 * 1000; // 7 jours en ms
        
        this.init();
    }
    
    detectPlatform() {
        const ua = navigator.userAgent.toLowerCase();
        
        if (/iphone|ipad|ipod/.test(ua)) {
            return 'ios';
        } else if (/android/.test(ua)) {
            return 'android';
        } else if (/windows phone/.test(ua)) {
            return 'windows';
        }
        
        return 'desktop';
    }
    
    checkStandalone() {
        // Vérifier si l'app est déjà installée
        return window.matchMedia('(display-mode: standalone)').matches || 
               window.navigator.standalone || 
               document.referrer.includes('android-app://');
    }
    
    init() {
        // Ne rien faire si l'app est déjà installée
        if (this.isStandalone) {
            console.log('App déjà installée en mode standalone');
            return;
        }
        
        // Vérifier si on doit afficher le prompt
        if (this.shouldShowPrompt()) {
            this.createInstallUI();
            this.setupEventListeners();
            
            // Afficher le prompt après un délai (meilleure UX)
            if (this.platform === 'ios') {
                // iOS ne supporte pas beforeinstallprompt, montrer après 2 secondes
                setTimeout(() => this.showIOSPrompt(), 2000);
            } else {
                // Android/Desktop - attendre l'événement beforeinstallprompt
                this.setupA2HSEvent();
            }
        }
    }
    
    shouldShowPrompt() {
        // Ne pas montrer si récemment refusé
        if (this.installDismissed && this.installDismissedTime) {
            const dismissedTime = parseInt(this.installDismissedTime);
            const now = Date.now();
            
            if (now - dismissedTime < this.dismissDuration) {
                return false;
            }
        }
        
        // Ne montrer que sur mobile ou si spécifiquement supporté
        return this.platform === 'ios' || this.platform === 'android';
    }
    
    createInstallUI() {
        // Créer un banner personnalisé plus attractif
        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.className = 'pwa-install-banner hidden';
        banner.innerHTML = `
            <div class="pwa-banner-content">
                <div class="pwa-banner-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L12 14M12 14L16 10M12 14L8 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <path d="M5 16V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
                <div class="pwa-banner-text">
                    <div class="pwa-banner-title">Installer l'application</div>
                    <div class="pwa-banner-subtitle">Accès rapide depuis votre écran d'accueil</div>
                </div>
                <button class="pwa-banner-close" aria-label="Fermer">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
            <div class="pwa-banner-actions">
                <button class="pwa-banner-install">Installer</button>
                <button class="pwa-banner-later">Plus tard</button>
            </div>
        `;
        
        document.body.appendChild(banner);
        this.installBanner = banner;
        
        // Ajouter les styles CSS
        this.injectStyles();
    }
    
    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .pwa-install-banner {
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                padding: 16px;
                z-index: 10000;
                transform: translateY(150%);
                transition: transform 0.3s ease-out;
                max-width: 400px;
                margin: 0 auto;
            }
            
            .pwa-install-banner.visible {
                transform: translateY(0);
            }
            
            .pwa-install-banner.hidden {
                display: none;
            }
            
            .pwa-banner-content {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
                position: relative;
            }
            
            .pwa-banner-icon {
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                margin-right: 12px;
                flex-shrink: 0;
            }
            
            .pwa-banner-text {
                flex: 1;
            }
            
            .pwa-banner-title {
                font-weight: 600;
                font-size: 16px;
                color: #1f2937;
                margin-bottom: 2px;
            }
            
            .pwa-banner-subtitle {
                font-size: 14px;
                color: #6b7280;
            }
            
            .pwa-banner-close {
                position: absolute;
                top: -8px;
                right: -8px;
                width: 24px;
                height: 24px;
                background: white;
                border: none;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: #6b7280;
                transition: color 0.2s;
            }
            
            .pwa-banner-close:hover {
                color: #374151;
            }
            
            .pwa-banner-actions {
                display: flex;
                gap: 8px;
            }
            
            .pwa-banner-install, .pwa-banner-later {
                flex: 1;
                padding: 10px 16px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                border: none;
            }
            
            .pwa-banner-install {
                background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
                color: white;
            }
            
            .pwa-banner-install:hover {
                transform: scale(1.02);
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
            }
            
            .pwa-banner-later {
                background: #f3f4f6;
                color: #4b5563;
            }
            
            .pwa-banner-later:hover {
                background: #e5e7eb;
            }
            
            /* Instructions modales pour iOS */
            .ios-install-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
                padding: 20px;
            }
            
            .ios-install-content {
                background: white;
                border-radius: 16px;
                padding: 24px;
                max-width: 340px;
                width: 100%;
                text-align: center;
            }
            
            .ios-install-icon {
                width: 60px;
                height: 60px;
                margin: 0 auto 16px;
                background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .ios-install-title {
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 12px;
                color: #1f2937;
            }
            
            .ios-install-steps {
                text-align: left;
                margin: 20px 0;
            }
            
            .ios-install-step {
                display: flex;
                align-items: start;
                margin-bottom: 16px;
                font-size: 14px;
                color: #4b5563;
            }
            
            .ios-install-step-number {
                width: 24px;
                height: 24px;
                background: #2563eb;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 600;
                margin-right: 12px;
                flex-shrink: 0;
            }
            
            .ios-install-button {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        if (!this.installBanner) return;
        
        // Bouton fermer
        const closeBtn = this.installBanner.querySelector('.pwa-banner-close');
        closeBtn?.addEventListener('click', () => this.dismissBanner(true));
        
        // Bouton "Plus tard"
        const laterBtn = this.installBanner.querySelector('.pwa-banner-later');
        laterBtn?.addEventListener('click', () => this.dismissBanner(false));
        
        // Bouton "Installer"
        const installBtn = this.installBanner.querySelector('.pwa-banner-install');
        installBtn?.addEventListener('click', () => this.handleInstallClick());
    }
    
    setupA2HSEvent() {
        // Événement pour Android/Chrome
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            
            // Montrer le banner personnalisé
            this.showBanner();
        });
        
        // Détecter l'installation réussie
        window.addEventListener('appinstalled', () => {
            console.log('PWA installée avec succès');
            this.hideBanner();
            
            // Tracker l'installation (analytics)
            if (typeof gtag !== 'undefined') {
                gtag('event', 'pwa_installed', {
                    platform: this.platform
                });
            }
        });
    }
    
    showBanner() {
        if (!this.installBanner) return;
        
        this.installBanner.classList.remove('hidden');
        setTimeout(() => {
            this.installBanner.classList.add('visible');
        }, 100);
    }
    
    hideBanner() {
        if (!this.installBanner) return;
        
        this.installBanner.classList.remove('visible');
        setTimeout(() => {
            this.installBanner.classList.add('hidden');
        }, 300);
    }
    
    dismissBanner(permanent) {
        this.hideBanner();
        
        if (permanent) {
            // Mémoriser le refus
            localStorage.setItem('pwa-install-dismissed', 'true');
            localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
        }
    }
    
    handleInstallClick() {
        if (this.platform === 'ios') {
            this.showIOSInstructions();
        } else if (this.deferredPrompt) {
            // Android/Chrome
            this.deferredPrompt.prompt();
            
            this.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('Installation acceptée');
                } else {
                    console.log('Installation refusée');
                    this.dismissBanner(true);
                }
                
                this.deferredPrompt = null;
            });
            
            this.hideBanner();
        }
    }
    
    showIOSPrompt() {
        // Vérifier si Safari
        const isSafari = /safari/.test(navigator.userAgent.toLowerCase()) && 
                        !/chrome/.test(navigator.userAgent.toLowerCase());
        
        if (!isSafari) {
            console.log('iOS détecté mais pas Safari - installation non disponible');
            return;
        }
        
        // Montrer le banner pour iOS
        this.showBanner();
    }
    
    showIOSInstructions() {
        const modal = document.createElement('div');
        modal.className = 'ios-install-modal';
        modal.innerHTML = `
            <div class="ios-install-content">
                <div class="ios-install-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2L12 14M12 14L16 10M12 14L8 10" stroke="white" stroke-width="2" stroke-linecap="round"/>
                        <path d="M5 16V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V16" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
                <div class="ios-install-title">Installer l'application</div>
                <div class="ios-install-steps">
                    <div class="ios-install-step">
                        <div class="ios-install-step-number">1</div>
                        <div>Appuyez sur le bouton de partage <svg style="display: inline; width: 16px; height: 16px; vertical-align: middle;" viewBox="0 0 24 24" fill="none"><path d="M8 10H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2h-3m-4-8v12m0-12L8 6m4-4l4 4" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/></svg> en bas de Safari</div>
                    </div>
                    <div class="ios-install-step">
                        <div class="ios-install-step-number">2</div>
                        <div>Faites défiler et appuyez sur "Sur l'écran d'accueil"</div>
                    </div>
                    <div class="ios-install-step">
                        <div class="ios-install-step-number">3</div>
                        <div>Appuyez sur "Ajouter" en haut à droite</div>
                    </div>
                </div>
                <button class="ios-install-button" onclick="this.closest('.ios-install-modal').remove()">Compris</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Fermer en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        this.hideBanner();
        this.dismissBanner(false); // Ne pas marquer comme définitivement refusé
    }
}

// Exporter pour utilisation
window.PWAInstaller = PWAInstaller;