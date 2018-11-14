// import libraries
var gpio = require('onoff').Gpio;
var pin2 = new gpio(2,'out');
// ===============================
var Pusher = require('pusher-client');
var pusher = new Pusher('2dddb6b3158434b9c126',{
  cluster: 'ap1'
});
// ===============================
var request = require('request');
// ===============================
// declare global variable
var url = "http://skripsi-azwar.ardata.co.id/";
var token = null;

module.exports = {
	get: function(req,res) {
		// do something
		console.log('please wait passport security on proccess');
		request.get({url:url+'api/clients/2',json:true},function(err,resp,body){
			console.log('secret client ready! \n\n',body.secret,'\n\n');
			request.post({
				url:url+'oauth/token',
				json:true,
				body:{
					grant_type:'password',
					client_id:'2',
					client_secret:body.secret,
					username:'admin@admin.com',
					password:'password'
				}
			},function(err,res,body){
				console.log('token ready! \n\n',body.access_token,'\n\n\n');
				token = body.access_token;
			});
		});
		
		var channel = pusher.subscribe('skripsi-data');
		
		channel.bind('App\\Events\\DataPusherEvent', function(data) {
			
			var date = new Date();  	
			 			
			console.log('data recieved at ',date.toString(),' with data ',data);
			
			if (data.message == 'forward') {
				pin2.writeSync(1);
			} else if(data.message == 'stop'){
				pin2.writeSync(0);
			}
			
			console.log('\ndata will sent to server again, please wait...\n');
			
			request.post({
				url:url+'api/sockets',
				json:true,
				headers:{
					Accept:'application/json',
					Authorization:'Bearer '+token
				},
				body:{
					user_id:1,
					value:data.message,
					date:date.toLocaleString()
				}
			},function(err,resp,body){
				console.log('result :\n',body);
			});
			
		});
		 
		res.render('index', { title: 'Skripsi Transmisi Data' });
	}
}
