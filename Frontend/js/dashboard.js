// Check if user is logged in
if (!api.isAuthenticated()) {
    window.location.href = 'login.html';
}

// DOM Elements
const displayName = document.getElementById('displayName');
const username = document.getElementById('username');
const logoutBtn = document.getElementById('logoutBtn');
const entriesContainer = document.getElementById('entriesContainer');
const emptyState = document.getElementById('emptyState');

// Load user info
async function loadUserInfo() {
    try {
        const response = await api.request('/auth/me', 'GET');
        if (response.success) {
            displayName.textContent = response.profile?.firstName || response.username;
            username.textContent = `@${response.username}`;
        }
    } catch (error) {
        console.error('Failed to load user info:', error);
    }
}

// Load journal entries (sorted by date descending)
async function loadEntries() {
    try {
        const response = await api.request('/journal/getall', 'GET');
        
        if (response.success && response.data && response.data.journals && response.data.journals.length > 0) {
            entriesContainer.innerHTML = '';
            emptyState.classList.add('hidden');
            
            // Sort entries by createdAt in descending order (newest first)
            const sortedEntries = response.data.journals.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            
            sortedEntries.forEach(entry => {
                const entryCard = createEntryCard(entry);
                entriesContainer.appendChild(entryCard);
            });
        } else {
            entriesContainer.innerHTML = '';
            emptyState.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Failed to load entries:', error);
    }
}

// Create entry card
function createEntryCard(entry) {
    const card = document.createElement('div');
    card.className = 'bg-light/5 backdrop-blur-xl border border-light/10 rounded-xl p-6 hover:border-primary/30 transition-all';
    
    const moodEmoji = getMoodEmoji(entry.mood);
    const date = new Date(entry.createdAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Strip HTML tags for preview
    const contentPreview = entry.content.replace(/<[^>]*>/g, '');
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <h3 class="text-lg font-semibold text-white line-clamp-1 flex-1">${entry.title}</h3>
            <div class="flex items-center gap-2 ml-2">
                ${moodEmoji ? `<span class="text-2xl">${moodEmoji}</span>` : ''}
                <button class="favorite-btn p-1.5 hover:bg-light/10 rounded-lg transition-colors" data-id="${entry._id}" title="${entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                    <i data-lucide="star" class="w-4 h-4 ${entry.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}"></i>
                </button>
                <button class="edit-btn p-1.5 hover:bg-light/10 rounded-lg transition-colors" data-id="${entry._id}" title="Edit">
                    <i data-lucide="edit-2" class="w-4 h-4 text-blue-400"></i>
                </button>
                <button class="delete-btn p-1.5 hover:bg-light/10 rounded-lg transition-colors" data-id="${entry._id}" title="Delete">
                    <i data-lucide="trash-2" class="w-4 h-4 text-red-400"></i>
                </button>
            </div>
        </div>
        <p class="text-light/60 text-sm mb-4 line-clamp-3">${contentPreview}</p>
        <div class="flex justify-between items-center text-xs text-light/40">
            <span>${date}</span>
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
        editEntry(entry._id);
    });
    
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteEntry(entry._id);
    });
    
    setTimeout(() => lucide.createIcons({ nameAttr: 'data-lucide' }), 0);
    return card;
}

// Edit entry - redirect to edit page
function editEntry(entryId) {
    window.location.href = `edit-entry.html?id=${entryId}`;
}

// Toggle favorite status
async function toggleFavorite(entryId, currentStatus) {
    try {
        const response = await api.request(`/journal/favorite/${entryId}`, 'PUT');
        
        if (response.success) {
            // Reload entries to reflect the change
            loadEntries();
        }
    } catch (error) {
        console.error('Failed to toggle favorite:', error);
        alert(error.message || 'Failed to update favorite status');
    }
}

// Delete entry
async function deleteEntry(entryId) {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await api.request(`/journal/delete/${entryId}`, 'DELETE');
        
        if (response.success) {
            // Reload entries
            loadEntries();
        }
    } catch (error) {
        console.error('Failed to delete entry:', error);
        alert(error.message || 'Failed to delete entry');
    }
}

// Get mood emoji
function getMoodEmoji(mood) {
    const moods = {
        happy: '😊', sad: '😢', excited: '🎉', anxious: '😰', calm: '😌',
        angry: '😠', neutral: '😐', grateful: '🙏', tired: '😴', motivated: '💪'
    };
    return moods[mood] || '';
}

// Event listeners
logoutBtn.addEventListener('click', () => api.logout());

// Initialize
loadUserInfo();
loadEntries();
