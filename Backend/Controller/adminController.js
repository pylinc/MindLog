const User = require('../Models/user');
const Journal = require('../Models/Journal');
const JournalPrompt = require('../Models/JournalPrompts');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../Config/constant');

exports.getDashboardStats = async (req, res) => {
    try {
        // Parallel execution for performance
        const [totalUsers, totalEntries, totalPrompts, activeUsers] = await Promise.all([
            User.countDocuments(),
            Journal.countDocuments(),
            JournalPrompt.countDocuments(),
            User.countDocuments({ 
                updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
            })
        ]);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                totalUsers,
                totalEntries,
                totalPrompts,
                activeUsers
            }
        });
    } catch (error) {
        console.error('Admin Stats Error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR
        });
    }
};
