/**
This file contains functions to preprocess and remove stop words from input string for the chatbot program 
Author:Siddharth Kothari 
Date: 6 July, 2017
**/


/**
Function to check for illegal characters. 
Returns true if illegal character found else false.
Takes single character as input.
**/
var uc = require('upper-case');
var str = require('string');

const illegalCharArray = ["!","@","#","$","%","^","&","*","(",")",",",";",":","[","]","<",">","/","|","~","`","."];

function isIllegalChar(char) {
	let i;
	let flag = false;
	for(i=0; i<illegalCharArray.length; i++) {
		if(illegalCharArray[i] == char) {
			flag = true;
		}
	}
	return flag;
};

/**
Public function to eliminate extra whitespace and illegal characters.
Takes a string as input.
Returns a upper-case string output without whitespace and illegal characters.
**/

exports.preprocessString=function(string) {
	let temp = "";
	let previousChar = null;
	let currentChar = null;
	let i;
	let str = uc(string);

	for(i=0; i<str.length; i++) {
		currentChar = str.charAt(i);
		if(!isIllegalChar(currentChar) && currentChar != " ") {
			temp += currentChar;
		}
		else if(previousChar == " " && currentChar == " ") {
			continue;
		}
		else if(currentChar == " " && previousChar != " "){
			temp += " ";
		}
		else {
			continue;
		}
		previousChar = currentChar;
	}
	return temp;
	
};

