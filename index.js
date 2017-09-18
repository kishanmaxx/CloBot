/**
This is the entry point of the chatbot. Uses botly framework to communicate with Facebook's SEND API
Author: Siddharth Kothari 
Date: 20th July, 2017
**/

const express = require('express');
const Botly = require('botly');
const bodyParser = require('body-parser');
const responseBuilder = require('./response-builder');
const {Wit, log} = require('node-wit');
const string = require('string');
const chatLogger = require('./chat-logger');

const PORT = 8080;

const VERIFY_TOKEN = 'hello_world';
const ACCESS_TOKEN = 'EAAbl95X5pnUBAKuuxi9Ih3a72jYfGNcbkxmm4uWlQZAyDDkZBE3IFj1BV7CvOhyfAwmCvsozpF8ggsnrZCgF33FjTdZAkxMhW8JqQVcZBBdkYf6gYIy7SpV7IKYIb4itUG2GTTbm4MDdK9dO18cam5AeL06ZCHUcoUS6H50KRxtwZDZD';
const PAGE_ID = '459797351067495';
const APP_SECRET = 'fe3036c9638717f0176c263e6bd041a1';
const WIT_ACCESS_TOKEN = 'CZILV4RDAVKOEFL67M537IK726M4DGZ2'; //Access token for CloBot app

var nextState = [];	// Array to store userId-nextState pair
var previousState = []; // Array to store userId-previousState pair
var userName = []; //Array to store userId-userName pair 
var selectionCategory = [];	// Array to store userId-firstName pair

//List of states 
const welcome_state = "welcome";
const employee_state = "employee";
const non_employee_state = "non employee";
const get_query_state = "get query";
const display_response_state = "display query";
const anything_else_state = "anything else";
const goodbye_state = "goodbye";
const customer_service_state = "customer service";
const cannot_understand_state = "undefined";
const server_error_state = "server error";
const help_state = "help";
const get_customer_query_state = "customer query";
const display_customer_response_state = "customer response";
const get_email_state = "email";

//List of categories 
const finance_category = "finance";
const people_category = "people";
const job_category ="job";
const customer_category = "customer";

// Create new instance of Botly with FB developer credentials
const botly = new Botly({
	accessToken: ACCESS_TOKEN,  
 	verifyToken: VERIFY_TOKEN, 
 	webhookPath: '/',
 	notificationType: Botly.CONST.REGULAR  
});

const witClient = new Wit ({
	accessToken: WIT_ACCESS_TOKEN,
	logger: new log.Logger(log.INFO)
});

botly.on("message", function(senderId, message, data) {

	//Set typing indicator to on
	botly.sendAction({"id": senderId, "action": "typing_on"});

	//Log the message as soon as the user sends it
	chatLogger.writeToLogFile(senderId, data.text, "User");

	console.log("Message from:"+senderId);
	
	//Get the primary intent
	let intentObject = responseBuilder.getIntent(senderId,data.text,responseBuilder.FILENAME_PRIMARY_INTENT);

	//Set previous state
	setPreviousState(senderId,getNextState(senderId));

	//Determine the next state
		if(getNextState(senderId) == null) {
			setNextState(senderId, welcome_state);
		}
		
		if(intentObject.intent == "restart") {
			setNextState(senderId, welcome_state);
		}

		if(intentObject.intent == "get_started" && getPreviousState(senderId) != get_query_state || intentObject.intent == "greeting" && getPreviousState(senderId) != get_query_state) {
			setNextState(senderId, welcome_state);
			setPreviousState(senderId, null);
		}

		if(intentObject.intent == "employee" && getPreviousState(senderId) == welcome_state) {
			setNextState(senderId, employee_state);
		}

		if(intentObject.intent == "non_employee" && getPreviousState(senderId) == welcome_state) {
			setNextState(senderId, non_employee_state);
		}

		if(intentObject.intent == "undefined") {
			setNextState(senderId, cannot_understand_state);
		}

		if(intentObject.intent == "goodbye") {
			setNextState(senderId, goodbye_state);
		}

		if(intentObject.intent == "customer_service" && getPreviousState(senderId) != get_query_state) {
			setNextState(senderId, customer_service_state);
		}

		if(intentObject.intent == "finance" && getPreviousState(senderId) == employee_state) {
			setNextState(senderId, get_query_state);
			selectionCategory[senderId] = finance_category;
		}

		if(intentObject.intent == "people" && getPreviousState(senderId) == employee_state) {
			setNextState(senderId, get_query_state);
			selectionCategory[senderId] = people_category;
		}

		if(intentObject.intent == "job" && getPreviousState(senderId) == non_employee_state) {
			setNextState(senderId, get_query_state);
			selectionCategory[senderId] = job_category;
		}

		if(intentObject.intent == "customer" && getPreviousState(senderId) == non_employee_state) {
			setNextState(senderId, get_customer_query_state);
			selectionCategory[senderId] = customer_category;
		}

		if(intentObject.intent == "file_not_found") {
			setNextState(senderId, server_error_state);
		}

		if(getPreviousState(senderId) == get_query_state && intentObject.intent != "restart") {
			setNextState(senderId, display_response_state);
		}

		if(getPreviousState(senderId) == get_customer_query_state && intentObject.intent != "restart") {
			//Save the customer category query in a text file
			chatLogger.writeToCustomerLogFile(senderId, data.text);
			setNextState(senderId, get_email_state);
		}

		if(getPreviousState(senderId) == get_email_state) {
			//Save the customer email in a text file 
			chatLogger.writeToCustomerLogFile(senderId, data.text);
			setNextState(senderId, display_customer_response_state);
		}

		if(intentObject.intent == "yes" && getPreviousState(senderId) == anything_else_state) {
			if(selectionCategory[senderId] != customer_category) {
				setNextState(senderId, get_query_state);
			}
			else {
				setNextState(senderId, get_customer_query_state);
			}
		}

		if(intentObject.intent == "no" && getPreviousState(senderId) == anything_else_state) {
			setNextState(senderId, goodbye_state);
			selectionCategory[senderId] = null;
		}

		if(intentObject.intent == "help" && getPreviousState(senderId) != get_query_state) {
			setNextState(senderId, help_state);
		}


	//Deal with next state here
	switch(getNextState(senderId)) {
		case welcome_state:
			sendWelcomeText(senderId);
			break;
		case customer_service_state:
			sendCustomerServiceButton(senderId);
			break;
		case employee_state:
			sendEmployeeText(senderId);
			break;
		case non_employee_state:
			sendNonEmployeeText(senderId);
			break;
		case cannot_understand_state:
			sendCannotUnderstandText(senderId);
			switch(getPreviousState(senderId)) {
				case welcome_state:
					sendWelcomeText(senderId);
					setNextState(senderId, welcome_state);
					break;
				case employee_state:
					sendEmployeeText(senderId);
					setNextState(senderId, employee_state);
					break;
				case non_employee_state:
					sendNonEmployeeText(senderId);
					setNextState(senderId, non_employee_state);
					break;
				case anything_else_state:
					sendAnythingElseText(senderId);
					setNextState(senderId, anything_else_state);
					break;
			}
			break;
		case get_query_state:
			sendGetQueryText(senderId);
			break;
		case get_customer_query_state:
			sendGetCustomerQueryText(senderId);
			break;
		case get_email_state:
			sendGetEmailText(senderId);
			break;
		case display_response_state:
			sendResponseText(senderId, data.text);
			break;
		case display_customer_response_state:
			sendCustomerResponseText(senderId);
			break;
		case goodbye_state:
			sendGoodbyeText(senderId);
			break;
		case server_error_state:
			sendServerErrorText(senderId);
			break;
		case help_state:
			sendHelpText(senderId);
			break;
	}

});



// Function to emit a 'message' event so every postback can be treated as a message
botly.on("postback", function(senderId,message,postback) {
	botly.emit("message", senderId, null, {"text":postback});
});


// Function to set the "get started" button for first time users;
botly.setGetStarted({pageId: PAGE_ID, payload: "Get started"});


// Function to send greeting text
var sendWelcomeText = function(senderId, message) {
	let msg;
	let firstName = null;

	botly.getUserProfile(senderId, function(err, info) {
			if(info != undefined) {
				msg = "Hello, "+info.first_name+" I am CloBot. I am designed to answer any questions you may have. To restart, type 'Restart'. But first, are you a Clover employee or a non-employee?";
				firstName = info.first_name;
			}
			else {
				msg = "Hello, I am CloBot. I am designed to answer any questions you may have. To restart, type 'Restart'. But first, are you a Clover employee or a non-employee?";
			}

		botly.sendText({id:senderId, text: msg, quick_replies: welcome_quickReply}, function(err, data) {
			if(data) {
				chatLogger.writeToLogFile(senderId, msg, "CloBot");
				botly.sendAction({"id": senderId, "action": "typing_off"});
			}
		});
		setName(senderId,firstName);
	});
};

// Function to send text when user is an employee
var sendEmployeeText = function(senderId) {
	let msg = "Your question belongs to what category? \n1) Finance/Payroll \n2) People(HR)";

	botly.sendText({id:senderId, text: msg, quick_replies: employee_quickReplies}, function(err, data) {
		if(data) {
			chatLogger.writeToLogFile(senderId, msg, "CloBot");
			botly.sendAction({"id": senderId, "action": "typing_off"});
		}
	});
};

// Function to send text when user is not an employee
var sendNonEmployeeText = function(senderId) {
	let msg = "Who would you describe yourself as? \n1) Customer \n2) Job Seeker/Student";

	botly.sendText({id:senderId, text: msg, quick_replies: nonEmployee_quickReplies}, function(err, data) {
		if(data) {
			chatLogger.writeToLogFile(senderId, msg, "CloBot");
			botly.sendAction({"id": senderId, "action": "typing_off"});
		}
	});
};

// Function sends a response if chatbot cannot understand input
var sendCannotUnderstandText = function(senderId) {
	let firstName = getName(senderId);
	let msg;

	if(firstName != null) {
		msg = "Sorry "+firstName+", I could not understand";
	}
	else {
		msg = "Sorry, I could not understand";
	}

	botly.sendText({id:senderId, text: msg, quick_replies:restart_quickReplies}, function(err,data) {
		if(data) {
			chatLogger.writeToLogFile(senderId, msg, "CloBot");
			botly.sendAction({"id": senderId, "action": "typing_off"});
		}
	});
};

// Function to send a response when user selects category from non-employee list
var sendGetQueryText = function(senderId) {
	let msg = "What is your query?";

	botly.sendText({id: senderId, text: msg, quick_replies: restart_quickReplies}, function(err, data) {
		if(data) {
			chatLogger.writeToLogFile(senderId, msg, "CloBot");
			botly.sendAction({"id": senderId, "action": "typing_off"});
		}
	});
};

var sendGetCustomerQueryText = function(senderId) {
	let msg = "Please let me know your query";

	botly.sendText({id: senderId, text: msg, quick_replies: restart_quickReplies}, function(err, data) {
		if(data) {
			chatLogger.writeToLogFile(senderId, msg, "CloBot");
			botly.sendAction({"id":senderId, "action": "typing_off"});
		}
	});
}

var sendGetEmailText = function(senderId) {
	let msg = "Please enter your email address";

	botly.sendText({id: senderId, text: msg}, function(err, data) {
		if(data) {
			chatLogger.writeToLogFile(senderId, msg, "CloBot");
			botly.sendAction({"id": senderId, "action": "typing_off"});
		}
	})
}

//Function to ask user if chatbot can help with anything else
var sendAnythingElseText = function(senderId) {
	let msg;

	if(getName(senderId) != null) {
		msg = "Would you like to know anything else "+getName(senderId)+"? (Yes/No)";
	}
	else {
		msg = "Would you like to know anything else? (Yes/No)";
	}
	

	botly.sendText({id: senderId, text: msg, quick_replies: anythingElse_quickReplies}, function(err, data) {
		if(data) {
			chatLogger.writeToLogFile(senderId, msg, "CloBot");
			botly.sendAction({"id": senderId, "action": "typing_off"});
		}
	});
};

// Function sends a button to call customer service
var sendCustomerServiceButton = function(senderId) {
	let number = "+91 22 29261650"; //Mumbai office number
	let firstName = getName(senderId);
	let msg;
	if(firstName != null) {
		msg = "We will be happy to help you "+firstName;
	} 
	else {
		msg = "We will be happy to help you";
	}
	botly.sendButtons({id: senderId, text: msg, buttons: [{type: "phone_number", title: "Call Representative", payload: number}]}, function(err,data) {
		if(data) {
			chatLogger.writeToLogFile(senderId, msg, "CloBot");
			botly.sendAction({"id": senderId, "action": "typing_off"});
		}
	});
};

// Function to send a goodbye message 
var sendGoodbyeText = function(senderId) {
	let msg = "Goodbye, I hope I could help you!";

	botly.sendText({id:senderId, text: msg, quick_replies: hello_quickReplies}, function(err, data) {
		if(data) {
			chatLogger.writeToLogFile(senderId, msg, "CloBot");
			botly.sendAction({"id": senderId, "action": "typing_off"});
		}
	});
};


// Function to send a response to the query by getting intent from wit.ai
var sendResponseText = function(senderId, input) {
	let finalIntent,msg,response;

	witClient.message(input, {}).then((data) => {

		if (getFirstEntityFromWit(data, "intent") != undefined) {
			finalIntent = getFirstEntityFromWit(data, "intent")+" "+getFirstEntityFromWit(data, "sub_intent");
		}
		else {
			finalIntent = "undefined";
		}
	
		//Get rid of all whitespaces from finalIntent using string(finalIntent).trim().s
		response = responseBuilder.getResponse(string(finalIntent).trim().s, getName(senderId));

		if(response == undefined) {
			sendServerErrorText(senderId);
		}
		else {
			botly.sendText({id: senderId, text: response}, function(info, data) {
				if(data) {
					chatLogger.writeToLogFile(senderId, response, "CloBot");
					botly.sendAction({"id": senderId, "action": "typing_off"});
					setNextState(senderId, anything_else_state);
					sendAnythingElseText(senderId);
				}
			});
		}
	}).catch(console.error);	
};

var sendCustomerResponseText = function(senderId) {
	let msg  = "Thank you, our customer service professional will address your query as soon as possible";

	botly.sendText({id: senderId, text: msg}, function(info,data) {
		if(data) {
			chatLogger.writeToLogFile(senderId, msg, "CloBot");
			botly.sendAction({"id":senderId, "action":"typing_off"});
			setNextState(senderId, anything_else_state);
			sendAnythingElseText(senderId);	
		}	
	});
};

//Function to send an error message to user
var sendServerErrorText = function(senderId) {
	let msg = "Sorry, our servers are currently down. Please try again later";
	botly.sendText({id: senderId, text: msg}, function(err, data) {
		if(data) {
			chatLogger.writeToLogFile(senderId, msg, "CloBot");
			botly.sendAction({"id": senderId, "action": "typing_off"});
		}
	});
};

//Function to send help message to user
var sendHelpText = function(senderId) {
	let msg = "I can help answer any query you may have. I may not understand everything so you can always ask me for our customer service number!";

	botly.sendText({id: senderId, text: msg, quick_replies: help_quickReplies}, function(err, data) {
		if(data) {
			chatLogger.writeToLogFile(senderId, msg, "CloBot");
			botly.sendAction({"id": senderId, "action": "typing_off"});
		}
	});
};

// Function to extract an entity from wit.ai response. Takes response object as parameter
var getFirstEntityFromWit = function(data, entity) {
	
	if(Array.isArray(data.entities["intent"])) {
		//Intent is present, return the value of the intent
			if(data.entities[entity] != undefined && data.entities[entity][0].suggested == undefined) {
				//Entity is present and the entity is not suggested by wit. Return the value
					return data.entities[entity][0].value;
			}
			else {
				//The entity is not present, return empty string.
				return "";
			}
	}
	else {
		//Intent is not present, return undefined
		return undefined;
	}
};

// Getter and setter functions for next state and previous state
var setPreviousState = function(senderId, state) {
	previousState[senderId] = state;
};

var getPreviousState = function(senderId) {
	return previousState[senderId];
};

var setNextState = function(senderId, state) {
	nextState[senderId] = state;
};

var getNextState = function(senderId) {
	return nextState[senderId];
};

// Function to set name
var setName = function(senderId, firstName) {
	userName[senderId] = firstName;
};

var getName = function(senderId) {
	return userName[senderId];
};

// Create quick replies
var welcome_quickReply = [];
welcome_quickReply.push(botly.createQuickReply("Employee","Employee"));
welcome_quickReply.push(botly.createQuickReply("Non-Employee","Non Employee"));

var employee_quickReplies = [];
employee_quickReplies.push(botly.createQuickReply("Finance/Payroll","Finance"));
employee_quickReplies.push(botly.createQuickReply("People(HR)","People"));
employee_quickReplies.push(botly.createQuickReply("Restart","Restart"));

var nonEmployee_quickReplies = [];
nonEmployee_quickReplies.push(botly.createQuickReply("Customer","Customer"));
nonEmployee_quickReplies.push(botly.createQuickReply("Job Seeker/Student","Job Seeker"));
nonEmployee_quickReplies.push(botly.createQuickReply("Restart","Restart"));

var restart_quickReplies = [];
restart_quickReplies.push(botly.createQuickReply("Restart","Restart"));

var help_quickReplies = [];
help_quickReplies.push(botly.createQuickReply("Customer Service", "Customer Service"));
help_quickReplies.push(botly.createQuickReply("Restart", "Restart"));

var hello_quickReplies = [];
hello_quickReplies.push(botly.createQuickReply("Hello","Hello"));

var anythingElse_quickReplies = [];
anythingElse_quickReplies.push(botly.createQuickReply("Yes","Yes"));
anythingElse_quickReplies.push(botly.createQuickReply("No","No"));

var app = express();
app.use(bodyParser.json());
app.use("/webhook",botly.router());
app.listen(PORT);
console.log("CloBot started on port "+PORT);

