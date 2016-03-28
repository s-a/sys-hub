var fs = require("fs");
var path = require("path");
var shelljs = require("shelljs");
var inquirer = require("inquirer");
var colors = require("colors/safe");

var getObjectKeys = function (o/*, ignore*/) {
	var result = [];
	for (var key in o) {
		if (key.toLowerCase() !== "description"){
			result.push(key);
		}
	}
	return result;
};

var getNewestFile = function(dir, keepOriginalPath) {
	console.log( colors.cyan.bold ("Search latest file in " + dir + "...") );
	var files = fs.readdirSync(dir);
	files.sort(function(a, b) {
		return 	fs.statSync(path.join(dir, b)).mtime.getTime() - 
		fs.statSync(path.join(dir, a)).mtime.getTime();
	});
	var result = path.join(dir, files[0]);
	if (!keepOriginalPath){
		result = result.replace("\\\\", "file://");
	}
	console.log( colors.cyan(result) );
	return result;
};

var logShellExit = function (status/*, output*/) {
	var color = colors.bgRed.white;
	if ( status === 0 ){
		color = colors.green.bold;
	}

	console.log( "" );
	console.log( color("Exitcode: " + status) );
	//console.log( color(output) );
};

var QA = function (config) {
	this.path = [];
	this.selection = config.setup;
	this.config = config.setup;
	this.configuration = config;
	return this;
};

QA.prototype.exec = function (cmd) {
	var commands = {
		"open" : function (cmd) {
			var fn = cmd.args[0];
			require("open")(fn);
			console.log(colors.yellow("opening " + fn));
		},
		"open-latest-file" : function (cmd) {
			var fn = getNewestFile(cmd.args[0]);
			require("open")(fn);
			console.log(colors.yellow("opening " + fn));
		},
		"tail-latest-file" : function (cmd) {
			var fn = getNewestFile(cmd.args[0], true);
			console.log(colors.yellow("tail -f " + fn + "..."));
			shelljs.exec("tail -f " + fn, logShellExit);
		},
		"type-latest-file" : function (cmd) {
			var fn = getNewestFile(cmd.args[0], true);
			console.log(colors.yellow("type " + fn));
			shelljs.exec("type " + fn, logShellExit);
		},
		"shell" : function (cmd) {
			console.log(cmd.args.join(" ") + "...");
			shelljs.exec(cmd.args.join(" "), logShellExit);
		},
	};
	if (commands[cmd.command]) {
		commands[cmd.command](cmd);
	} else {
		this.err(cmd.command + " not implemented");
	}
};

QA.prototype.execute = function () {
	var cmd = this.command;
	this.configuration.pushCommandToHistory(this.path, cmd);
	this.exec(cmd);
};

QA.prototype.err = function(msg) {
	console.log ( colors.bgRed.white( msg ) );
};

QA.prototype.prompt = function() {
	var self = this;
	var choices = getObjectKeys(self.selection);

	if (choices.length === 0){
		this.err("no commands found");
		process.exit(1);
	}

	inquirer.prompt([{
		type: "list",
		message: "Choose an option",
		name: "key",
		choices: choices
	}], function( answers ) {
		if (self.selection[answers.key]){
			self.path.push(answers.key);
			self.selection = self.selection[answers.key];

			if (self.selection.command && self.selection.args){
				self.command = self.selection;
				self.execute();
			} else {
				self.prompt();
			}

		} else {
			console.log(colors.red.bold("you can not select this option"));
			self.prompt();
		}
	});

};


module.exports = QA;