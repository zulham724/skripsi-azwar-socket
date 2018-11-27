// import libraries
var gpio = require('onoff').Gpio;
// lampu
var led = new gpio(21,'out');
// led.writeSync(1);
// front motor
var pin2 = new gpio(2,'in'); 
var pin3 = new gpio(3,'in'); 
var pin5 = new gpio(5,'in');
var pin6 = new gpio(6,'in');

// back motor

// ===============================
var Pusher = require('pusher-client');
var pusher = new Pusher('2dddb6b3158434b9c126',{
  cluster: 'ap1'
});
// ===============================
var request = require('request');
var sizeof = require('object-sizeof');
var os = require('os-utils');
// ===============================
// declare global variable
var url = "http://skripsi-azwar.ardata.co.id/";
var token = null;
var bandwidth = 0;
var cpuUsage = 0;
var memoryUsage = 0;

module.exports = {
	get: function(req,res) {
		// do something
		console.log('please wait passport security on proccess');
		
		setInterval(()=>{
			os.cpuUsage(val=>{
				cpuUsage = val;
			});
		},1000);
		
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
				console.log('now we will listen on our single channel of connection...');
				token = body.access_token;
			});
		});
		
		var channel = pusher.subscribe('skripsi-data');
		
		channel.bind('App\\Events\\DataPusherEvent', function(data) {
			
			var date = new Date();  	
			
			bandwidth += sizeof(data);
			memoryUsage = os.totalmem() - os.freemem();
			 			
			console.log('New data recieved at ',date.toString(),' with : ',data,'\n','estimate bandwidth used : ',bandwidth,' Bytes\n','estimate cpu usage : ',cpuUsage,'%\n','estimate memory used : ',memoryUsage,' Bytes\n');
			
			if (data.message == 'forward') {
				pin2 = new gpio(2,'out'); 
				pin3 = new gpio(3,'in'); 
				pin5 = new gpio(5,'out');
				pin6 = new gpio(6,'in');
				led.writeSync(1);
			} else if(data.message == 'stop'){
				pin2 = new gpio(2,'in'); 
				pin3 = new gpio(3,'in'); 
				pin5 = new gpio(5,'in');
				pin6 = new gpio(6,'in');
				led.writeSync(0);
			}
			
			console.log('\ndata will sent to server again, please wait...\n');
			
			callback(data,date);
			
		});
		
		
		 
		res.render('index', { title: 'Skripsi Transmisi Data' });
	}
}


function callback(data,date){
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
			date:date.toLocaleString(),
			bandwidth_usage:bandwidth,
			cpu_usage:cpuUsage,
			memory_usage:memoryUsage
		}
	},function(err,resp,body){
		console.log('result :\n',body,'\n\n');
	});
}
