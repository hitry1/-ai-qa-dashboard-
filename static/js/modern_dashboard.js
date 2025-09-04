// Modern Dashboard JavaScript - Apple Style with Animations

class ModernQAApp {
    constructor() {
        console.log('ModernQAApp constructor called');
        this.currentSection = 'dashboard';
        this.authHandler = new AuthHandler();
        this.currentUser = null;
        this.currentReplyQA = null;
        this.currentAIResponse = null;
        this.stats = {};
        this.searchCache = new Map();
        this.dataCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        this.performanceMetrics = {
            initStart: performance.now(),
            sectionsLoaded: 0,
            apiCalls: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        // Global error handler
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.showNotification('Something went wrong. Please refresh the page.', 'error');
        });
        
        console.log('Starting initialization...');
        this.init();
    }

    async init() {
        console.log('init() method called');
        // Check authentication first
        try {
            const authSuccess = await this.checkAuthentication();
            console.log('Authentication check completed, result:', authSuccess);
            
            if (!authSuccess) {
                console.log('Authentication failed, stopping initialization');
                return;
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            return;
        }
        
        // If we reach here, user is authenticated
        console.log('User authenticated, continuing initialization');
        this.setupEventListeners();
        this.updateDateTime();
        this.setupAnimations();
        await this.loadInitialData();
        this.showSection('dashboard');
        
        // Hide auth overlay with fade effect
        this.hideAuthOverlay();
        
        // Start periodic updates
        this.startPeriodicUpdates();
        
        // Record initialization completion
        const initTime = performance.now() - this.performanceMetrics.initStart;
        console.log(`Modern dashboard initialization completed in ${initTime.toFixed(2)}ms`);
        
        // Show welcome notification
        setTimeout(() => {
            this.showNotification(`Welcome back, ${this.currentUser?.username || 'User'}!`, 'success');
        }, 500);
    }

    async checkAuthentication() {
        try {
            console.log('Checking authentication...');
            const user = await this.authHandler.checkAuth();
            console.log('Auth check result:', user);
            
            if (!user) {
                console.log('No user found, redirecting to login');
                window.location.href = '/login';
                return false;
            }
            
            this.currentUser = user;
            this.displayUserInfo(user);
            console.log('User authenticated successfully:', user.username);
            return true;
        } catch (error) {
            console.error('Authentication check error:', error);
            window.location.href = '/login';
            return false;
        }
    }

    displayUserInfo(user) {
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const userInfo = document.getElementById('userInfo');
        
        if (userName && userEmail && userInfo) {
            userName.textContent = user.username;
            userEmail.textContent = user.email;
            userInfo.style.display = 'flex';
        }
    }

    hideAuthOverlay() {
        const overlay = document.getElementById('authOverlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Navigation event listeners
        const navItems = document.querySelectorAll('.nav-item');
        console.log(`Found ${navItems.length} navigation items`);
        navItems.forEach((item, index) => {
            const itemText = item.textContent.trim();
            const section = item.getAttribute('data-section');
            console.log(`[${index}] Adding click listener to nav item: ${itemText} -> ${section}`);
            
            // Remove any existing listeners first (Chrome safety)
            item.onclick = null;
            
            const clickHandler = (e) => {
                console.log(`[Chrome Debug] Nav item clicked: ${itemText} -> ${section}`);
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                if (section && this.showSection) {
                    console.log(`[Chrome Debug] Calling showSection from nav: ${section}`);
                    try {
                        this.showSection(section);
                    } catch (error) {
                        console.error('[Chrome Debug] Error calling showSection from nav:', error);
                    }
                }
                
                return false;
            };
            
            // Add both addEventListener and onclick for maximum compatibility
            item.addEventListener('click', clickHandler, { passive: false });
            item.onclick = clickHandler;
        });

        // Search form event listeners
        const searchInput = document.getElementById('searchInput');
        const globalSearch = document.getElementById('globalSearch');
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        if (globalSearch) {
            globalSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performGlobalSearch();
                }
            });
        }

        // AI form event listeners
        const aiQuestion = document.getElementById('aiQuestion');
        if (aiQuestion) {
            aiQuestion.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    this.askAI();
                }
            });
        }

        // Add form event listener
        const addForm = document.getElementById('addForm');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addQA();
            });
        }

        // Quick action buttons using data-section attribute
        const quickActionCards = document.querySelectorAll('.quick-action-card[data-section]');
        console.log(`Found ${quickActionCards.length} quick action cards`);
        quickActionCards.forEach((card, index) => {
            const section = card.getAttribute('data-section');
            console.log(`[${index}] Adding click listener to quick action card for section:`, section);
            
            // Remove any existing listeners first (Chrome safety)
            card.onclick = null;
            
            const clickHandler = (e) => {
                console.log(`Quick action: ${section}`);
                
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                if (section && this.showSection) {
                    try {
                        this.showSection(section);
                    } catch (error) {
                        console.error('Error showing section:', error);
                    }
                } else {
                    console.error('Missing section or showSection method');
                }
                
                return false;
            };
            
            // Add both addEventListener and onclick for maximum compatibility
            card.addEventListener('click', clickHandler, { passive: false });
            card.onclick = clickHandler;
            
            // Add visual feedback on hover
            card.addEventListener('mouseenter', () => {
                card.style.cursor = 'pointer';
                card.style.transform = 'translateY(-4px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Reply form event listener
        const replyForm = document.getElementById('replyForm');
        if (replyForm) {
            replyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addReply();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts if not typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Alt/Option + number keys for quick section switching
            if (e.altKey && !e.shiftKey && !e.ctrlKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        this.showSection('dashboard');
                        this.showNotification('Dashboard (Alt+1)', 'info');
                        break;
                    case '2':
                        e.preventDefault();
                        this.showSection('search');
                        this.showNotification('Search (Alt+2)', 'info');
                        break;
                    case '3':
                        e.preventDefault();
                        this.showSection('ask-ai');
                        this.showNotification('Ask AI (Alt+3)', 'info');
                        break;
                    case '4':
                        e.preventDefault();
                        this.showSection('browse');
                        this.showNotification('Browse (Alt+4)', 'info');
                        break;
                    case '5':
                        e.preventDefault();
                        this.showSection('add');
                        this.showNotification('Add Q&A (Alt+5)', 'info');
                        break;
                    case '6':
                        e.preventDefault();
                        this.showSection('analytics');
                        this.showNotification('Analytics (Alt+6)', 'info');
                        break;
                }
            }
        });

        // Smooth scrolling for anchor links
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]')) {
                e.preventDefault();
                const target = document.querySelector(e.target.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    setupAnimations() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe all cards and sections
        const animatedElements = document.querySelectorAll('.stat-card, .quick-action-card, .activity-card, .schedule-card, .favorites-card');
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            observer.observe(el);
        });

        // Add hover animations to interactive elements
        this.addHoverAnimations();
    }

    addHoverAnimations() {
        const hoverElements = document.querySelectorAll('.stat-card, .quick-action-card, .nav-item, .icon-button');
        
        hoverElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.style.transform = 'translateY(-4px)';
            });
            
            element.addEventListener('mouseleave', () => {
                if (!element.classList.contains('active')) {
                    element.style.transform = 'translateY(0)';
                }
            });
        });
    }

    updateDateTime() {
        const now = new Date();
        const currentDate = document.getElementById('currentDate');
        const welcomeTitle = document.getElementById('welcomeTitle');
        
        if (currentDate) {
            currentDate.textContent = now.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        if (welcomeTitle) {
            const hour = now.getHours();
            let greeting = '안녕하세요';
            let emoji = '👋';
            
            if (hour < 6) {
                greeting = '좋은 새벽이에요';
                emoji = '🌙';
            } else if (hour < 12) {
                greeting = '좋은 아침이에요';
                emoji = '🌅';
            } else if (hour < 18) {
                greeting = '좋은 오후에요';
                emoji = '☀️';
            } else if (hour < 22) {
                greeting = '좋은 저녁이에요';
                emoji = '🌆';
            } else {
                greeting = '늦은 밤이네요';
                emoji = '🌙';
            }
            
            welcomeTitle.innerHTML = `${greeting}! ${emoji}`;
        }
    }

    async loadInitialData() {
        await Promise.all([
            this.loadCategories(),
            this.loadStats(),
            this.loadRecentActivity()
        ]);
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
            this.updateCategorySelects(data.categories);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    updateCategorySelects(categories) {
        const categorySelects = document.querySelectorAll('#categoryFilter, #category');
        
        categorySelects.forEach(select => {
            // Clear existing options except first one
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                select.appendChild(option);
            });
        });
    }

    async loadStats() {
        const cacheKey = 'stats';
        const cached = this.getCachedData(cacheKey);
        
        if (cached) {
            this.performanceMetrics.cacheHits++;
            console.log('Using cached stats data');
            this.stats = cached;
            this.updateStatsDisplay(cached);
            return;
        }

        this.performanceMetrics.cacheMisses++;
        try {
            this.performanceMetrics.apiCalls++;
            const response = await fetch('/api/stats', {
                credentials: 'include'
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            const data = await response.json();
            this.stats = data;
            this.setCachedData(cacheKey, data);
            this.updateStatsDisplay(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateStatsDisplay(data) {
        // Animate number updates
        this.animateNumber('totalProjects', data.total_qa);
        this.animateNumber('activeUsers', data.user_stats?.total_users || 0);
        this.animateNumber('totalCategories', data.categories?.length || 0);
        
        // Update last update time
        const lastUpdate = document.querySelector('.last-update');
        if (lastUpdate) {
            lastUpdate.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        } else {
            // Add last update indicator to stats section
            const statsSection = document.querySelector('.stats-grid');
            if (statsSection) {
                const updateIndicator = document.createElement('div');
                updateIndicator.className = 'last-update';
                updateIndicator.style.cssText = 'text-align: center; color: var(--text-tertiary); font-size: 0.875rem; margin-top: 1rem;';
                updateIndicator.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
                statsSection.appendChild(updateIndicator);
            }
        }
    }

    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startValue = parseInt(element.textContent) || 0;
        const difference = targetValue - startValue;
        const duration = 1000; // 1 second
        const steps = 60;
        const stepValue = difference / steps;
        const stepDuration = duration / steps;

        let currentStep = 0;
        const timer = setInterval(() => {
            currentStep++;
            const currentValue = Math.round(startValue + (stepValue * currentStep));
            element.textContent = currentValue.toLocaleString();

            if (currentStep >= steps) {
                clearInterval(timer);
                element.textContent = targetValue.toLocaleString();
            }
        }, stepDuration);
    }

    async loadRecentActivity() {
        const activityContainer = document.getElementById('recentActivity');
        if (!activityContainer) return;

        // Simulate recent activity data
        const activities = [
            {
                id: '1',
                title: '새로운 수학 질문이 추가되었습니다',
                time: '2분 전',
                type: 'question',
                icon: 'fas fa-plus-circle',
                color: 'var(--success)'
            },
            {
                id: '2',
                title: 'AI가 프로그래밍 질문에 답변했습니다',
                time: '15분 전',
                type: 'ai',
                icon: 'fas fa-robot',
                color: 'var(--primary)'
            },
            {
                id: '3',
                title: '새로운 사용자가 가입했습니다',
                time: '1시간 전',
                type: 'user',
                icon: 'fas fa-user-plus',
                color: 'var(--warning)'
            },
            {
                id: '4',
                title: '과학 카테고리에 답글이 달렸습니다',
                time: '2시간 전',
                type: 'reply',
                icon: 'fas fa-comment',
                color: 'var(--info)'
            }
        ];

        const html = activities.map((activity, index) => `
            <div class="activity-item" style="animation-delay: ${index * 0.1}s">
                <div class="activity-icon" style="background: ${activity.color}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-title">${activity.title}</p>
                    <p class="activity-time">${activity.time}</p>
                </div>
            </div>
        `).join('');

        activityContainer.innerHTML = html;

        // Animate activity items
        const activityItems = activityContainer.querySelectorAll('.activity-item');
        activityItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            item.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
            
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, index * 100);
        });
    }

    showSection(sectionName) {
        console.log(`Switching to section: ${sectionName}`);
        
        // Show loading indicator for heavy sections
        if (['browse', 'analytics'].includes(sectionName)) {
            this.showSectionLoading(sectionName);
        }
        
        // Update navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === sectionName) {
                item.classList.add('active');
            }
        });

        // Show/hide sections with animation
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            if (section.id === sectionName) {
                section.style.display = 'block';
                section.classList.add('active');
                // Trigger reflow for animation
                section.offsetHeight;
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            } else {
                section.style.opacity = '0';
                section.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    section.style.display = 'none';
                    section.classList.remove('active');
                }, 300);
            }
        });

        this.currentSection = sectionName;

        // Load section-specific data
        switch (sectionName) {
            case 'browse':
                console.log('Loading browse section data...');
                this.loadAllQA();
                break;
            case 'analytics':
                console.log('Loading analytics section data...');
                this.loadAnalytics();
                break;
            case 'search':
                console.log('Search section loaded - ready for input');
                // Focus on search input if it exists
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    setTimeout(() => searchInput.focus(), 300);
                }
                break;
            case 'ask-ai':
                console.log('AI section loaded - ready for questions');
                // Focus on AI question input
                const aiInput = document.getElementById('aiQuestion');
                if (aiInput) {
                    setTimeout(() => aiInput.focus(), 300);
                }
                break;
            case 'add':
                console.log('Add section loaded - ready for new Q&A');
                // Focus on question input
                const questionInput = document.getElementById('question');
                if (questionInput) {
                    setTimeout(() => questionInput.focus(), 300);
                }
                break;
            default:
                console.log(`Section ${sectionName} loaded`);
        }

        // Update URL without reload
        history.pushState({ section: sectionName }, '', `#${sectionName}`);
    }

    async performSearch() {
        const query = document.getElementById('searchInput')?.value?.trim();
        const category = document.getElementById('categoryFilter')?.value;
        const resultsContainer = document.getElementById('searchResults');

        if (!query || !resultsContainer) return;

        this.showLoading(resultsContainer);

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
            this.displaySearchResults(data, resultsContainer);
        } catch (error) {
            console.error('Error performing search:', error);
            this.showError(resultsContainer, '검색 중 오류가 발생했습니다.');
        }
    }

    async performGlobalSearch() {
        const query = document.getElementById('globalSearch')?.value?.trim();
        if (!query) return;

        // Show search section and perform search
        this.showSection('search');
        document.getElementById('searchInput').value = query;
        this.performSearch();
    }

    displaySearchResults(data, container) {
        if (!data.results || data.results.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search" style="font-size: 3rem; color: var(--text-tertiary); margin-bottom: 1rem;"></i>
                    <h3>검색 결과가 없습니다</h3>
                    <p>다른 키워드로 검색해보세요.</p>
                </div>
            `;
            return;
        }

        const html = data.results.map(result => `
            <div class="result-item fade-in">
                <div class="result-header">
                    <h3 class="result-question">${this.escapeHtml(result.question)}</h3>
                    <span class="result-category">${result.category}</span>
                </div>
                <div class="result-answer">${this.formatAnswer(result.answer, result.category)}</div>
                <div class="result-meta">
                    <div class="result-tags">
                        ${result.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="result-actions">
                        <button class="reply-btn" onclick="openReplyModal('${result.id}')">
                            <i class="fas fa-reply"></i>
                            Reply (${result.reply_count || 0})
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;

        // Re-render MathJax if present
        if (window.MathJax) {
            MathJax.typesetPromise([container]).catch(err => console.error('MathJax error:', err));
        }
    }

    async loadAllQA() {
        const container = document.getElementById('browseResults');
        if (!container) return;

        this.showLoading(container);

        try {
            const response = await fetch('/api/all', {
                credentials: 'include'
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            const data = await response.json();
            this.displaySearchResults(data, container);
        } catch (error) {
            console.error('Error loading Q&A:', error);
            this.showError(container, '데이터를 불러오는 중 오류가 발생했습니다.');
        }
    }

    async askAI() {
        const question = document.getElementById('aiQuestion')?.value?.trim();
        if (!question) {
            this.showNotification('질문을 입력해주세요.', 'warning');
            return;
        }

        // Show loading with smooth animation
        const loadingEl = document.getElementById('aiLoading');
        const responseEl = document.getElementById('aiResponse');
        
        if (loadingEl) {
            loadingEl.style.display = 'block';
            loadingEl.style.opacity = '0';
            setTimeout(() => loadingEl.style.opacity = '1', 10);
        }
        
        if (responseEl) {
            responseEl.style.display = 'none';
        }

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
                this.showNotification(data.error || 'AI 응답 생성에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('Error asking AI:', error);
            this.showNotification('AI 응답 생성 중 오류가 발생했습니다.', 'error');
        } finally {
            if (loadingEl) {
                loadingEl.style.opacity = '0';
                setTimeout(() => loadingEl.style.display = 'none', 300);
            }
        }
    }

    displayAIResponse(data) {
        this.currentAIResponse = data;

        const responseEl = document.getElementById('aiResponse');
        if (!responseEl) return;

        const html = `
            <div class="ai-answer">
                <div class="ai-header">
                    <h3><i class="fas fa-lightbulb"></i> AI 답변</h3>
                    <div class="ai-meta">
                        <span class="category-badge category-${data.category}">${data.category}</span>
                        <span class="confidence-badge confidence-${this.getConfidenceClass(data.confidence)}">
                            ${Math.round(data.confidence * 100)}% 신뢰도
                        </span>
                    </div>
                </div>
                <div class="ai-content">${this.formatAnswer(data.answer, data.category)}</div>
                ${data.sources && data.sources.length > 0 ? `
                    <div class="ai-sources">
                        <h4><i class="fas fa-bookmark"></i> 관련 질문:</h4>
                        <ul>${data.sources.map(source => `<li>${this.escapeHtml(source)}</li>`).join('')}</ul>
                    </div>
                ` : ''}
                ${this.displayCategoryTools(data.tools, data.category)}
            </div>
            
            <div class="ai-actions">
                <button type="button" onclick="saveAIAnswer()" class="btn-primary">
                    <i class="fas fa-save"></i> 지식베이스에 저장
                </button>
                <button type="button" onclick="editAIAnswer()" class="btn-secondary">
                    <i class="fas fa-edit"></i> 답변 수정
                </button>
            </div>
        `;

        responseEl.innerHTML = html;
        responseEl.style.display = 'block';
        responseEl.style.opacity = '0';
        setTimeout(() => responseEl.style.opacity = '1', 10);

        // Re-render MathJax if present
        if (data.category === '수학' && window.MathJax) {
            MathJax.typesetPromise([responseEl]).catch(err => console.error('MathJax error:', err));
        }
    }

    displayCategoryTools(tools, category) {
        if (!tools || Object.keys(tools).length === 0) return '';

        let toolsHtml = '<div class="category-tools"><h4><i class="fas fa-tools"></i> 카테고리 도구:</h4><div class="tools-grid">';

        if (tools.mathjax) {
            toolsHtml += '<div class="tool-item">✓ 수학 수식 지원</div>';
        }
        if (tools.code_editor) {
            toolsHtml += '<div class="tool-item">✓ 코드 포맷팅</div>';
        }
        if (tools.calculator) {
            toolsHtml += '<div class="tool-item">✓ 계산 도구</div>';
        }
        if (tools.formula_templates) {
            toolsHtml += '<div class="tool-item">✓ 공식 템플릿</div>';
            toolsHtml += '<div class="formula-templates">';
            tools.formula_templates.forEach(template => {
                toolsHtml += `<span class="formula-template">${template}</span>`;
            });
            toolsHtml += '</div>';
        }

        toolsHtml += '</div></div>';
        return toolsHtml;
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

    getConfidenceClass(confidence) {
        if (confidence >= 0.8) return 'high';
        if (confidence >= 0.6) return 'medium';
        return 'low';
    }

    showLoading(container) {
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>로딩 중...</p>
            </div>
        `;
    }

    showError(container, message) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }

    showSectionLoading(sectionName) {
        const sectionMap = {
            'browse': 'Browse All Questions',
            'analytics': 'Analytics Dashboard'
        };
        const sectionTitle = sectionMap[sectionName] || sectionName;
        
        this.showNotification(`Loading ${sectionTitle}...`, 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification element with enhanced styling and functionality
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Icon mapping with better visual indicators
        const iconMap = {
            'success': 'check-circle',
            'error': 'times-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        
        notification.innerHTML = `
            <i class="fas fa-${iconMap[type]} notification-icon"></i>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()" title="Close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to DOM
        document.body.appendChild(notification);

        // Show with enhanced animation
        setTimeout(() => {
            notification.classList.add('show');
            // Add click sound effect (optional)
            if (type === 'success') {
                this.playNotificationSound('success');
            }
        }, 10);

        // Auto-remove with different durations based on type
        const duration = {
            'info': 2000,
            'success': 3000,
            'warning': 4000,
            'error': 5000
        }[type] || 3000;
        
        const autoRemove = setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 400);
        }, duration);
        
        // Clear auto-remove if user manually closes
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(autoRemove);
        });
        
        // Stack multiple notifications properly
        this.stackNotifications();
    }

    startPeriodicUpdates() {
        // Update time every minute
        setInterval(() => this.updateDateTime(), 60000);
        
        // Update stats every 5 minutes
        setInterval(() => this.loadStats(), 5 * 60 * 1000);
        
        // Update activity every 2 minutes
        setInterval(() => this.loadRecentActivity(), 2 * 60 * 1000);
        
        // Clear expired cache every 10 minutes
        setInterval(() => this.clearExpiredCache(), 10 * 60 * 1000);
    }

    stackNotifications() {
        // Stack notifications vertically when multiple are shown
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach((notification, index) => {
            const offset = index * 70; // 70px spacing between notifications
            notification.style.top = `${20 + offset}px`;
        });
    }
    
    playNotificationSound(type) {
        // Optional: Play subtle audio feedback for success notifications
        // This is a placeholder - you could implement actual audio if needed
        if ('vibrate' in navigator && type === 'success') {
            navigator.vibrate(50); // Gentle vibration on mobile
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

    async saveAIAnswer() {
        if (!this.currentAIResponse) {
            this.showNotification('저장할 AI 답변이 없습니다.', 'warning');
            return;
        }

        const aiQuestion = document.getElementById('aiQuestion')?.value?.trim();
        if (!aiQuestion) {
            this.showNotification('질문을 입력해주세요.', 'warning');
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
                    question: aiQuestion,
                    answer: this.currentAIResponse.answer,
                    category: this.currentAIResponse.category,
                    confidence: this.currentAIResponse.confidence,
                    sources: this.currentAIResponse.sources || [],
                    reasoning: this.currentAIResponse.reasoning || ''
                })
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            const data = await response.json();

            if (data.success) {
                this.showNotification('AI 답변이 지식베이스에 저장되었습니다!', 'success');
                
                // Update stats
                this.loadStats();
                
                // Clear the AI form
                document.getElementById('aiQuestion').value = '';
                document.getElementById('aiResponse').style.display = 'none';
                this.currentAIResponse = null;
            } else {
                this.showNotification(data.error || 'AI 답변 저장에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('Error saving AI answer:', error);
            this.showNotification('AI 답변 저장 중 오류가 발생했습니다.', 'error');
        }
    }

    editAIAnswer() {
        if (!this.currentAIResponse) {
            this.showNotification('수정할 AI 답변이 없습니다.', 'warning');
            return;
        }

        // Create editable version of the AI response
        const responseEl = document.getElementById('aiResponse');
        const currentAnswer = this.currentAIResponse.answer;
        
        const editHtml = `
            <div class="ai-answer-editor">
                <div class="ai-header">
                    <h3><i class="fas fa-edit"></i> AI 답변 수정</h3>
                    <div class="ai-meta">
                        <span class="category-badge category-${this.currentAIResponse.category}">${this.currentAIResponse.category}</span>
                    </div>
                </div>
                <div class="edit-form">
                    <textarea id="editAnswerText" placeholder="답변을 수정하세요...">${currentAnswer}</textarea>
                    <div class="edit-actions">
                        <button type="button" onclick="saveEditedAnswer()" class="btn-primary">
                            <i class="fas fa-save"></i> 수정 완료
                        </button>
                        <button type="button" onclick="cancelEdit()" class="btn-secondary">
                            <i class="fas fa-times"></i> 취소
                        </button>
                    </div>
                </div>
            </div>
        `;

        responseEl.innerHTML = editHtml;

        // Focus on textarea
        const textarea = document.getElementById('editAnswerText');
        if (textarea) {
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
    }

    saveEditedAnswer() {
        const editedAnswer = document.getElementById('editAnswerText')?.value?.trim();
        if (!editedAnswer) {
            this.showNotification('답변을 입력해주세요.', 'warning');
            return;
        }

        // Update current AI response with edited answer
        this.currentAIResponse.answer = editedAnswer;
        
        // Display the updated response
        this.displayAIResponse(this.currentAIResponse);
        
        this.showNotification('답변이 수정되었습니다.', 'success');
    }

    cancelEdit() {
        // Restore original AI response display
        this.displayAIResponse(this.currentAIResponse);
    }

    async loadAnalytics() {
        const container = document.getElementById('analyticsContent');
        if (!container) return;

        this.showLoading(container);

        try {
            // Simulate analytics data loading
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const analyticsData = {
                questionsByCategory: {
                    '수학': 45,
                    '과학': 32,
                    '프로그래밍': 58,
                    '영어': 23,
                    '국어': 15,
                    '일반': 27
                },
                monthlyActivity: [
                    { month: '1월', questions: 45, answers: 42 },
                    { month: '2월', questions: 52, answers: 48 },
                    { month: '3월', questions: 38, answers: 35 },
                    { month: '4월', questions: 65, answers: 60 },
                    { month: '5월', questions: 73, answers: 70 },
                    { month: '6월', questions: 58, answers: 55 }
                ],
                userStats: {
                    totalUsers: 156,
                    activeUsers: 89,
                    newUsers: 12
                },
                topCategories: [
                    { name: '프로그래밍', count: 58, percentage: 29 },
                    { name: '수학', count: 45, percentage: 22.5 },
                    { name: '과학', count: 32, percentage: 16 }
                ]
            };

            this.displayAnalytics(analyticsData, container);
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showError(container, '분석 데이터를 불러오는 중 오류가 발생했습니다.');
        }
    }

    displayAnalytics(data, container) {
        const html = `
            <div class="analytics-dashboard">
                <div class="analytics-header">
                    <h2><i class="fas fa-chart-bar"></i> 데이터 분석</h2>
                    <p>시스템 사용 현황과 통계를 확인하세요</p>
                </div>

                <div class="analytics-grid">
                    <!-- Category Distribution Chart -->
                    <div class="analytics-card chart-card">
                        <h3><i class="fas fa-pie-chart"></i> 카테고리별 질문 분포</h3>
                        <div class="chart-container">
                            <canvas id="categoryChart" width="400" height="300"></canvas>
                        </div>
                    </div>

                    <!-- Monthly Activity Chart -->
                    <div class="analytics-card chart-card">
                        <h3><i class="fas fa-line-chart"></i> 월별 활동 추이</h3>
                        <div class="chart-container">
                            <canvas id="monthlyChart" width="400" height="300"></canvas>
                        </div>
                    </div>

                    <!-- Top Categories -->
                    <div class="analytics-card">
                        <h3><i class="fas fa-trophy"></i> 인기 카테고리</h3>
                        <div class="top-categories">
                            ${data.topCategories.map((category, index) => `
                                <div class="category-rank">
                                    <span class="rank">${index + 1}</span>
                                    <span class="category-name">${category.name}</span>
                                    <span class="category-count">${category.count}</span>
                                    <div class="progress-bar">
                                        <div class="progress" style="width: ${category.percentage}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- User Statistics -->
                    <div class="analytics-card">
                        <h3><i class="fas fa-users"></i> 사용자 통계</h3>
                        <div class="user-stats">
                            <div class="stat-item">
                                <div class="stat-value">${data.userStats.totalUsers}</div>
                                <div class="stat-label">전체 사용자</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${data.userStats.activeUsers}</div>
                                <div class="stat-label">활성 사용자</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${data.userStats.newUsers}</div>
                                <div class="stat-label">신규 사용자</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Initialize charts
        this.initializeCharts(data);
    }

    initializeCharts(data) {
        // Note: This is a simplified chart implementation
        // In a real app, you'd use a library like Chart.js or D3.js
        
        const categoryCanvas = document.getElementById('categoryChart');
        const monthlyCanvas = document.getElementById('monthlyChart');
        
        if (categoryCanvas) {
            const ctx = categoryCanvas.getContext('2d');
            this.drawCategoryChart(ctx, data.questionsByCategory);
        }
        
        if (monthlyCanvas) {
            const ctx = monthlyCanvas.getContext('2d');
            this.drawMonthlyChart(ctx, data.monthlyActivity);
        }
    }

    drawCategoryChart(ctx, data) {
        const canvas = ctx.canvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 40;
        
        const total = Object.values(data).reduce((sum, val) => sum + val, 0);
        const colors = ['#007AFF', '#FF3B30', '#34C759', '#FF9500', '#5856D6', '#AF52DE'];
        
        let currentAngle = -Math.PI / 2;
        
        Object.entries(data).forEach(([category, count], index) => {
            const angle = (count / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
            ctx.fillStyle = colors[index % colors.length];
            ctx.fill();
            
            currentAngle += angle;
        });
        
        // Add labels
        ctx.fillStyle = '#000';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
        currentAngle = -Math.PI / 2;
        
        Object.entries(data).forEach(([category, count]) => {
            const angle = (count / total) * 2 * Math.PI;
            const labelAngle = currentAngle + angle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
            
            ctx.fillText(`${category}: ${count}`, labelX, labelY);
            currentAngle += angle;
        });
    }

    drawMonthlyChart(ctx, data) {
        const canvas = ctx.canvas;
        const padding = 40;
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - 2 * padding;
        
        const maxValue = Math.max(...data.map(d => Math.max(d.questions, d.answers)));
        const stepX = chartWidth / (data.length - 1);
        
        // Draw grid
        ctx.strokeStyle = '#E5E5E7';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
        }
        
        // Draw question line
        ctx.strokeStyle = '#007AFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = padding + stepX * index;
            const y = padding + chartHeight - (point.questions / maxValue) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // Draw answer line
        ctx.strokeStyle = '#34C759';
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = padding + stepX * index;
            const y = padding + chartHeight - (point.answers / maxValue) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // Add labels
        ctx.fillStyle = '#000';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
        
        data.forEach((point, index) => {
            const x = padding + stepX * index;
            ctx.fillText(point.month, x - 10, canvas.height - 10);
        });
    }

    // Additional methods for form handling, etc.
    async addQA() {
        const question = document.getElementById('question')?.value?.trim();
        const answer = document.getElementById('answer')?.value?.trim();
        const category = document.getElementById('category')?.value || '일반';
        const tags = document.getElementById('tags')?.value?.trim();

        if (!question || !answer) {
            this.showNotification('질문과 답변을 모두 입력해주세요.', 'warning');
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
                    tags: tags ? tags.split(',').map(t => t.trim()) : []
                })
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            const data = await response.json();

            if (data.success) {
                this.showNotification('Q&A가 성공적으로 추가되었습니다!', 'success');
                // Clear form
                document.getElementById('addForm').reset();
                // Reload stats
                this.loadStats();
            } else {
                this.showNotification(data.error || 'Q&A 추가에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('Error adding Q&A:', error);
            this.showNotification('Q&A 추가 중 오류가 발생했습니다.', 'error');
        }
    }

    // Modal methods
    openReplyModal(qaId) {
        this.currentReplyQA = qaId;
        const modal = document.getElementById('replyModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    closeReplyModal() {
        const modal = document.getElementById('replyModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        this.currentReplyQA = null;
        document.getElementById('replyContent').value = '';
    }

    async addReply() {
        const content = document.getElementById('replyContent')?.value?.trim();
        
        if (!content || !this.currentReplyQA) {
            this.showNotification('답글 내용을 입력해주세요.', 'warning');
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
                this.showNotification('답글이 성공적으로 추가되었습니다!', 'success');
                
                // Refresh current view
                if (this.currentSection === 'search') {
                    this.performSearch();
                } else if (this.currentSection === 'browse') {
                    this.loadAllQA();
                }
            } else {
                this.showNotification(data.error || '답글 추가에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('Error adding reply:', error);
            this.showNotification('답글 추가 중 오류가 발생했습니다.', 'error');
        }
    }

    // Performance monitoring
    measurePerformance(operation, callback) {
        const start = performance.now();
        const result = callback();
        const end = performance.now();
        console.log(`Performance: ${operation} took ${(end - start).toFixed(2)}ms`);
        return result;
    }

    // Debounced search for better performance
    debounceSearch(callback, delay = 300) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => callback.apply(this, args), delay);
        };
    }

    // Lazy loading for images and content
    lazyLoad() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }

    // Cache management methods
    getCachedData(key) {
        const cached = this.dataCache.get(key);
        if (!cached) return null;
        
        const now = Date.now();
        if (now - cached.timestamp > this.cacheExpiry) {
            this.dataCache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    setCachedData(key, data) {
        this.dataCache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    clearExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.dataCache.entries()) {
            if (now - value.timestamp > this.cacheExpiry) {
                this.dataCache.delete(key);
            }
        }
    }

    // Memory cleanup
    cleanup() {
        // Clear intervals
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Remove event listeners
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        
        // Clear cached data
        this.searchCache?.clear();
        this.dataCache?.clear();
        this.currentAIResponse = null;
        this.currentReplyQA = null;
        
        // Log performance metrics
        console.log('Performance Metrics:', this.performanceMetrics);
    }
}

// Global functions for compatibility
function showSection(sectionName) {
    console.log('Global showSection called with:', sectionName);
    if (window.modernApp) {
        console.log('Calling window.modernApp.showSection');
        window.modernApp.showSection(sectionName);
    } else {
        console.error('window.modernApp not available');
    }
}

function performSearch() {
    if (window.modernApp) {
        window.modernApp.performSearch();
    }
}

function askAI() {
    if (window.modernApp) {
        window.modernApp.askAI();
    }
}

function clearAIForm() {
    const aiQuestion = document.getElementById('aiQuestion');
    const aiResponse = document.getElementById('aiResponse');
    if (aiQuestion) aiQuestion.value = '';
    if (aiResponse) aiResponse.style.display = 'none';
}

function saveAIAnswer() {
    if (window.modernApp && window.modernApp.currentAIResponse) {
        window.modernApp.saveAIAnswer();
    }
}

function editAIAnswer() {
    if (window.modernApp) {
        window.modernApp.editAIAnswer();
    }
}

function saveEditedAnswer() {
    if (window.modernApp) {
        window.modernApp.saveEditedAnswer();
    }
}

function cancelEdit() {
    if (window.modernApp) {
        window.modernApp.cancelEdit();
    }
}

function openReplyModal(qaId) {
    if (window.modernApp) {
        window.modernApp.openReplyModal(qaId);
    }
}

function closeReplyModal() {
    if (window.modernApp) {
        window.modernApp.closeReplyModal();
    }
}

async function logout() {
    if (window.modernApp && window.modernApp.authHandler) {
        await window.modernApp.authHandler.logout();
    }
}

// Prevent multiple initialization
if (!window.modernAppInitialized) {
    window.modernAppInitialized = true;
    
    // Initialize the app when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing ModernQAApp...');
        const initStart = performance.now();
        
        try {
            if (!window.modernApp) {
                window.modernApp = new ModernQAApp();
                const initEnd = performance.now();
                console.log(`ModernQAApp initialized successfully in ${(initEnd - initStart).toFixed(2)}ms`);
            } else {
                console.log('ModernQAApp already exists, skipping initialization');
            }
        } catch (error) {
            console.error('Error initializing ModernQAApp:', error);
        }
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (window.modernApp && e.state && e.state.section) {
                window.modernApp.showSection(e.state.section);
            }
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('replyModal');
            if (e.target === modal) {
                closeReplyModal();
            }
        });
    });
}