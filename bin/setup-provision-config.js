#!/usr/bin/env node
var chalk = require('chalk');
var inquirer = require('inquirer');
var fs = require('fs-extra');
var path = require('path');

// Ansible directories
var ansibleDir = './ansible';
var provisionDir = ansibleDir + '/provision';
var setupDir = path.join(__dirname, '..', 'setup');

// Provision paths
var provisionSrc = setupDir + '/provision/provision.yml';
var provisionDest = provisionDir + '/provision.yml';

// Provision database paths
var dbserversSrc = setupDir + '/provision/dbservers.yml';
var dbserversDest = provisionDir + '/dbservers.yml';

// Provision webservers paths
var webserversSrc = setupDir + '/provision/webservers.yml';
var webserversDest = provisionDir + '/webservers.yml';

// Provision vars paths
var varsDir = provisionDir + '/vars';
var varsSrc = setupDir + '/provision/vars/provision_vars.yml';
var varsDest = provisionDir + '/vars/provision_vars.yml';

// Inventory paths
var inventorySrc = setupDir + '/provision/inventory';

// Ansible config paths
var ansibleCfgSrc = setupDir + '/ansible.cfg';
var ansibleCfgDest = './ansible.cfg';

function environmentPrompt(callback) {
	var questions = [];

	questions.push(
		{
			name: 'target',
			type: 'input',
			message: 'Create a new provision environment:',
			default: 'development',
			validate: function( value ) {
				if (value.length) {
					return true;
				} else {
					return 'Please enter the provision environment name';
				}
			}
		}
	);

	inquirer.prompt(questions).then(callback);
}

function projectPrompt(callback) {
	var questions = [];

	questions.push(
		{
			name: 'host',
			type: 'input',
			message: 'Server IP Address:',
			default: '127.0.0.1',
			validate: function( value ) {
				if (value.length) {
					return true;
				} else {
					return 'Please enter the server IP address';
				}
			}
		},
		{
			name: 'port',
			type: 'input',
			message: 'Server SSH port:',
			default: '22',
			validate: function( value ) {
				if (value.length) {
					return true;
				} else {
					return 'Please enter the server SSH port';
				}
			}
		},
		{
			name: 'user',
			type: 'input',
			message: 'Server SSH user:',
			default: 'provision',
			validate: function( value ) {
				if (value.length) {
					return true;
				} else {
					return 'Please enter the server SSH user';
				}
			}
		},
		{
			name: 'key',
			type: 'input',
			message: 'Server SSH private key:',
			default: '~/.ssh/id_rsa',
			validate: function( value ) {
				if (value.length) {
					return true;
				} else {
					return 'Please enter the server SSH private key';
				}
			}
		},
		{
			name: 'servername',
			type: 'input',
			message: 'Server name:',
			default: 'localhost',
			validate: function( value ) {
				if (value.length) {
					return true;
				} else {
					return 'Please enter the server name';
				}
			}
		},
		{
			name: 'projectpath',
			type: 'input',
			message: 'Project path:',
			default: '/var/www/myproject',
			validate: function( value ) {
				if (value.length) {
					return true;
				} else {
					return 'Please enter the project path';
				}
			}
		},
		{
			name: 'docroot',
			type: 'input',
			message: 'Document root:',
			default: '/var/www/myproject/public',
			validate: function( value ) {
				if (value.length) {
					return true;
				} else {
					return 'Please enter the document root';
				}
			}
		}
	);

	inquirer.prompt(questions).then(callback);
}

function setup() {
	console.log('Setting up provision scripts...');

	// Top level directory
	if(!fs.existsSync(ansibleDir)) {
		fs.mkdirSync(ansibleDir);
	}

	// Working directory
	if(!fs.existsSync(provisionDir)) {
		fs.mkdirSync(provisionDir);
	}

	// Vars directory
	if(!fs.existsSync(varsDir)) {
		fs.mkdirSync(varsDir);
	}

	// Vars file
	if(!fs.existsSync(varsDest)) {
		console.log(chalk.green('Creating provision vars file...'));
		fs.copySync(varsSrc, varsDest);
	}
	else {
		console.log(chalk.yellow('Provision vars file already exists...'));
	}

	// Provision file: provision.yml
	if(!fs.existsSync(provisionDest)) {
		console.log(chalk.green('Creating provision file...'));
		fs.copySync(provisionSrc, provisionDest);
	}
	else {
		console.log(chalk.yellow('Provision file already exists...'));
	}

	// Database provision file: dbservers.yml
	if(!fs.existsSync(dbserversDest)) {
		console.log(chalk.green('Creating database provision file...'));
		fs.copySync(dbserversSrc, dbserversDest);
	}
	else {
		console.log(chalk.yellow('Database provision file already exists...'));
	}

	// Webservers provision file: webservers.yml
	if(!fs.existsSync(webserversDest)) {
		console.log(chalk.green('Creating webservers provision file...'));
		fs.copySync(webserversSrc, webserversDest);
	}
	else {
		console.log(chalk.yellow('Webservers provision file already exists...'));
	}

	// Ansible roles config file
	if(!fs.existsSync(ansibleCfgDest)) {
		console.log(chalk.green('Creating ansible config file...'));
		fs.copySync(ansibleCfgSrc, ansibleCfgDest);
	}
	else {
		console.log(chalk.yellow('Ansible config file already exists...'));
	}

	console.log('Setting up provision environments...');

	environmentPrompt(function(arguments){

		if(!fs.existsSync(provisionDir + '/' + arguments.target)) {
			console.log(chalk.green('Creating provision environment config...'));
			fs.copySync(inventorySrc, provisionDir + '/' + arguments.target);

			var environment = arguments.target;

			projectPrompt(function(arguments){

				var host = arguments.host;
				var port = arguments.port;
				var user = arguments.user;
				var key = arguments.key;
				var servername = arguments.servername;
				var projectpath = arguments.projectpath;
				var docroot = arguments.docroot;

				fs.readFile(provisionDir + '/' + environment + '/inventory', 'utf8', function (err,data) {
					if (err) {
						return console.log(err);
					}

					var result = data
						.replace(/\$HOST\$/g, host)
						.replace(/\$PORT\$/g, port)
						.replace(/\$USER\$/g, user)
						.replace(/\$KEY\$/g, key);

					fs.writeFile(provisionDir + '/' + environment + '/inventory', result, 'utf8', function (err) {
						if (err) return console.log(err);
					});
				});

				fs.readFile(provisionDir + '/' + environment + '/group_vars/all.yml', 'utf8', function (err,data) {
					if (err) {
						return console.log(err);
					}

					var result = data
						.replace(/\$SERVER_NAME\$/g, servername)
						.replace(/\$PROJECT_PATH\$/g, projectpath)
						.replace(/\$DOC_ROOT\$/g, docroot);

					fs.writeFile(provisionDir + '/' + environment + '/group_vars/all.yml', result, 'utf8', function (err) {
						if (err) return console.log(err);
					});
				});

				console.log('Finished setting up provision environment.');
			});
		}
		else {
			console.log(chalk.red('The environment "' + arguments.target + '" already exists.'));
		}

	});
}

setup();