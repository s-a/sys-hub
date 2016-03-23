#!/usr/local/bin/node

var fs = require("fs");
var path = require("path");
var open = require("open");
var shelljs = require('shelljs');
var program = require('commander');
var packageJsonFileName = path.join(__dirname, "package.json");

if (!fs.existsSync(packageJsonFileName)){
	throw ("cannot find " + packageJsonFileName);
}

var version = require(packageJsonFileName).version;


console.log(version);

program
  .version(version)
  .option("-c, --cfg [path]", "set the global configuration path")
  .option("-f, --find [path]", "find the local configuration path")
  .parse(process.argv);
 
 


var q = function() {
	var inquirer = require("inquirer");


	var getObjectKeys = function (o) {
		var result = [];
		for (var key in o) {
			result.push(key);
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
	}


	var client, project, deployment, command;
	inquirer.prompt([{
		type: "list",
		message: "Choose a client",
		name: "client",
		choices: getObjectKeys(config)
	}], function( answers ) {
		client = answers.client;

		inquirer.prompt([{
			type: "list",
			message: "Choose a project",
			name: "project",
			choices: getObjectKeys(config[client])
		}], function( answers ) {
			project = answers.project;
			inquirer.prompt([{
				type: "list",
				message: "Choose a deployment",
				name: "deployment",
				choices: getObjectKeys(config[client][project]["deployments"])
			}], function( answers ) {
				deployment = answers.deployment;
				inquirer.prompt([{
					type: "list",
					message: "Choose a command",
					name: "command",
					choices: getObjectKeys(config[client][project]["deployments"][deployment])
				}], function( answers ) {
					command = answers.command;
					var cmd = config[client][project]["deployments"][deployment][command];

					console.log(client, project, deployment, command, cmd);
					console.log(cmd.args[0]);
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
	    					shelljs.exec("tail -f " + fn, function(status, output) {
						  		console.log('Exit status:', status);
						  		console.log('Program output:', output);
							});
					        break;
					    case "shell":
	    					shelljs.exec(cmd.args.join(" "), function(status, output) {
						  		console.log('Exit status:', status);
						  		console.log('Program output:', output);
							});
					        break;
					    default:
					        console.log (cmd.command + " not implemented");
					}
				});
			});
		});
	});

};


if (program.cfg){
	console.log(program.cfg);
	return ;
}

if (program.find){
	open(__dirname);
	return ;
}

var localConfigFilename = path.join(__dirname, "..", "ctrl_local_config", "config.json");
var globalConfigurationFile = require(localConfigFilename).globalConfigurationFile;
var config = require(globalConfigurationFile);

q();