const { Router } = require("express");
const postModel = require("../model/post.model");
const { isValidObjectId } = require("mongoose");
const User = require("../model/user.model");

const postRouter = Router();

// Get all posts with author details
postRouter.get('/', async (req, res) => {
    try {
        const posts = await postModel.find()
            .sort({ createdAt: -1 })
            .populate('author', 'name avatar'); // Populate author details
        
        const processedPosts = posts.map(post => ({
            ...post.toObject(),
            author: {
                _id: post.author?._id,
                name: post.author?.name || 'Anonymous',
                avatar: post.author?.avatar || '/default-avatar.png'
            },
            reactions: post.reactions || { likes: [], dislikes: [] }
        }));

        res.json(processedPosts);
    } catch (error) {
        console.error("Fetch posts error:", error);
        res.status(500).json({ error: "Failed to fetch posts", details: error.message });
    }
});

// Create new post
postRouter.post('/', async (req, res) => {
    try {
        const { content, title } = req.body;
        
        if (!content || !title) {
            return res.status(400).json({ message: 'Content and title are required' });
        }

        const author = await User.findById(req.userId);
        if (!author) {
            return res.status(404).json({ message: 'Author not found' });
        }

        const newPost = await postModel.create({
            content, 
            title, 
            author: author._id,
            reactions: { likes: [], dislikes: [] }
        });

        author.posts.push(newPost._id);
        await author.save();

        // Populate author data in the response
        const populatedPost = await postModel.findById(newPost._id)
            .populate('author', 'name avatar');

        res.status(201).json(populatedPost);
    } catch (error) {
        console.error("Create post error:", error);
        res.status(500).json({ error: "Failed to create post", details: error.message });
    }
});

// Get single post
postRouter.get('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        if(!isValidObjectId(id)){
            return res.status(400).json({message: "Invalid post ID"});
        }

        const post = await postModel.findById(id)
            .populate('author', 'name avatar');

        if(!post){
            return res.status(404).json({message: 'Post not found'});
        }

        res.status(200).json(post);
    } catch (error) {
        console.error("Get post error:", error);
        res.status(500).json({ error: "Failed to fetch post", details: error.message });
    }
});

// Delete post
postRouter.delete('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        if(!isValidObjectId(id)){
            return res.status(400).json({message: "Invalid post ID"});
        }

        const post = await postModel.findById(id);
        if(!post){
            return res.status(404).json({message: 'Post not found'});
        }

        if(post.author.toString() !== req.userId){
            return res.status(403).json({message: 'Unauthorized to delete this post'});
        }

        await postModel.findByIdAndDelete(id);
        
        // Remove post reference from user
        await User.findByIdAndUpdate(req.userId, {
            $pull: { posts: id }
        });

        res.status(200).json({message: "Post deleted successfully"});
    } catch (error) {
        console.error("Delete post error:", error);
        res.status(500).json({ error: "Failed to delete post", details: error.message });
    }
});

// Update post
postRouter.put('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        if(!isValidObjectId(id)){
            return res.status(400).json({message: "Invalid post ID"});
        }

        const post = await postModel.findById(id);
        if(!post){
            return res.status(404).json({message: 'Post not found'});
        }

        if(post.author.toString() !== req.userId){
            return res.status(403).json({message: 'Unauthorized to update this post'});
        }

        const {title, content} = req.body;
        const updatedPost = await postModel.findByIdAndUpdate(
            id, 
            {title, content}, 
            {new: true}
        ).populate('author', 'name avatar');

        res.status(200).json(updatedPost);
    } catch (error) {
        console.error("Update post error:", error);
        res.status(500).json({ error: "Failed to update post", details: error.message });
    }
});

// Handle reactions
postRouter.post('/:id/reactions', async (req, res) => {
    try {
        const id = req.params.id;
        const {type} = req.body;
        const supportReactionType = ['like', 'dislike'];
        
        if(!isValidObjectId(id)){
            return res.status(400).json({message: "Invalid post ID"});
        }

        if(!supportReactionType.includes(type)){
            return res.status(400).json({error: "Invalid reaction type"});
        }

        const post = await postModel.findById(id);
        if(!post){
            return res.status(404).json({message: 'Post not found'});
        }

        // Initialize reactions if they don't exist
        if(!post.reactions){
            post.reactions = { likes: [], dislikes: [] };
        }

        const alreadyLikedIndex = post.reactions.likes.findIndex(el => el.toString() === req.userId);
        const alreadyDislikedIndex = post.reactions.dislikes.findIndex(el => el.toString() === req.userId);

        if(type === 'like'){
            if(alreadyLikedIndex !== -1){
                post.reactions.likes.splice(alreadyLikedIndex, 1);
            }else{
                post.reactions.likes.push(req.userId);
                // Remove from dislikes if exists
                if(alreadyDislikedIndex !== -1){
                    post.reactions.dislikes.splice(alreadyDislikedIndex, 1);
                }
            }
        } else if(type === 'dislike'){
            if(alreadyDislikedIndex !== -1){
                post.reactions.dislikes.splice(alreadyDislikedIndex, 1);
            }else{
                post.reactions.dislikes.push(req.userId);
                // Remove from likes if exists
                if(alreadyLikedIndex !== -1){
                    post.reactions.likes.splice(alreadyLikedIndex, 1);
                }
            }
        }

        await post.save();
        
        // Return the updated post
        const updatedPost = await postModel.findById(id)
            .populate('author', 'name avatar');
            
        res.status(200).json(updatedPost);
    } catch (error) {
        console.error("Reaction error:", error);
        res.status(500).json({ error: "Failed to update reaction", details: error.message });
    }
});

module.exports = postRouter;