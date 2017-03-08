#!/usr/bin/env node
var chalk = require('chalk');

console.log('To use this script make sure that the following is added to your package.json scripts block...\n');
console.log(chalk.cyan('"scripts": {\n  "setup-provision":"setup-provision-script"\n}'));
console.log('\nThen run ' + chalk.cyan('npm run setup-provision') + ' to start the setup.\n');
