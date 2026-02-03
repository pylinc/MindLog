const { HTTP_STATUS, ERROR_MESSAGES, VALIDATION, SUCCESS_MESSAGES } = require('../Config/constant');
const Category = require('../Models/Category');

exports.getAll = async(req,res)=>{
    try{
        const userId = req.user;
    
        const category = await Category.findByUser(userId);

        if(!category || category.length === 0){
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success:false,
                message:ERROR_MESSAGES.CATEGORY_NOT_FOUND,
            });
        }

        return res.status(HTTP_STATUS.OK).json({
            success:true,
            data:category,
        })
    }catch(error){
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        });
    }

};

exports.getSingle = async(req,res)=>{
    try{
        const userId = req.user;
        const categoryId = req.params.id;

        const exist = await Category.findById(categoryId);

        if(!exist){
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success:false,
                message:ERROR_MESSAGES.CATEGORY_NOT_FOUND,
            });
        }

        if(!exist.belongsToUser(userId)){
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success:false,
                message:ERROR_MESSAGES.UNAUTHORIZED,
            });
        }

        return res.status(HTTP_STATUS.OK).json({
            success:true,
            data:exist,
        });

    }catch(error){
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        })
    }
};

exports.createCategory = async(req,res)=>{
    try{
        const userId = req.user;
        const{name,color,icon,description} = req.body;

        // Validate category name
        if(!name || name.trim() === ''){
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success:false,
                message:'Category name is required',
            });
        }

        const trimmedName = name.trim();

        if(trimmedName.length < VALIDATION.CATEGORY_NAMES.MIN_LENGTH){
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success:false,
                message:`Category name must be at least ${VALIDATION.CATEGORY_NAMES.MIN_LENGTH} character`,
            });
        }

        if(trimmedName.length > VALIDATION.CATEGORY_NAMES.MAX_LENGTH){
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success:false,
                message:`Category name cannot exceed ${VALIDATION.CATEGORY_NAMES.MAX_LENGTH} characters`,
            });
        }

        // Create new category
        const newCategory = new Category({
            userId,
            name: trimmedName,
            color,
            icon,
            description
        });

        await newCategory.save();

        return res.status(HTTP_STATUS.CREATED).json({
            success:true,
            message:SUCCESS_MESSAGES.CATEGORY_CREATED,
            data:newCategory,
        });

    }catch(error){
        console.error(error);
        
        // Handle duplicate category name error
        if(error.statusCode === 409){
            return res.status(HTTP_STATUS.CONFLICT).json({
                success:false,
                message:ERROR_MESSAGES.CATEGORY_EXISTS,
            });
        }

        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        });
    };
};

exports.updateCategory = async(req,res)=>{
    try{
        const userId = req.user;
        const categoryId = req.params.id;
        const {name, color, icon, description} = req.body;

        // Find category by ID
        const category = await Category.findById(categoryId);

        if(!category){
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success:false,
                message:ERROR_MESSAGES.CATEGORY_NOT_FOUND,
            });
        }

        // Verify user owns the category
        if(!category.belongsToUser(userId)){
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success:false,
                message:ERROR_MESSAGES.UNAUTHORIZED,
            });
        }

        // Validate category name if provided
        if(name !== undefined){
            if(!name || name.trim() === ''){
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success:false,
                    message:'Category name is required',
                });
            }

            const trimmedName = name.trim();

            if(trimmedName.length < VALIDATION.CATEGORY_NAMES.MIN_LENGTH){
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success:false,
                    message:`Category name must be at least ${VALIDATION.CATEGORY_NAMES.MIN_LENGTH} character`,
                });
            }

            if(trimmedName.length > VALIDATION.CATEGORY_NAMES.MAX_LENGTH){
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success:false,
                    message:`Category name cannot exceed ${VALIDATION.CATEGORY_NAMES.MAX_LENGTH} characters`,
                });
            }

            category.name = trimmedName;
        }

        // Update other fields if provided
        if(color !== undefined) category.color = color;
        if(icon !== undefined) category.icon = icon;
        if(description !== undefined) category.description = description;

        // Save updated category
        await category.save();

        return res.status(HTTP_STATUS.OK).json({
            success:true,
            message:SUCCESS_MESSAGES.CATEGORY_UPDATED,
            data:category,
        });

    }catch(error){
        console.error(error);

        // Handle duplicate category name error
        if(error.statusCode === 409){
            return res.status(HTTP_STATUS.CONFLICT).json({
                success:false,
                message:ERROR_MESSAGES.CATEGORY_EXISTS,
            });
        }

        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        });
    }
};

exports.deleteCategory = async(req,res)=>{
    try{
        const userId = req.user;
        const categoryId = req.params.id;

        // Find category by ID
        const category = await Category.findById(categoryId);

        if(!category){
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success:false,
                message:ERROR_MESSAGES.CATEGORY_NOT_FOUND,
            });
        }

        // Verify user owns the category
        if(!category.belongsToUser(userId)){
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success:false,
                message:ERROR_MESSAGES.UNAUTHORIZED,
            });
        }

        // Delete category
        await Category.findByIdAndDelete(categoryId);

        return res.status(HTTP_STATUS.OK).json({
            success:true,
            message:SUCCESS_MESSAGES.CATEGORY_DELETED,
        });

    }catch(error){
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        });
    }
};



