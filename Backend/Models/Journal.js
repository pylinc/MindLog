const mongoose = require('mongoose');
const {VALIDATION,MOOD_VALUES,DEFAULTS} = require('/Config/constant');

const journalSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    title:{
        type:String,
        required:true,
        minlength:[VALIDATION.JOURNAL_TITLE.MIN_LENGTH,`minimum title length should be ${VALIDATION.JOURNAL_TITLE.MIN_LENGTH} character`],
        maxlength:[VALIDATION.JOURNAL_TITLE.MAX_LENGTH,`Title length cannot exceed ${VALIDATION.JOURNAL_TITLE.MAX_LENGTH} characters`],
    },
    content:{
        type:String,
        required:true,
        minlength:[VALIDATION.JOURNAL_CONTENT.MIN_LENGTH,`Minimum Content length should be ${VALIDATION.JOURNAL_CONTENT.MIN_LENGTH} characters`],
        maxlength:[VALIDATION.JOURNAL_CONTENT.MAX_LENGTH,`The content length cannot exceed ${VALIDATION.JOURNAL_CONTENT.MAX_LENGTH} characters`],
    },
    mood:{
        type:String,
        enum:{
            values:MOOD_VALUES,
        },
        default:DEFAULTS.MOOD,
    },
    tags:{
        type:[{
            type:String,
            trim:true,
            lowercase:true,
            minlength: [VALIDATION.TAG.MIN_LENGTH, 'Tag must be at least 1 character'],
            maxlength: [VALIDATION.TAG.MAX_LENGTH, `Tag cannot exceed ${VALIDATION.TAG.MAX_LENGTH} characters`]
        }],
        validate:{
            validator: function(tags){
                return tags.length <= VALIDATION.TAG.MAX_COUNT;
            },
            message: `Cannot have more than ${VALIDATION.TAG.MAX_COUNT} tags`
        },
    },
    isFavorite: {
        type: Boolean,
        default: DEFAULTS.IS_FAVORITE
    },
    isPrivate: {
        type: Boolean,
        default: DEFAULTS.IS_PRIVATE
    },
    
    
});