// Component Loader for Header and Footer with Performance Optimizations
class ComponentLoader {
    static cache = new Map();
    static isInitialized = false;
    static pendingInitializations = new Set();

    static async loadComponent(containerId, componentPath) {
        // Return cached component if available
        if (this.cache.has(componentPath)) {
            console.log(`⚡ Using cached ${componentPath}`);
            const html = this.cache.get(componentPath);
            this.injectComponent(containerId, html, true);
            return;
        }

        try {
            console.log(`🔄 Loading ${componentPath}...`);
            const response = await fetch(componentPath, {
                cache: 'force-cache',
                headers: {
                    'Cache-Control': 'max-age=300'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to load ${componentPath}: ${response.status}`);
            }
            
            const html = await response.text();
            
            // Cache the component
            this.cache.set(componentPath, html);
            
            this.injectComponent(containerId, html, false);
            console.log(`✅ Loaded and cached ${componentPath}`);
            
        } catch (error) {
            console.error(`❌ Error loading ${componentPath}:`, error);
            this.createFallbackComponent(containerId);
        }
    }

    static injectComponent(containerId, html, fromCache = false) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`❌ Container #${containerId} not found`);
            return;
        }

        container.innerHTML = html;
        
        if (containerId === 'header') {
            // Initialize header immediately if from cache, otherwise use microtask
            if (fromCache) {
                this.initHeader();
            } else {
                // Use microtask for faster initialization
                Promise.resolve().then(() => this.initHeader());
            }
        }
    }

    static initHeader() {
        if (this.pendingInitializations.has('header')) {
            return; // Avoid duplicate initialization
        }
        
        this.pendingInitializations.add('header');
        console.log('🔄 Initializing header...');
        
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileOverlay = document.getElementById('mobile-menu-overlay');

        if (!mobileToggle || !mobileMenu || !mobileOverlay) {
            console.error('❌ Missing mobile menu elements');
            this.pendingInitializations.delete('header');
            this.fallbackMobileMenu();
            return;
        }

        console.log('✅ All mobile menu elements found');

        // Use event delegation for better performance
        this.setupEventDelegation(mobileToggle, mobileMenu, mobileOverlay);
        this.setActiveNavLink();
        
        this.pendingInitializations.delete('header');
        this.isInitialized = true;
    }

    static setupEventDelegation(mobileToggle, mobileMenu, mobileOverlay) {
        let isMenuOpen = false;

        const toggleMenu = (open) => {
            isMenuOpen = open;
            mobileToggle.classList.toggle('active', open);
            mobileMenu.classList.toggle('active', open);
            mobileOverlay.classList.toggle('active', open);
            document.body.classList.toggle('menu-open', open);
            document.body.style.overflow = open ? 'hidden' : '';
        };

        // Single event listener for all interactions
        document.body.addEventListener('click', (e) => {
            // Mobile menu toggle
            if (e.target.closest('#mobile-menu-toggle')) {
                e.preventDefault();
                toggleMenu(!isMenuOpen);
                return;
            }
            
            // Overlay click
            if (e.target.closest('#mobile-menu-overlay')) {
                toggleMenu(false);
                return;
            }
            
            // Mobile nav link click
            if (e.target.closest('.mobile-nav-link')) {
                toggleMenu(false);
                return;
            }
            
            // Click outside to close
            if (isMenuOpen && 
                !e.target.closest('#mobile-menu') && 
                !e.target.closest('#mobile-menu-toggle')) {
                toggleMenu(false);
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMenuOpen) {
                toggleMenu(false);
            }
        });

        console.log('✅ Event delegation setup complete');
    }

    static fallbackMobileMenu() {
        console.log('🔄 Trying fallback mobile menu...');
        const toggle = document.getElementById('mobile-menu-toggle');
        const menu = document.getElementById('mobile-menu');
        
        if (toggle && menu) {
            toggle.addEventListener('click', function() {
                const isActive = this.classList.toggle('active');
                menu.classList.toggle('active', isActive);
                document.body.classList.toggle('menu-open', isActive);
            });
        }
    }

    static setActiveNavLink() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
        
        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    static createFallbackComponent(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (containerId === 'header') {
            console.log('🔄 Creating fallback header...');
            container.innerHTML = `
                <header class="main-header">
                    <div class="container">
                        <nav class="navbar">
                            <a href="index.html" class="logo">
                                <div class="logo-icon">
                                    <i class="fas fa-bolt"></i>
                                </div>
                                <span class="logo-text">SwiftBliss Jobs</span>
                                <span class="logo-text-mobile">SwiftBliss</span>
                            </a>
                            <div class="nav-links">
                                <a href="index.html" class="nav-link">Home</a>
                                <a href="jobs.html" class="nav-link">Find Jobs</a>
                                <a href="about.html" class="nav-link">About</a>
                                <a href="contact.html" class="nav-link">Contact</a>
                            </div>
                            <button class="mobile-menu-toggle" id="mobile-menu-toggle">
                                <span class="bar"></span>
                                <span class="bar"></span>
                                <span class="bar"></span>
                            </button>
                        </nav>
                    </div>
                    <div class="mobile-menu-overlay" id="mobile-menu-overlay"></div>
                    <div class="mobile-menu" id="mobile-menu">
                        <nav class="mobile-nav">
                            <a href="index.html" class="mobile-nav-link">Home</a>
                            <a href="jobs.html" class="mobile-nav-link">Find Jobs</a>
                            <a href="about.html" class="mobile-nav-link">About</a>
                            <a href="contact.html" class="mobile-nav-link">Contact</a>
                        </nav>
                    </div>
                </header>
            `;
            // Initialize immediately
            this.initHeader();
        }
    }

    static async loadAllComponents() {
        console.log('🚀 Starting to load all components...');
        
        try {
            // Load components in parallel with caching
            await Promise.allSettled([
                this.loadComponent('header', 'components/header.html'),
                this.loadComponent('footer', 'components/footer.html')
            ]);
            
            console.log('✅ All components loaded');
        } catch (error) {
            console.error('❌ Component loading failed:', error);
        }
    }

    // Preload components for faster navigation
    static preloadComponents() {
        const components = ['components/header.html', 'components/footer.html'];
        
        components.forEach(componentPath => {
            if (!this.cache.has(componentPath)) {
                fetch(componentPath, { cache: 'force-cache' })
                    .then(response => response.text())
                    .then(html => {
                        this.cache.set(componentPath, html);
                        console.log(`⚡ Preloaded ${componentPath}`);
                    })
                    .catch(error => {
                        console.warn(`⚠️ Could not preload ${componentPath}:`, error);
                    });
            }
        });
    }

    // Initialize scroll effects for modern design
    static initScrollEffects() {
        const header = document.querySelector('.main-header');
        if (!header) return;

        const updateHeader = () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        };

        // Throttled scroll handler
        let ticking = false;
        const throttledUpdate = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateHeader();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', throttledUpdate, { passive: true });
        updateHeader(); // Initial check
    }
}

// Enhanced initialization with multiple strategies
class SwiftBlissApp {
    static init() {
        console.log('🚀 SwiftBliss App Initializing...');
        
        // Strategy 1: Start loading immediately if DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startApp());
        } else {
            this.startApp();
        }
        
        // Preload components when user interacts with navigation
        this.setupPreloading();
    }

    static startApp() {
        console.log('📄 DOM Ready - Starting component load...');
        
        // Load components with priority
        ComponentLoader.loadAllComponents().then(() => {
            // Initialize scroll effects after components are loaded
            setTimeout(() => {
                ComponentLoader.initScrollEffects();
            }, 100);
        }).catch(error => {
            console.error('❌ App initialization failed:', error);
        });
    }

    static setupPreloading() {
        // Preload components on navigation hover
        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a[href]');
            if (link && !link.href.includes('#') && !ComponentLoader.isInitialized) {
                ComponentLoader.preloadComponents();
            }
        }, { once: true, passive: true });

        // Preload on touch start for mobile
        document.addEventListener('touchstart', () => {
            if (!ComponentLoader.isInitialized) {
                ComponentLoader.preloadComponents();
            }
        }, { once: true, passive: true });
    }
}

// Performance monitoring
class PerformanceMonitor {
    static startTime = performance.now();
    
    static logPerformance() {
        const loadTime = performance.now() - this.startTime;
        console.log(`⏱️  Page loaded in ${loadTime.toFixed(2)}ms`);
        
        // Log component cache status
        console.log(`📦 Cache size: ${ComponentLoader.cache.size} components`);
    }
}

// Initialize the application
SwiftBlissApp.init();

// Performance monitoring
window.addEventListener('load', () => {
    PerformanceMonitor.logPerformance();
    
    // Final safety check
    setTimeout(() => {
        const header = document.querySelector('.main-header');
        if (!header || header.children.length === 0) {
            console.log('⚠️ Header missing, creating fallback...');
            ComponentLoader.createFallbackComponent('header');
        }
    }, 1000);
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ComponentLoader, SwiftBlissApp };
}