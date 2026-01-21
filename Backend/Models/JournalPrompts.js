const mongoose = require('mongoose');
const{PROMPT_CATEGORIES_VALUES,PROMPT_CATEGORIES} = require('../config/constants');

const journalPromptsSchema = new mongoose.Schema({
    prompt:{
        type:String,
        required:[true,'Prompt text is required'],
        unique:true,
        trim:true,
    },
    category:{
        type:String,
        required: [true, 'Category is required'],
        enum:{
            values:PROMPT_CATEGORIES_VALUES,
            message:'{VALUE} is not a valid prompt'
        },
    },
    isActive:{
        type:Boolean,
        default:true,
    }
},{
    timestamps:true,
});

journalPromptsSchema.index({category:1});
journalPromptsSchema.index({isActive:1});

journalPromptSchema.statics.getRandomPrompt = async function(category) {
  const query = { isActive: true };
  
  if (category) {
    query.category = category;
  }
  
  const prompts = await this.aggregate([
    { $match: query },
    { $sample: { size: 1 } }
  ]);
  
  return prompts[0] || null;
};

journalPromptSchema.statics.getByCategory = function(category) {
  return this.find({ 
    category, 
    isActive: true 
  }).sort({ createdAt: -1 });
};

journalPromptSchema.statics.getAllActive = function() {
  return this.find({ isActive: true }).sort({ category: 1, createdAt: -1 });
};

module.exports = mongoose.model('JournalPrompt', journalPromptSchema);