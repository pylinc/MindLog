const Journal = require('../Models/Journal');
const mongoose = require('mongoose');
const{HTTP_STATUS,ERROR_MESSAGES,VALIDATION,SUCCESS_MESSAGES} = require("../Config/constant");

exports.getAll = async (req, res) => {
    try {
        const userId = req.user;
        const {
            page = 1,
            limit = 10,
            mood,
            tags,
            search,
            isFavorite,
            startDate,
            endDate,
            sort
        } = req.query;

        
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 100); 
        const skip = (pageNum - 1) * limitNum;

        const query = { userId };

        if (mood) {
            query.mood = mood;
        }

        if (tags) {
            const tagList = tags.split(',').map(t => t.trim());
            query.tags = { $in: tagList };
        }

        if (isFavorite !== undefined) {
            query.isFavorite = isFavorite === 'true';
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        // Determine sort order
        let sortOption = { createdAt: -1 };
        if (sort) {
            if (sort === 'createdAt') sortOption = { createdAt: 1 };
            else if (sort === '-createdAt') sortOption = { createdAt: -1 };
            else if (sort === 'updatedAt') sortOption = { updatedAt: 1 };
            else if (sort === '-updatedAt') sortOption = { updatedAt: -1 };
        }

        // Execute query and count concurrently
        const [journals, total] = await Promise.all([
            Journal.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(limitNum)
                .lean(), // Optimize for read-only
            Journal.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / limitNum);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                journals,
                pagination: {
                    total,
                    totalPages,
                    currentPage: pageNum,
                    limit: limitNum
                }
            }
        });

    } catch (error) {
        console.error('Error in getJournals:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error retrieving journals',
            error: error.message
        });
    }
};

exports.singleJournal = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user;

        const journal = await Journal.findOne({
            _id: id,
            userId: userId,
        });

        if (!journal) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.JOURNAL_NOT_FOUND
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: journal
        });

    } catch (error) {
        console.error('Error in singleJournal:', error);
        if (error.kind === 'ObjectId') {
             return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: ERROR_MESSAGES.INVALID_INPUT
            });
        }
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error retrieving journal',
            error: error.message
        });
    }
};
exports.createJournal = async (req, res) => {
    try {
        const { title, content, mood, tags, isFavorite, isPrivate, location, weather, attachments } = req.body;
        const userId = req.user;

        if (!title || !content) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: "Title and content are required",
            });
        }
        if (title.length < VALIDATION.JOURNAL_TITLE.MIN_LENGTH || title.length > VALIDATION.JOURNAL_TITLE.MAX_LENGTH) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: `Title length must be between ${VALIDATION.JOURNAL_TITLE.MIN_LENGTH} and ${VALIDATION.JOURNAL_TITLE.MAX_LENGTH} characters`,
            });
        }
        if (content.length < VALIDATION.JOURNAL_CONTENT.MIN_LENGTH || content.length > VALIDATION.JOURNAL_CONTENT.MAX_LENGTH) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: `Content length must be between ${VALIDATION.JOURNAL_CONTENT.MIN_LENGTH} and ${VALIDATION.JOURNAL_CONTENT.MAX_LENGTH} characters`,
            });
        }
        if (tags && tags.length > VALIDATION.TAG.MAX_COUNT) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: "Too many tags",
            });
        }

        // Sanitize location
        let processedLocation = location;
        if (location) {
             if (!location.coordinates || location.coordinates.length === 0) {
                 // If no coordinates, ensure we honor the schema or handle it. 
                 // If the user wants to save placeName only, we keep it. 
                 // If location is just empty object, remove it.
                 if (!location.placeName) {
                     processedLocation = undefined;
                 }
             }
        }

        const journal = await Journal.create({
            userId,
            title,
            content,
            mood: mood ? mood.toLowerCase() : undefined,
            tags,
            isFavorite,
            isPrivate,
            location: processedLocation,
            weather,
            attachments
        });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: SUCCESS_MESSAGES.JOURNAL_CREATED,
            data: journal
        });
    } catch (error) {
        console.error('Error in createJournal:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error creating journal',
            error: error.message
        });
    }
};

exports.updateJournal = async (req, res) => {
    try {
        const { id } = req.params; // Fix: Extract id from params
        const { title, content, mood, tags, isFavorite, isPrivate, location, weather, attachments } = req.body;
        
        if (!title || !content) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: "Title and content are required",
            });
        }
        
        const userId = req.user;

        // Find journal by ID and Owner
        const journal = await Journal.findOne({ _id: id, userId: userId });

        if (!journal) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.JOURNAL_NOT_FOUND,
            });
        }

        // Update fields
        journal.title = title;
        journal.content = content;
        if (mood) journal.mood = mood.toLowerCase();
        if (tags) journal.tags = tags;
        if (isFavorite !== undefined) journal.isFavorite = isFavorite;
        if (isPrivate !== undefined) journal.isPrivate = isPrivate;
        
        if (location) {
             if (!location.coordinates || location.coordinates.length === 0) {
                 if (!location.placeName) {
                     // If empty location object, do nothing or unset? 
                     // Typically if user sends field it means update. 
                     // Let's assume valid update if not empty.
                 }
             }
             journal.location = location;
        }

        if (weather) journal.weather = weather;
        if (attachments) journal.attachments = attachments;
        
        // Save to trigger validation and timestamps
        await journal.save();

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.JOURNAL_UPDATED,
            data: journal
        });

    } catch (error) {
        console.error("Error while updating journal: ", error);
        if (error.kind === 'ObjectId') {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
               success: false,
               message: ERROR_MESSAGES.INVALID_INPUT
           });
       }
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error updating journal',
            error: error.message
        });
    }
};

exports.deleteJournal = async (req, res) => {
    try {
        const { id } = req.params; 
        const userId = req.user;
        
        const journal = await Journal.findOneAndDelete({
            _id: id,
            userId: userId
        });
        
        if (!journal) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.JOURNAL_NOT_FOUND,
            });
        }
        
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.JOURNAL_DELETED
        });
    } catch (error) {
        console.error("Error while deleting journal: ", error);
        if (error.kind === 'ObjectId') {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
               success: false,
               message: ERROR_MESSAGES.INVALID_INPUT
           });
       }
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error deleting journal',
            error: error.message
        });
    }
};

exports.favoriteJournal = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user;
        
        const journal = await Journal.findOne({
            _id: id,
            userId: userId,
        });

        if (!journal) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: ERROR_MESSAGES.JOURNAL_NOT_FOUND,
            });
        }
        
        journal.isFavorite = true;
        await journal.save();

        return res.status(HTTP_STATUS.OK).json({
            success: true, // Fix typo 'sucess'
            message: 'Journal marked as Favorite',
            data: journal
        });
        
    } catch (error) {
        console.error("Error while making Favorite", error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message
        });
    }
};

exports.moodStatics = async (req, res) => {
    try {
        const userId = req.user;
        const moodStatics = await Journal.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $group: {
                    _id: "$mood",
                    count: { $sum: 1 }
                }
            }
        ]);
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Mood statics",
            data: moodStatics
        });
    } catch (error) {
        console.error("Error while getting mood statics: ", error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message
        });
    }
};

exports.journalAnalytics = async (req, res) => {
    try {
        const userId = req.user;
        const now = new Date();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const analytics = await Journal.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
                $facet: {
                    totalJournals: [{ $count: "count" }],
                    journalsThisWeek: [
                        { $match: { createdAt: { $gte: startOfWeek } } },
                        { $count: "count" }
                    ],
                    journalsThisMonth: [
                        { $match: { createdAt: { $gte: startOfMonth } } },
                        { $count: "count" }
                    ],
                    mostUsedTags: [
                        { $unwind: "$tags" },
                        { $group: { _id: "$tags", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ],
                    moodDistribution: [
                        { $group: { _id: "$mood", count: { $sum: 1 } } }
                    ],
                    favoriteCount: [
                        { $match: { isFavorite: true } },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        const result = analytics[0];
        
        const oldestJournal = await Journal.findOne({ userId }).sort({ createdAt: 1 });
        let averagePerWeek = 0;
        
        if (oldestJournal) {
            const daysDiff = (now - oldestJournal.createdAt) / (1000 * 60 * 60 * 24);
            const weeksDiff = Math.max(daysDiff / 7, 1); // Avoid division by zero
            const total = result.totalJournals[0] ? result.totalJournals[0].count : 0;
            averagePerWeek = (total / weeksDiff).toFixed(1);
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                totalJournals: result.totalJournals[0] ? result.totalJournals[0].count : 0,
                journalsThisWeek: result.journalsThisWeek[0] ? result.journalsThisWeek[0].count : 0,
                journalsThisMonth: result.journalsThisMonth[0] ? result.journalsThisMonth[0].count : 0,
                mostUsedTags: result.mostUsedTags,
                moodDistribution: result.moodDistribution,
                favoriteCount: result.favoriteCount[0] ? result.favoriteCount[0].count : 0,
                averagePerWeek: parseFloat(averagePerWeek)
            }
        });

    } catch (error) {
        console.error("Error while getting journal analytics: ", error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message
        });
    }
};

exports.searchJournals = async(req,res)=>{
    try{
        const { search } = req.query;
        const userId = req.user;
        
        if (!search) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: "Search query is required"
            });
        }
        
        const journals = await Journal.find({
            userId,
            $or: [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ]
        });
        
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Journals found",
            data: journals
        });
    }catch(error){
        console.error("Error while searching journals: ", error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message
        });
    }
};
