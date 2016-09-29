var fs = require("fs");
var fse = require("fs-extra");
var xml = require("node-xml-lite");
var path = require("path");
var colors = require("colors/safe");
var extend = require("extend");
var inquirer = require("inquirer");
var JSONSelect = require("JSONSelect");

var Configuration = function (package) {
	this.package = package;
	var localConfigurationPath = path.join(__dirname, "..", "..", package.name + "-configuration");
	fse.ensureDirSync(localConfigurationPath);
	var localConfigurationFilename = path.join(localConfigurationPath, "config.json");
	if (!fs.existsSync(localConfigurationFilename)){
		fs.writeFileSync(localConfigurationFilename, "{}");
	}

	this.local = require(localConfigurationFilename);
	this.local.filename = localConfigurationFilename;
	this.global = {};

	if (fs.existsSync(this.local.globalConfigurationFilename)){
		this.global = require(this.local.globalConfigurationFilename);
	}

	this.global.filename = this.local.globalConfigurationFilename;

	return this;
};


Configuration.prototype.pickHistoryCommands = function(localCfg, ignorePath) {
	var newHistory = [ignorePath];
	for (var h = 0; (h < localCfg.history.length); h++) {
		var history = localCfg.history[h];
		if (history.join("/") !== ignorePath.join("/") && Array.isArray(history)){
			newHistory.push(history);
		}
	}
	return newHistory;
};

Configuration.prototype.updateCommandHistory = function(path) {
	var data = fs.readFileSync(this.local.filename).toString();
	var localCfg = JSON.parse(data) ;
	if (!localCfg.history){
		localCfg.history = [];
	}
	var newHistory = this.pickHistoryCommands(localCfg, path);
	localCfg.history = newHistory;

	fs.writeFileSync(this.local.filename, JSON.stringify(localCfg, null, 4));
};


Configuration.prototype.shiftHistoryItem = function(path) {
	if (path[0] === "Command history"){
		path.shift();
	}
	return path;
};

Configuration.prototype.normalizePath = function(path) {
	if (path.length === 1) {
		path = path[0].split("/");
	}
	return path;
};

Configuration.prototype.exitIfInvalidCommandPath = function(path) {
	if (typeof(path) === "string" || path.length === 1) {
		return;
	}
};

Configuration.prototype.pushCommandToHistory = function(path, cmd) {

	this.exitIfInvalidCommandPath(path);
	var i;
	var line = "";
	for (i = 0; i < path.join("/").length + 10; i++) {
		line += "-";
	}
	console.log( line );
	console.log( colors.yellow.bold("run: ") + colors.yellow( path.join("/") ));
	console.log( colors.yellow(cmd.command) );
	for (i = 0; i < cmd.args.length; i++) {
		console.log(colors.yellow.bold(cmd.args[i]));
	}
	console.log( line );

	path = this.shiftHistoryItem(path);
	path = this.normalizePath(path);

	this.updateCommandHistory(path);
};

Configuration.prototype.getHistoryCommand = function(history, commands) {
	var cmdName = history.join("/");
	var cmd = commands;
	while( history.length !== 0 ){
		var key = history.shift();
		if (cmd[key]){
			cmd = cmd[key];
		} else {
			//console.log ( colors.red( cmdName + " does not exist anymore in configuration" ) );
			history = [];
			cmd = null;
		}
	}
	return {
		name : cmdName,
		cmd : cmd
	};
};

Configuration.prototype.setupHistoryItems = function(setup, cmd) {
	this.setup["Command history"] = {};
	for (var i = 1; i < this.local.history.length; i++) {
		var h = this.local.history[i];
		cmd = this.getHistoryCommand(h, setup);
		if (cmd.cmd){
			this.setup["Command history"][cmd.name] = cmd.cmd;
		}
	}
	this.setup[new inquirer.Separator()] = null;
};

Configuration.prototype.setupHistory = function(setup) {
	if (this.local.history && this.local.history.length !== 0){

		var cmd = this.getHistoryCommand(this.local.history[0], setup);
		if (cmd.cmd){
			this.setup[cmd.name] = cmd.cmd;
		}

		if (this.local.history.length > 1){
			this.setupHistoryItems(setup, cmd);
		}
	}
};

Configuration.prototype.loadAndParseDataFromStorageFilename = function(cmd) {
	var jsonData;

	var ext = path.extname(cmd.argumentDatasource.filename).toLowerCase().replace(/\./g,"");
	var parserFunction = {
		config : xml.parseString,
		xml : xml.parseString,
		json : JSON.parse,
		js : require
	};

	if (parserFunction[ext]){
		var rawData;
		try{
			rawData = fs.readFileSync(cmd.argumentDatasource.filename).toString().replace(/\n/g, "").replace(/\r/g, "");
		} catch(e){
			rawData = "{}";
		}
		jsonData = parserFunction[ext](rawData);
	} else {
		var msg = colors.bgRed.white(cmd.argumentDatasource.filename + " not supported as data storage");
		console.log(msg);
	}

	return jsonData;
};

Configuration.prototype.equipCmdWithCommandBundle = function(cmd, args) {
	cmd["tail config file"] = {
		"command" : "shell",
		"args" : ["tail -f " + cmd.argumentDatasource.filename]
	};

	cmd["output config file to console"] = {
		"command" : "shell",
		"args" : ["type " + cmd.argumentDatasource.filename]
	};
	cmd["open config file"] = {
		"command" : "open",
		"args" : [cmd.argumentDatasource.filename]
	};

	if(this.local.shell && this.local.shell.openFolderCommand){
		cmd["open file explorer and select config file"] = {
			"command" : "shell",
			"args" : [this.local.shell.openFolderCommand.replace("@dir@", cmd.argumentDatasource.filename)]
		};
	} else {
		cmd["open file explorer and select config file"] = {
			"command" : "open",
			"args" :  [path.dirname(cmd.argumentDatasource.filename)]
		};
	}

	cmd[new inquirer.Separator()] = null;


	var startTime = new Date();
	console.log(colors.cyan("parse ") + colors.gray(cmd.argumentDatasource.filename + "..."));

	var jsonData = this.loadAndParseDataFromStorageFilename(cmd);


	var selector = cmd.argumentDatasource.selector; // xPath CSS like selector
	var resultObj = JSONSelect.match(selector, jsonData);
	/*if (cmd.argumentDatasource.filename === "sus.exe.config.json"){
		console.log(resultObj);
	}*/

	var color;
	if (resultObj.length !== 0){
		args = [resultObj[0][cmd.argumentDatasource.attribute]];
		if (args[0] === undefined){
			args = resultObj;
		}
		//console.log(args);

		var time = new Date() - startTime;
		color = colors.red;
		if (time < 400){
			color = colors.cyan;
		}

		console.log(color("found: \"") + colors.grey(args[0]) + "\" " + colors.yellow("("  + time + "ms)") );
		delete cmd.argumentDatasource;
	} else {
		color = colors.bgRed.white;
		console.error(color("selector returned 0 or file could not be opened"), cmd);
		// process.exit(1);
	}
	return args;
};

Configuration.prototype.parseConfigForArguments = function(cmd) {
	var args = cmd.args;

	if (cmd.argumentDatasource){
		args = this.equipCmdWithCommandBundle(cmd, args);
	}
	return args;
};

Configuration.prototype.extendCommandsByTypeFolder = function(cmd) {
	var args = this.parseConfigForArguments(cmd);
	cmd["tail latest file"] = {
		"command" : "tail-latest-file",
		"args" : args
	};
	cmd["output latest file to console"] = {
		"command" : "type-latest-file",
		"args" : args
	};
	cmd["open latest file"] = {
		"command" : "open-latest-file",
		"args" : args
	};

	if(this.local.shell && this.local.shell.openFolderCommand){
		cmd["open file-explorer and select folder"] = {
			"command" : "shell",
			"args" : [this.local.shell.openFolderCommand.replace("@dir@", args[0])]
		};
	} else {
		cmd["open file-explorer and select folder"] = {
			"command" : "open",
			"args" : args
		};
	}

	delete cmd.type;
	delete cmd.args;
};

Configuration.prototype.extendCommandsByTypeFile = function(cmd) {
	var args = this.parseConfigForArguments(cmd);

	cmd["output file to console"] = {
		"command" : "shell",
		"args" : ["type " + args[0]]
	};
	cmd["tail file to console"] = {
		"command" : "shell",
		"args" : ["tail -f " + args]
	};
	cmd["open file in editor"] = {
		"command" : "open",
		"args" : args
	};

	if(this.local.shell && this.local.shell.openFolderCommand){
		cmd["open file-explorer and select file"] = {
			"command" : "shell",
			"args" : [this.local.shell.openFolderCommand.replace("@dir@", args[0])]
		};
	} else {
		cmd["open file-explorer and select folder"] = {
			"command" : "open",
			"args" : args
		};
	}

	delete cmd.type;
	delete cmd.args;
};

Configuration.prototype.eachCommand = function(setupTree, cb) {
	for (var key in setupTree) {
		if (setupTree.hasOwnProperty(key)) {
			var cmd = setupTree[key];

			cb(key, cmd);
		}
	}
};

Configuration.prototype.extendCommandsByType = function(setupTree) {
	var self = this;
	this.eachCommand(setupTree, function(key, cmd){
		if (cmd.type){
			var extensionCommand = {
				folder : function(cmd){return self.extendCommandsByTypeFolder(cmd);},
				file : function(cmd){return self.extendCommandsByTypeFile(cmd);}
			};

			extensionCommand[cmd.type](cmd);
		} else {
			if (!cmd.command && isNaN(parseInt(key))){
				self.extendCommandsByType(cmd);
			}
		}
	});
};

Configuration.prototype.setup = function() {
	this.setup = {};
	var setup = {};
	extend(true, setup, this.local, this.global);
	delete setup.globalConfigurationFilename;
	delete setup.filename;
	delete setup.history;
	delete setup.shell;


	this.extendCommandsByType(setup);
	this.setupHistory(setup);
	extend(true, this.setup, setup);
	console.log("");
};

Configuration.prototype.log = function() {
	console.log( colors.cyan.bold(this.package.name) + colors.yellow(" v" + this.package.version) + colors.gray(" MIT licensed https://github.com/s-a/sys-hub") );
	console.log("");
	console.log( colors.yellow.bold("local configuration: ") + colors.yellow(this.local.filename) );
	console.log( colors.yellow.bold("global configuration: ") + colors.yellow(this.global.filename) );
	console.log("");
};


module.exports = Configuration;