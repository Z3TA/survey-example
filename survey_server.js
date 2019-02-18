/*
	
	A server for receving survey posts
	
	
*/


var mysql2 = require("mysql2");
var DB = mysql.createConnection({
	user: process.env.myName,
	socketPath: '/sock/mysql',
	authSwitchHandler: true, // Need to be true:ish
	database: "my_survey_database" // Change this to the name of your database!
});

var http = require("http");
http.createServer(handleHttpRequest).listen("/sock/survey");

function handleHttpRequest(request, response) {
	var answersToSave = 0;
	var answersSaved = 0;
	var surveyName = "";
	var ipAddr = request.headers["x-real-ip"] || request.connection.remoteAddress;
	var abort = false;
	
	console.log("Request to " + request.url + " from " + ipAddr);
	
	if (request.method == "POST") {
		var body = "";
		
		request.on("data", function requestData(data) {
			body += data;
			
			// Too much POST data, kill the connection!
			// 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
			if (body.length > 1e6) request.connection.destroy();
		});
		
		request.on("end", function requestEnd() {
			var qs = require("querystring");
			var post = qs.parse(body);
			
			console.log(JSON.stringify(post, null, 2); 
			
			surveyName = post["survey_name"];
			
			DB.execute("INSERT INTO participant (ip) VALUES(?)", [ipAddr], function(err, result) {
				if(err) return error(err);
				
				var participantId = result.insertId;
				
				for(var question in post) save(participantId, question, post[question]);
			});
			
		});
	}
	else {
		response.writeHead(400, "Bad Request", {"Content-Type": "text/plain"});
		response.end("Expected HTTP POST!");
	}
	
	function save(participantId, question, answer) {
		answersToSave++;
		DB.execute("INSERT INTO answers (survey_name, question, answer, participant_id) VALUES(?,?,?,?)", [surveyName, question, answer, participantId], function(err) {
			answersSaved++;
			
			if(err) return error(err);
			
			if(answersSaved == answersToSave) done();
			
		});
		
	}
	
	function done() {
		if(abort) throw new Error("Done called when abort=" + abort);
		
		response.writeHead(200, "OK", {"Content-Type": "text/plain"});
		response.end("Thank you for participating in the survey!");
		
		abort = true;
	}
	
	function error(err) {
		console.error(err);
		
		if(abort) return;
		abort = true;
		
		response.writeHead(500, "Error", {"Content-Type": "text/plain"});
		response.end("Something went wrong. Please call support!");
	}
	
}
