const bcrypt = require('bcryptjs');
const User = require('../models/user');
const jwt = require ('jsonwebtoken');
const {validationResult} = require('express-validator');

exports.signUp = async (req, res, next) => {
    const userName = req.body.userName;
    const email = req.body.email;
    const password = req.body.password;

    const invalidInput = validationResult(req);

    if(!invalidInput.isEmpty()){
        console.log('signup',invalidInput)
        res.status(422).json({invalidInput:invalidInput})
    }else {
        const foundUser = await User.findOne({email:email});

        if(foundUser){
            res.status(422).json({signUpError: true ,emailExist: true , message:'Email already exit!'})
        }else {
            bcrypt
                .hash(password,12)
                .then(hashedPw => {
                    const user = new User({
                        userName: userName,
                        email: email,
                        password: hashedPw
                    });
                    return user.save();
                })
                .then(result => {
                    res.status(201).json({signUpError: false,userCreated: true,message:'User Created'})
                })
        }
    }
}

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const invalidInput = validationResult(req);

    if(!invalidInput.isEmpty()){
        console.log('login',invalidInput)
        res.status(422).json({invalidInput:invalidInput})
    }

    let loadedUser;

    User.findOne({email: email})
        .then(user => {
            loadedUser = user;
            return bcrypt.compare(password, user.password)
        })
        .then(isEqual => {
            if (!isEqual) {
                res.status(422).json({loggingError:true, passwordIsIncorrect: true, message: 'Password Incorrect!'})
            }else {
                const token = jwt.sign(
                    {
                        email: loadedUser.email,
                        userId: loadedUser._id.toString()
                    },
                    'OnePiece',
                    {expiresIn: '1h'}
                );
                res.status(200).json({
                    loggingError:false,
                    message:'Logging Successfully',
                    token: token,
                    userId: loadedUser._id,
                    userName:loadedUser.userName,
                    userEmail:loadedUser.email,
                    profileImageUrl:loadedUser.profileImageUrl
                });
            }
        }).catch(err=>{
        res.status(422).json({loggingError:true,emailNotFound: true,message: 'Email not found!'})
    })
}
