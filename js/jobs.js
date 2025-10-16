// Jobs page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load header and footer
    Utils.loadComponents();

    // Initialize jobs page
    initializeJobsPage();
});

// Jobs page functionality
async function initializeJobsPage() {
    const allJobsContainer = document.getElementById('all-jobs');
    if (!allJobsContainer) return;
    
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    
    // Load all jobs
    const allJobs = await API.getJobs();
    
    // Initialize filters
    initializeFilters(allJobs);
    
    // Initialize search
    initializeSearch(allJobs, searchQuery);
    
    // Render initial jobs
    let filteredJobs = allJobs;
    if (searchQuery) {
        filteredJobs = filterJobsBySearch(allJobs, searchQuery);
        document.getElementById('jobs-search').value = searchQuery;
    }
    
    renderJobsPage(filteredJobs);
    
    // Update jobs count
    updateJobsCount(filteredJobs.length);
}

// Initialize filters
function initializeFilters(jobs) {
    const locationFilter = document.getElementById('location-filter');
    const typeFilter = document.getElementById('type-filter');
    const companyFilter = document.getElementById('company-filter');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    
    if (!locationFilter || !applyFiltersBtn) return;
    
    // Populate company filter
    const companies = API.getUniqueCompanies(jobs);
    companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        companyFilter.appendChild(option);
    });
    
    // Apply filters
    applyFiltersBtn.addEventListener('click', () => {
        applyFilters(jobs);
    });
    
    // Reset filters
    resetFiltersBtn.addEventListener('click', () => {
        locationFilter.value = '';
        typeFilter.value = '';
        companyFilter.value = '';
        applyFilters(jobs);
    });
    
    // Apply filters on enter key in selects
    [locationFilter, typeFilter, companyFilter].forEach(select => {
        select.addEventListener('change', () => {
            applyFilters(jobs);
        });
    });
}

// Apply filters to jobs
function applyFilters(jobs) {
    const location = document.getElementById('location-filter').value;
    const type = document.getElementById('type-filter').value;
    const company = document.getElementById('company-filter').value;
    const search = document.getElementById('jobs-search').value;
    
    let filteredJobs = jobs;
    
    // Apply search filter
    if (search) {
        filteredJobs = filterJobsBySearch(filteredJobs, search);
    }
    
    // Apply location filter
    if (location) {
        filteredJobs = filteredJobs.filter(job => job.location === location);
    }
    
    // Apply type filter
    if (type) {
        filteredJobs = filteredJobs.filter(job => job.type === type);
    }
    
    // Apply company filter
    if (company) {
        filteredJobs = filteredJobs.filter(job => job.company === company);
    }
    
    renderJobsPage(filteredJobs);
    updateJobsCount(filteredJobs.length);
}

// Initialize search functionality
function initializeSearch(jobs, initialSearch = '') {
    const searchInput = document.getElementById('jobs-search');
    if (!searchInput) return;
    
    if (initialSearch) {
        searchInput.value = initialSearch;
    }
    
    const debouncedSearch = Utils.debounce(() => {
        applyFilters(jobs);
    }, 300);
    
    searchInput.addEventListener('input', debouncedSearch);
}

// Filter jobs by search term
function filterJobsBySearch(jobs, searchTerm) {
    const term = searchTerm.toLowerCase();
    return jobs.filter(job => 
        job.title.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term)
    );
}

// Render jobs on jobs page
function renderJobsPage(jobs) {
    const container = document.getElementById('all-jobs');
    const loadMoreBtn = document.getElementById('load-more');
    
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    if (jobs.length === 0) {
        container.innerHTML = `
            <div class="no-jobs">
                <i class="fas fa-search"></i>
                <h3>No jobs found</h3>
                <p>Try adjusting your search criteria or check back later for new opportunities.</p>
            </div>
        `;
        
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
        return;
    }
    
    // Show first 8 jobs initially
    const jobsToShow = jobs.slice(0, 8);
    renderJobs(jobsToShow, 'all-jobs');
    
    // Setup load more functionality if there are more jobs
    if (jobs.length > 8 && loadMoreBtn) {
        let currentIndex = 8;
        
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.onclick = () => {
            const nextJobs = jobs.slice(currentIndex, currentIndex + 4);
            renderJobs(nextJobs, 'all-jobs');
            currentIndex += 4;
            
            if (currentIndex >= jobs.length) {
                loadMoreBtn.style.display = 'none';
            }
        };
    } else if (loadMoreBtn) {
        loadMoreBtn.style.display = 'none';
    }
}

// Update jobs count
function updateJobsCount(count) {
    const jobsCountElement = document.getElementById('jobs-count');
    if (jobsCountElement) {
        jobsCountElement.textContent = `${count} Job${count !== 1 ? 's' : ''} Found`;
    }
}