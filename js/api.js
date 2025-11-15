// Enhanced API with Sheety integration and multi-source fallback
const API = {
    // Primary: Sheety Configuration (Updated with your new URLs)
    sheetyConfig: {
        apiId: '3cd26d721c1e5919ca9955ed45267657',
        project: 'swiftBliss',
        sheet: 'sheet1',
        baseUrl: 'https://api.sheety.co/3cd26d721c1e5919ca9955ed45267657/swiftBliss/sheet1'
    },

    // Secondary: Static JSON fallback
    staticDataUrl: '/data/jobs.json',

    // Cache configuration
    cache: {
        jobs: null,
        lastFetch: null,
        cacheDuration: 10 * 60 * 1000, // 10 minutes
        lastSource: null
    },

    // Main method to get jobs with multi-source fallback
    getJobs: async function(forceRefresh = false) {
        // Return cached data if still valid
        if (!forceRefresh && this.cache.jobs && this.cache.lastFetch && 
            (Date.now() - this.cache.lastFetch) < this.cache.cacheDuration) {
            console.log(`📦 Returning cached jobs from ${this.cache.lastSource} (${this.cache.jobs.length} jobs)`);
            return this.cache.jobs;
        }

        let lastError;
        
        // Try Sheety first (Primary)
        try {
            console.log('🔄 Trying Sheety API...');
            const jobs = await this.fetchFromSheety();
            if (jobs && jobs.length > 0) {
                console.log(`✅ Sheety success: ${jobs.length} jobs`);
                this.updateCache(jobs, 'sheety');
                return jobs;
            }
        } catch (error) {
            console.warn('❌ Sheety failed:', error.message);
            lastError = error;
        }

        // Try static JSON second (Secondary)
        try {
            console.log('🔄 Trying static data...');
            const jobs = await this.fetchFromStatic();
            if (jobs && jobs.length > 0) {
                console.log(`✅ Static data success: ${jobs.length} jobs`);
                this.updateCache(jobs, 'static');
                return jobs;
            }
        } catch (error) {
            console.warn('❌ Static data failed:', error.message);
            lastError = error;
        }

        // Final fallback to sample data
        console.log('🔄 Using sample data as final fallback');
        const sampleJobs = this.getSampleJobs();
        this.updateCache(sampleJobs, 'sample');
        return sampleJobs;
    },

    // Sheety API integration (Updated with new URL structure)
    fetchFromSheety: async function() {
        const url = `${this.sheetyConfig.baseUrl}?t=${Date.now()}`;
        
        console.log(`📡 Fetching from Sheety: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Sheety API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📊 Raw Sheety data:', data);
        
        // Handle both sheet1 format and direct array format
        const jobsData = data.sheet1 || data.jobs || data;
        return this.formatSheetyData(jobsData);
    },

    // Static JSON fallback
    fetchFromStatic: async function() {
        const response = await fetch(this.staticDataUrl);
        if (!response.ok) throw new Error('Static data not found');
        
        const data = await response.json();
        return data.jobs || [];
    },

    // Data formatting methods for Sheety
    formatSheetyData: function(jobsData) {
        if (!jobsData || jobsData.length === 0) {
            console.warn('⚠️ No jobs data found in Sheety response');
            return [];
        }
        
        console.log(`🔄 Formatting ${jobsData.length} jobs from Sheety`);
        
        return jobsData.map((job, index) => {
            // Handle both object property access and array index access
            const getField = (fieldName, defaultValue = '') => {
                // Try different field name variations
                const variations = [
                    fieldName,
                    fieldName.toLowerCase(),
                    fieldName.replace(/([A-Z])/g, '_$1').toLowerCase()
                ];
                
                for (const variation of variations) {
                    if (job[variation] !== undefined && job[variation] !== null && job[variation] !== '') {
                        return job[variation];
                    }
                }
                return defaultValue;
            };

            const formattedJob = {
                id: job.id || `sheety_${index}_${Date.now()}`,
                title: getField('jobTitle', getField('title', 'No Title')),
                company: getField('company', 'No Company'),
                location: getField('location', 'Remote'),
                type: this.normalizeJobType(getField('jobType', getField('type'))),
                category: getField('category', 'General'),
                description: getField('description', 'No description available'),
                requirements: getField('requirements', 'No requirements specified'),
                salary: getField('salary', 'Salary not specified'),
                apply_link: getField('applyLink', getField('apply_link', '#')),
                date_posted: getField('datePosted', getField('date_posted', new Date().toISOString().split('T')[0])),
                status: getField('status', 'Active'),
                featured: getField('featured') === 'true' || getField('featured') === true,
                urgent: getField('urgent') === 'true' || getField('urgent') === true
            };

            console.log(`📝 Formatted job ${index}:`, formattedJob.title);
            return formattedJob;
        }).filter(job => job.status !== 'Inactive'); // Filter out inactive jobs
    },

    normalizeJobType: function(type) {
        if (!type) return 'Full-time';
        
        const typeMap = {
            'fulltime': 'Full-time',
            'full-time': 'Full-time',
            'parttime': 'Part-time',
            'part-time': 'Part-time', 
            'contract': 'Contract',
            'internship': 'Internship',
            'remote': 'Remote',
            'freelance': 'Freelance',
            'hybrid': 'Hybrid'
        };
        
        const normalized = type.toLowerCase().trim();
        return typeMap[normalized] || type;
    },

    getSheetyUrl: function() {
        return this.sheetyConfig.baseUrl;
    },

    updateCache: function(jobs, source) {
        this.cache.jobs = jobs;
        this.cache.lastFetch = Date.now();
        this.cache.lastSource = source;
        console.log(`💾 Cache updated from ${source} (${jobs.length} jobs)`);
        
        // Dispatch event for other components to listen to
        window.dispatchEvent(new CustomEvent('jobsUpdated', {
            detail: { jobs, source, count: jobs.length }
        }));
    },

    // Clear cache
    clearCache: function() {
        this.cache.jobs = null;
        this.cache.lastFetch = null;
        this.cache.lastSource = null;
        console.log('🗑️ API cache cleared');
    },

    // Get cache info for debugging
    getCacheInfo: function() {
        return {
            hasCache: !!this.cache.jobs,
            jobCount: this.cache.jobs ? this.cache.jobs.length : 0,
            lastSource: this.cache.lastSource,
            lastFetch: this.cache.lastFetch ? new Date(this.cache.lastFetch).toLocaleTimeString() : 'Never',
            isStale: this.cache.lastFetch ? (Date.now() - this.cache.lastFetch) > this.cache.cacheDuration : true,
            sheetyUrl: this.getSheetyUrl()
        };
    },

    // Test Sheety connection
    testConnection: async function() {
        try {
            console.log('🔗 Testing Sheety connection...');
            const response = await fetch(this.sheetyConfig.baseUrl);
            const data = await response.json();
            return {
                success: true,
                status: response.status,
                data: data,
                message: `Connected successfully. Found ${data.sheet1 ? data.sheet1.length : data.length || 0} records`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Failed to connect to Sheety API'
            };
        }
    },

    // Existing methods (keep for compatibility)
    getFilteredJobs: async function(filters = {}) {
        const allJobs = await this.getJobs();
        
        return allJobs.filter(job => {
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                const searchableText = `
                    ${job.title} ${job.company} ${job.location} 
                    ${job.description} ${job.requirements} ${job.category}
                `.toLowerCase();
                
                if (!searchableText.includes(searchTerm)) return false;
            }
            
            if (filters.location && job.location.toLowerCase() !== filters.location.toLowerCase()) return false;
            if (filters.jobType && job.type.toLowerCase() !== filters.jobType.toLowerCase()) return false;
            if (filters.company && job.company.toLowerCase() !== filters.company.toLowerCase()) return false;
            if (filters.category && job.category.toLowerCase() !== filters.category.toLowerCase()) return false;
            if (filters.featured && !job.featured) return false;
            if (filters.urgent && !job.urgent) return false;
            
            return true;
        });
    },

    getUniqueValues: function(jobs, field) {
        const values = [...new Set(jobs.map(job => job[field]).filter(Boolean))];
        return values.sort();
    },

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

    // Enhanced sample jobs (fallback)
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
            },
            {
                id: 'sample_4',
                title: "UX/UI Designer",
                company: "Creative Studio NG",
                location: "Abuja",
                type: "Full-time",
                category: "Design",
                description: "Create beautiful and intuitive user interfaces for web and mobile applications. Work closely with product managers and developers to deliver exceptional user experiences.",
                requirements: "3+ years in UX/UI design, Proficiency in Figma, Adobe XD, Strong portfolio, Understanding of user-centered design principles",
                salary: "₦300,000 - ₦500,000",
                apply_link: "#",
                date_posted: "2024-01-12",
                status: "Active",
                featured: false,
                urgent: true
            },
            {
                id: 'sample_5',
                title: "Backend Engineer",
                company: "Cloud Systems Ltd",
                location: "Lagos",
                type: "Full-time",
                category: "Technology",
                description: "Build scalable backend systems using Node.js, Python, and cloud technologies. Experience with microservices architecture and database design required.",
                requirements: "4+ years backend development, Node.js/Python, Database design, API development, Cloud platforms (AWS/Azure)",
                salary: "₦400,000 - ₦650,000",
                apply_link: "#",
                date_posted: "2024-01-11",
                status: "Active",
                featured: true,
                urgent: false
            },
            {
                id: 'sample_6',
                title: "Digital Marketing Specialist",
                company: "E-commerce Solutions",
                location: "Remote",
                type: "Remote",
                category: "Marketing",
                description: "Manage digital marketing campaigns across multiple channels including social media, email, and PPC. Analyze performance metrics and optimize for maximum ROI.",
                requirements: "2+ years digital marketing, Google Analytics, Social media management, Content creation, SEO/SEM",
                salary: "₦250,000 - ₦400,000",
                apply_link: "#",
                date_posted: "2024-01-10",
                status: "Active",
                featured: false,
                urgent: false
            }
        ];
    }
};

// Initialize API when module loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 SwiftBliss Jobs API initialized with Sheety integration');
    console.log('🔗 Sheety URL:', API.getSheetyUrl());
    console.log('💡 Cache info:', API.getCacheInfo());
    
    // Test connection on startup
    API.testConnection().then(result => {
        console.log('🔗 Connection test:', result);
    });
});

// Make API globally available for debugging
window.SwiftBlissAPI = API;