#!/usr/bin/env node

var path = require("path");
var program = require("commander");
var package = require(path.join(__dirname, "..", "package.json"));

program
  .version(package.version)
  .option("-c, --cfg [path]", "set the global configuration path")
  .option("-f, --find [path]", "find the local configuration path")
  .parse(process.argv);

if (program.cfg){
	console.log(program.cfg);
	return ;
}

if (program.find){
	open(__dirname);
	return ;
}

var Config = require(path.join(__dirname, "configuration.js"));
var config = new Config(package);

config.log();

var QA = require(path.join(__dirname, "qa.js"));
var qa = new QA(config);

qa.prompt();