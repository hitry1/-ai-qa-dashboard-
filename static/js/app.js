// RAG Q&A Knowledge Base JavaScript

class QAApp {
    constructor() {
        this.currentSection = 'search';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadCategories();
        await this.loadStats();
        this.showSection('search');
    }

    setupEventListeners() {
        // Search form
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Add form
        document.getElementById('addForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addQA();
        });
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionName).classList.add('active');
        
        // Add active class to nav link
        document.querySelector(`[onclick="showSection('${sectionName}')"]`).classList.add('active');

        this.currentSection = sectionName;

        // Load content based on section
        if (sectionName === 'browse') {
            this.loadAllQA();
        } else if (sectionName === 'stats') {
            this.loadStats();
        }
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            
            const categoryFilter = document.getElementById('categoryFilter');
            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            
            data.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                categoryFilter.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    async performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        const category = document.getElementById('categoryFilter').value;
        
        if (!query) {
            this.showMessage('searchResults', 'Please enter a search query', 'error');
            return;
        }

        this.showLoading('searchResults');

        try {
            const params = new URLSearchParams({ q: query });
            if (category) params.append('category', category);
            
            const response = await fetch(`/api/search?${params}`);
            const data = await response.json();
            
            this.displayResults(data.results, 'searchResults');
        } catch (error) {
            console.error('Search error:', error);
            this.showMessage('searchResults', 'Search failed. Please try again.', 'error');
        }
    }

    async loadAllQA() {
        this.showLoading('browseResults');

        try {
            const response = await fetch('/api/all');
            const data = await response.json();
            
            this.displayResults(data.qa_pairs, 'browseResults');
        } catch (error) {
            console.error('Error loading Q&A pairs:', error);
            this.showMessage('browseResults', 'Failed to load Q&A pairs.', 'error');
        }
    }

    async addQA() {
        const question = document.getElementById('question').value.trim();
        const answer = document.getElementById('answer').value.trim();
        const category = document.getElementById('category').value.trim() || 'general';
        const tagsInput = document.getElementById('tags').value.trim();
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];

        if (!question || !answer) {
            this.showMessage('addResult', 'Question and answer are required.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question,
                    answer,
                    category,
                    tags
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showMessage('addResult', 'Q&A pair added successfully!', 'success');
                document.getElementById('addForm').reset();
                await this.loadCategories();
                await this.loadStats();
            } else {
                this.showMessage('addResult', data.error || 'Failed to add Q&A pair.', 'error');
            }
        } catch (error) {
            console.error('Error adding Q&A:', error);
            this.showMessage('addResult', 'Failed to add Q&A pair.', 'error');
        }
    }

    async loadStats() {
        const statsContent = document.getElementById('statsContent');
        
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            
            statsContent.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${data.total_qa}</div>
                        <div class="stat-label">Total Q&A Pairs</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.categories.length}</div>
                        <div class="stat-label">Categories</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.top_tags.length}</div>
                        <div class="stat-label">Unique Tags</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <div class="categories-list">
                        <h3><i class="fas fa-folder"></i> Categories</h3>
                        ${Object.entries(data.category_counts).map(([category, count]) => `
                            <div class="category-item">
                                <span>${category.charAt(0).toUpperCase() + category.slice(1)}</span>
                                <span class="category-count">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="tags-list">
                        <h3><i class="fas fa-tags"></i> Popular Tags</h3>
                        ${data.top_tags.slice(0, 10).map(([tag, count]) => `
                            <div class="tag-item">
                                <span>${tag}</span>
                                <span class="tag-count">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading stats:', error);
            statsContent.innerHTML = '<div class="no-results">Failed to load statistics.</div>';
        }
    }

    displayResults(results, containerId) {
        const container = document.getElementById(containerId);
        
        if (!results || results.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No results found</h3>
                    <p>Try adjusting your search terms or browse all Q&A pairs.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = results.map(qa => `
            <div class="qa-card">
                <div class="qa-question">
                    <i class="fas fa-question-circle" style="color: var(--primary-color); margin-right: 0.5rem;"></i>
                    ${this.escapeHtml(qa.question)}
                </div>
                <div class="qa-answer">
                    ${this.escapeHtml(qa.answer)}
                </div>
                <div class="qa-meta">
                    <div class="qa-category">${qa.category}</div>
                    <div class="qa-tags">
                        ${qa.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                    <div style="margin-left: auto; font-size: 0.8rem; opacity: 0.7;">
                        ${new Date(qa.created_at).toLocaleDateString()}
                    </div>
                </div>
            </div>
        `).join('');
    }

    showLoading(containerId) {
        document.getElementById(containerId).innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Loading...</p>
            </div>
        `;
    }

    showMessage(containerId, message, type) {
        const container = document.getElementById(containerId);
        container.innerHTML = `<div class="result-message ${type}">${message}</div>`;
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                container.innerHTML = '';
            }, 3000);
        }
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Global function for navigation (called from HTML)
function showSection(sectionName) {
    window.qaApp.showSection(sectionName);
}

function performSearch() {
    window.qaApp.performSearch();
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.qaApp = new QAApp();
});