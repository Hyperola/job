// Advanced API functions for Sheety integration
const API = {
    // Sheety API configuration
    sheetyApiId: '053ab15a0e0f433f990a359d43997fdf',
    sheetyProject: 'swiftBliss',
    sheetySheet: 'sheet1',

    // Cache configuration
    cache: {
        jobs: null,
        lastFetch: null,
        cacheDuration: 5 * 60 * 1000 // 5 minutes
    },

    getSheetyUrl: function() {
        return `https://api.sheety.co/${this.sheetyApiId}/${this.sheetyProject}/${this.sheetySheet}`;
    },

    // Get all jobs from Sheety with caching
    getJobs: async function(forceRefresh = false) {
        // Return cached data if still valid
        if (!forceRefresh && this.cache.jobs && this.cache.lastFetch && 
            (Date.now() - this.cache.lastFetch) < this.cache.cacheDuration) {
            console.log('📦 Returning cached jobs');
            return this.cache.jobs;
        }

        try {
            console.log('🔄 Fetching jobs from Sheety...');
            
            const response = await fetch(`${this.getSheetyUrl()}?t=${Date.now()}`);
            
            if (!response.ok) {
                throw new Error(`Sheety API error: ${response.status}`);
            }
            
            const data = await response.json();
            const jobs = this.formatJobsData(data.sheet1 || []);
            
            // Update cache
            this.cache.jobs = jobs;
            this.cache.lastFetch = Date.now();
            
            console.log(`✅ Successfully loaded ${jobs.length} jobs from Sheety`);
            return jobs;
            
        } catch (error) {
            console.error('❌ Error fetching jobs from Sheety:', error);
            
            // Return cached data as fallback if available
            if (this.cache.jobs) {
                console.log('🔄 Using cached data as fallback');
                return this.cache.jobs;
            }
            
            // Final fallback to sample data
            return this.getSampleJobs();
        }
    },

    // Format jobs data from Sheety
    formatJobsData: function(jobs) {
        if (!jobs || jobs.length === 0) return [];
        
        return jobs.map(job => ({
            id: job.id || Math.random().toString(36).substr(2, 9),
            title: job.jobTitle || 'No Title',
            company: job.company || 'No Company',
            location: job.location || 'Not Specified',
            type: job.jobType || 'Full-time',
            category: job.category || 'General',
            description: job.description || 'No description available',
            requirements: job.requirements || 'No requirements specified',
            salary: job.salary || 'Salary not specified',
            apply_link: job.applyLink || '#',
            date_posted: job.datePosted || new Date().toISOString().split('T')[0],
            status: job.status || 'Active',
            featured: job.featured === 'true' || Math.random() > 0.7, // Random featured for demo
            urgent: job.urgent === 'true' || Math.random() > 0.8 // Random urgent for demo
        }));
    },

    // Get jobs with advanced filtering
    getFilteredJobs: async function(filters = {}) {
        const allJobs = await this.getJobs();
        
        return allJobs.filter(job => {
            // Search filter
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                const searchableText = `
                    ${job.title} ${job.company} ${job.location} 
                    ${job.description} ${job.requirements} ${job.category}
                `.toLowerCase();
                
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            // Location filter
            if (filters.location && job.location !== filters.location) {
                return false;
            }
            
            // Job type filter
            if (filters.jobType && job.type !== filters.jobType) {
                return false;
            }
            
            // Company filter
            if (filters.company && job.company !== filters.company) {
                return false;
            }
            
            // Category filter
            if (filters.category && job.category !== filters.category) {
                return false;
            }
            
            // Featured filter
            if (filters.featured && !job.featured) {
                return false;
            }
            
            // Urgent filter
            if (filters.urgent && !job.urgent) {
                return false;
            }
            
            // Salary range filter (basic implementation)
            if (filters.minSalary) {
                const salaryMatch = job.salary.match(/\d+/g);
                if (salaryMatch) {
                    const minSalary = Math.min(...salaryMatch.map(Number));
                    if (minSalary < parseInt(filters.minSalary)) {
                        return false;
                    }
                }
            }
            
            return true;
        });
    },

    // Get unique values for filters
    getUniqueValues: function(jobs, field) {
        const values = [...new Set(jobs.map(job => job[field]).filter(Boolean))];
        return values.sort();
    },

    // Get statistics
    getStats: function(jobs) {
        return {
            total: jobs.length,
            featured: jobs.filter(job => job.featured).length,
            urgent: jobs.filter(job => job.urgent).length,
            locations: this.getUniqueValues(jobs, 'location').length,
            companies: this.getUniqueValues(jobs, 'company').length,
            categories: this.getUniqueValues(jobs, 'category').length
        };
    },

    // Clear cache
    clearCache: function() {
        this.cache.jobs = null;
        this.cache.lastFetch = null;
        console.log('🗑️ API cache cleared');
    },

    // Sample jobs data (enhanced fallback)
    getSampleJobs: function() {
        return [
            {
                id: 'sample_1',
                title: "Senior Frontend Developer",
                company: "Tech Solutions Ltd",
                location: "Abuja",
                type: "Full-time",
                category: "Technology",
                description: "We are looking for a skilled Senior Frontend Developer with extensive experience in React, Vue.js, and modern JavaScript frameworks to lead our frontend development team.",
                requirements: "5+ years of frontend development experience, Expertise in React.js and TypeScript, Experience with state management (Redux, Zustand), Strong understanding of responsive design",
                salary: "₦450,000 - ₦700,000",
                apply_link: "#",
                date_posted: "2024-01-15",
                status: "Active",
                featured: true,
                urgent: false
            },
            {
                id: 'sample_2',
                title: "Product Marketing Manager",
                company: "Growth Marketing Agency",
                location: "Lagos",
                type: "Full-time",
                category: "Marketing",
                description: "Seeking an experienced Product Marketing Manager to develop and implement comprehensive marketing strategies for our diverse portfolio of digital products and services.",
                requirements: "3+ years in product marketing, Strong analytical skills, Experience with marketing automation tools, Excellent communication skills",
                salary: "₦350,000 - ₦550,000",
                apply_link: "#",
                date_posted: "2024-01-14",
                status: "Active",
                featured: false,
                urgent: true
            },
            {
                id: 'sample_3',
                title: "Data Scientist",
                company: "Data Insights Inc",
                location: "Remote",
                type: "Remote",
                category: "Technology",
                description: "Join our data science team to analyze complex datasets, build predictive models, and provide actionable insights that drive business decisions across multiple departments.",
                requirements: "Master's in Data Science or related field, Proficiency in Python and R, Experience with machine learning frameworks, Strong statistical analysis skills",
                salary: "₦400,000 - ₦600,000",
                apply_link: "#",
                date_posted: "2024-01-13",
                status: "Active",
                featured: true,
                urgent: false
            }
        ];
    }
};

// Initialize API when module loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 SwiftBliss Jobs API initialized');
});