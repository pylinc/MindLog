//This file for the Values that i will use throught the app 
const MOODS = {
    HAPPY:'happy',
    SAD: 'sad',
    EXCITED: 'excited',
    ANXIOUS: 'anxious',
    CALM: 'calm',
    ANGRY: 'angry',
    NEUTRAL: 'neutral',
    GRATEFUL: 'grateful',
    TIRED: 'tired',
    MOTIVATED: 'motivated'
};

const MOOD_VALUES = Object.values(MOODS);

const PROMPT_CATEGORIES = {
    REFLECTION: 'reflection',
    GRATITUDE: 'gratitude',
    GOALS: 'goals',
    CREATIVITY: 'creativity',
    MINDFULNESS: 'mindfulness',
    RELATIONSHIPS: 'relationships',
    PERSONAL_GROWTH: 'personal_growth'
};

const PROMPT_CATEGORIES_VALUES = Object.values(PROMPT_CATEGORIES);

const THEMES = {
    LIGHT:'light',
    DARK:'dark',
    AUTO:'auto'
}

const PAGINATION = {
    DEFAULT_PAGE:1,
    DEFAULT_LIMIT:10,
    MAX_LIMIT:100
};

// JWT token configurations
const JWT = {
    EXPIRES_IN: '7d',
    COOKIE_EXPIRES_INT: 7*24*60*60*1000,  // 7d in milliseconds
}

//Validation constraints
const VALIDATION = {
    USERNAME:{
        MIN_LENGTH:3,
        MAX_LENGTH:30
    },
    PASSWORD:{
        MIN_LENGTH:6,
        MAX_LENGTH:10,
    },
    JOURNAL_TITLE:{
        MIN_LENGTH:1,
        MAX_LENGTH:200
    },
    JOURNAL_CONTENT:{
        MIN_LENGTH:1,
        MAX_LENGTH:50000, // ~50kb of text
    },
    TAG:{
        MIN_LENGTH:1,
        MAX_LENGTH:10,
        MAX_COUNT:10,
    },
    CATEGORY_NAMES:{
        MIN_LENGTH:1,
        MAX_LENGTH:50,
    }
};

// File upload configurations
const FILE_UPLOAD = {
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'],
    MAX_SIZE: 5 * 1024 * 1024  // 5MB in bytes
};


// HTTP Status Codes
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
};

//Error Messages
const ERROR_MESSAGES = {
  // Authentication errors
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_EXISTS: 'User already exists',
    USER_NOT_FOUND: 'User not found',
    UNAUTHORIZED: 'Not authorized to access this resource',
    TOKEN_EXPIRED: 'Token has expired',
    INVALID_TOKEN: 'Invalid token',

    // Validation errors
    INVALID_INPUT: 'Invalid input data',
    REQUIRED_FIELD: 'This field is required',
    
    // Journal errors
    JOURNAL_NOT_FOUND: 'Journal entry not found',
    JOURNAL_ACCESS_DENIED: 'You do not have access to this journal',
    
    // Category errors
    CATEGORY_NOT_FOUND: 'Category not found',
    CATEGORY_EXISTS: 'Category with this name already exists',
    
    // General errors
    SERVER_ERROR: 'Internal server error',
    NOT_FOUND: 'Resource not found'
};

// Success Message
const SUCCESS_MESSAGES = {
    JOURNAL_CREATED: 'Journal entry created successfully',
    JOURNAL_UPDATED: 'Journal entry updated successfully',
    JOURNAL_DELETED: 'Journal entry deleted successfully',
    CATEGORY_CREATED: 'Category created successfully',
    CATEGORY_UPDATED: 'Category updated successfully',
    CATEGORY_DELETED: 'Category deleted successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
    PASSWORD_CHANGED: 'Password changed successfully'
};

// Default values
const DEFAULTS = {
    MOOD: MOODS.NEUTRAL,
    THEME: THEMES.AUTO,
    TIMEZONE: 'IST',
    IS_PRIVATE: true,
    IS_FAVORITE: false,
    CATEGORY_COLOR: '#3b82f6'
};

const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  URL: /^https?:\/\/.+/
};


module.exports = {
    REGEX,
    DEFAULTS,
    SUCCESS_MESSAGES,
    ERROR_MESSAGES,
    HTTP_STATUS,
    VALIDATION,
    JWT,
    PAGINATION,
    MOOD_VALUES,
    PROMPT_CATEGORIES_VALUES,
    THEMES,
    MOODS,
    PROMPT_CATEGORIES,
    FILE_UPLOAD
};
