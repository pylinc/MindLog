// models/Category.js
const mongoose = require('mongoose');
const { 
  VALIDATION, 
  DEFAULTS,
  REGEX 
} = require('../config/constants');

const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    minlength: [VALIDATION.CATEGORY_NAME.MIN_LENGTH, `Category name must be at least ${VALIDATION.CATEGORY_NAME.MIN_LENGTH} character`],
    maxlength: [VALIDATION.CATEGORY_NAME.MAX_LENGTH, `Category name cannot exceed ${VALIDATION.CATEGORY_NAME.MAX_LENGTH} characters`]
  },
  color: {
    type: String,
    default: DEFAULTS.CATEGORY_COLOR,
    match: [REGEX.HEX_COLOR, 'Color must be a valid hex code (e.g., #3b82f6)']
  },
  icon: {
    type: String,
    trim: true,
    maxlength: [50, 'Icon name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  }
}, {
  timestamps: true
});

// Compound unique index - user can't have duplicate category names
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

// Pre-save middleware to ensure category name is unique per user
categorySchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('name')) {
    const existingCategory = await this.constructor.findOne({
      userId: this.userId,
      name: this.name,
      _id: { $ne: this._id } // Exclude current document
    });

    if (existingCategory) {
      const error = new Error('Category with this name already exists');
      error.statusCode = 409; // Conflict
      return next(error);
    }
  }
  next();
});

// Instance method to check if category belongs to user
categorySchema.methods.belongsToUser = function(userId) {
  return this.userId.toString() === userId.toString();
};

// Static method to find categories by user
categorySchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ name: 1 });
};

module.exports = mongoose.model('Category', categorySchema);