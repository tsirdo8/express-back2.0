const mongoose = require("mongoose");

const userScheama = new mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    password:{
        type: String,
        required: true,
        select: false, 
    },
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
    }],
    role:{
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    avatar:{
        type: String
    }

    
}, { timestamps: true })

module.exports = mongoose.model("User", userScheama)