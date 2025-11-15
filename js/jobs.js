// Jobs Page JavaScript with Enhanced Sheety API Integration
document.addEventListener('DOMContentLoaded', function() {
    // State management
    let currentJobs = [];
    let filteredJobs = [];
    let currentPage = 1;
    const jobsPerPage = 12;
    let isLoading = false;
    let hasMoreJobs = true;
    let currentDataSource = 'unknown';

    // DOM Elements
    const jobsContainer = document.getElementById('jobs-container');
    const jobsLoading = document.getElementById('jobs-loading');
    const noJobsMessage = document.getElementById('no-jobs-message');
    const loadMoreSection = document.getElementById('load-more-section');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const showingCount = document.getElementById('showing-count');
    const totalJobsCount = document.getElementById('total-jobs-count');
    const todayJobsCount = document.getElementById('today-jobs-count');

    // Filter elements
    const searchInput = document.getElementById('job-search-input');
    const locationSelect = document.getElementById('location-select');
    const jobTypeFilter = document.getElementById('job-type-filter');
    const experienceFilter = document.getElementById('experience-filter');
    const salaryFilter = document.getElementById('salary-filter');
    const sortSelect = document.getElementById('sort-select');
    
    // Checkbox filters
    const locationFilters = document.querySelectorAll('.location-filter');
    const typeFilters = document.querySelectorAll('.type-filter');
    const experienceFilters = document.querySelectorAll('.experience-filter');

    // Initialize the page
    initJobsPage();

    async function initJobsPage() {
        showLoading();
        await loadJobs();
        setupEventListeners();
        updateFilterCounts();
        hideLoading();
    }

    async function loadJobs() {
        if (isLoading) return;
        
        try {
            isLoading = true;
            console.log('🔄 Loading jobs from Sheety API...');
            
            const jobs = await API.getJobs();
            
            // Check data source for user feedback
            const cacheInfo = API.getCacheInfo();
            currentDataSource = cacheInfo.lastSource || 'unknown';
            
            console.log(`✅ Loaded ${jobs.length} jobs from ${currentDataSource}`);
            
            // Show data source status to user
            showDataSourceStatus(currentDataSource, jobs.length);
            
            currentJobs = jobs;
            filteredJobs = [...jobs];
            
            // Update stats
            updateStats();
            
            // Display first page of jobs
            displayJobs(getCurrentPageJobs());
            
            // Show/hide load more button
            updateLoadMoreButton();
            
        } catch (error) {
            console.error('❌ Error loading jobs:', error);
            handleLoadError(error);
        } finally {
            isLoading = false;
        }
    }

    function handleLoadError(error) {
        // Enhanced error handling
        let errorMessage = 'Failed to load jobs. Please try again.';
        
        if (error.message.includes('402') || error.message.includes('Payment Required')) {
            errorMessage = 'API service temporarily unavailable. Using demo data.';
        } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error. Please check your connection.';
        } else if (error.message.includes('404') || error.message.includes('Not Found')) {
            errorMessage = 'Job database not found. Using demo data.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            errorMessage = 'API access issue. Using demo data.';
        }
        
        showError(errorMessage);
        
        // Use sample data as fallback
        currentJobs = API.getSampleJobs();
        filteredJobs = [...currentJobs];
        currentDataSource = 'sample';
        
        updateStats();
        displayJobs(getCurrentPageJobs());
        updateLoadMoreButton();
        
        // Show data source status
        showDataSourceStatus('sample', currentJobs.length);
    }

    function showDataSourceStatus(source, jobCount) {
        // Remove existing status message
        const existingStatus = document.querySelector('.data-source-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        const statusMessages = {
            'sheety': { text: `✅ Connected to live job database (${jobCount} jobs)`, type: 'success' },
            'static': { text: `ℹ️ Using cached job data (${jobCount} jobs)`, type: 'info' },
            'sample': { text: `⚠️ Using demo data - Add jobs to your Google Sheet (${jobCount} sample jobs)`, type: 'warning' },
            'unknown': { text: `ℹ️ Loaded ${jobCount} jobs`, type: 'info' }
        };

        const status = statusMessages[source] || statusMessages['unknown'];
        
        const statusElement = document.createElement('div');
        statusElement.className = `data-source-status ${status.type}`;
        statusElement.innerHTML = `
            <div class="status-content">
                <i class="fas fa-${getStatusIcon(status.type)}"></i>
                <span>${status.text}</span>
                ${source === 'sample' ? '<button class="btn-retry" id="retry-jobs-btn">Try Again</button>' : ''}
                ${source === 'sample' ? '<button class="btn-help" id="help-jobs-btn">Setup Help</button>' : ''}
            </div>
        `;
        
        // Add styles
        statusElement.style.cssText = `
            background: ${getStatusColor(status.type)};
            color: ${status.type === 'warning' ? '#000' : 'white'};
            padding: 0.75rem 1rem;
            border-radius: var(--border-radius);
            margin: 1rem 0;
            font-size: 0.9rem;
            border-left: 4px solid ${getStatusBorderColor(status.type)};
        `;

        // Insert before jobs container
        const jobsMain = document.querySelector('.jobs-main');
        if (jobsMain) {
            jobsMain.insertBefore(statusElement, jobsMain.firstChild);
        }

        // Add button listeners if needed
        if (source === 'sample') {
            const retryBtn = document.getElementById('retry-jobs-btn');
            const helpBtn = document.getElementById('help-jobs-btn');
            
            if (retryBtn) {
                retryBtn.addEventListener('click', refreshJobs);
                retryBtn.style.cssText = `
                    margin-left: 10px;
                    padding: 4px 12px;
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    border-radius: 4px;
                    color: inherit;
                    cursor: pointer;
                    font-size: 0.8rem;
                `;
            }
            
            if (helpBtn) {
                helpBtn.addEventListener('click', showSetupHelp);
                helpBtn.style.cssText = `
                    margin-left: 5px;
                    padding: 4px 12px;
                    background: rgba(255,255,255,0.3);
                    border: 1px solid rgba(255,255,255,0.4);
                    border-radius: 4px;
                    color: inherit;
                    cursor: pointer;
                    font-size: 0.8rem;
                `;
            }
        }
    }

    function showSetupHelp() {
        const helpMessage = `
🚀 **How to Setup Your Job Database:**

1. **Open your Google Sheet** that's connected to Sheety
2. **Add job listings** with these columns:
   - jobTitle, company, location, jobType
   - category, description, requirements
   - salary, applyLink, datePosted
   - featured, urgent, status

3. **Save the sheet** - changes appear automatically!
4. **Refresh this page** to see your real jobs

📊 **Current API Status:** ${API.getSheetyUrl()}
        `;
        
        alert(helpMessage);
    }

    function getStatusIcon(type) {
        const icons = {
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle',
            'error': 'exclamation-circle'
        };
        return icons[type] || 'info-circle';
    }

    function getStatusColor(type) {
        const colors = {
            'success': '#10b981',
            'warning': '#f59e0b',
            'info': '#3b82f6',
            'error': '#ef4444'
        };
        return colors[type] || '#3b82f6';
    }

    function getStatusBorderColor(type) {
        const colors = {
            'success': '#047857',
            'warning': '#d97706',
            'info': '#1d4ed8',
            'error': '#dc2626'
        };
        return colors[type] || '#1d4ed8';
    }

    function refreshJobs() {
        API.clearCache();
        currentPage = 1;
        showNotification('🔄 Refreshing job data from Sheety...', 'info');
        loadJobs();
    }

    function displayJobs(jobs) {
        if (jobs.length === 0) {
            jobsContainer.style.display = 'none';
            noJobsMessage.style.display = 'block';
            loadMoreSection.style.display = 'none';
            return;
        }

        jobsContainer.style.display = 'grid';
        noJobsMessage.style.display = 'none';
        
        // Clear existing jobs (for pagination)
        if (currentPage === 1) {
            jobsContainer.innerHTML = '';
        }

        jobs.forEach(job => {
            const jobCard = createJobCard(job);
            jobsContainer.appendChild(jobCard);
        });

        // Update showing count
        showingCount.textContent = filteredJobs.length;
    }

    function createJobCard(job) {
        const jobCard = document.createElement('div');
        jobCard.className = `job-card ${job.featured ? 'featured' : ''}`;
        
        // Add AOS animation if available
        if (typeof AOS !== 'undefined') {
            jobCard.setAttribute('data-aos', 'fade-up');
        }
        
        // Convert your API job structure to match the card template
        const jobTypeClass = getJobTypeClass(job.type);
        const experienceLevel = getExperienceLevel(job.requirements);
        const timeAgo = getTimeAgo(job.date_posted);
        const skills = extractSkills(job.requirements);
        
        jobCard.innerHTML = `
            ${job.featured ? `
                <div class="featured-badge">
                    <i class="fas fa-star"></i>
                    Featured
                </div>
            ` : ''}
            <div class="job-header">
                <div class="company-logo">
                    <div class="logo-fallback">
                        <i class="fas fa-building"></i>
                    </div>
                </div>
                <div class="job-meta">
                    <span class="job-type ${jobTypeClass}">${job.type}</span>
                    ${job.urgent ? '<span class="job-urgent">Urgent</span>' : ''}
                </div>
            </div>
            <div class="job-content">
                <h3 class="job-title">${job.title}</h3>
                <p class="company-name">${job.company}</p>
                <div class="job-details">
                    <div class="detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${job.location}</span>
                    </div>
                    <div class="detail">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>${job.salary}</span>
                    </div>
                    <div class="detail">
                        <i class="fas fa-clock"></i>
                        <span>${timeAgo}</span>
                    </div>
                </div>
                <p class="job-description">${job.description}</p>
                <div class="job-skills">
                    ${skills.map(skill => `<span class="skill">${skill}</span>`).join('')}
                    ${job.category ? `<span class="skill">${job.category}</span>` : ''}
                </div>
            </div>
            <div class="job-footer">
                <button class="btn-apply" data-job-id="${job.id}" data-apply-link="${job.apply_link}">
                    <i class="fas fa-paper-plane"></i>
                    Apply Now
                </button>
                <button class="btn-save" data-job-id="${job.id}">
                    <i class="far fa-bookmark"></i>
                </button>
            </div>
        `;

        // Add event listeners to the buttons
        const applyBtn = jobCard.querySelector('.btn-apply');
        const saveBtn = jobCard.querySelector('.btn-save');

        applyBtn.addEventListener('click', handleApply);
        saveBtn.addEventListener('click', handleSave);

        return jobCard;
    }

    function getCurrentPageJobs() {
        const startIndex = (currentPage - 1) * jobsPerPage;
        const endIndex = startIndex + jobsPerPage;
        return filteredJobs.slice(0, endIndex);
    }

    function filterJobs() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedLocation = locationSelect.value;
        const selectedJobType = jobTypeFilter.value;
        const selectedExperience = experienceFilter.value;
        const selectedSalary = salaryFilter.value;
        const sortBy = sortSelect.value;

        // Get selected checkbox filters
        const selectedLocations = Array.from(locationFilters)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        const selectedTypes = Array.from(typeFilters)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        const selectedExperiences = Array.from(experienceFilters)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        filteredJobs = currentJobs.filter(job => {
            // Text search across multiple fields
            if (searchTerm) {
                const searchableText = `
                    ${job.title} ${job.company} ${job.location} 
                    ${job.description} ${job.requirements} ${job.category}
                `.toLowerCase();
                
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            // Location filters
            if (selectedLocation && job.location.toLowerCase() !== selectedLocation.toLowerCase()) {
                return false;
            }

            if (selectedLocations.length > 0 && !selectedLocations.some(loc => 
                job.location.toLowerCase().includes(loc.toLowerCase()))) {
                return false;
            }

            // Job type filters
            if (selectedJobType && job.type.toLowerCase() !== selectedJobType.toLowerCase()) {
                return false;
            }

            if (selectedTypes.length > 0 && !selectedTypes.some(type => 
                job.type.toLowerCase().includes(type.toLowerCase()))) {
                return false;
            }

            // Experience filters
            if (selectedExperience) {
                const jobExperience = getExperienceLevel(job.requirements);
                if (jobExperience.toLowerCase() !== selectedExperience.toLowerCase()) {
                    return false;
                }
            }

            if (selectedExperiences.length > 0) {
                const jobExperience = getExperienceLevel(job.requirements);
                if (!selectedExperiences.includes(jobExperience)) {
                    return false;
                }
            }

            // Salary filter
            if (selectedSalary && !matchSalaryRange(job.salary, selectedSalary)) {
                return false;
            }

            return true;
        });

        // Sort jobs
        sortJobs(sortBy);

        // Reset to first page
        currentPage = 1;
        
        // Update display
        displayJobs(getCurrentPageJobs());
        updateLoadMoreButton();
        updateFilterCounts();
    }

    function sortJobs(sortBy) {
        switch (sortBy) {
            case 'newest':
                filteredJobs.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));
                break;
            case 'salary':
                filteredJobs.sort((a, b) => parseSalary(b.salary) - parseSalary(a.salary));
                break;
            case 'relevant':
            default:
                // Default to newest first
                filteredJobs.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));
                break;
        }
    }

    function parseSalary(salaryString) {
        if (!salaryString) return 0;
        
        // Extract numbers from salary string like "₦350,000 - ₦500,000"
        const numbers = salaryString.replace(/[^\d,-]/g, '').split('-');
        if (numbers.length > 0) {
            return parseInt(numbers[0].replace(/,/g, '')) || 0;
        }
        return 0;
    }

    function matchSalaryRange(salaryString, range) {
        const salary = parseSalary(salaryString);
        switch (range) {
            case '0-50000': return salary <= 50000;
            case '50000-150000': return salary > 50000 && salary <= 150000;
            case '150000-300000': return salary > 150000 && salary <= 300000;
            case '300000+': return salary > 300000;
            default: return true;
        }
    }

    function updateStats() {
        totalJobsCount.textContent = currentJobs.length.toLocaleString();
        
        // Count jobs posted today
        const today = new Date().toISOString().split('T')[0];
        const todayJobs = currentJobs.filter(job => job.date_posted === today);
        todayJobsCount.textContent = todayJobs.length;
    }

    function updateFilterCounts() {
        // Update counts for each filter option
        locationFilters.forEach(checkbox => {
            const location = checkbox.value;
            const count = currentJobs.filter(job => 
                job.location.toLowerCase().includes(location.toLowerCase())
            ).length;
            const countElement = checkbox.parentElement.querySelector('.option-count');
            if (countElement) {
                countElement.textContent = count;
            }
        });

        typeFilters.forEach(checkbox => {
            const type = checkbox.value;
            const count = currentJobs.filter(job => 
                job.type.toLowerCase().includes(type.toLowerCase())
            ).length;
            const countElement = checkbox.parentElement.querySelector('.option-count');
            if (countElement) {
                countElement.textContent = count;
            }
        });

        experienceFilters.forEach(checkbox => {
            const experience = checkbox.value;
            const count = currentJobs.filter(job => {
                const jobExperience = getExperienceLevel(job.requirements);
                return jobExperience === experience;
            }).length;
            const countElement = checkbox.parentElement.querySelector('.option-count');
            if (countElement) {
                countElement.textContent = count;
            }
        });
    }

    function updateLoadMoreButton() {
        const displayedJobs = currentPage * jobsPerPage;
        hasMoreJobs = displayedJobs < filteredJobs.length;
        
        if (hasMoreJobs && filteredJobs.length > jobsPerPage) {
            loadMoreSection.style.display = 'block';
        } else {
            loadMoreSection.style.display = 'none';
        }
    }

    function loadMoreJobs() {
        if (isLoading || !hasMoreJobs) return;
        
        currentPage++;
        const nextJobs = getCurrentPageJobs();
        displayJobs(nextJobs);
        updateLoadMoreButton();
    }

    // Event Handlers
    function setupEventListeners() {
        // Search and filter events
        searchInput.addEventListener('input', debounce(filterJobs, 300));
        if (locationSelect) locationSelect.addEventListener('change', filterJobs);
        if (jobTypeFilter) jobTypeFilter.addEventListener('change', filterJobs);
        if (experienceFilter) experienceFilter.addEventListener('change', filterJobs);
        if (salaryFilter) salaryFilter.addEventListener('change', filterJobs);
        if (sortSelect) sortSelect.addEventListener('change', filterJobs);

        // Checkbox filters
        locationFilters.forEach(checkbox => {
            checkbox.addEventListener('change', filterJobs);
        });
        typeFilters.forEach(checkbox => {
            checkbox.addEventListener('change', filterJobs);
        });
        experienceFilters.forEach(checkbox => {
            checkbox.addEventListener('change', filterJobs);
        });

        // Forms
        const quickSearchForm = document.getElementById('quick-search-form');
        const advancedSearchForm = document.getElementById('advanced-search-form');
        const newsletterForm = document.getElementById('newsletter-form');

        if (quickSearchForm) {
            quickSearchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                filterJobs();
            });
        }

        if (advancedSearchForm) {
            advancedSearchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                filterJobs();
            });
        }

        // Load more
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', loadMoreJobs);
        }

        // Clear filters
        const clearFiltersBtn = document.getElementById('clear-filters-btn');
        const sidebarClearFilters = document.getElementById('sidebar-clear-filters');
        const resetSearchBtn = document.getElementById('reset-search-btn');

        if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', resetFilters);
        if (sidebarClearFilters) sidebarClearFilters.addEventListener('click', resetFilters);
        if (resetSearchBtn) resetSearchBtn.addEventListener('click', resetFilters);

        // Newsletter
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', handleNewsletterSubmit);
        }

        // Tab switching
        setupTabs();
        
        // View toggle
        setupViewToggle();
        
        // Filter toggle
        setupFilterToggle();
    }

    function resetFilters() {
        if (searchInput) searchInput.value = '';
        if (locationSelect) locationSelect.value = '';
        if (jobTypeFilter) jobTypeFilter.value = '';
        if (experienceFilter) experienceFilter.value = '';
        if (salaryFilter) salaryFilter.value = '';
        if (sortSelect) sortSelect.value = 'newest';

        // Uncheck all checkboxes
        locationFilters.forEach(checkbox => checkbox.checked = false);
        typeFilters.forEach(checkbox => checkbox.checked = false);
        experienceFilters.forEach(checkbox => checkbox.checked = false);

        currentPage = 1;
        filteredJobs = [...currentJobs];
        displayJobs(getCurrentPageJobs());
        updateLoadMoreButton();
    }

    function handleApply(e) {
        const jobId = e.currentTarget.getAttribute('data-job-id');
        const applyLink = e.currentTarget.getAttribute('data-apply-link');
        const originalText = e.currentTarget.innerHTML;
        
        e.currentTarget.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Applying...';
        e.currentTarget.disabled = true;

        setTimeout(() => {
            if (applyLink && applyLink !== '#') {
                // Redirect to actual apply link
                window.open(applyLink, '_blank');
            }
            
            e.currentTarget.innerHTML = '<i class="fas fa-check"></i> Applied!';
            e.currentTarget.style.background = 'var(--success)';
            showNotification('Application submitted successfully!');
            
            setTimeout(() => {
                e.currentTarget.innerHTML = originalText;
                e.currentTarget.disabled = false;
                e.currentTarget.style.background = '';
            }, 3000);
        }, 2000);
    }

    function handleSave(e) {
        const icon = e.currentTarget.querySelector('i');
        if (icon.classList.contains('far')) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            e.currentTarget.style.background = 'var(--primary)';
            e.currentTarget.style.color = 'white';
            showNotification('Job saved to your favorites!');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            e.currentTarget.style.background = 'var(--light)';
            e.currentTarget.style.color = 'var(--gray)';
            showNotification('Job removed from favorites!');
        }
    }

    function handleNewsletterSubmit(e) {
        e.preventDefault();
        const emailInput = document.getElementById('newsletter-email');
        if (emailInput) {
            const email = emailInput.value;
            if (email) {
                showNotification('Successfully subscribed to job alerts!');
                e.target.reset();
            }
        }
    }

    // Utility functions
    function getJobTypeClass(type) {
        const typeMap = {
            'full-time': 'fulltime',
            'part-time': 'parttime',
            'contract': 'contract',
            'internship': 'internship',
            'remote': 'remote'
        };
        return typeMap[type.toLowerCase()] || 'fulltime';
    }

    function getExperienceLevel(requirements) {
        if (!requirements) return 'mid';
        
        const req = requirements.toLowerCase();
        if (req.includes('0-2') || req.includes('entry') || req.includes('junior')) {
            return 'entry';
        } else if (req.includes('5+') || req.includes('senior') || req.includes('lead')) {
            return 'senior';
        } else {
            return 'mid';
        }
    }

    function extractSkills(requirements) {
        if (!requirements) return ['General'];
        
        const skills = [];
        const commonSkills = ['React', 'JavaScript', 'Python', 'Node.js', 'TypeScript', 'CSS', 'HTML', 'AWS', 'Azure', 'SQL', 'MongoDB', 'UI/UX', 'Figma', 'Adobe XD', 'Marketing', 'SEO', 'Analytics', 'Management'];
        
        commonSkills.forEach(skill => {
            if (requirements.includes(skill)) {
                skills.push(skill);
            }
        });
        
        return skills.length > 0 ? skills.slice(0, 4) : ['General'];
    }

    function getTimeAgo(dateString) {
        if (!dateString) return 'Recently';
        
        const now = new Date();
        const posted = new Date(dateString);
        const diffMs = now - posted;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function showLoading() {
        if (jobsLoading) jobsLoading.style.display = 'flex';
        if (jobsContainer) jobsContainer.style.display = 'none';
    }

    function hideLoading() {
        if (jobsLoading) jobsLoading.style.display = 'none';
        if (jobsContainer) jobsContainer.style.display = 'grid';
    }

    function showError(message) {
        showNotification(message, 'error');
    }

    function showNotification(message, type = 'success') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success)' : '#dc3545'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${tabId}-tab`) {
                        content.classList.add('active');
                    }
                });
            });
        });
    }

    function setupViewToggle() {
        const viewBtns = document.querySelectorAll('.view-btn');
        const jobsContainer = document.querySelector('.jobs-container');
        
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.getAttribute('data-view');
                
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                if (jobsContainer) {
                    jobsContainer.className = 'jobs-container ' + view + '-view';
                }
            });
        });
    }

    function setupFilterToggle() {
        const filterHeaders = document.querySelectorAll('.filter-header');
        
        filterHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const options = header.nextElementSibling;
                const icon = header.querySelector('i');
                
                if (options && icon) {
                    const isHidden = options.style.display === 'none';
                    options.style.display = isHidden ? 'block' : 'none';
                    icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
                }
            });
        });
    }
});