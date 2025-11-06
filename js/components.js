// Component Loader for Header and Footer
class ComponentLoader {
    static async loadComponent(containerId, componentPath) {
        try {
            console.log(`🔄 Loading ${componentPath}...`);
            const response = await fetch(componentPath);
            if (!response.ok) {
                throw new Error(`Failed to load ${componentPath}: ${response.status}`);
            }
            
            const html = await response.text();
            const container = document.getElementById(containerId);
            
            if (container) {
                container.innerHTML = html;
                console.log(`✅ Loaded ${componentPath} into #${containerId}`);
                
                if (containerId === 'header') {
                    // Small delay to ensure DOM is ready
                    setTimeout(() => this.initHeader(), 100);
                }
                
            } else {
                console.error(`❌ Container #${containerId} not found`);
            }
        } catch (error) {
            console.error(`❌ Error loading ${componentPath}:`, error);
            this.createFallbackComponent(containerId);
        }
    }

    static initHeader() {
        console.log('🔄 Initializing header on:', window.location.pathname);
        
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileOverlay = document.getElementById('mobile-menu-overlay');
        
        console.log('Mobile elements found:', {
            toggle: !!mobileToggle,
            menu: !!mobileMenu,
            overlay: !!mobileOverlay
        });

        if (mobileToggle && mobileMenu && mobileOverlay) {
            console.log('✅ All mobile menu elements found, setting up event listeners...');
            
            const toggleMenu = (isOpening) => {
                console.log('🍔 Toggling menu, opening:', isOpening);
                mobileToggle.classList.toggle('active');
                mobileMenu.classList.toggle('active');
                mobileOverlay.classList.toggle('active');
                document.body.classList.toggle('menu-open');
                
                if (isOpening) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            };

            // Toggle menu on button click
            mobileToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📱 Mobile menu button clicked');
                const isOpening = !mobileToggle.classList.contains('active');
                toggleMenu(isOpening);
            });

            // Close menu on overlay click
            mobileOverlay.addEventListener('click', () => {
                console.log('🎯 Overlay clicked, closing menu');
                toggleMenu(false);
            });

            // Close menu on link click
            const mobileLinks = mobileMenu.querySelectorAll('.mobile-nav-link');
            mobileLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    console.log('🔗 Mobile link clicked:', e.target.textContent);
                    // Small delay to allow navigation
                    setTimeout(() => toggleMenu(false), 300);
                });
            });

            // Close menu on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
                    console.log('⎋ Escape key pressed, closing menu');
                    toggleMenu(false);
                }
            });

            // Close menu when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (mobileMenu.classList.contains('active') && 
                    !mobileToggle.contains(e.target) && 
                    !mobileMenu.contains(e.target) &&
                    !mobileOverlay.contains(e.target)) {
                    console.log('👆 Click outside, closing menu');
                    toggleMenu(false);
                }
            });

            console.log('✅ Mobile menu event listeners attached');

        } else {
            console.error('❌ Missing mobile menu elements:', {
                toggle: mobileToggle,
                menu: mobileMenu,
                overlay: mobileOverlay
            });
            
            // Try fallback initialization
            this.fallbackMobileMenu();
        }

        // Set active nav link
        this.setActiveNavLink();
    }

    static fallbackMobileMenu() {
        console.log('🔄 Trying fallback mobile menu initialization...');
        const toggle = document.getElementById('mobile-menu-toggle');
        const menu = document.getElementById('mobile-menu');
        
        if (toggle && menu) {
            console.log('✅ Found elements in fallback, setting up simple toggle...');
            toggle.addEventListener('click', function() {
                console.log('🍔 Fallback: Hamburger clicked');
                this.classList.toggle('active');
                menu.classList.toggle('active');
                document.body.classList.toggle('menu-open');
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
            // Initialize the fallback header
            setTimeout(() => {
                this.initHeader();
                this.fallbackMobileMenu();
            }, 200);
        }
    }

    static async loadAllComponents() {
        console.log('🚀 Starting to load all components...');
        try {
            await Promise.all([
                this.loadComponent('header', 'components/header.html'),
                this.loadComponent('footer', 'components/footer.html')
            ]);
            console.log('✅ All components loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load components:', error);
        }
    }
}

// Load components when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM Content Loaded - Initializing components...');
    ComponentLoader.loadAllComponents().catch(error => {
        console.error('❌ Component loading failed:', error);
    });
});

// Additional safety net
window.addEventListener('load', function() {
    console.log('🖼️ Window loaded - checking component status...');
    // Check if header was loaded properly
    const header = document.querySelector('.main-header');
    if (!header || header.innerHTML.includes('Loading')) {
        console.log('⚠️ Header not loaded properly, triggering fallback...');
        ComponentLoader.createFallbackComponent('header');
    }
});