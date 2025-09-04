// Authentication JavaScript

class AuthHandler {
    constructor() {
        this.apiBase = '';
    }

    // Show message to user
    showMessage(message, type = 'info') {
        const messageEl = document.getElementById('message');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `message ${type}`;
            messageEl.style.display = 'block';
            
            // Auto-hide success messages after 3 seconds
            if (type === 'success') {
                setTimeout(() => {
                    messageEl.style.display = 'none';
                }, 3000);
            }
        }
    }

    // Set button loading state
    setButtonLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Initialize login form
    initLoginForm() {
        const form = document.getElementById('loginForm');
        const submitBtn = form.querySelector('button[type="submit"]');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            // Basic validation
            if (!username || !password) {
                this.showMessage('Please enter both username and password', 'error');
                return;
            }

            this.setButtonLoading(submitBtn, true);

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                    credentials: 'include'
                });

                const data = await response.json();

                if (data.success) {
                    this.showMessage('Login successful! Redirecting...', 'success');
                    // Redirect to main app after short delay
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    this.showMessage(data.error || 'Login failed', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                this.showMessage('Login failed. Please try again.', 'error');
            } finally {
                this.setButtonLoading(submitBtn, false);
            }
        });
    }

    // Initialize register form
    initRegisterForm() {
        const form = document.getElementById('registerForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        // Real-time password confirmation validation
        confirmPasswordInput.addEventListener('input', () => {
            if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
                confirmPasswordInput.setCustomValidity('Passwords do not match');
            } else {
                confirmPasswordInput.setCustomValidity('');
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const terms = document.getElementById('terms').checked;

            // Validation
            if (!username || !email || !password || !confirmPassword) {
                this.showMessage('Please fill in all fields', 'error');
                return;
            }

            if (username.length < 3) {
                this.showMessage('Username must be at least 3 characters long', 'error');
                return;
            }

            if (!this.isValidEmail(email)) {
                this.showMessage('Please enter a valid email address', 'error');
                return;
            }

            if (password.length < 6) {
                this.showMessage('Password must be at least 6 characters long', 'error');
                return;
            }

            if (password !== confirmPassword) {
                this.showMessage('Passwords do not match', 'error');
                return;
            }

            if (!terms) {
                this.showMessage('Please accept the terms of service', 'error');
                return;
            }

            this.setButtonLoading(submitBtn, true);

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password }),
                    credentials: 'include'
                });

                const data = await response.json();

                if (data.success) {
                    this.showMessage('Registration successful! Redirecting...', 'success');
                    // Redirect to main app after short delay
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    this.showMessage(data.error || 'Registration failed', 'error');
                }
            } catch (error) {
                console.error('Registration error:', error);
                this.showMessage('Registration failed. Please try again.', 'error');
            } finally {
                this.setButtonLoading(submitBtn, false);
            }
        });
    }

    // Check if user is authenticated
    async checkAuth() {
        try {
            const response = await fetch('/api/me', {
                credentials: 'include'
            });
            const data = await response.json();
            return data.authenticated ? data.user : null;
        } catch (error) {
            console.error('Auth check error:', error);
            return null;
        }
    }

    // Logout user
    async logout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                // Redirect to login page
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Redirect to login if not authenticated
    async requireAuth() {
        const user = await this.checkAuth();
        if (!user) {
            window.location.href = '/login';
            return false;
        }
        return user;
    }
}