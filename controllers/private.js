const User = require('../models/user')
const PrivateChat = require('../models/private');
const Message = require('../models/message');
const mongoose = require('mongoose')

exports.addPrivateUser = async (req, res, next) => {
    const senderName = req.body.senderName;
    const receiverName = req.body.receiverName;

    console.log('ReceiverName', receiverName);
    console.log(senderName)

    const findSender = await User.findOne({userName: senderName});
    const findReceiver = await User.findOne({userName: receiverName})

    const privateUser = await PrivateChat.findOne({user: {$all: [findSender._id, findReceiver._id]}})

    if (privateUser) {
    } else {

        const newPrivateUser = new PrivateChat();
        newPrivateUser.save().then(result => {
            console.log('private Chat confirm');
            result.user.push(findSender._id);
            result.user.push(findReceiver._id);
            result.save().then(done => {
                    res.status(202).json({receiverUser: findReceiver})
                }
            );
        });


    }
};

exports.fetchPrivateUser = async (req, res, next) => {
    const userName = req.query.userName;

    const userFound = await User.findOne({userName: userName});
    const privateUserFound = await PrivateChat.find({user: {$in: [userFound._id]}}).populate('user');

    if (privateUserFound) {
        res.status(200).json({privateUser: privateUserFound})
    } else {
        res.status(200).json({noPrivateUser: true})
    }

}


exports.createPersonalMessage = async (req, res, next) => {
    const senderName = req.body.senderName;
    const receiverName = req.body.receiverName;
    const message = req.body.message


    const findSender = await User.findOne({userName: senderName});
    const findReceiver = await User.findOne({userName: receiverName})

    const privateUser = await PrivateChat.findOne({user: {$all: [findSender._id, findReceiver._id]}});

    if (privateUser) {
        const newMessage = new Message({
            message: message,
            user: mongoose.Types.ObjectId(findSender._id)
        })

        newMessage.save().then(done => {
            privateUser.privateMessages.push(done._id);
            privateUser.lastMessage = message;
            privateUser.save();
        })
    }
}

exports.fetchPrivateMessage = async (req, res, next) => {
    const senderName = req.query.senderName;
    const receiverName = req.query.receiverName;


    const findSender = await User.findOne({userName: senderName});
    const findReceiver = await User.findOne({userName: receiverName});

    if (findSender || findReceiver) {
        const privateUser = await PrivateChat.findOne({user: {$all: [findSender._id, findReceiver._id]}}).populate({
            path: 'privateMessages',
            populate: {path: 'user'}
        });

        if (privateUser) {
            res.status(200).json({privateMessage: privateUser})
        }
    } else {
        res.status(404).json({message: 'no User found'})
    }
}
