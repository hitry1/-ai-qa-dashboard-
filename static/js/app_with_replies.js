// Student Q&A Knowledge Base JavaScript with Replies

class StudentQAApp {
    constructor() {
        this.currentSection = 'search';
        this.authHandler = new AuthHandler();
        this.currentUser = null;
        this.currentReplyQA = null;
        this.studentCategories = [];
        this.init();
    }

    async init() {
        // Check authentication first
        await this.checkAuthentication();
        
        // If we reach here, user is authenticated
        this.setupEventListeners();
        await this.loadCategories();
        await this.loadStats();
        this.showSection('search');
        
        // Hide auth overlay
        this.hideAuthOverlay();
    }

    async checkAuthentication() {
        const user = await this.authHandler.checkAuth();
        if (!user) {
            window.location.href = '/login';
            return;
        }
        
        this.currentUser = user;
        this.displayUserInfo(user);
    }

    displayUserInfo(user) {
        const userInfo = document.getElementById('userInfo');
        const username = document.getElementById('username');
        const userEmail = document.getElementById('userEmail');
        
        if (userInfo && username && userEmail) {
            username.textContent = user.username;
            userEmail.textContent = user.email;
            userInfo.style.display = 'flex';
        }
    }

    hideAuthOverlay() {
        const overlay = document.getElementById('authOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
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

        // Reply form
        document.getElementById('replyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addReply();
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
            const response = await fetch('/api/categories', {
                credentials: 'include'
            });
            
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            
            const data = await response.json();
            this.studentCategories = data.student_categories || [];
            
            // Update category filter dropdown
            const categoryFilter = document.getElementById('categoryFilter');
            categoryFilter.innerHTML = '<option value="">All Subjects</option>';
            
            data.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = this.formatCategoryName(category);
                categoryFilter.appendChild(option);
            });

            // Update category pills
            this.updateCategoryPills();
            
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    formatCategoryName(category) {
        const categoryMap = {
            'mathematics': 'Mathematics',
            'science': 'Science',
            'history': 'History',
            'language': 'Language & Literature',
            'geography': 'Geography',
            'computer-science': 'Computer Science',
            'study-tips': 'Study Tips & Skills',
            'general': 'General Knowledge'
        };
        return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
    }

    updateCategoryPills() {
        const pillsContainer = document.getElementById('categoryPills');
        
        // Clear existing pills except "All Subjects"
        pillsContainer.innerHTML = `
            <div class="category-pill active" onclick="filterByCategory('')">
                <i class="fas fa-home"></i> All Subjects
            </div>
        `;

        // Add student category pills
        this.studentCategories.forEach(category => {
            const pill = document.createElement('div');
            pill.className = 'category-pill';
            pill.onclick = () => this.filterByCategory(category.key);
            pill.innerHTML = `<i class="${category.icon}"></i> ${category.name}`;
            pillsContainer.appendChild(pill);
        });
    }

    filterByCategory(categoryKey) {
        // Update active pill
        document.querySelectorAll('.category-pill').forEach(pill => {
            pill.classList.remove('active');
        });
        event.target.classList.add('active');

        // Update category filter dropdown
        document.getElementById('categoryFilter').value = categoryKey;

        // If we're in search section and have a query, search with category
        if (this.currentSection === 'search') {
            const query = document.getElementById('searchInput').value.trim();
            if (query) {
                this.performSearch();
            }
        } else if (this.currentSection === 'browse') {
            this.loadAllQA();
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
            
            const response = await fetch(`/api/search?${params}`, {
                credentials: 'include'
            });
            
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            
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
            const response = await fetch('/api/all', {
                credentials: 'include'
            });
            
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            
            const data = await response.json();
            
            // Filter by selected category if any
            const selectedCategory = document.getElementById('categoryFilter').value;
            let filteredResults = data.qa_pairs;
            
            if (selectedCategory) {
                filteredResults = data.qa_pairs.filter(qa => qa.category === selectedCategory);
            }
            
            this.displayResults(filteredResults, 'browseResults');
        } catch (error) {
            console.error('Error loading Q&A pairs:', error);
            this.showMessage('browseResults', 'Failed to load Q&A pairs.', 'error');
        }
    }

    async addQA() {
        const question = document.getElementById('question').value.trim();
        const answer = document.getElementById('answer').value.trim();
        const category = document.getElementById('category').value || 'general';
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
                credentials: 'include',
                body: JSON.stringify({
                    question,
                    answer,
                    category,
                    tags
                })
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            const data = await response.json();
            
            if (data.success) {
                this.showMessage('addResult', `Question added successfully! Thank you for contributing, ${data.added_by}!`, 'success');
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
            const response = await fetch('/api/stats', {
                credentials: 'include'
            });
            
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            
            const data = await response.json();
            
            statsContent.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${data.total_qa}</div>
                        <div class="stat-label">Total Questions</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.categories.length}</div>
                        <div class="stat-label">Subject Areas</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.reply_stats.total_replies}</div>
                        <div class="stat-label">Total Replies</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.user_stats.total_users}</div>
                        <div class="stat-label">Students</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.reply_stats.helpful_replies}</div>
                        <div class="stat-label">Helpful Replies</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                    <div class="categories-list">
                        <h3><i class="fas fa-folder"></i> Subject Areas</h3>
                        ${Object.entries(data.category_counts).map(([category, count]) => `
                            <div class="category-item">
                                <span>${this.formatCategoryName(category)}</span>
                                <span class="category-count">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="tags-list">
                        <h3><i class="fas fa-tags"></i> Popular Topics</h3>
                        ${data.top_tags.slice(0, 10).map(([tag, count]) => `
                            <div class="tag-item">
                                <span>${tag}</span>
                                <span class="tag-count">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="categories-list">
                        <h3><i class="fas fa-users"></i> Community</h3>
                        <div class="category-item">
                            <span>Active Students</span>
                            <span class="category-count">${data.user_stats.active_users}</span>
                        </div>
                        <div class="category-item">
                            <span>Active Sessions</span>
                            <span class="category-count">${data.user_stats.active_sessions}</span>
                        </div>
                        <div class="category-item">
                            <span>Top Contributors</span>
                            <span class="category-count">${data.reply_stats.top_contributors.length}</span>
                        </div>
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
                    <p>Try searching for different terms or browse all questions.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = results.map(qa => this.renderQACard(qa)).join('');
    }

    renderQACard(qa) {
        const repliesHtml = qa.replies && qa.replies.length > 0 
            ? qa.replies.map(reply => this.renderReply(reply)).join('')
            : '<p class="no-replies">No replies yet. Be the first to help!</p>';

        return `
            <div class="qa-card">
                <div class="qa-question">
                    <i class="fas fa-question-circle" style="color: var(--student-blue); margin-right: 0.5rem;"></i>
                    ${this.escapeHtml(qa.question)}
                </div>
                <div class="qa-answer">
                    ${this.escapeHtml(qa.answer)}
                </div>
                <div class="qa-meta">
                    <div class="qa-category">${this.formatCategoryName(qa.category)}</div>
                    <div class="qa-tags">
                        ${qa.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                    <div style="margin-left: auto; font-size: 0.8rem; opacity: 0.7;">
                        ${new Date(qa.created_at).toLocaleDateString()}
                    </div>
                </div>
                
                <div class="replies-section">
                    <div class="replies-header">
                        <span class="replies-count">
                            <i class="fas fa-comments"></i> ${qa.reply_count || 0} replies
                        </span>
                        <button class="reply-btn" onclick="openReplyModal('${qa.id}')">
                            <i class="fas fa-reply"></i> Reply
                        </button>
                    </div>
                    
                    <div class="replies-list" id="replies-${qa.id}">
                        ${repliesHtml}
                    </div>
                </div>
            </div>
        `;
    }

    renderReply(reply) {
        return `
            <div class="reply-card">
                <div class="reply-header">
                    <span class="reply-author">
                        <i class="fas fa-user-circle"></i> ${this.escapeHtml(reply.username)}
                    </span>
                    <span class="reply-date">
                        ${new Date(reply.created_at).toLocaleDateString()}
                    </span>
                </div>
                <div class="reply-content">
                    ${this.escapeHtml(reply.content)}
                </div>
                <div class="reply-actions">
                    <button class="helpful-btn ${reply.is_helpful ? 'helpful' : ''}" 
                            onclick="toggleHelpful('${reply.id}')">
                        <i class="fas fa-thumbs-up"></i> 
                        Helpful (${reply.helpful_votes || 0})
                    </button>
                </div>
            </div>
        `;
    }

    openReplyModal(qaId) {
        this.currentReplyQA = qaId;
        document.getElementById('replyContent').value = '';
        document.getElementById('replyModal').style.display = 'block';
    }

    closeReplyModal() {
        document.getElementById('replyModal').style.display = 'none';
        this.currentReplyQA = null;
    }

    async addReply() {
        if (!this.currentReplyQA) return;

        const content = document.getElementById('replyContent').value.trim();
        
        if (!content) {
            alert('Please enter a reply.');
            return;
        }

        try {
            const response = await fetch('/api/replies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    qa_id: this.currentReplyQA,
                    content: content
                })
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            const data = await response.json();
            
            if (data.success) {
                this.closeReplyModal();
                
                // Refresh the current view to show the new reply
                if (this.currentSection === 'search') {
                    const query = document.getElementById('searchInput').value.trim();
                    if (query) {
                        this.performSearch();
                    }
                } else if (this.currentSection === 'browse') {
                    this.loadAllQA();
                }
                
                // Show success message
                alert('Reply added successfully!');
            } else {
                alert(data.error || 'Failed to add reply.');
            }
        } catch (error) {
            console.error('Error adding reply:', error);
            alert('Failed to add reply.');
        }
    }

    async toggleHelpful(replyId) {
        try {
            const response = await fetch(`/api/replies/${replyId}/helpful`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            const data = await response.json();
            
            if (data.success) {
                // Refresh the current view to show updated helpful status
                if (this.currentSection === 'search') {
                    const query = document.getElementById('searchInput').value.trim();
                    if (query) {
                        this.performSearch();
                    }
                } else if (this.currentSection === 'browse') {
                    this.loadAllQA();
                }
            }
        } catch (error) {
            console.error('Error toggling helpful:', error);
        }
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

    // AI Methods
    async askAI() {
        const question = document.getElementById('aiQuestion').value.trim();
        if (!question) {
            alert('Please enter a question');
            return;
        }

        // Show loading
        document.getElementById('aiLoading').style.display = 'block';
        document.getElementById('aiResponse').style.display = 'none';

        try {
            const response = await fetch('/api/ask-ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ question })
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            const data = await response.json();

            if (data.success) {
                this.displayAIResponse(data);
            } else {
                alert(data.error || 'Failed to get AI response');
            }
        } catch (error) {
            console.error('Error asking AI:', error);
            alert('Failed to get AI response');
        } finally {
            document.getElementById('aiLoading').style.display = 'none';
        }
    }

    displayAIResponse(data) {
        // Store current AI response for saving
        this.currentAIResponse = data;

        // Display category and confidence
        document.getElementById('aiCategory').textContent = data.category;
        document.getElementById('aiCategory').className = `category-badge category-${data.category}`;
        
        const confidencePercent = Math.round(data.confidence * 100);
        document.getElementById('aiConfidence').textContent = `${confidencePercent}% confidence`;
        document.getElementById('aiConfidence').className = `confidence-badge confidence-${this.getConfidenceClass(data.confidence)}`;

        // Display answer with formatting
        document.getElementById('aiAnswerContent').innerHTML = this.formatAnswer(data.answer, data.category);

        // Display sources if available
        if (data.sources && data.sources.length > 0) {
            const sourcesList = document.getElementById('aiSourcesList');
            sourcesList.innerHTML = data.sources.map(source => `<li>${this.escapeHtml(source)}</li>`).join('');
            document.getElementById('aiSources').style.display = 'block';
        } else {
            document.getElementById('aiSources').style.display = 'none';
        }

        // Display tools for the category
        this.displayCategoryTools(data.tools, data.category);

        // Show response
        document.getElementById('aiResponse').style.display = 'block';

        // Re-render math if present
        if (data.category === '수학' && window.MathJax) {
            MathJax.typesetPromise([document.getElementById('aiAnswerContent')]).catch(err => console.error('MathJax error:', err));
        }
    }

    formatAnswer(answer, category) {
        let formatted = this.escapeHtml(answer);
        
        // Convert newlines to HTML breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        // For math category, handle LaTeX expressions
        if (category === '수학') {
            // Keep LaTeX expressions unescaped
            formatted = answer.replace(/\n/g, '<br>');
        }
        
        // For programming category, handle code blocks
        if (category === '프로그래밍') {
            formatted = formatted.replace(/```(\w+)?\n?(.*?)\n?```/gs, (match, lang, code) => {
                return `<pre><code class="language-${lang || 'text'}">${code}</code></pre>`;
            });
            formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        }
        
        return formatted;
    }

    displayCategoryTools(tools, category) {
        const toolsContainer = document.getElementById('aiTools');
        
        if (!tools || Object.keys(tools).length === 0) {
            toolsContainer.innerHTML = '';
            return;
        }

        let toolsHtml = '<div class="category-tools"><h4><i class="fas fa-tools"></i> Category Tools:</h4><div class="tools-grid">';

        if (tools.mathjax) {
            toolsHtml += '<div class="tool-item">✓ Mathematical expressions supported</div>';
        }
        if (tools.code_editor) {
            toolsHtml += '<div class="tool-item">✓ Code formatting available</div>';
        }
        if (tools.calculator) {
            toolsHtml += '<div class="tool-item">✓ Calculation assistance</div>';
        }
        if (tools.formula_templates) {
            toolsHtml += '<div class="tool-item">✓ Formula templates available</div>';
            toolsHtml += '<div class="formula-templates">';
            tools.formula_templates.forEach(template => {
                toolsHtml += `<span class="formula-template">${template}</span>`;
            });
            toolsHtml += '</div>';
        }

        toolsHtml += '</div></div>';
        toolsContainer.innerHTML = toolsHtml;

        // Re-render math in tools if present
        if (category === '수학' && window.MathJax) {
            MathJax.typesetPromise([toolsContainer]).catch(err => console.error('MathJax error:', err));
        }
    }

    getConfidenceClass(confidence) {
        if (confidence >= 0.8) return 'high';
        if (confidence >= 0.6) return 'medium';
        return 'low';
    }

    editAIAnswer() {
        if (!this.currentAIResponse) return;

        document.getElementById('editedAnswer').value = this.currentAIResponse.answer;
        document.getElementById('editCategory').value = this.currentAIResponse.category;
        document.getElementById('aiEditForm').style.display = 'block';
    }

    async saveAIAnswer() {
        if (!this.currentAIResponse) {
            alert('No AI response to save');
            return;
        }

        try {
            const response = await fetch('/api/save-ai-qa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    question: this.currentAIResponse.question,
                    answer: this.currentAIResponse.answer,
                    category: this.currentAIResponse.category,
                    tags: ['AI생성']
                })
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            const data = await response.json();

            if (data.success) {
                alert('AI answer saved to knowledge base!');
                // Clear the form
                document.getElementById('aiQuestion').value = '';
                document.getElementById('aiResponse').style.display = 'none';
                this.currentAIResponse = null;
            } else {
                alert(data.error || 'Failed to save AI answer');
            }
        } catch (error) {
            console.error('Error saving AI answer:', error);
            alert('Failed to save AI answer');
        }
    }

    async saveEditedAI() {
        const editedAnswer = document.getElementById('editedAnswer').value.trim();
        const editedCategory = document.getElementById('editCategory').value;

        if (!editedAnswer) {
            alert('Answer cannot be empty');
            return;
        }

        try {
            const response = await fetch('/api/save-ai-qa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    question: this.currentAIResponse.question,
                    answer: editedAnswer,
                    category: editedCategory,
                    tags: ['AI생성', '사용자수정']
                })
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            const data = await response.json();

            if (data.success) {
                alert('Edited AI answer saved to knowledge base!');
                // Clear forms
                document.getElementById('aiQuestion').value = '';
                document.getElementById('aiResponse').style.display = 'none';
                document.getElementById('aiEditForm').style.display = 'none';
                this.currentAIResponse = null;
            } else {
                alert(data.error || 'Failed to save edited answer');
            }
        } catch (error) {
            console.error('Error saving edited AI answer:', error);
            alert('Failed to save edited answer');
        }
    }
}

// Global functions for navigation and interactions
function showSection(sectionName) {
    window.qaApp.showSection(sectionName);
}

function performSearch() {
    window.qaApp.performSearch();
}

function filterByCategory(categoryKey) {
    // This is handled by the click event on the pill
}

function openReplyModal(qaId) {
    window.qaApp.openReplyModal(qaId);
}

function closeReplyModal() {
    window.qaApp.closeReplyModal();
}

function toggleHelpful(replyId) {
    window.qaApp.toggleHelpful(replyId);
}

// AI Functions
async function askAI() {
    window.qaApp.askAI();
}

function clearAIForm() {
    document.getElementById('aiQuestion').value = '';
    document.getElementById('aiResponse').style.display = 'none';
}

function editAIAnswer() {
    window.qaApp.editAIAnswer();
}

function cancelEdit() {
    document.getElementById('aiEditForm').style.display = 'none';
}

function saveAIAnswer() {
    window.qaApp.saveAIAnswer();
}

function saveEditedAI() {
    window.qaApp.saveEditedAI();
}

async function logout() {
    await window.qaApp.authHandler.logout();
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.qaApp = new StudentQAApp();
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('replyModal');
        if (event.target === modal) {
            closeReplyModal();
        }
    };
});