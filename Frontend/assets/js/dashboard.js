if (!api.isAuthenticated()) {
    window.location.href = 'login.html';
}

const displayName = document.getElementById('displayName');
const navDisplayName = document.getElementById('navDisplayName');
const logoutBtn = document.getElementById('logoutBtn');
const entriesContainer = document.getElementById('entriesContainer');
const emptyState = document.getElementById('emptyState');

const statThisMonth = document.getElementById('statThisMonth');
const statTotal = document.getElementById('statTotal');
const statLongestStreak = document.getElementById('statLongestStreak');
const statThisWeek = document.getElementById('statThisWeek');

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

async function loadStats() {
    try {
        const response = await api.request('/journal/getall', 'GET');
        if (response.success && response.data && response.data.journals) {
            const entries = response.data.journals;
            const now = new Date();
            
            if (statTotal) statTotal.textContent = entries.length;
            
            const thisMonth = entries.filter(entry => {
                const entryDate = new Date(entry.createdAt);
                return entryDate.getMonth() === now.getMonth() && 
                       entryDate.getFullYear() === now.getFullYear();
            }).length;
            if (statThisMonth) statThisMonth.textContent = thisMonth;
            
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const thisWeek = entries.filter(entry => 
                new Date(entry.createdAt) >= oneWeekAgo
            ).length;
            if (statThisWeek) statThisWeek.textContent = thisWeek;
            
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

async function loadEntries() {
    try {
        const response = await api.request('/journal/getall', 'GET');
        
        if (response.success && response.data && response.data.journals && response.data.journals.length > 0) {
            entriesContainer.innerHTML = '';
            emptyState.classList.add('hidden');
            
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
    
    const contentPreview = entry.content.replace(/<[^>]*>/g, '');
    
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

function editEntry(entryId) {
    window.location.href = `edit-entry.html?id=${entryId}`;
}

async function toggleFavorite(entryId, currentStatus) {
    try {
        const response = await api.request(`/journal/favorite/${entryId}`, 'PUT');
        
        if (response.success) {
            loadEntries();
        }
    } catch (error) {
        console.error('Failed to toggle favorite:', error);
        alert(error.message || 'Failed to update favorite status');
    }
}

async function deleteEntry(entryId) {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await api.request(`/journal/delete/${entryId}`, 'DELETE');
        
        if (response.success) {
            loadEntries();
        }
    } catch (error) {
        console.error('Failed to delete entry:', error);
        alert(error.message || 'Failed to delete entry');
    }
}

function getMoodEmoji(mood) {
    const moods = {
        happy: '😊', sad: '😢', excited: '🎉', anxious: '😰', calm: '😌',
        angry: '😠', neutral: '😐', grateful: '🙏', tired: '😴', motivated: '💪'
    };
    return moods[mood] || '';
}

let currentDate = new Date();
let entryDates = new Set();
let dateMoodMap = new Map();

const calendarMonth = document.getElementById('calendarMonth');
const calendarDays = document.getElementById('calendarDays');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const currentStreakEl = document.getElementById('currentStreak');

async function loadCalendarData() {
    try {
        const response = await api.request('/journal/stats/calendar', 'GET');
        if (response.success && response.data) {
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

    const sortedDates = dates.sort((a, b) => new Date(b) - new Date(a));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let streak = 0;
    
    const lastEntryDate = new Date(sortedDates[0]);
    lastEntryDate.setHours(0, 0, 0, 0);

    if (lastEntryDate.getTime() === today.getTime() || lastEntryDate.getTime() === yesterday.getTime()) {
        streak = 1;
        
        let currentDateCheck = lastEntryDate;

        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i]);
            prevDate.setHours(0, 0, 0, 0);
            
            const expectedDate = new Date(currentDateCheck);
            expectedDate.setDate(expectedDate.getDate() - 1);

            if (prevDate.getTime() === expectedDate.getTime()) {
                streak++;
                currentDateCheck = prevDate;
            } else if (prevDate.getTime() === currentDateCheck.getTime()) {
                continue;
            } else {
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

    calendarMonth.textContent = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

    let firstDayIndex = new Date(year, month, 1).getDay();
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    calendarDays.innerHTML = '';

    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement('div');
        calendarDays.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasEntry = entryDates.has(dateStr);
        const mood = dateMoodMap.get(dateStr);
        
        const isToday = today.getDate() === day && 
                        today.getMonth() === month && 
                        today.getFullYear() === year;

        const dayCell = document.createElement('div');
        
        let cellClasses = "aspect-square rounded-xl flex items-center justify-center text-base cursor-pointer transition-all duration-200 relative overflow-hidden";
        
        if (isToday) {
            cellClasses += " ring-2 ring-blue-400 bg-blue-400/10";
        } else {
            cellClasses += " hover:bg-white/5 hover:scale-110";
        }

        dayCell.className = cellClasses;
        
        let innerHTML = '';
        
        if (hasEntry) {
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

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        api.logout();
    });
}

async function loadTodaysPrompt() {
    const promptText = document.getElementById('promptText');
    const shuffleBtn = document.getElementById('shufflePrompt');
    if (!promptText) return;
    
    const currentId = promptText.dataset.promptId;
    
    promptText.classList.add('opacity-50');
    if (shuffleBtn) shuffleBtn.classList.add('animate-spin');
    
    try {
        const response = await api.getRandomPrompt(currentId);

        if (response.success && response.data) {
            promptText.textContent = response.data.prompt;
            promptText.dataset.promptId = response.data._id;
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
        
        const moodCounts = {};
        moodData.forEach(item => {
            moodCounts[item._id.toLowerCase()] = item.count;
        });

        const sortedMoods = moods
            .map(mood => ({
                ...mood,
                count: moodCounts[mood.id] || 0
            }))
            .sort((a, b) => b.count - a.count);

        const displayMoods = [...sortedMoods, ...sortedMoods, ...sortedMoods];
        const maxCount = Math.max(...Object.values(moodCounts), 0);

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

const shuffleBtn = document.getElementById('shufflePrompt');
if (shuffleBtn) {
    shuffleBtn.addEventListener('click', loadTodaysPrompt);
}

loadUserInfo();
loadEntries();
loadCalendarData();
loadStats();
loadTodaysPrompt();
loadMoodStats();
