#!/usr/bin/env node
var chalk = require('chalk');
var inquirer = require('inquirer');
var fs = require('fs-extra');
var path = require('path');

var src = path.join(__dirname, '..', 'setup');
var dest = './ansible';

var files = [];
var environment = [
	{
		name: 'environment',
		type: 'input',
		message: 'Environment:',
		default: 'development'
	}
];

console.log('Setting up provision scripts...');

inquirer.prompt(environment).then(function(args) {

	files = [
		{
			src: '/provision/inventory/inventory',
			dest: '/provision/' + args.environment + '/inventory',
			replacements: [
				{
					name: 'host',
					type: 'input',
					message: 'Server IP Address:',
					default: '127.0.0.1'
				},
				{
					name: 'port',
					type: 'input',
					message: 'Server SSH port:',
					default: '22'
				},
				{
					name: 'user',
					type: 'input',
					message: 'Server SSH user:',
					default: 'provision'
				},
				{
					name: 'key',
					type: 'input',
					message: 'Server SSH private key:',
					default: '~/.ssh/id_rsa'
				}
			]
		},
		{
			src: '/provision/inventory/group_vars/all.yml',
			dest: '/provision/' + args.environment + '/group_vars/all.yml',
			replacements: [
				{
					name: 'server_name',
					type: 'input',
					message: 'Server name:',
					default: 'localhost'
				},
				{
					name: 'project_path',
					type: 'input',
					message: 'Project path:',
					default: '/var/www/myproject'
				},
				{
					name: 'document_root',
					type: 'input',
					message: 'Document root:',
					default: '/var/www/myproject/public'
				}
			]
		},
		{
			src: '/provision/vars/provision_vars.yml',
			dest: '/provision/vars/provision_vars.yml',
			replacements: [
				{
					name: 'php_version',
					type: 'list',
					message: 'PHP version:',
					choices: [
						'php71',
						'php56'
					],
					default: 'php71'
				}
			]
		},
		{
			src: '/provision/dbservers.yml',
			dest: '/provision/dbservers.yml',
			replacements: []
		},
		{
			src: '/provision/webservers.yml',
			dest: '/provision/webservers.yml',
			replacements: []
		},
		{
			src: '/provision/provision.yml',
			dest: '/provision/provision.yml',
			replacements: []
		}
	];

	filePrompt();
});

function filePrompt(i) {
	i = typeof i !== 'undefined' ? i : 0;

	if(typeof files[i].replacements !== 'undefined') {
		var replacements = [];

		if(!fs.existsSync(dest + files[i].dest)) {
			replacements = files[i].replacements;
		}

		inquirer.prompt(replacements).then(function(args) {
			if(!fs.existsSync(dest + files[i].dest)) {
				fs.copySync(src + files[i].src, dest + files[i].dest);
				fileReplace(args, files[i]);

				console.log(chalk.green('Finished setting up ' + files[i].dest.substring(1) + '.'));
			}
			else {
				console.log(chalk.yellow('File already exists ' + files[i].dest.substring(1) + '.'));
			}

			filePrompt(i + 1);
		});
	}
}

function fileReplace(args, file) {
	fs.readFile(dest + file.dest, 'utf8', function (err, data) {
		if (err) {
			return console.log(err);
		}

		var result = data;
		var replacements = Object.keys(args);

		for(i in replacements) {
			var replacement = replacements[i];
			var regex = new RegExp('\\$' + replacement.toUpperCase() + '\\$', 'g');

			result = result.replace(regex, args[replacement]);
		}

		fs.writeFile(dest + file.dest, result, 'utf8', function (err) {
			if (err) {
				return console.log(err);
			}
		});
	});
}