const JournalPrompt = require("../Models/JournalPrompts");

exports.getAllPrompts = async(req,res)=>{
    try{
        const prompts = await JournalPrompt.getAllActive();

        return res.status(HTTP_STATUS.OK).json({
            success:true,
            data:prompts,
        });
    }catch(error){
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        });
    }
};

exports.getRandomPrompt = async(req,res)=>{
    try{
        const prompt = await JournalPrompt.getRandomPrompt();

        return res.status(HTTP_STATUS.OK).json({
            success:true,
            data:prompt,
        });
    }catch(error){
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        });
    }
};

exports.getPromptsByCategory = async(req,res)=>{
    try{
        const {category} = req.params;
        const prompts = await JournalPrompt.getPromptsByCategory(category);

        return res.status(HTTP_STATUS.OK).json({
            success:true,
            data:prompts,
        });
    }catch(error){
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        });
    }
};

exports.createPrompt = async(req,res)=>{
    try{
        const {prompt,category} = req.body;
        const newPrompt = await JournalPrompt.create({
            prompt,
            category,
        });

        return res.status(HTTP_STATUS.OK).json({
            success:true,
            data:newPrompt,
        });
    }catch(error){
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        });
    }
};

exports.updatePrompt = async(req,res)=>{
    try{
        const {id} = req.params;
        const {prompt,category} = req.body;
        const updatedPrompt = await JournalPrompt.findByIdAndUpdate(id,{
            prompt,
            category,
        });

        return res.status(HTTP_STATUS.OK).json({
            success:true,
            data:updatedPrompt,
        });
    }catch(error){
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        });
    }
};

exports.deletePrompt = async(req,res)=>{
    try{
        const {id} = req.params;
        const prompt = await JournalPrompt.findByIdAndDelete(id);

        return res.status(HTTP_STATUS.OK).json({
            success:true,
            data:prompt,
        });
    }catch(error){
        console.error(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        });
    }
};
