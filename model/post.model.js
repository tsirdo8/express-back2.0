const mongoose = require("mongoose");


const postSchema = new mongoose.Schema({
    title:
    {
        type: String,
        required: true,
        
    },
    content: {
        type: String,
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    reactions: {
        likes: [{type: mongoose.Schema.Types.ObjectId, ref: 'user'}],
        dislikes: [{type: mongoose.Schema.Types.ObjectId, ref: 'user'}],
    }
}, {timestamps: true})

module.exports = mongoose.model("Post", postSchema);