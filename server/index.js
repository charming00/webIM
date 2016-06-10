var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');

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
	
	//监听新用户加入
	socket.on('register', function(obj){
		//将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
		var selectSQL = 'select * from user where user_name = "' + obj.username + '"';
		console.log(selectSQL);
		var insertSQL = 'insert into user(user_name, user_passwd) values("' + obj.username + '" , "' + obj.passwd + '")';
		conn.query(selectSQL, function (err1, res1) {
			if (err1) {
				console.log(err1);
			}
        	console.log("Select Return ==> ");
        	if (res1.length == 0 ) {
        		console.log("null");
        		conn.query(insertSQL, function (err2, res2) {
        			console.log("Insert Return ==> ");
        			socket.emit("login", "注册成功");
        		});
        	} else {
        		console.log(res1);
        		console.log("用户名已存在");
        	}
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


	socket.on('login', function(obj){
		//将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
		var selectSQL = 'select * from user where user_name = "' + obj.username + '" and user_passwd = "' + obj.passwd + '"' ;
		console.log(selectSQL);
		var insertSQL = 'insert into user(user_name, user_passwd) values("' + obj.username + '" , "' + obj.passwd + '")';
		conn.query(selectSQL, function (err1, res1) {
			if (err1) {
				console.log(err1);
			}
        	console.log("Select Return ==> ");
        	if (res1.length == 0 ) {
        		socket.emit("login", "error");
        	} else {
        		console.log(res1);
        		socket.emit("login", "succeed");
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
		io.emit('message', obj);
		console.log(obj.username+'说：'+obj.content);
	});
  
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});