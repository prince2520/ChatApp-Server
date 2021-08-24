const User = require('../models/user');
const Room = require('../models/group');
const mongoose = require('mongoose');


exports.createUser = async(req,res,next) => {
    const userName = req.body.userName;
    const roomName = req.body.roomName;


    const userFound = await User.findOne({userName: userName})
    const roomFound = await Room.findOne({roomName: roomName})

    if(userFound){
        roomFound.user.push(userFound._id)
        roomFound.save()
        res.status(200).json({message: 'User already exist!'})
    }else {
            const newUser = new User({
                userName:userName,
            });
            const saveUser = await newUser.save();
            roomFound.user.push(saveUser._id);
            roomFound.save()
    }
}

exports.fetchUser = async (req,res,next) => {
    const searchEmail = req.query.email;

    const userFound = await User.findOne({email:searchEmail})

    console.log(userFound)
    if(userFound){
        res.status(200).json({userFound:true, user: userFound })
    }else {
        res.status(200).json({userFound:false, user: 'No UserFound'})
    }
}

exports.fetchAuthUser = async (req,res,next) =>{
    const authUserId =  mongoose.Types.ObjectId(req.query.authUser);

    console.log('authUserId',authUserId)

    const userFound = await User.findOne({_id:authUserId})

    if(userFound){
        console.log('userFound',userFound)
        res.status(200).json({userFound:true,user:userFound});
    }else {
        res.status(200).json({userFound:false, user: 'No UserFound'})
    }
}

exports.saveProfile = async (req,res,next)=>{
    const userId = mongoose.Types.ObjectId(req.body.userId);
    const status = req.body.status;
    const profileImageUrl = req.body.profileImageUrl;

    const userFound = await User.findOne({_id:userId});

    if(userFound){
        if(!profileImageUrl){
            userFound.Status = status;
            userFound.save().then(result=>{
                res.status(200).json({
                    status:result.Status,
                    profileImageUrl:result.profileImageUrl
                })
            });
        }else {
            userFound.Status = status;
            userFound.profileImageUrl = profileImageUrl ;
            userFound.save().then(result=>{
                res.status(200).json({
                    status:result.Status,
                    profileImageUrl:result.profileImageUrl
                })
            })
        }
    }else {
        res.status(404).json({noUserFound: true,message:'No User Found!'})
    }
}
