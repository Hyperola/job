// Main JavaScript for the application
document.addEventListener('DOMContentLoaded', function() {
    // Load header and footer
    Utils.loadComponents();

    // Initialize page-specific functionality
    initializeHomePage();
    initializeContactPage();
});

// Home page functionality
function initializeHomePage() {
    const latestJobsContainer = document.getElementById('latest-jobs');
    if (latestJobsContainer) {
        loadLatestJobs();
        initializeHomeSearch();
    }
}

// Load latest jobs for homepage
async function loadLatestJobs() {
    try {
        const jobs = await API.getJobs();
        const latestJobs = jobs.slice(0, 6); // Show only 6 latest jobs
        
        renderJobs(latestJobs, 'latest-jobs');
    } catch (error) {
        console.error('Error loading latest jobs:', error);
        Utils.showNotification('Error loading jobs. Please try again.', 'error');
    }
}

// Initialize search on homepage
function initializeHomeSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput && searchBtn) {
        const performSearch = () => {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                // Redirect to jobs page with search query
                window.location.href = `jobs.html?search=${encodeURIComponent(searchTerm)}`;
            }
        };
        
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

// Contact page functionality
function initializeContactPage() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }
}

// Handle contact form submission
function handleContactFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message')
    };
    
    // Here you would typically send the data to a server
    // For now, we'll just show a success message
    console.log('Contact form submitted:', data);
    Utils.showNotification('Thank you for your message! We will get back to you soon.', 'success');
    e.target.reset();
}

// Render jobs to the specified container
function renderJobs(jobs, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (jobs.length === 0) {
        container.innerHTML = `
            <div class="no-jobs">
                <i class="fas fa-search"></i>
                <h3>No jobs found</h3>
                <p>Try adjusting your search criteria or check back later for new opportunities.</p>
            </div>
        `;
        return;
    }
    
    jobs.forEach((job, index) => {
        const jobCard = document.createElement('div');
        jobCard.className = 'job-card fade-in';
        
        jobCard.innerHTML = `
            <div class="job-header">
                <h3 class="job-title">${job.title}</h3>
                <p class="job-company">${job.company}</p>
                <div class="job-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                    <span><i class="fas fa-clock"></i> ${job.type}</span>
                    ${job.salary ? `<span><i class="fas fa-money-bill-wave"></i> ${job.salary}</span>` : ''}
                </div>
            </div>
            <div class="job-body">
                <p class="job-description">${job.description}</p>
            </div>
            <div class="job-footer">
                <span class="job-type">${job.type}</span>
                <a href="${job.apply_link}" class="apply-btn" target="_blank">Apply Now</a>
            </div>
        `;
        
        container.appendChild(jobCard);
        
        // Trigger animation with delay
        setTimeout(() => {
            jobCard.classList.add('visible');
        }, index * 100);
    });
}