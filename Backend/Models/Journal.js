// models/Journal.js
const mongoose = require('mongoose');
const { 
  MOOD_VALUES, 
  DEFAULTS, 
  VALIDATION,
  REGEX,
  FILE_UPLOAD 
} = require('../Config/constant');

const journalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [VALIDATION.JOURNAL_TITLE.MIN_LENGTH, `Title must be at least ${VALIDATION.JOURNAL_TITLE.MIN_LENGTH} character`],
    maxlength: [VALIDATION.JOURNAL_TITLE.MAX_LENGTH, `Title cannot exceed ${VALIDATION.JOURNAL_TITLE.MAX_LENGTH} characters`]
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [VALIDATION.JOURNAL_CONTENT.MIN_LENGTH, 'Content cannot be empty'],
    maxlength: [VALIDATION.JOURNAL_CONTENT.MAX_LENGTH, `Content cannot exceed ${VALIDATION.JOURNAL_CONTENT.MAX_LENGTH} characters`]
  },
  mood: {
    type: String,
    enum: {
      values: MOOD_VALUES,
      message: '{VALUE} is not a valid mood'
    },
    default: DEFAULTS.MOOD
  },
  tags: {
    type: [{
      type: String,
      trim: true,
      lowercase: true,
      minlength: [VALIDATION.TAG.MIN_LENGTH, 'Tag must be at least 1 character'],
      maxlength: [VALIDATION.TAG.MAX_LENGTH, `Tag cannot exceed ${VALIDATION.TAG.MAX_LENGTH} characters`]
    }],
    validate: {
      validator: function(tags) {
        return tags.length <= VALIDATION.TAG.MAX_COUNT;
      },
      message: `Cannot have more than ${VALIDATION.TAG.MAX_COUNT} tags`
    },
    default: []
  },
  isFavorite: {
    type: Boolean,
    default: DEFAULTS.IS_FAVORITE
  },
  isPrivate: {
    type: Boolean,
    default: DEFAULTS.IS_PRIVATE
  },
  attachments: [{
    fileName: {
      type: String,
      required: [true, 'File name is required']
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
      match: [REGEX.URL, 'File URL must be a valid URL']
    },
    fileType: {
      type: String,
      enum: {
        values: FILE_UPLOAD.ALLOWED_TYPES,
        message: '{VALUE} is not a supported file type'
      }
    },
    fileSize: {
      type: Number,
      max: [FILE_UPLOAD.MAX_SIZE, `File size cannot exceed ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`]
    }
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates. Longitude must be between -180 and 180, Latitude between -90 and 90'
      }
    },
    placeName: {
      type: String,
      trim: true,
      maxlength: [100, 'Place name cannot exceed 100 characters']
    }
  },
  weather: {
    condition: {
      type: String,
      trim: true
    },
    temperature: {
      type: Number,
      min: [-100, 'Temperature seems too low'],
      max: [100, 'Temperature seems too high']
    },
    icon: String
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
journalSchema.index({ userId: 1, createdAt: -1 });
journalSchema.index({ userId: 1, tags: 1 });
journalSchema.index({ userId: 1, mood: 1 });
journalSchema.index({ userId: 1, isFavorite: 1 });

// Text index for search functionality
journalSchema.index({ title: 'text', content: 'text' });

// Pre-save middleware to clean tags
journalSchema.pre('save', function(next) {
  // Remove duplicate tags and empty strings
  if (this.tags && this.tags.length > 0) {
    this.tags = [...new Set(this.tags.filter(tag => tag && tag.trim()))];
  }
  next();
});

// Instance method to check if journal belongs to user
journalSchema.methods.belongsToUser = function(userId) {
  return this.userId.toString() === userId.toString();
};

// Static method to find journals by user
journalSchema.statics.findByUser = function(userId, options = {}) {
  const query = this.find({ userId });
  
  if (options.mood) {
    query.where('mood').equals(options.mood);
  }
  
  if (options.tags && options.tags.length > 0) {
    query.where('tags').in(options.tags);
  }
  
  if (options.isFavorite !== undefined) {
    query.where('isFavorite').equals(options.isFavorite);
  }
  
  return query.sort({ createdAt: -1 });
};

// Static method to get mood statistics
journalSchema.statics.getMoodStats = async function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$mood', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

module.exports = mongoose.model('Journal', journalSchema);