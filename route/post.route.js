const { Router } = require("express");
const postModel = require("../model/post.model");
const { isValidObjectId } = require("mongoose");


const postRouter = Router()

postRouter.get('/', async (req, res) => {
    const posts = await postModel
        .find()
        .sort({ _id: -1 })
        .populate({ path: 'author', select: 'fullName email' })


    res.status(200).json(posts)
})

postRouter.post('/', async (req, res) => {
    const {content, title} = req.body
    if(!content) {
        return res.status(400).json({message:'content it requred'})
    }

    await postModel.create({content, title, author: req.userId})
    res.status(201).json({message: "post created successfully"})
})

postRouter.get('/:id', async (req, res) => {
    const {id} = req.params
    if(!isValidObjectId(id)){
        return res.status(400).json({message: "id is invalid"})
    }

    const post = await postModel.findById(id)

    if(!post){
        return res.status(404).json({message: 'not dound'})
    }

    res.status(200).json(post)
})

postRouter.delete('/:id', async (req, res) => {
    const {id} = req.params
    if(!isValidObjectId(id)){
        return res.status(400).json({message: "id is invalid"})
    }

    const post = await postModel.findById(id)

    if(post.author.toString() !== req.userId){
        return res.status(401).json({message: 'you dont have permition'})
    }

    await postModel.findByIdAndDelete(id)
    res.status(200).json({message: "post deleted successfully"})
})

postRouter.put('/:id', async (req, res) => {
    const {id} = req.params
    if(!isValidObjectId(id)){
        return res.status(400).json({message: "id is invalid"})
    }

    const post = await postModel.findById(id)

    if(post.author.toString() !== req.userId){
        return res.status(401).json({message: 'you dont have permition'})
    }

    const {title, content} = req.body

    await postModel.findByIdAndUpdate(id, {title, content}, {new: true})
    res.status(200).json({message: "post updated successfully"})
})

postRouter.post('/:id/reactions', async (req, res) => {
    const id = req.params.id
    const {type} = req.body
    const supportReactionType = ['like', 'dislike']
    if(!supportReactionType.includes(type)){
        return res.status(400).json({error: "wrong reaction type"})
    }
    const post = await postModel.findById(id)

    const alreadyLikedIndex = post.reactions.likes.findIndex(el => el.toString() === req.userId)
    const alreadyDislikedIndex = post.reactions.dislikes.findIndex(el => el.toString() === req.userId)

    if(type === 'like'){
        if(alreadyLikedIndex !== -1){
            post.reactions.likes.splice(alreadyLikedIndex, 1)
        }else{
            post.reactions.likes.push(req.userId)
        }
    }
    if(type === 'dislike'){
        if(alreadyDislikedIndex !== -1){
            post.reactions.dislikes.splice(alreadyDislikedIndex, 1)
        }else{
            post.reactions.dislikes.push(req.userId)
        }
    }

    if(alreadyLikedIndex !== -1 && type === 'dislike'){
        post.reactions.likes.splice(alreadyLikedIndex, 1)
    }

     if(alreadyDislikedIndex !== -1 && type === 'like'){
        post.reactions.dislikes.splice(alreadyDislikedIndex, 1)
    }
   
    await post.save()
    res.send('added successfully')
})


module.exports = postRouter