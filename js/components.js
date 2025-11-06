// Component Loader for Header and Footer
class ComponentLoader {
    static async loadComponent(containerId, componentPath) {
        try {
            const response = await fetch(componentPath);
            if (!response.ok) {
                throw new Error(`Failed to load ${componentPath}: ${response.status}`);
            }
            
            const html = await response.text();
            const container = document.getElementById(containerId);
            
            if (container) {
                container.innerHTML = html;
                console.log(`✅ Loaded ${componentPath} into #${containerId}`);
                
                // Initialize component-specific scripts
                if (containerId === 'header') {
                    this.initHeader();
                } else if (containerId === 'footer') {
                    this.initFooter();
                }
                
            } else {
                console.warn(`⚠️ Container #${containerId} not found`);
            }
        } catch (error) {
            console.error(`❌ Error loading ${componentPath}:`, error);
            // Fallback: Create basic header/footer if loading fails
            this.createFallbackComponent(containerId);
        }
    }

    static initHeader() {
        // Mobile menu functionality
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileToggle && mobileMenu) {
            mobileToggle.addEventListener('click', () => {
                mobileToggle.classList.toggle('active');
                mobileMenu.classList.toggle('active');
            });

            // Close mobile menu when clicking on links
            const mobileLinks = mobileMenu.querySelectorAll('.mobile-nav-link');
            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileToggle.classList.remove('active');
                    mobileMenu.classList.remove('active');
                });
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileToggle.contains(e.target) && !mobileMenu.contains(e.target)) {
                    mobileToggle.classList.remove('active');
                    mobileMenu.classList.remove('active');
                }
            });
        }

        // Header scroll effect
        const header = document.querySelector('.main-header');
        if (header) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 100) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            });
        }

        // Set active nav link based on current page
        this.setActiveNavLink();
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

    static initFooter() {
        // Footer-specific initialization can go here
        console.log('Footer initialized');
    }

    static createFallbackComponent(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (containerId === 'header') {
            container.innerHTML = `
                <header class="main-header">
                    <div class="container">
                        <div class="header-content">
                            <div class="logo">
                                <a href="index.html" class="logo-link">
                                    <div class="logo-icon">
                                        <i class="fas fa-bolt"></i>
                                    </div>
                                    <span class="logo-text">SwiftBliss Jobs</span>
                                </a>
                            </div>
                            <nav class="main-nav">
                                <a href="index.html" class="nav-link">Home</a>
                                <a href="jobs.html" class="nav-link">Find Jobs</a>
                                <a href="contact.html" class="nav-link active">Contact</a>
                            </nav>
                        </div>
                    </div>
                </header>
            `;
        } else if (containerId === 'footer') {
            container.innerHTML = `
                <footer class="main-footer">
                    <div class="container">
                        <div class="footer-content">
                            <div class="footer-section">
                                <div class="footer-logo">
                                    <i class="fas fa-bolt"></i>
                                    <span>SwiftBliss Jobs</span>
                                </div>
                                <p>Abuja's premier job portal connecting talented professionals with top employers.</p>
                            </div>
                            <div class="footer-section">
                                <p>&copy; 2024 SwiftBliss Jobs. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </footer>
            `;
        }
        
        console.log(`✅ Created fallback ${containerId}`);
    }

    static async loadAllComponents() {
        await Promise.all([
            this.loadComponent('header', 'components/header.html'),
            this.loadComponent('footer', 'components/footer.html')
        ]);
        
        // Update body padding for fixed header
        this.updateBodyPadding();
    }

    static updateBodyPadding() {
        const header = document.querySelector('.main-header');
        if (header) {
            const headerHeight = header.offsetHeight;
            document.body.style.paddingTop = headerHeight + 'px';
        }
    }
}

// Load components when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await ComponentLoader.loadAllComponents();
});