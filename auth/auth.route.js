const authRouter = require('express').Router();
const User = require('../model/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userSchema = require("../validations/user.validation");
const isAuth = require('../middlewares/isAuth.middleware');
require("dotenv").config();

authRouter.post("/sign-up", async(req,res)=>{

    const {error} = userSchema.validate(req.body || {});
    if(error){
        return res.status(400).json(error)
    }

    const {name, email, password} = req.body;

    const existUser = await User.findOne({email});
    if(existUser){
        return res.status(400).json({message: "User already exists"});
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
        name,
        email,
        password: hashedPassword
    });
    
    res.status(201).json({
        message: "User created successfully",
        user
    });



})


authRouter.post("/sign-in", async(req,res)=>{
    const {email, password}= req.body;
    if(!email || !password){
        return res.status(400).json({message: "Email and password are required"});
    }

    const existUser = await User.findOne({email}).select("password role")
    if(!existUser){
        return res.status(400).json({message: "User does not exist"});
    }
    
    const isPassEqual = await bcrypt.compare(password, existUser.password);
    if(!isPassEqual){
        return res.status(400).json({message: "Invalid credentials"});
    }

    const payload = {
        id: existUser._id,
        role: existUser.role
    }                   

    const token = await jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "1h"});

    res.json(token)
})

authRouter.get('/current-user', isAuth, async (req, res) => {
    const user = await User.findById(req.userId)
    res.json(user)
})


module.exports = authRouter;