var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');
var crypto = require("crypto");  

var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'chengming133',
    database: 'bs'
});
conn.connect();


// var insertSQL = 'insert into user(user_name, user_passwd) values("name", "password")';
// var selectSQL = 'select * from user where user_name = "haha"';
// conn.query(selectSQL, function (err1, res1) {
//         if (err1) console.log(err1);
//         console.log("INSERT Return ==> ");
//         if (res1 = null ) {
//         	console.log("null");
//         };
//         console.log(res1);
// });

app.get('/', function(req, res){
	res.send('<h1>Welcome Realtime Server</h1>');
});

//在线用户
var onlineUsers = {};
//当前在线人数
var onlineCount = 0;

io.on('connection', function(socket){
	
	//监听注册
	socket.on('register', function(obj){

		// console.log("aa" > "bb");
		//将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
		var selectSQL = 'select * from user where user_name = "' + obj.username + '" or user_email = "' + obj.email + '"';
		// var selectSQL = 'select user_name from user where 1';
		console.log(selectSQL);

		var md5Passwd = crypto.createHash("md5").update(obj.passwd).digest("hex");
		console.log(md5Passwd);

		var insertSQL = 'insert into user(user_email, user_name, user_passwd) values("' + obj.email + '" , "' + obj.username + '" , "' + md5Passwd + '")';

		var registerResult = {};

		conn.query(selectSQL, function (err1, res1) {
			if (err1) {
				console.log(err1);
			}
        	console.log("Select Return ==> ");

        	if (res1.length == 0 ) {
        		console.log("null");
        		conn.query(insertSQL, function(err2, res2) {
        			console.log("insert succeed!");
        			registerResult["result"] = "succeed";
        			if (err2) {
        				console.log("insert error!");
        				registerResult["result"] = "error";
        			};
        			socket.emit("register", registerResult);
        		});
        	} else {
        		console.log(res1);
        		registerResult["result"] = "error";
        		socket.emit("register", registerResult);
        	}
        	socket.emit("register", registerResult);
        });

		// socket.name = obj.userid;
		
		// var obj = {
		// 			userid: "cm",
		// 			username: "username",
		// 			content: "content"
		// 		};

		// socket.emit("message", obj);



		// //检查在线列表，如果不在里面就加入
		// if(!onlineUsers.hasOwnProperty(obj.userid)) {
		// 	onlineUsers[obj.userid] = obj.username;
		// 	//在线人数+1
		// 	onlineCount++;
		// }
		
		// //向所有客户端广播用户加入
		// io.emit('login', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
		// console.log(socket.name+'加入了聊天室');
	});

	// 监听登录
	socket.on('login', function(obj){
		//将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
		var md5Passwd = crypto.createHash("md5").update(obj.passwd).digest("hex");
		console.log(md5Passwd);
		var selectSQL = 'select * from user where user_name = "' + obj.username + '" and user_passwd = "' + md5Passwd + '"' ;
		var selectFriendSQL = 'select * from friend where user1 = "' + obj.username + '" or user2 = "' + obj.username + '"';
		console.log(selectSQL);
		var loginResult = {};
		var friend = [];
		conn.query(selectSQL, function (err1, res1) {
			if (err1) {
				console.log(err1);
			}
        	console.log("Select Return ==> ");
        	if (res1.length == 0 ) {
        		console.log("login error");
        		loginResult["result"] = "error";
        		socket.emit("login", loginResult);
        	} else {
        		console.log(res1);
        		loginResult["result"] = "succeed";
        		console.log(obj.username + "socket succeed");
        		onlineUsers[obj.username] = socket;
        		conn.query(selectFriendSQL, function (err2, res2) {
        			if (err2) {
        				console.log(err2);
        			} else {
        				console.log(res2);
        				for (var i = 0; i < res2.length; i++) {
        					if (res2[i].user1 == obj.username) {
        						friend.push(res2[i].user2);
        					} else {
        						friend.push(res2[i].user1);
        					}
        				};
        				console.log(friend);
        				loginResult["friend"] = friend;
        				socket.emit("login", loginResult);
        			}
        		});
        	}
        	
        });
	});

	//监听用户退出
	socket.on('disconnect', function(){
		//将退出的用户从在线列表中删除
		if(onlineUsers.hasOwnProperty(socket.name)) {
			//退出用户的信息
			var obj = {userid:socket.name, username:onlineUsers[socket.name]};
			
			//删除
			delete onlineUsers[socket.name];
			//在线人数-1
			onlineCount--;
			
			//向所有客户端广播用户退出
			io.emit('logout', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
			console.log(obj.username+'退出了聊天室');
		}
	});
	
	//监听用户发布聊天内容
	socket.on('message', function(obj){
		//向所有客户端广播发布的消息
		// io.emit('message', obj);
		if (onlineUsers[obj.to]) {
			console.log(onlineUsers);
			console.log(obj.to);
			var toSocket = onlineUsers[obj.to];
			toSocket.emit('message', obj);
		} else {
			console.log("不在线");
		}
		console.log(obj);
	});
  
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
