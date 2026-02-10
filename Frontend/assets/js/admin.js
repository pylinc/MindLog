document.addEventListener('DOMContentLoaded', () => {
    if (!api.isAuthenticated()) {
        window.location.href = '../auth/login.html';
        return;
    }
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
        window.location.href = '../app/dashboard.html';
        return;
    }

    initTheme();
    initMobileMenu();
    
    const path = window.location.pathname;
    if (path.includes('dashboard.html')) {
        loadDashboardStats();
    } else if (path.includes('prompts.html')) {
        loadPrompts();
        initPromptModal();
    }
    
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        api.logout();
        window.location.href = '../auth/login.html';
    });
});

async function loadDashboardStats() {
    const container = document.getElementById('statsContainer');
    if (!container) return;

    try {
        const response = await api.request('/admin/stats', 'GET');
        
        if (response.success) {
            const { totalUsers, totalEntries, totalPrompts, activeUsers } = response.data;
            
            container.innerHTML = `
                ${createStatCard('Total Users', totalUsers, 'users', 'bg-accent-blue')}
                ${createStatCard('Total Entries', totalEntries, 'book', 'bg-accent-purple')}
                ${createStatCard('Jounral Prompts', totalPrompts, 'message-circle', 'bg-accent-primary')}
                ${createStatCard('Active Users (7d)', activeUsers, 'activity', 'bg-green-500')}
            `;
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Stats Error:', error);
        container.innerHTML = `<div class="col-span-full text-center text-red-500">Failed to load statistics. Access Denied?</div>`;
    }
}

function createStatCard(label, value, icon, colorClass) {
    return `
        <div class="stat-card">
            <div class="stat-icon ${colorClass}">
                <i data-lucide="${icon}"></i>
            </div>
            <div>
                <div class="stat-value">${value}</div>
                <div class="stat-label">${label}</div>
            </div>
        </div>
    `;
}

let allPrompts = [];
const CATEGORIES = [
    { label: 'Self-Reflection', value: 'reflection' },
    { label: 'Gratitude', value: 'gratitude' },
    { label: 'Future Goals', value: 'goals' },
    { label: 'Mindfulness', value: 'mindfulness' },
    { label: 'Creativity', value: 'creativity' },
    { label: 'Challenges', value: 'challenges' },
    { label: 'Relationships', value: 'relationships' },
    { label: 'Personal Growth', value: 'personal_growth' }
];

async function loadPrompts() {
    const tbody = document.getElementById('promptsTableBody');
    if (!tbody) return;

    try {
        const response = await api.request('/prompt/getall', 'GET');
        
        if (response.success) {
            allPrompts = response.data;
            renderPromptsTable(allPrompts);
        }
    } catch (error) {
        console.error('Prompts Error:', error);
        tbody.innerHTML = `<tr><td colspan="3" class="p-8 text-center text-red-500">Failed to load prompts.</td></tr>`;
    }
}

function getCategoryLabel(value) {
    const cat = CATEGORIES.find(c => c.value === value);
    return cat ? cat.label : value;
}

function renderPromptsTable(prompts) {
    const tbody = document.getElementById('promptsTableBody');
    if (prompts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="p-8 text-center text-text-secondary">No prompts found.</td></tr>`;
        return;
    }

    tbody.innerHTML = prompts.map(p => `
        <tr class="border-b border-border-subtle hover:bg-surface-elevated transition-colors">
            <td class="p-4 text-text-primary text-sm font-medium">${p.prompt}</td>
            <td class="p-4 text-text-secondary text-sm">
                <span class="category-badge">
                    ${getCategoryLabel(p.category)}
                </span>
            </td>
            <td class="p-4 text-right">
                <button onclick="editPrompt('${p._id}')" class="p-2 text-text-secondary hover:text-accent-primary transition-colors" title="Edit">
                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                </button>
                <button onclick="deletePrompt('${p._id}')" class="p-2 text-text-secondary hover:text-red-500 transition-colors" title="Delete">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

function initPromptModal() {
    const modal = document.getElementById('promptModal');
    const content = document.getElementById('promptModalContent');
    const addBtn = document.getElementById('addPromptBtn');
    const cancelBtn = document.getElementById('cancelPromptBtn');
    const form = document.getElementById('promptForm');
    const catSelect = document.getElementById('promptCategory');

    catSelect.innerHTML = CATEGORIES.map(c => `<option value="${c.value}">${c.label}</option>`).join('');

    function openModal(isEdit = false) {
        document.getElementById('modalTitle').textContent = isEdit ? 'Edit Prompt' : 'New Prompt';
        modal.classList.add('open');
    }

    function closeModal() {
        modal.classList.remove('open');
        setTimeout(() => {
            form.reset();
            document.getElementById('promptId').value = '';
        }, 300);
    }

    addBtn.addEventListener('click', () => openModal(false));
    cancelBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('promptId').value;
        const prompt = document.getElementById('promptText').value;
        const category = document.getElementById('promptCategory').value;

        try {
            let response;
            if (id) {
                // Update
                response = await api.request(`/admin/prompts/${id}`, 'PUT', { prompt, category });
            } else {
                // Create
                response = await api.request('/admin/prompts', 'POST', { prompt, category });
            }

            if (response.success) {
                closeModal();
                loadPrompts(); // Reload table
            }
        } catch (error) {
            console.error('Submit Error:', error);
            alert('Operation failed: ' + (error.message || 'Unknown error'));
        }
    });

    window.editPrompt = (id) => {
        const p = allPrompts.find(x => x._id === id);
        if (!p) return;
        
        document.getElementById('promptId').value = p._id;
        document.getElementById('promptText').value = p.prompt;
        document.getElementById('promptCategory').value = p.category;
        openModal(true);
    };

    window.deletePrompt = async (id) => {
        if (!confirm('Are you sure you want to delete this prompt?')) return;
        try {
            const response = await api.request(`/admin/prompts/${id}`, 'DELETE');
            if (response.success) {
                loadPrompts();
            }
        } catch (error) {
            console.error('Delete Error:', error);
            alert('Delete failed');
        }
    };
}

function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const html = document.documentElement;

    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark') {
        html.classList.add('dark');
        themeIcon.textContent = '🌙';
    } else {
        html.classList.remove('dark');
        themeIcon.textContent = '☀️';
    }

    themeToggle?.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        if (newTheme === 'dark') {
            html.classList.add('dark');
            themeIcon.textContent = '🌙';
        } else {
            html.classList.remove('dark');
            themeIcon.textContent = '☀️';
        }
    });
}
function initMobileMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            const isExpanded = hamburgerBtn.getAttribute('aria-expanded') === 'true';
            hamburgerBtn.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.style.transform = isExpanded ? 'translateY(-150%)' : 'translateY(0)';
        });
    }
}
