var fs = require("fs");
var path = require("path");
var open = require("open");
var shelljs = require('shelljs');
var inquirer = require("inquirer");
var colors = require("colors");

var getObjectKeys = function (o, ignore) {
	var result = [];
	for (var key in o) {
		if (key.toLowerCase() !== "description"){
			result.push(key);
		}
	}
	return result;
};

var getNewestFile = function(dir, keepOriginalPath) {
	console.log("seeking latest file in ", dir);
	var files = fs.readdirSync(dir);
	files.sort(function(a, b) {
		return 	fs.statSync(dir + b).mtime.getTime() - 
		fs.statSync(dir + a).mtime.getTime();
	});
	var result = path.join(dir, files[0]);
	if (!keepOriginalPath){
		result = result.replace("\\\\", "file://");
	}
	return result;
};

var logShellExit = function (status, output) {
	var color = colors.bgRed.white;
	if ( status === 0 ){
		color = colors.green.bold;
	}

	console.log( color("Exitcode: " + status) );
	console.log( color(output) );
};

var QA = function (config) {
	this.path = [];
	this.selection = config.setup;
	this.config = config.setup;
	this.configuration = config;
	return this;
};

QA.prototype.execute = function () {
	var cmd = this.command;
	this.configuration.pushCommandToHistory(this.path, cmd);

	switch(cmd.command) {
		case "open":
			open(cmd.args[0]);
			break;
		case "open-latest-file":
			var fn = getNewestFile(cmd.args[0]);
			console.log(fn);
			open(fn);
			break;
		case "tail-latest-file":
			var fn = getNewestFile(cmd.args[0], true);
			console.log(fn);
			shelljs.exec("tail -f " + fn, logShellExit);
			break;
		case "shell":
			shelljs.exec(cmd.args.join(" "), logShellExit);
			break;
		default:
			this.err(cmd.command + " not implemented")
	}
}

QA.prototype.err = function(msg) {
	console.log ( colors.bgRed.white( msg ) );
};

QA.prototype.prompt = function() {
	var self = this;
	var choices = getObjectKeys(self.selection);

	if (choices.length === 0){
		this.err("no commands found");
		process.exit(1);
	};

	inquirer.prompt([{
		type: "list",
		message: "Choose an option",
		name: "key",
		choices: choices
	}], function( answers ) {
		self.path.push(answers.key);
		self["selection"] = self["selection"][answers.key];
		if (self.selection.command && self.selection.args){
			self.command = self["selection"];
			self.execute();
		} else {
			self.prompt();
		}

	});

};


module.exports = QA;