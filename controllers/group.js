const Room = require('../models/group');
const mongoose = require('mongoose');
const User = require('../models/user');
const {validationResult} = require("express-validator");

exports.createRoom = async (req, res, next) => {
    const groupName = req.body.groupName;
    const userId = mongoose.Types.ObjectId(req.body.userId);
    const groupImageUrl = req.body.groupImageUrl;


    const invalidInput = validationResult(req);

    if (!invalidInput.isEmpty()) {
        res.status(422).json({invalidInput: invalidInput})
    } else {
        const roomFound = await Room.findOne({groupName: groupName})
        const userFound = await User.findOne({_id: userId})

        if (!roomFound) {
            let createGroup;
            if(groupImageUrl){
                createGroup = new Room({
                    groupName: groupName,
                    groupImageUrl: groupImageUrl,
                    createdBy: userId
                });
            }else {
                createGroup = new Room({
                    groupName: groupName,
                    createdBy: userId
                });
            }

            createGroup.save().then(saveGroup => {
                saveGroup.user.push(userId)
                saveGroup.save().then(userSaveInGroup => {
                    userFound.joinRoom.push(userSaveInGroup._id);
                    userFound.save();
                    console.log(userSaveInGroup)
                    res.status(200).json({
                        message: groupName + 'group created successfully!',
                        createGroup: userSaveInGroup
                    })
                })
            });
        } else {
            let groupInUserFound;
            for (const groupInUser of userFound.joinRoom) {
                groupInUserFound = groupInUser.toString() === roomFound._id.toString();
            }
            if (groupInUserFound) {
                res.status(200).json({userAlreadyJoinGroup: true, message: 'User already join this group.'})
            } else {
                res.status(200).json({joinGroup: true, message: 'Join this Group'});
            }
        }
    }
};

exports.fetchRoomMessages = async (req, res, next) => {
    const roomName = req.query.roomName
    const result = await Room.findOne({groupName: roomName}).populate({
        path: 'messages',
        populate: {path: 'user'}
    })
    if (result) {
        return res.status(200).json({roomInfo: result})
    } else {
        return res.status(200).json({roomInfo: 'No message!'})
    }
};

exports.fetchRoomNames = async (req, res, next) => {
    const userId = mongoose.Types.ObjectId(req.query.userId);

    const roomName = await User.findOne({_id: userId}).populate('joinRoom');

    if (roomName) {
        return res.status(200).json({roomInfo: roomName.joinRoom})
    } else {
        return res.status(200).json({roomInfo: []})
    }
}


exports.joinGroup = async (req, res, next) => {
    const groupName = req.body.groupName;
    const userId = mongoose.Types.ObjectId(req.body.userId);

    const groupFound = await Room.findOne({groupName: groupName});
    const userFound = await User.findOne({_id: userId})

    let groupInUserFound;
    if (groupFound) {
        for (const userInGroup of groupFound.user) {
            groupInUserFound = userInGroup.toString() === userId.toString();
        }

        if (groupInUserFound) {
            res.status(202).json({userAlreadyJoinGroup: true})
        } else {
            userFound.joinRoom.push(groupFound._id);
            userFound.save();
            res.status(202).json({userJoinGroup: true, joinGroup: groupFound});
        }

    } else {
        res.status(404).json({isGroupFound: false})
    }
}
