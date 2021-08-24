const express = require('express');
const app= express()
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');


const groupRoute = require('./router/group')
const messageRoute = require('./router/message')
const authRoute = require('./router/auth');
const userRoute = require('./router/user');
const privateRoute = require('./router/private')

app.use(bodyParser.urlencoded({extended:false}));
app.use(express.json());

let users = [];


app.use(helmet());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'OPTIONS, GET, POST, PUT, PATCH, DELETE'
    );
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/message',messageRoute);
app.use('/group',groupRoute);
app.use('/private',privateRoute);
app.use('user',userRoute)
app.use('/auth', authRoute);
app.use('/',(req,res,next)=>{
    res.status(200).json({message:'Server is Working...'});
    next()
})

io.on('connection',function (socket){
    console.log('Connected to Server Socket');
    console.log('Connected Socket ID',socket.id)

    socket.on('user_connected',(userName)=>{
        if(!users[userName]){
            users[userName] = socket.id;
            socket.userName = userName
        }
        console.log('userconnected',users)
        io.emit('user_connected',users);
    });

    //Room Chat
    socket.on('join',({groupId})=>{
        socket.join(groupId);
    });

    socket.on('sendGroupMsg',({ groupId,message,userName})=>{
        socket.in(groupId).emit('groupMsg', {userName, message,groupId})
    });

    //PrivateChat
    socket.on('send_message',function (data){
        let sockedId = users[data.receiver];
        socket.to(`${sockedId}`).emit('new_message',{userName:data.sender,message:data.message})
    });

    socket.on('disconnect',function (){
        delete users[socket.userName];
        console.log('disconnect', socket.id)
        io.emit('user_connected',users);
    })
});


mongoose.connect(`mongodb+srv://${process.env.USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.sa7i5.mongodb.net/chat?retryWrites=true&w=majority`,{
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(done=>{
    console.log('Connected')
    server.listen(process.env.PORT||5000);
})
