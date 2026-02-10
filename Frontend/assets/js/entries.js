document.addEventListener('DOMContentLoaded', () => {
    const entriesContainer = document.getElementById('entriesContainer');
    const emptyState = document.getElementById('emptyState');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const filterInfo = document.getElementById('filterInfo');
    const activeFilter = document.getElementById('activeFilter');
    const clearFilterBtn = document.getElementById('clearFilterBtn');

    // Parse query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const moodFilter = urlParams.get('mood');
    const categoryFilter = urlParams.get('category');
    const searchFilter = urlParams.get('search');

    // Mood emoji map
    const moodEmojis = {
        happy: '😊', sad: '😢', excited: '🎉', anxious: '😰', calm: '😌',
        angry: '😠', neutral: '😐', grateful: '🙏', tired: '😴', motivated: '💪'
    };

    // Initialize page
    init();

    async function init() {
        updatePageHeader();
        await loadEntries();
    }

    function updatePageHeader() {
        if (moodFilter) {
            const emoji = moodEmojis[moodFilter] || '';
            pageTitle.textContent = `${emoji} ${capitalizeFirstLetter(moodFilter)} Entries`;
            pageSubtitle.textContent = `All your ${moodFilter} moments`;
            showFilterInfo(`Mood: ${capitalizeFirstLetter(moodFilter)}`);
        } else if (categoryFilter) {
            // We'll fetch category details later if needed, for now show ID or generic
            pageTitle.textContent = 'Category Entries';
            showFilterInfo(`Category: ${categoryFilter}`);
        } else if (searchFilter) {
            pageTitle.textContent = 'Search Results';
            pageSubtitle.textContent = `Found for "${searchFilter}"`;
            showFilterInfo(`Search: "${searchFilter}"`);
        } else {
            pageTitle.textContent = 'Journal Entries';
            pageSubtitle.textContent = 'Your personal collection of thoughts and memories';
            filterInfo.classList.add('hidden');
        }
    }

    function showFilterInfo(text) {
        filterInfo.classList.remove('hidden');
        activeFilter.textContent = text;
    }

    // Clear filter button
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', () => {
            window.location.href = 'entries.html';
        });
    }

    async function loadEntries() {
        try {
            // Build query string
            let queryString = '/journal/getall?limit=50'; // Higher limit for list view
            if (moodFilter) queryString += `&mood=${moodFilter}`;
            if (categoryFilter) queryString += `&categoryId=${categoryFilter}`;
            if (searchFilter) queryString += `&search=${searchFilter}`;

            const response = await api.request(queryString, 'GET');

            if (response.success && response.data && response.data.journals && response.data.journals.length > 0) {
                entriesContainer.innerHTML = '';
                emptyState.classList.add('hidden');
                
                // Sort entries if not already sorted by backend
                const entries = response.data.journals; // Backend sorts by default usually
                
                entries.forEach((entry, index) => {
                    const card = createEntryCard(entry);
                    // Add staggered animation delay using CSS variable or style
                    card.style.animationDelay = `${index * 0.1}s`;
                    entriesContainer.appendChild(card);
                });
                
                // Initializing icons for new elements
                lucide.createIcons();
            } else {
                entriesContainer.innerHTML = '';
                emptyState.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Failed to load entries:', error);
            entriesContainer.innerHTML = `
                <div class="col-span-full text-center py-12 text-red-400">
                    <p>Error loading entries: ${error.message}</p>
                    <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-surface border border-border-subtle rounded-lg hover:bg-surface-hover">Try Again</button>
                </div>
            `;
        }
    }

    function createEntryCard(entry) {
        const card = document.createElement('div');
        card.className = 'entry-card';
        // Add staggered animation delay
        // card.style.animationDelay = `${index * 50}ms`; 
        
        const moodEmoji = getMoodEmoji(entry.mood);
        const date = new Date(entry.createdAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Strip HTML tags for preview and limit length
        let contentPreview = entry.content.replace(/<[^>]*>/g, '');
        if (contentPreview.length > 150) {
            contentPreview = contentPreview.substring(0, 150) + '...';
        }
        
        // Category badge HTML
        const categoryBadge = entry.categoryId ? `
            <span class="category-badge" style="background-color: ${entry.categoryId.color}20; color: ${entry.categoryId.color}; border: 1px solid ${entry.categoryId.color}40;">
                ${entry.categoryId.icon || '📁'} ${entry.categoryId.name}
            </span>
        ` : '';

        // Favorite class
        const favClass = entry.isFavorite ? 'text-yellow-400 fill-current' : 'text-text-tertiary hover:text-yellow-400';
        
        card.innerHTML = `
            <div class="entry-header">
                <h3 class="entry-title">${entry.title}</h3>
                <div class="entry-actions">
                    <button class="action-btn favorite-btn ${favClass}" data-id="${entry._id}" title="${entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                        ${entry.isFavorite ? '⭐' : '☆'}
                    </button>
                    <button class="action-btn edit-btn" data-id="${entry._id}" title="Edit">
                        ✏️
                    </button>
                    <button class="action-btn delete-btn" data-id="${entry._id}" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
            <p class="entry-preview">${contentPreview}</p>
            <div class="entry-meta">
                <span class="entry-date">${date}</span>
                ${categoryBadge}
                <span class="entry-mood" title="${entry.mood}">${moodEmoji || '😊'}</span>
            </div>
        `;
        
        // Add event listeners for buttons
        const favoriteBtn = card.querySelector('.favorite-btn');
        const editBtn = card.querySelector('.edit-btn');
        const deleteBtn = card.querySelector('.delete-btn');
        
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(entry._id, entry.isFavorite);
        });
        
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.location.href = `edit-entry.html?id=${entry._id}`;
        });
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteEntry(entry._id);
        });

        // Make whole card clickable
        card.addEventListener('click', (e) => {
            // Don't trigger if clicked on actions
            if (!e.target.closest('.entry-actions')) {
                window.location.href = `edit-entry.html?id=${entry._id}`;
            }
        });
        
        return card;
    }

    function getMoodEmoji(mood) {
        return moodEmojis[mood] || '😐';
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Reuse helper functions from dashboard logic could be better, but duplicated for simplicity here
    async function toggleFavorite(entryId, currentStatus) {
        try {
            const response = await api.request(`/journal/favorite/${entryId}`, 'PUT');
            if (response.success) {
                loadEntries(); // Refresh UI
            }
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
            alert('Failed to update favorite status');
        }
    }

    async function deleteEntry(entryId) {
        if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
            return;
        }
        try {
            const response = await api.request(`/journal/delete/${entryId}`, 'DELETE');
            if (response.success) {
                loadEntries(); // Refresh UI
            }
        } catch (error) {
            console.error('Failed to delete entry:', error);
            alert('Failed to delete entry');
        }
    }
});
