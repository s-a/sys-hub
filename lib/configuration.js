var path = require("path");
var fs = require("fs");
var fse = require("fs-extra");
var colors = require('colors');
var extend = require('extend');


var Configuration = function (package) {
	this.package = package;
	var localConfigurationPath = path.join(__dirname, "..", "..", package.name + "-configuration");
	fse.ensureDirSync(localConfigurationPath);
	var localConfigurationFilename = path.join(localConfigurationPath, "config.json");
	if (!fs.existsSync(localConfigurationFilename)){
		fs.writeFileSync(localConfigurationFilename, "{}");
	};

	this.local = require(localConfigurationFilename);
	this.local.filename = localConfigurationFilename;
	this.global = {};

	if (fs.existsSync(this.local.globalConfigurationFilename)){
		this.global = require(this.local.globalConfigurationFilename);
	}

	this.global.filename = this.local.globalConfigurationFilename;

	this.setup();


	return this;
};

Configuration.prototype.pushCommandToHistory = function(path, cmd) {
	var line = "";
	for (var i = 0; i < path.join("/").length + 10; i++) {
		line += "-";
	}
	console.log( line );
	console.log( colors.yellow.bold("run: ") +  colors.yellow ( path.join("/") ));
	console.log( colors.yellow(cmd.command) );
	for (var i = 0; i < cmd.args.length; i++) {
		console.log(colors.yellow.bold(cmd.args[i]))
	}
	console.log( line );
};

Configuration.prototype.getHistoryCommand = function(history, commands) {
	var cmdName = history.join("/");
	var cmd = commands;
	while( history.length !== 0 ){
		var key = history.shift();
		if (cmd[key]){
			cmd = cmd[key];
		} else {
			console.log ( colors.red( cmdName + " does not exist anymore in configuration" ) );
			history = [];
			cmd = null;
		}
	}
	return {
		name : cmdName,
		cmd : cmd
	};
};

Configuration.prototype.setupHistory = function(setup) {
	if (this.local.history && this.local.history.length !== 0){

		var cmd = this.getHistoryCommand(this.local.history[0], setup)
		if (cmd.cmd){
			this.setup["- " + cmd.name] = cmd.cmd;
		}

		if (this.local.history.length > 1){
			this.setup["- Command history"] = {};
			for (var i = 1; i < this.local.history.length; i++) {
				var h = this.local.history[i];
				cmd = this.getHistoryCommand(h, setup)
				if (cmd.cmd){
					this.setup["- Command history"][cmd.name] = cmd.cmd;
				}
			}
		}
	}
};


Configuration.prototype.setup = function() {
	this.setup = {};
	var setup = {};
	extend(true, setup, this.local, this.global);
	delete setup.globalConfigurationFilename;
	delete setup.filename;
	delete setup.history;

	this.setupHistory(setup);

	extend(true, this.setup, setup);
};

Configuration.prototype.log = function() {
	console.log( colors.cyan(this.package.name) + colors.yellow(" v" + this.package.version) )
	console.log( colors.yellow.bold("local configuration: ") + colors.yellow(this.local.filename) );
	console.log( colors.yellow.bold("global configuration: ") + colors.yellow(this.global.filename) );
};


module.exports = Configuration;