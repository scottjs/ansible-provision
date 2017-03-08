#!/usr/bin/env node
var chalk = require('chalk');
var inquirer = require('inquirer');
var fs = require('fs-extra');
var path = require('path');
var generator = require('generate-password');

var src = path.join(__dirname, '..', 'setup');
var dest = '.';

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
			dest: '/ansible/provision/' + args.environment + '/inventory',
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
			dest: '/ansible/provision/' + args.environment + '/group_vars/all.yml',
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
				},
				{
					name: 'mysql_root_password',
					type: 'input',
					message: 'MySQL root password:',
					default: 'leave blank for random'
				},
				{
					name: 'mysql_database',
					type: 'input',
					message: 'MySQL database name:',
					default: 'vagrant'
				},
				{
					name: 'mysql_user_name',
					type: 'input',
					message: 'MySQL user name:',
					default: 'vagrant'
				},
				{
					name: 'mysql_user_pass',
					type: 'input',
					message: 'MySQL user password:',
					default: 'leave blank for random'
				}
			]
		},
		{
			src: '/provision/vars/provision_vars.yml',
			dest: '/ansible/provision/vars/provision_vars.yml',
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
			dest: '/ansible/provision/dbservers.yml',
			replacements: []
		},
		{
			src: '/provision/webservers.yml',
			dest: '/ansible/provision/webservers.yml',
			replacements: []
		},
		{
			src: '/provision/provision.yml',
			dest: '/ansible/provision/provision.yml',
			replacements: []
		},
		{
			src: '/ansible.cfg',
			dest: '/ansible.cfg',
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

			var replace = args[replacement];

			if(replace == 'leave blank for random') {
				replace = generator.generate({
					length: 16,
					numbers: true
				});
			}

			result = result.replace(regex, replace);
		}

		fs.writeFile(dest + file.dest, result, 'utf8', function (err) {
			if (err) {
				return console.log(err);
			}
		});
	});
}