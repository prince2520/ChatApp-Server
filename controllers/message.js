const Message = require('../models/message')
const Room = require('../models/group');
const User = require('../models/user')
const {validationResult} = require("express-validator");

exports.createMessage = (req,res,next) => {
    const message = req.body.message;
    const roomName = req.body.roomName;
    const userName = req.body.userName;

    const invalidInput = validationResult(req);

    if(!invalidInput.isEmpty()){
        res.status(422).json({invalidInput:invalidInput})
    }else {
        User.findOne({userName: userName}).then(user=>{
            Room.findOne({groupName: roomName}).then(group=>{
                const newMessage = new Message({
                    message: message,
                    room: group._id,
                    user: user._id
                })
                return newMessage.save().then(done => {
                    user.messages.push(newMessage._id)
                    group.messages.push(newMessage._id)
                    group.lastMessage = message
                    group.save();
                    user.save();
                });

            }).catch(err=>{
                console.log(err)
            })
        })
    }
}
