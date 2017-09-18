/**
This module contains two functions, getIntent to generate intent and getResponse to send response to index.js
Author: Siddharth Kothari 
Date: 7th July, 2017
**/
 
var jsonfile = require('jsonfile'); // Library to read json files
var preProcessor = require('./string-preprocessor'); // Input preprocessor module
var string = require('string'); // String functions such as .replaceAll
var natural = require('natural'); // Language processing library

const SEARCH_SENSITIVITY = 1; // Lower value = more accurate. 
const PATH = "./";


const intentFilename = PATH + "primary_intent.json"; 
const responseFilename = PATH + "response.json";


/**
Function returns an intent by taking in user id, message and type. Intent is returned in #intent form
Type changes the file to look for intents in
Returns a json object 
{
	"userId": userId,
	"intent": intent
}
**/

exports.getIntent = function(userId, message) {
	let temp = null;
	let previousValue = 9999; // Arbitrary large value
	let currentValue = null;
	let file_not_found = false;

	// Change the file name according to type of message
	let msg_temp = preProcessor.preprocessString(message);

	try{
		var obj = jsonfile.readFileSync(intentFilename);
	}
	catch(err) {
		console.log("Error opening "+fileName+ " file: "+err);
		obj = undefined;
	}

	if(obj != undefined) {
		for(i=0; i<obj.length; i++) {
			for(j=0; j<obj[i].keyword.length; j++) {
				currentValue = natural.LevenshteinDistance(obj[i].keyword[j], msg_temp);

				if(currentValue < previousValue && currentValue <= SEARCH_SENSITIVITY) {
					temp = obj[i];
				}
				else {
					continue;
				}
				previousValue = currentValue;
			}
		}
	}
	else {
		file_not_found = true;
	}

	if(temp != undefined && file_not_found == false) {
		return ({
			"userId":userId,
			"intent":temp.intent
		});
	}
	else if(file_not_found == true) {
		return ({
			"userId":userId,
			"intent":"file_not_found"
		});
	}
	else {
		return ({
			"userId":userId,
			"intent":"undefined"
		});
	}
};

/**
Function returns a response by taking in intent and first name
Returns a string response.
**/

exports.getResponse = function(intent, firstName) {
	let response;
	let found = false;
	try {
		var obj = jsonfile.readFileSync(responseFilename);
	}
	catch(err) {
		console.log("Error opening file: "+err);
		obj = undefined;
	}
	
	if(obj != undefined && intent != "undefined") {
		for(let i=0;i<obj.length;i++) {
			if(intent == obj[i].intent) {
				response = string(obj[i].response).replaceAll('<name>',firstName).s;
				found = true;
			} 
		}

		if(found == true) {
			return response;
		}
		else {
			return "Sorry "+firstName+" I do not have an answer to this question yet. We will get back to you shortly";
		}
	}
	else if(intent == "undefined") {
		return "Sorry "+firstName+" I do not have an answer to this question yet. We will get back to you shortly";
	}
	else {
		return "Sorry "+ firstName + ", our servers are not functioning now, please ask your question a little later";
	}
};




