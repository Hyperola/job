// API functions for Google Sheets integration
const API = {
    // Google Sheets API configuration
    sheetId: 'YOUR_GOOGLE_SHEET_ID', // Replace with your Google Sheet ID
    apiKey: 'YOUR_API_KEY', // Replace with your API key
    sheetName: 'jobs', // Name of the sheet tab

    // Get all jobs from Google Sheets
    getJobs: async function() {
        try {
            // For demo purposes, using sample data
            // In production, replace with actual Google Sheets API call
            return this.getSampleJobs();
            
            // Example of actual API call (uncomment when ready):
            /*
            const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}/values/${this.sheetName}?key=${this.apiKey}`);
            const data = await response.json();
            return this.formatJobsData(data.values);
            */
        } catch (error) {
            console.error('Error fetching jobs:', error);
            return this.getSampleJobs(); // Fallback to sample data
        }
    },

    // Format jobs data from Google Sheets
    formatJobsData: function(sheetData) {
        if (!sheetData || sheetData.length < 2) return [];
        
        const headers = sheetData[0];
        const jobs = [];
        
        for (let i = 1; i < sheetData.length; i++) {
            const job = {};
            for (let j = 0; j < headers.length; j++) {
                job[headers[j].toLowerCase().replace(/\s+/g, '_')] = sheetData[i][j];
            }
            jobs.push(job);
        }
        
        return jobs;
    },

    // Sample jobs data (replace with actual API call)
    getSampleJobs: function() {
        return [
            {
                id: 1,
                title: "Frontend Developer",
                company: "Tech Solutions Ltd",
                location: "Abuja",
                type: "Full-time",
                description: "We are looking for a skilled Frontend Developer with experience in React and modern JavaScript frameworks to join our growing team.",
                apply_link: "#",
                date_posted: "2023-11-15",
                salary: "₦250,000 - ₦400,000"
            },
            {
                id: 2,
                title: "Marketing Manager",
                company: "Growth Marketing Agency",
                location: "Lagos",
                type: "Full-time",
                description: "Seeking an experienced Marketing Manager to develop and implement marketing strategies for our diverse client portfolio.",
                apply_link: "#",
                date_posted: "2023-11-14",
                salary: "₦300,000 - ₦500,000"
            },
            {
                id: 3,
                title: "Data Analyst",
                company: "Data Insights Inc",
                location: "Remote",
                type: "Remote",
                description: "Join our data team to analyze complex datasets and provide actionable insights to drive business decisions.",
                apply_link: "#",
                date_posted: "2023-11-13",
                salary: "₦200,000 - ₦350,000"
            },
            {
                id: 4,
                title: "Customer Support Specialist",
                company: "Service First Ltd",
                location: "Abuja",
                type: "Part-time",
                description: "Provide exceptional customer service and support to our clients through various communication channels.",
                apply_link: "#",
                date_posted: "2023-11-12",
                salary: "₦120,000 - ₦180,000"
            },
            {
                id: 5,
                title: "Product Designer",
                company: "Creative Designs Co",
                location: "Lagos",
                type: "Full-time",
                description: "Create intuitive and beautiful user experiences for our digital products across multiple platforms.",
                apply_link: "#",
                date_posted: "2023-11-11",
                salary: "₦280,000 - ₦450,000"
            },
            {
                id: 6,
                title: "Sales Executive",
                company: "Sales Pro Ltd",
                location: "Abuja",
                type: "Contract",
                description: "Drive sales growth by identifying new business opportunities and building strong client relationships.",
                apply_link: "#",
                date_posted: "2023-11-10",
                salary: "₦180,000 + Commission"
            },
            {
                id: 7,
                title: "Backend Developer",
                company: "Tech Innovations",
                location: "Abuja",
                type: "Full-time",
                description: "Develop robust backend systems and APIs using Node.js and Python for our enterprise applications.",
                apply_link: "#",
                date_posted: "2023-11-09",
                salary: "₦300,000 - ₦500,000"
            },
            {
                id: 8,
                title: "HR Manager",
                company: "People First Inc",
                location: "Lagos",
                type: "Full-time",
                description: "Oversee all human resources functions including recruitment, training, and employee relations.",
                apply_link: "#",
                date_posted: "2023-11-08",
                salary: "₦350,000 - ₦550,000"
            }
        ];
    },

    // Get unique companies for filter
    getUniqueCompanies: function(jobs) {
        const companies = [...new Set(jobs.map(job => job.company))];
        return companies.sort();
    }
};