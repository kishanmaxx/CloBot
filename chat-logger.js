/**
This is a module that logs messenger chats in text files with the title log_userID.txt
Author:Siddharth Kothari 
Date: 6 July,2017
**/

var fs = require('fs');
var dateFormat = require('dateformat');

const LOG_PATH = "./logs/";
const CUSTOMER_PATH = "./customer_queries/";

/**
Function to create a new file "log_senderId.txt"
Takes three parameters senderId, message and options (option_user,option_bot) and stores date, sender ID and message in txt file
**/

exports.writeToLogFile = function(senderId, message, option) {
	let filename = LOG_PATH + "log_" + senderId + ".txt";
	let now = new Date();
	let currentTimeStamp = dateFormat(now, "dddd, mmmm dS, yyyy, h:MM:ss TT");
	let msg = currentTimeStamp + " " + option + ": " + message + '\n';
	

	fs.appendFile(filename, msg, function(err) {
		if(err) {
			console.log(senderId + " :" + "Message not logged: " + err);
		}
	});
};

exports.writeToCustomerLogFile = function(senderId, message) {
	let filename = CUSTOMER_PATH + "query_" + senderId + ".txt";
	let now = new Date();
	let currentTimeStamp = dateFormat(now, "dddd, mmmm dS, yyyy, h:MM:ss TT");
	let msg = currentTimeStamp + ":" + message + '\n';


	fs.appendFile(filename, msg, function(err) {
		if(err) {
			console.log(senderId + " :" + "Query not logged: " + err);
		}
	});
};




