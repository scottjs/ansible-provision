#!/usr/bin/env node
var chalk = require('chalk');
var inquirer = require('inquirer');
var cp = require('child_process');
var fs = require('fs');

// Setup paths
var dest = './ansible-provision';

// Load in required parameters and optional assigned parameters
var args = process.argv.slice(2);
var params = [];
var total = 0;

// Display help
if(args[0] === 'help') {
	console.log(chalk.underline.bold('Provision help') + '\n\n  Provision help.\n\n' + chalk.underline.bold('Usage') + '\n\n  $ npm run provision\n  $ npm run provision <' + chalk.underline('environment') + '>\n  $ npm run provision <' + chalk.underline('environment') + '> [vault=<' + chalk.underline('vault') + '>]\n\n' + chalk.underline.bold('Options') + '\n\n  vault=<' + chalk.underline('vault') + '>\t\tPath to vault password file.\n');
	process.exit();
}

// Start script
console.log('Setting up a provision...');

for(i in args) {
	var item = args[i];

	if(item.indexOf('=') !== -1) {
		var parts = args[i].split('=');
		params[parts[0]] = parts[1];
	}
	else {
		params['arg' + total] = args[i];
		total++;
	}
}

// If no parameters are passed, ask the user for answers
if(typeof params['arg0'] === 'undefined') {
	var environments = [];

	// Get a list of configured environments
	if(fs.existsSync(dest)) {
		var files = fs.readdirSync(dest);
		for (var i in files) {
			if (fs.statSync(dest + '/' + files[i]).isDirectory() && files[i] !== 'vars' && files[i] !== 'plays') {
				environments.push(files[i]);
			}
		}
	}

	// If no environments exist yet
	if(environments.length === 0) {
		console.log(chalk.red('No environments setup'));
		process.exit();
	}

	// Setup questions
	var deploy = [
		{
			name: 'arg0',
			type: 'rawlist',
			message: 'Environment:',
			choices: environments
		},
		{
			name: 'vault',
			type: 'input',
			message: 'Vault:',
			default: typeof params['vault'] !== 'undefined' ? params['vault'] : 'leave blank if no vault setup'
		}
	];

	// Ask questions
	inquirer.prompt(deploy).then(function(params) {
		setup(params);
	});
}

// Otherwise use the params
else {
	setup(params);
}

/**
 * Start the ansible deploy with given args
 *
 * @param params Parameters from command line and/or prompt
 */
function setup(params) {

	// Ansible args to use
	var deployArgs = [
		'-i',
		'ansible-provision/' + params['arg0'] + '/inventory'
	];

	// If vault params are sent, pass it into the ansible args
	if(typeof params['vault'] !== 'undefined' && params['vault'] !== 'leave blank if no vault setup') {
		deployArgs.push('--vault-password-file=' + params['vault']);
	}

	// If vault params are sent, pass it into the ansible args
	if(typeof params['play'] !== 'undefined') {
		deployArgs.push('ansible-provision/plays/' + params['play'] + '.yml');
	}
	else {
		deployArgs.push('ansible-provision/provision.yml');
	}

	// Spawn the command
	cp.spawnSync('ansible-playbook', deployArgs, {stdio: 'inherit'});
}


