// Check if user is logged in
if (!api.isAuthenticated()) {
    window.location.href = 'login.html';
}

// DOM Elements
const displayName = document.getElementById('displayName');
const navDisplayName = document.getElementById('navDisplayName');
const logoutBtn = document.getElementById('logoutBtn');
const entriesContainer = document.getElementById('entriesContainer');
const emptyState = document.getElementById('emptyState');

// Stats elements
const statThisMonth = document.getElementById('statThisMonth');
const statTotal = document.getElementById('statTotal');
const statLongestStreak = document.getElementById('statLongestStreak');
const statThisWeek = document.getElementById('statThisWeek');

// Load user info
async function loadUserInfo() {
    try {
        const response = await api.request('/auth/me', 'GET');
        if (response.success) {
            const name = response.profile?.firstName || response.username;
            displayName.textContent = name;
            if (navDisplayName) {
                navDisplayName.textContent = `@${response.username}`;
            }
        }
    } catch (error) {
        console.error('Failed to load user info:', error);
    }
}

// Load stats
async function loadStats() {
    try {
        const response = await api.request('/journal/getall', 'GET');
        if (response.success && response.data && response.data.journals) {
            const entries = response.data.journals;
            const now = new Date();
            
            // Total entries
            if (statTotal) statTotal.textContent = entries.length;
            
            // This month
            const thisMonth = entries.filter(entry => {
                const entryDate = new Date(entry.createdAt);
                return entryDate.getMonth() === now.getMonth() && 
                       entryDate.getFullYear() === now.getFullYear();
            }).length;
            if (statThisMonth) statThisMonth.textContent = thisMonth;
            
            // This week
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const thisWeek = entries.filter(entry => 
                new Date(entry.createdAt) >= oneWeekAgo
            ).length;
            if (statThisWeek) statThisWeek.textContent = thisWeek;
            
            // Longest streak (calculated from calendar data)
            const calendarResponse = await api.request('/journal/stats/calendar', 'GET');
            if (calendarResponse.success && calendarResponse.data) {
                const dates = calendarResponse.data.map(d => d.date).sort();
                let longestStreak = 0;
                let currentStreak = 0;
                
                for (let i = 0; i < dates.length; i++) {
                    if (i === 0 || isConsecutiveDay(dates[i-1], dates[i])) {
                        currentStreak++;
                        longestStreak = Math.max(longestStreak, currentStreak);
                    } else {
                        currentStreak = 1;
                    }
                }
                
                if (statLongestStreak) statLongestStreak.textContent = longestStreak;
            }
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
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
    card.className = 'entry-card';
    
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
    
    // Category badge HTML
    const categoryBadge = entry.categoryId ? `
        <span class="category-badge" style="background-color: ${entry.categoryId.color}20; color: ${entry.categoryId.color}; border: 1px solid ${entry.categoryId.color}40;">
            ${entry.categoryId.icon || '📁'} ${entry.categoryId.name}
        </span>
    ` : '';
    
    card.innerHTML = `
        <div class="entry-header">
            <h3 class="entry-title">${entry.title}</h3>
            <div class="entry-actions">
                <button class="action-btn favorite-btn" data-id="${entry._id}" title="${entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
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
            <span class="entry-mood">${moodEmoji || '😊'}</span>
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

// Calendar Logic
let currentDate = new Date();
let entryDates = new Set();
let dateMoodMap = new Map(); // Map of date -> mood

const calendarMonth = document.getElementById('calendarMonth');
const calendarDays = document.getElementById('calendarDays');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const currentStreakEl = document.getElementById('currentStreak');

async function loadCalendarData() {
    try {
        const response = await api.request('/journal/stats/calendar', 'GET');
        if (response.success && response.data) {
            // Data is now array of { date, mood }
            entryDates = new Set(response.data.map(item => item.date));
            dateMoodMap = new Map(response.data.map(item => [item.date, item.mood]));
            calculateCurrentStreak(response.data.map(item => item.date));
            renderCalendar();
        }
    } catch (error) {
        console.error('Failed to load calendar data:', error);
    }
}

function calculateCurrentStreak(dates) {
    if (!currentStreakEl) return;
    
    if (!dates || dates.length === 0) {
        currentStreakEl.textContent = '0 Days';
        return;
    }

    // Sort dates descending
    const sortedDates = dates.sort((a, b) => new Date(b) - new Date(a));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let streak = 0;
    
    // Check if the most recent entry is today or yesterday
    // If not, streak is 0 (unless we want to count active streak even if broken today?)
    // Usually streak broken if missed yesterday AND today. 
    // If missed today but has yesterday -> streak is active (just needs to do today to keep it).
    // If missed yesterday -> streak is 0.
    
    const lastEntryDate = new Date(sortedDates[0]);
    lastEntryDate.setHours(0, 0, 0, 0);

    if (lastEntryDate.getTime() === today.getTime() || lastEntryDate.getTime() === yesterday.getTime()) {
        streak = 1;
        
        let currentDateCheck = lastEntryDate;

        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i]);
            prevDate.setHours(0, 0, 0, 0);
            
            // Expected previous date to continue streak
            const expectedDate = new Date(currentDateCheck);
            expectedDate.setDate(expectedDate.getDate() - 1);

            if (prevDate.getTime() === expectedDate.getTime()) {
                streak++;
                currentDateCheck = prevDate;
            } else if (prevDate.getTime() === currentDateCheck.getTime()) {
                // Same day, multiple entries, ignore and continue checking next
                continue;
            } else {
                // Streak broken
                break;
            }
        }
    }

    currentStreakEl.textContent = `${streak} Day${streak !== 1 ? 's' : ''}`;
}


function renderCalendar() {
    if (!calendarMonth || !calendarDays) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Format: "February, 2026"
    calendarMonth.textContent = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

    // JS getDay(): 0 = Sunday. We want Monday to be first column.
    // Adjust logic: If day is 0 (Sun), make it 6. Else day - 1.
    // Mon(1)-1=0, Tue(2)-1=1 ... Sun(0)->6
    let firstDayIndex = new Date(year, month, 1).getDay();
    // Convert to Monday start
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date(); // To highlight today

    calendarDays.innerHTML = '';

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement('div');
        calendarDays.appendChild(emptyCell);
    }

    // Days with checks
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasEntry = entryDates.has(dateStr);
        const mood = dateMoodMap.get(dateStr);
        
        // Check if this specific day is "Today"
        const isToday = today.getDate() === day && 
                        today.getMonth() === month && 
                        today.getFullYear() === year;

        const dayCell = document.createElement('div');
        
        // Enhanced styling with better visual hierarchy
        let cellClasses = "aspect-square rounded-xl flex items-center justify-center text-base cursor-pointer transition-all duration-200 relative overflow-hidden";
        
        if (isToday) {
            cellClasses += " ring-2 ring-blue-400 bg-blue-400/10";
        } else {
            cellClasses += " hover:bg-white/5 hover:scale-110";
        }

        dayCell.className = cellClasses;
        
        // Inner HTML - Fire emoji as background, date number on top with better styling
        let innerHTML = '';
        
        if (hasEntry) {
            // Fire emoji in background with better opacity and sizing
            innerHTML = `
                <span class="absolute inset-0 flex items-center justify-center text-4xl opacity-30 transition-opacity duration-200 group-hover:opacity-50">🔥</span>
                <span class="relative z-10 text-base font-bold ${isToday ? 'text-blue-300' : 'text-white'} drop-shadow-lg">${day}</span>
            `;
        } else {
            innerHTML = `<span class="text-sm font-medium ${isToday ? 'text-blue-400 font-bold' : 'text-gray-500'}">${day}</span>`;
        }

        dayCell.innerHTML = innerHTML;
        calendarDays.appendChild(dayCell);
    }
}

if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
}

if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
}

// Logout functionality
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        api.logout();
    });
}

// Load Today's Prompt
// Load Today's Prompt
// Load Today's Prompt
async function loadTodaysPrompt() {
    const promptText = document.getElementById('promptText');
    const shuffleBtn = document.getElementById('shufflePrompt');
    if (!promptText) return;
    
    const currentId = promptText.dataset.promptId;
    
    // Add loading state
    promptText.classList.add('opacity-50');
    if (shuffleBtn) shuffleBtn.classList.add('animate-spin');
    
    try {
        const response = await api.getRandomPrompt(currentId);

        if (response.success && response.data) {
            promptText.textContent = response.data.prompt;
            promptText.dataset.promptId = response.data._id; // Store ID
            // Store prompt for "Start Writing" button
            localStorage.setItem('todaysPrompt', response.data.prompt);
        }
    } catch (error) {
        console.error('Error loading prompt:', error);
        promptText.textContent = 'What are three things you\'re grateful for right now?';
    } finally {
        promptText.classList.remove('opacity-50');
        if (shuffleBtn) shuffleBtn.classList.remove('animate-spin');
    }
}

// Load Mood Statistics
async function loadMoodStats() {
    const moodGrid = document.getElementById('moodGrid');
    if (!moodGrid) return;
    
    const moods = [
        { id: 'happy', emoji: '😊', name: 'Happy' },
        { id: 'sad', emoji: '😢', name: 'Sad' },
        { id: 'excited', emoji: '🎉', name: 'Excited' },
        { id: 'anxious', emoji: '😰', name: 'Anxious' },
        { id: 'calm', emoji: '😌', name: 'Calm' },
        { id: 'angry', emoji: '😠', name: 'Angry' },
        { id: 'neutral', emoji: '😐', name: 'Neutral' },
        { id: 'grateful', emoji: '🙏', name: 'Grateful' },
        { id: 'tired', emoji: '😴', name: 'Tired' },
        { id: 'motivated', emoji: '💪', name: 'Motivated' }
    ];

    try {
        const response = await api.getMoodStats();
        const moodData = response.success ? response.data : [];
        
        // Create map of mood counts
        const moodCounts = {};
        moodData.forEach(item => {
            moodCounts[item._id.toLowerCase()] = item.count;
        });

        // Sort moods by count
        const sortedMoods = moods
            .map(mood => ({
                ...mood,
                count: moodCounts[mood.id] || 0
            }))
            .sort((a, b) => b.count - a.count);

        // Duplicate for seamless marque animation
        const displayMoods = [...sortedMoods, ...sortedMoods, ...sortedMoods];
        const maxCount = Math.max(...Object.values(moodCounts), 0);

        // Generate mood cards
        moodGrid.innerHTML = displayMoods.map(mood => {
            const count = mood.count;
            const isHighlighted = count === maxCount && count > 0;
            
            return `
                <div class="mood-card ${isHighlighted ? 'highlighted' : ''}" data-mood="${mood.id}">
                    <div class="mood-emoji">${mood.emoji}</div>
                    <div class="mood-name">${mood.name}</div>
                    <div class="mood-count">${count} ${count === 1 ? 'entry' : 'entries'}</div>
                </div>
            `;
        }).join('');

        // Add click handlers
        document.querySelectorAll('.mood-card').forEach(card => {
            card.addEventListener('click', () => {
                const mood = card.dataset.mood;
                window.location.href = `entries.html?mood=${mood}`;
            });
        });
    } catch (error) {
        console.error('Error loading mood stats:', error);
    }
}

// Shuffle prompt button
const shuffleBtn = document.getElementById('shufflePrompt');
if (shuffleBtn) {
    shuffleBtn.addEventListener('click', loadTodaysPrompt);
}

// Initialize
loadUserInfo();
loadEntries();
// lucide.createIcons() is handled by nav.js now
loadCalendarData();
loadStats();
loadTodaysPrompt();
loadMoodStats();
