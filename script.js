class BookVaultPro {
    constructor() {
        this.books = this.loadBooks();
        this.currentPage = 1;
        this.booksPerPage = 12;
        this.currentFilters = {
            search: '',
            genre: '',
            rating: '',
            status: '',
            sortBy: 'newest'
        };
        this.viewMode = 'grid';
        this.readingGoal = this.loadReadingGoal();
        this.init();
    }

    init() {
        this.showLoadingScreen();
        setTimeout(() => {
            this.hideLoadingScreen();
            this.bindEvents();
            this.renderBooks();
            this.updateStats();
            this.initTheme();
            this.setupFormValidation();
            this.setupStarRating();
            this.setupCoverPreview();
            this.setupCharacterCount();
        }, 2000);
    }

    showLoadingScreen() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    }

    hideLoadingScreen() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    bindEvents() {
        // Form submission
        document.getElementById('book-form').addEventListener('submit', (e) => this.handleAddBook(e));

        // Search and filters
        document.getElementById('search-input').addEventListener('input', () => this.handleSearch());
        document.getElementById('filter-genre').addEventListener('change', () => this.handleSearch());
        document.getElementById('filter-rating').addEventListener('change', () => this.handleSearch());
        document.getElementById('filter-status').addEventListener('change', () => this.handleSearch());
        document.getElementById('sort-by').addEventListener('change', () => this.handleSearch());

        // View controls
        document.getElementById('grid-view').addEventListener('click', () => this.setViewMode('grid'));
        document.getElementById('list-view').addEventListener('click', () => this.setViewMode('list'));
        document.getElementById('clear-filters').addEventListener('click', () => this.clearFilters());

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

        // Export/Import
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());
        document.getElementById('import-file').addEventListener('change', (e) => this.importData(e));

        // Reading goal
        document.getElementById('reading-goal-btn').addEventListener('click', () => this.showReadingGoalModal());

        // Modal events
        this.setupModalEvents();

        // Pagination
        document.getElementById('prev-page').addEventListener('click', () => this.changePage(this.currentPage - 1));
        document.getElementById('next-page').addEventListener('click', () => this.changePage(this.currentPage + 1));
    }

    setupModalEvents() {
        const modal = document.getElementById('reading-goal-modal');
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = document.getElementById('cancel-goal');
        const saveBtn = document.getElementById('save-goal');

        [closeBtn, cancelBtn].forEach(btn => {
            btn.addEventListener('click', () => this.hideReadingGoalModal());
        });

        saveBtn.addEventListener('click', () => this.saveReadingGoal());

        // Goal presets
        modal.querySelectorAll('.goal-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.getElementById('goal-input').value = e.target.dataset.goal;
            });
        });

        // Close modal on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideReadingGoalModal();
        });
    }

    setupFormValidation() {
        const titleInput = document.getElementById('title');
        const authorInput = document.getElementById('author');

        titleInput.addEventListener('input', () => this.validateField('title'));
        authorInput.addEventListener('input', () => this.validateField('author'));
    }

    validateField(fieldName) {
        const field = document.getElementById(fieldName);
        const validation = document.getElementById(`${fieldName}-validation`);
        const value = field.value.trim();

        if (value.length === 0) {
            validation.textContent = '';
            validation.className = 'form-validation';
        } else if (value.length < 2) {
            validation.textContent = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least 2 characters`;
            validation.className = 'form-validation error';
        } else {
            validation.textContent = `✓ Looks good!`;
            validation.className = 'form-validation success';
        }
    }

    setupStarRating() {
        const stars = document.querySelectorAll('.star');
        const ratingInput = document.getElementById('rating');
        const ratingText = document.querySelector('.rating-text');

        stars.forEach((star, index) => {
            star.addEventListener('mouseover', () => {
                this.highlightStars(index + 1);
                ratingText.textContent = `${index + 1} star${index > 0 ? 's' : ''}`;
            });

            star.addEventListener('click', () => {
                const rating = index + 1;
                ratingInput.value = rating;
                this.setStarRating(rating);
                ratingText.textContent = `${rating} star${rating > 1 ? 's' : ''} selected`;
            });
        });

        document.getElementById('star-rating').addEventListener('mouseleave', () => {
            const currentRating = parseInt(ratingInput.value) || 0;
            this.setStarRating(currentRating);
            if (currentRating > 0) {
                ratingText.textContent = `${currentRating} star${currentRating > 1 ? 's' : ''} selected`;
            } else {
                ratingText.textContent = 'Click stars to rate';
            }
        });
    }

    highlightStars(rating) {
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
    }

    setStarRating(rating) {
        this.highlightStars(rating);
    }

    setupCoverPreview() {
        const coverInput = document.getElementById('cover-url');
        const preview = document.getElementById('cover-preview');

        coverInput.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url && this.isValidImageUrl(url)) {
                preview.innerHTML = `<img src="${url}" alt="Book cover preview" onerror="this.parentElement.innerHTML=''">`;
            } else {
                preview.innerHTML = '';
            }
        });
    }

    isValidImageUrl(url) {
        const imageExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
        return url.match(/^https?:\/\/.+/) && (imageExtensions.test(url) || url.includes('googleapi') || url.includes('amazon'));
    }

    setupCharacterCount() {
        const reviewTextarea = document.getElementById('review');
        const counter = document.getElementById('review-count');
        const maxLength = 500;

        reviewTextarea.addEventListener('input', (e) => {
            const length = e.target.value.length;
            counter.textContent = length;
            counter.style.color = length > maxLength ? 'var(--error-color)' : 'var(--text-muted)';

            if (length > maxLength) {
                e.target.value = e.target.value.substring(0, maxLength);
                counter.textContent = maxLength;
            }
        });
    }

    handleAddBook(e) {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.classList.add('loading');

        setTimeout(() => {
            const formData = new FormData(e.target);
            const book = {
                id: Date.now(),
                title: formData.get('title').trim(),
                author: formData.get('author').trim(),
                genre: formData.get('genre'),
                status: formData.get('status') || 'completed',
                rating: parseInt(formData.get('rating')),
                review: formData.get('review').trim(),
                coverUrl: formData.get('cover-url').trim(),
                pages: formData.get('pages') ? parseInt(formData.get('pages')) : null,
                dateAdded: new Date().toLocaleDateString(),
                dateFinished: formData.get('status') === 'completed' ? new Date().toLocaleDateString() : null
            };

            this.books.push(book);
            this.saveBooks();
            this.renderBooks();
            this.updateStats();
            e.target.reset();
            this.resetForm();
            submitBtn.classList.remove('loading');

            this.showMessage('📚 Book added successfully!', 'success');

            // Scroll to books section
            document.querySelector('.books-section').scrollIntoView({ behavior: 'smooth' });
        }, 1000);
    }

    resetForm() {
        // Reset star rating
        document.getElementById('rating').value = '';
        this.setStarRating(0);
        document.querySelector('.rating-text').textContent = 'Click stars to rate';

        // Reset cover preview
        document.getElementById('cover-preview').innerHTML = '';

        // Reset character count
        document.getElementById('review-count').textContent = '0';

        // Reset validation messages
        document.querySelectorAll('.form-validation').forEach(el => {
            el.textContent = '';
            el.className = 'form-validation';
        });
    }

    handleEditBook(id) {
        const book = this.books.find(b => b.id === id);
        if (!book) return;

        // Populate form
        document.getElementById('title').value = book.title;
        document.getElementById('author').value = book.author;
        document.getElementById('genre').value = book.genre;
        document.getElementById('status').value = book.status;
        document.getElementById('rating').value = book.rating;
        document.getElementById('review').value = book.review || '';
        document.getElementById('cover-url').value = book.coverUrl || '';
        document.getElementById('pages').value = book.pages || '';

        // Update star rating
        this.setStarRating(book.rating);

        // Update cover preview
        if (book.coverUrl) {
            document.getElementById('cover-preview').innerHTML =
                `<img src="${book.coverUrl}" alt="Book cover preview">`;
        }

        // Update character count
        document.getElementById('review-count').textContent = (book.review || '').length;

        // Remove the book temporarily
        this.deleteBook(id);

        // Scroll to form
        document.querySelector('.add-book-section').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('title').focus();
    }

    deleteBook(id) {
        if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
            return;
        }

        this.books = this.books.filter(book => book.id !== id);
        this.saveBooks();
        this.renderBooks();
        this.updateStats();
        this.showMessage('🗑️ Book deleted successfully', 'info');
    }

    handleSearch() {
        this.currentFilters = {
            search: document.getElementById('search-input').value.toLowerCase(),
            genre: document.getElementById('filter-genre').value,
            rating: document.getElementById('filter-rating').value,
            status: document.getElementById('filter-status').value,
            sortBy: document.getElementById('sort-by').value
        };

        this.currentPage = 1;
        this.renderBooks();
    }

    clearFilters() {
        document.getElementById('search-input').value = '';
        document.getElementById('filter-genre').value = '';
        document.getElementById('filter-rating').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('sort-by').value = 'newest';

        this.currentFilters = {
            search: '', genre: '', rating: '', status: '', sortBy: 'newest'
        };

        this.currentPage = 1;
        this.renderBooks();
    }

    setViewMode(mode) {
        this.viewMode = mode;

        // Update button states
        document.getElementById('grid-view').classList.toggle('active', mode === 'grid');
        document.getElementById('list-view').classList.toggle('active', mode === 'list');

        // Update container class
        const container = document.getElementById('books-container');
        container.classList.toggle('list-view', mode === 'list');

        this.renderBooks();
    }

    getFilteredAndSortedBooks() {
        let filtered = this.books.filter(book => {
            const matchesSearch = !this.currentFilters.search ||
                book.title.toLowerCase().includes(this.currentFilters.search) ||
                book.author.toLowerCase().includes(this.currentFilters.search) ||
                (book.review && book.review.toLowerCase().includes(this.currentFilters.search));

            const matchesGenre = !this.currentFilters.genre || book.genre === this.currentFilters.genre;
            const matchesRating = !this.currentFilters.rating || book.rating >= parseInt(this.currentFilters.rating);
            const matchesStatus = !this.currentFilters.status || book.status === this.currentFilters.status;

            return matchesSearch && matchesGenre && matchesRating && matchesStatus;
        });

        // Sort books
        filtered.sort((a, b) => {
            switch (this.currentFilters.sortBy) {
                case 'newest':
                    return b.id - a.id;
                case 'oldest':
                    return a.id - b.id;
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'author':
                    return a.author.localeCompare(b.author);
                case 'rating-high':
                    return b.rating - a.rating;
                case 'rating-low':
                    return a.rating - b.rating;
                default:
                    return b.id - a.id;
            }
        });

        return filtered;
    }

    renderBooks() {
        const container = document.getElementById('books-container');
        const filteredBooks = this.getFilteredAndSortedBooks();

        // Update results info
        this.updateResultsInfo(filteredBooks);

        // Pagination
        const totalPages = Math.ceil(filteredBooks.length / this.booksPerPage);
        const startIndex = (this.currentPage - 1) * this.booksPerPage;
        const endIndex = startIndex + this.booksPerPage;
        const booksToShow = filteredBooks.slice(startIndex, endIndex);

        if (booksToShow.length === 0) {
            container.innerHTML = this.getEmptyState();
            this.updatePagination(0, 0);
            return;
        }

        container.innerHTML = booksToShow.map(book => this.createBookCard(book)).join('');

        // Add event listeners
        booksToShow.forEach(book => {
            document.getElementById(`edit-${book.id}`)?.addEventListener('click', () => this.handleEditBook(book.id));
            document.getElementById(`delete-${book.id}`)?.addEventListener('click', () => this.deleteBook(book.id));
        });

        // Update pagination
        this.updatePagination(this.currentPage, totalPages);

        // Add animation
        container.querySelectorAll('.book-card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('animate-slide-in');
        });
    }

    createBookCard(book) {
        const stars = '⭐'.repeat(book.rating);
        const coverHtml = book.coverUrl ?
            `<img src="${book.coverUrl}" alt="${book.title} cover" class="book-cover" onerror="this.outerHTML='<div class=\\'book-cover placeholder\\'>📚</div>'">` :
            `<div class="book-cover placeholder">📚</div>`;

        const statusClass = book.status.replace('-', '-');
        const statusText = {
            'completed': '✅ Completed',
            'reading': '📖 Currently Reading',
            'want-to-read': '📚 Want to Read'
        }[book.status];

        const pagesText = book.pages ? `${book.pages} pages` : '';
        const reviewText = book.review || 'No review provided.';

        if (this.viewMode === 'list') {
            return `
                <div class="book-card list-view animate-fade-in">
                    ${coverHtml}
                    <div class="book-info">
                        <div class="book-title">${this.escapeHtml(book.title)}</div>
                        <div class="book-author">by ${this.escapeHtml(book.author)}</div>
                        <div class="book-meta">
                            <span class="book-genre">${this.getGenreIcon(book.genre)} ${this.capitalizeFirst(book.genre)}</span>
                            <span class="book-status ${statusClass}">${statusText}</span>
                        </div>
                        <div class="book-rating">${stars} (${book.rating}/5)</div>
                        <div class="book-review">${this.escapeHtml(reviewText)}</div>
                    </div>
                    <div class="book-actions">
                        <button id="edit-${book.id}" class="btn-edit">Edit</button>
                        <button id="delete-${book.id}" class="btn-delete">Delete</button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="book-card">
                ${coverHtml}
                <div class="book-title">${this.escapeHtml(book.title)}</div>
                <div class="book-author">by ${this.escapeHtml(book.author)}</div>
                <div class="book-meta">
                    <span class="book-genre">${this.getGenreIcon(book.genre)} ${this.capitalizeFirst(book.genre)}</span>
                    <span class="book-status ${statusClass}">${statusText}</span>
                </div>
                <div class="book-rating">${stars} (${book.rating}/5)</div>
                <div class="book-review">${this.escapeHtml(reviewText)}</div>
                ${pagesText ? `<div class="book-pages">${pagesText}</div>` : ''}
                <div class="book-date">Added: ${book.dateAdded}</div>
                <div class="book-actions">
                    <button id="edit-${book.id}" class="btn-edit">Edit</button>
                    <button id="delete-${book.id}" class="btn-delete">Delete</button>
                </div>
            </div>
        `;
    }

    getGenreIcon(genre) {
        const icons = {
            'fiction': '📚',
            'non-fiction': '📖',
            'mystery': '🔍',
            'romance': '💕',
            'sci-fi': '🚀',
            'fantasy': '🧙',
            'biography': '👤',
            'history': '🏛️',
            'thriller': '⚡',
            'horror': '👻',
            'self-help': '💪',
            'business': '💼'
        };
        return icons[genre] || '📚';
    }

    getEmptyState() {
        const hasFilters = Object.values(this.currentFilters).some(filter => filter && filter !== 'newest');

        if (hasFilters) {
            return `
                <div class="no-books">
                    <div class="no-books-icon">🔍</div>
                    <h3>No books match your search</h3>
                    <p>Try adjusting your filters or search terms</p>
                </div>
            `;
        }

        return `
            <div class="no-books">
                <div class="no-books-icon">📚</div>
                <h3>No books in your library yet</h3>
                <p>Add your first book to get started on your reading journey!</p>
            </div>
        `;
    }

    updateResultsInfo(filteredBooks) {
        document.getElementById('results-count').textContent =
            `${filteredBooks.length} book${filteredBooks.length !== 1 ? 's' : ''} found`;

        const statusCounts = {
            reading: filteredBooks.filter(b => b.status === 'reading').length,
            completed: filteredBooks.filter(b => b.status === 'completed').length,
            'want-to-read': filteredBooks.filter(b => b.status === 'want-to-read').length
        };

        document.getElementById('reading-count').textContent = `${statusCounts.reading} reading`;
        document.getElementById('completed-count').textContent = `${statusCounts.completed} completed`;
        document.getElementById('want-to-read-count').textContent = `${statusCounts['want-to-read']} want to read`;
    }

    updatePagination(currentPage, totalPages) {
        const paginationElement = document.getElementById('pagination');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const numbersContainer = document.getElementById('pagination-numbers');

        if (totalPages <= 1) {
            paginationElement.style.display = 'none';
            return;
        }

        paginationElement.style.display = 'flex';

        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;

        // Generate page numbers
        let numbersHtml = '';
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            numbersHtml += `
                <button class="page-number ${i === currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }

        numbersContainer.innerHTML = numbersHtml;

        // Add click listeners
        numbersContainer.querySelectorAll('.page-number').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changePage(parseInt(e.target.dataset.page));
            });
        });
    }

    changePage(page) {
        const filteredBooks = this.getFilteredAndSortedBooks();
        const totalPages = Math.ceil(filteredBooks.length / this.booksPerPage);

        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderBooks();
            document.querySelector('.books-section').scrollIntoView({ behavior: 'smooth' });
        }
    }

    updateStats() {
        const totalBooks = this.books.length;
        const avgRating = totalBooks > 0 ?
            (this.books.reduce((sum, book) => sum + book.rating, 0) / totalBooks).toFixed(1) : '0.0';

        const completedBooks = this.books.filter(b => b.status === 'completed').length;
        const goalProgress = this.readingGoal > 0 ?
            Math.round((completedBooks / this.readingGoal) * 100) : 0;

        const genreCounts = {};
        this.books.forEach(book => {
            genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
        });

        const favoriteGenre = Object.keys(genreCounts).length > 0 ?
            Object.keys(genreCounts).reduce((a, b) => genreCounts[a] > genreCounts[b] ? a : b) : '-';

        document.getElementById('total-books').textContent = totalBooks;
        document.getElementById('avg-rating').textContent = avgRating;
        document.getElementById('reading-goal').textContent = `${goalProgress}%`;
        document.getElementById('favorite-genre').textContent =
            favoriteGenre !== '-' ? this.capitalizeFirst(favoriteGenre) : '-';
    }

    // Theme Management
    initTheme() {
        const savedTheme = localStorage.getItem('bookVaultTheme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeIcon = document.querySelector('.theme-icon');
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('bookVaultTheme', theme);
    }

    // Reading Goal Management
    showReadingGoalModal() {
        const modal = document.getElementById('reading-goal-modal');
        const input = document.getElementById('goal-input');

        input.value = this.readingGoal || '';
        modal.classList.add('active');
        input.focus();
    }

    hideReadingGoalModal() {
        document.getElementById('reading-goal-modal').classList.remove('active');
    }

    saveReadingGoal() {
        const goal = parseInt(document.getElementById('goal-input').value);

        if (goal && goal > 0) {
            this.readingGoal = goal;
            localStorage.setItem('bookVaultReadingGoal', goal.toString());
            this.updateStats();
            this.hideReadingGoalModal();
            this.showMessage(`🎯 Reading goal set to ${goal} books!`, 'success');
        } else {
            this.showMessage('Please enter a valid number', 'error');
        }
    }

    loadReadingGoal() {
        return parseInt(localStorage.getItem('bookVaultReadingGoal')) || 0;
    }

    // Export/Import Functionality
    exportData() {
        const data = {
            books: this.books,
            readingGoal: this.readingGoal,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = `bookvault-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showMessage('📥 Data exported successfully!', 'success');
    }

    importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);

                if (data.books && Array.isArray(data.books)) {
                    const confirmMessage = `This will replace your current library (${this.books.length} books) with ${data.books.length} books from the backup. Continue?`;

                    if (confirm(confirmMessage)) {
                        this.books = data.books;
                        this.readingGoal = data.readingGoal || 0;

                        this.saveBooks();
                        localStorage.setItem('bookVaultReadingGoal', this.readingGoal.toString());

                        this.renderBooks();
                        this.updateStats();
                        this.showMessage('📤 Data imported successfully!', 'success');
                    }
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                this.showMessage('❌ Error importing data. Please check the file format.', 'error');
            }
        };

        reader.readAsText(file);
        e.target.value = ''; // Reset file input
    }

    // Utility Methods
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };

        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            background: ${colors[type]};
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;

        document.body.appendChild(messageDiv);

        // Animate in
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(0)';
        }, 100);

        // Animate out and remove
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(100%)';
            setTimeout(() => messageDiv.remove(), 300);
        }, 4000);
    }

    saveBooks() {
        localStorage.setItem('bookVaultPro_books', JSON.stringify(this.books));
    }

    loadBooks() {
        const saved = localStorage.getItem('bookVaultPro_books');
        return saved ? JSON.parse(saved) : [];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).replace('-', ' ');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new BookVaultPro();

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
});