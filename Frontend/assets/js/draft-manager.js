// Draft Manager for MindLog Journal Entries
// Handles auto-save, recovery, and cleanup of drafts using localStorage

const DraftManager = {
    // Configuration
    DRAFT_PREFIX: 'mindlog_draft_',
    DRAFT_EXPIRY_DAYS: 7,
    
    /**
     * Generate a unique key for the draft
     * @param {string} type - 'new-entry' or 'edit-entry'
     * @param {string} id - Optional entry ID for edit mode
     * @returns {string} Draft key
     */
    _getDraftKey(type, id = null) {
        return id ? `${this.DRAFT_PREFIX}${type}_${id}` : `${this.DRAFT_PREFIX}${type}`;
    },
    
    /**
     * Save draft to localStorage
     * @param {string} type - 'new-entry' or 'edit-entry'
     * @param {object} data - Draft data (title, content, mood, isFavorite)
     * @param {string} id - Optional entry ID for edit mode
     * @returns {boolean} Success status
     */
    saveDraft(type, data, id = null) {
        try {
            const key = this._getDraftKey(type, id);
            const draft = {
                timestamp: Date.now(),
                data: data
            };
            localStorage.setItem(key, JSON.stringify(draft));
            console.log(`Draft saved: ${key}`);
            return true;
        } catch (error) {
            console.error('Failed to save draft:', error);
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                this._cleanupOldDrafts();
                // Try again after cleanup
                try {
                    const key = this._getDraftKey(type, id);
                    const draft = {
                        timestamp: Date.now(),
                        data: data
                    };
                    localStorage.setItem(key, JSON.stringify(draft));
                    return true;
                } catch (retryError) {
                    console.error('Failed to save draft after cleanup:', retryError);
                    return false;
                }
            }
            return false;
        }
    },
    
    /**
     * Get draft from localStorage
     * @param {string} type - 'new-entry' or 'edit-entry'
     * @param {string} id - Optional entry ID for edit mode
     * @returns {object|null} Draft data or null if not found/expired
     */
    getDraft(type, id = null) {
        try {
            const key = this._getDraftKey(type, id);
            const draftStr = localStorage.getItem(key);
            
            if (!draftStr) {
                return null;
            }
            
            const draft = JSON.parse(draftStr);
            
            // Check if draft is expired
            const expiryTime = this.DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
            if (Date.now() - draft.timestamp > expiryTime) {
                console.log('Draft expired, removing...');
                this.clearDraft(type, id);
                return null;
            }
            
            return draft;
        } catch (error) {
            console.error('Failed to get draft:', error);
            return null;
        }
    },
    
    /**
     * Clear draft from localStorage
     * @param {string} type - 'new-entry' or 'edit-entry'
     * @param {string} id - Optional entry ID for edit mode
     */
    clearDraft(type, id = null) {
        try {
            const key = this._getDraftKey(type, id);
            localStorage.removeItem(key);
            console.log(`Draft cleared: ${key}`);
        } catch (error) {
            console.error('Failed to clear draft:', error);
        }
    },
    
    /**
     * Check if draft exists
     * @param {string} type - 'new-entry' or 'edit-entry'
     * @param {string} id - Optional entry ID for edit mode
     * @returns {boolean} True if draft exists and is not expired
     */
    hasDraft(type, id = null) {
        return this.getDraft(type, id) !== null;
    },
    
    /**
     * Get human-readable time ago string
     * @param {number} timestamp - Timestamp in milliseconds
     * @returns {string} Time ago string
     */
    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 60) {
            return 'just now';
        }
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }
        
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    },
    
    /**
     * Clean up old drafts (older than DRAFT_EXPIRY_DAYS)
     * @private
     */
    _cleanupOldDrafts() {
        try {
            const expiryTime = this.DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
            const keysToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.DRAFT_PREFIX)) {
                    try {
                        const draftStr = localStorage.getItem(key);
                        const draft = JSON.parse(draftStr);
                        
                        if (Date.now() - draft.timestamp > expiryTime) {
                            keysToRemove.push(key);
                        }
                    } catch (error) {
                        // Invalid draft, remove it
                        keysToRemove.push(key);
                    }
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log(`Cleaned up ${keysToRemove.length} old drafts`);
        } catch (error) {
            console.error('Failed to cleanup old drafts:', error);
        }
    },
    
    /**
     * Initialize draft manager (cleanup old drafts on load)
     */
    init() {
        this._cleanupOldDrafts();
    }
};

// Initialize on load
DraftManager.init();
