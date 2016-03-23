var isWin = /^win/.test(process.platform);

if (isWin){
	var fs = require('fs');
	var path = require('path');
	fs.writeFileSync(path.join(__dirname, "..", "..", "..", "sys-hub.cmd"), "node " +  path.join(__dirname, "..", "lib/cli.js") );
}