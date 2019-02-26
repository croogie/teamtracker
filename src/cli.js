#!/usr/bin/env node

const chalk = require("chalk");
const meow = require("meow");
const keys = require("lodash/keys");

const timelog = require("./tasks/timelog");

const cli = meow(
  chalk`
Global flags:
{blue --debug -d}    Run in debug mode
{blue --verbose -v}  Run in verbose mode

{blue Config file}:
Place somewhere in your dir structure file: {blue .teamtrackerrc}. 
It can be in your project dir or even in your home directory.

Define content as follows:
{yellow.inverse \{
    "email": "you.name@venturedevs.com",
    "password": "yourPassword",
    "project": "LifeCents"
\}}

Then calling {blue timelog} command from project dir does not require to pass login credentials every time.

{red Remember!} to not add this file to your GIT repo! 

Available tasks:
{blue timelog} - ${timelog.help}
`,
  {
    booleanDefault: undefined,
    flags: {
      debug: {
        type: "boolean",
        default: false,
        alias: "d"
      },
      verbose: {
        type: "boolean",
        default: false,
        alias: "v"
      }
    }
  }
);

const tasks = {
  timelog
};

const taskName = cli.input[0];

if (tasks && tasks[taskName]) {
  const task = tasks[taskName];
  task(cli);
} else if (!taskName) {
  console.log(
    chalk`{red You have to define task!}
    
More information: {gray.inverse teamtracker --help}

Available tasks: {blue ${keys(tasks).join(", ")}}`
  );
} else {
  console.log(
    chalk`{red There's no task} {red.inverse ${taskName}}\n\nUse {gray --help} flag for more info.`
  );
}
