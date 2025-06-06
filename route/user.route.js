
const userRouter = require("express").Router();
const userModel = require("../model/user.model");
const {upload, deleteFromCloudinary} = require("../config/clodinary.config");
const postModel = require("../model/post.model");
const isAuth = require("../middlewares/isAuth.middleware");



userRouter.get("/", async(req, res)=>{
    const users = await userModel.find().sort({_id: -1})
    res.status(200).json(users)                                     
}
)

userRouter.put('/', isAuth, upload.single('avatar'), async (req, res) => {
    try {
        const id = req.userId;
        const { email, name } = req.body; 
        const filePath = req.file?.path; 
        
        const updateData = { email, name }; 
        
        if (filePath) {
            const user = await userModel.findById(id);
            if (user.avatar) {
                const deleteId = user.avatar.split('uploads/')[1];
                const cloudinaryId = deleteId.split('.')[0];
                await deleteFromCloudinary(`uploads/${cloudinaryId}`);
            }
            updateData.avatar = filePath;
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            id, 
            updateData,
            { new: true } 
        );
        
        res.status(200).json({
            message: "User updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ error: "Failed to update user" });
    }
});

userRouter.delete('/:id', isAuth, async (req, res) => {
    const targetUserId = req.params.id
    const userId = req.userId

    const user = await userModel.findById(userId)
    const targetUser = await userModel.findById(targetUserId)

    if(user.role !== 'admin' && targetUserId !== userId){
        return res.status(403).json({error: "You dont have perimition"})
    }

    await userModel.findByIdAndDelete(targetUserId)
    await postModel.deleteMany({author: targetUserId})
    res.json({message: 'user deleted successfully'})
})



module.exports = userRouter;