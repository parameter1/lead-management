#!/usr/bin/env node
const { readdirSync } = require('fs');
const path = require('path');
const { spawnSync, execSync } = require('child_process');
const pkg = require('../packages/lambda/package.json');

const { log } = console;

const pkgPattern = /^@lead-management\//;
const getPackagesFrom = (dependencies) => Object
  .keys(dependencies)
  .filter((name) => pkgPattern.test(name))
  .map((name) => name.replace(pkgPattern, ''));

const getPackages = (dependencies, all = new Set()) => {
  const names = getPackagesFrom(dependencies);
  names.forEach((name) => {
    if (all.has(name)) return;
    all.add(name);
    const currentPkg = require(path.resolve(__dirname, '../packages', name, 'package.json'));
    getPackages(currentPkg.dependencies, all);
  });
  return all;
};

const packages = getPackages(pkg.dependencies);
packages.add('lambda');

const cwd = __dirname;
const lambdaDir = path.resolve(__dirname, '../packages/lambda');
const functionDir = path.resolve(lambdaDir, 'functions');

const functions = readdirSync(functionDir).filter((file) => /\.js$/.test(file));

const distFolder = '../dist/lambda';
const target = `${distFolder}`;

// clean dist folder
execSync(`rm -rf ${distFolder}`, { cwd });

// create package folders
packages.forEach((folder) => {
  execSync(`mkdir -p ${target}/packages/${folder}`, { cwd });
});

// common core monorepo files
execSync(`cp ../package.json ${target}`, { cwd });
execSync(`cp ../yarn.lock ${target}`, { cwd });

// copy required packages
packages.forEach((folder) => {
  execSync(`cp -R ../packages/${folder} ${target}/packages/`, { cwd });
});

// install dependencies
spawnSync('yarn', ['--production', '--frozen-lockfile'], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, target),
});

// create zip
spawnSync('zip', ['-r', '../lambda.zip', '.', '-x', '.git/\*'], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, target),
});

// remove files
execSync(`rm -rf ${distFolder}`, { cwd });
