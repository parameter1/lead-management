#!/usr/bin/env node
/* eslint-disable import/no-dynamic-require */

const { existsSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const { TRAVIS_TAG, DOCKER_PASSWORD, DOCKER_USERNAME } = process.env;
const AWS_ECR_REGISTRY = process.env.AWS_ECR_REGISTRY || '598984531759.dkr.ecr.us-east-2.amazonaws.com';
const [,,serviceName] = process.argv;
const workspace = join('.', 'services', serviceName);
const notifyEnv = { ...process.env, TRAVIS_REPO_SLUG: `${process.env.TRAVIS_REPO_SLUG}-${serviceName}` };
const repository = process.env.AWS_ECR_REPOSITORY || `lead-management-${serviceName}`;
const { log } = console;
const version = TRAVIS_TAG;
const imageTag = `${repository}:${version}`;

const failed = () => spawnSync('npx', ['@parameter1/base-cms-website-deployment-tool', 'notify-failed'], { stdio: 'inherit', env: notifyEnv });

const error = async (message, context = {}) => {
  log(`ERROR: ${message}`, context);
  await failed();
  process.exit(1);
};

if (!existsSync(workspace)) error(`Could not read ${workspace}!`);

const pkg = require(`../${workspace}/package.json`);
if (version !== `v${pkg.version}`) {
  log(`Package ${pkg.name} is at version ${pkg.version}. Skipping deployment.`);
  process.exit(0);
}

const docker = async (args = [], opts = { stdio: 'inherit' }) => {
  const out = await spawnSync('docker', args, opts);
  const { status, stderr } = out;
  if (status !== 0) {
    const err = stderr || out.stdout || 'Unknown error';
    error('Docker command failed!', await err.toString());
  }
  return out;
};

const aws = async (args) => docker([
  'run',
  '-e',
  `AWS_ACCESS_KEY_ID=${process.env.AWS_ACCESS_KEY_ID}`,
  '-e',
  `AWS_SECRET_ACCESS_KEY=${process.env.AWS_SECRET_ACCESS_KEY}`,
  'amazon/aws-cli',
  ...args,
], {});

const getVersions = async () => {
  try {
    const { stdout } = await aws(['ecr', 'describe-images', '--repository-name', repository, '--output', 'json', '--region', 'us-east-2']);
    const body = await stdout.toString();
    const { imageDetails } = JSON.parse(body);
    const items = Array.isArray(imageDetails) ? imageDetails : [];
    return items.reduce((arr, obj) => ([...arr, ...obj.imageTags]), []);
  } catch (e) {
    return [];
  }
};

const shouldBuild = async () => {
  log(`\nChecking  ${imageTag} on ECR`);
  const versions = await getVersions();
  return !versions.includes(version);
};

const build = async () => {
  log(`Building  ${imageTag}...\n`);
  const Dockerfile = join(workspace, 'Dockerfile');
  const file = existsSync(Dockerfile) ? ['-f', Dockerfile] : [];
  const { stdout } = await aws(['ecr', 'get-login-password', '--region', 'us-east-2']);
  const password = await stdout.toString();
  await docker(['build', '-t', imageTag, ...file, process.cwd()]);
  await docker(['tag', imageTag, `${AWS_ECR_REGISTRY}/${imageTag}`]);
  await docker(['login', '-u', 'AWS', '-p', password, `https://${AWS_ECR_REGISTRY}`]);
  await docker(['push', `${AWS_ECR_REGISTRY}/${imageTag}`]);
  await docker(['image', 'rm', imageTag]);
};

const deploy = async ({ key, value, image }) => {
  log(`Deploying ${imageTag} on Kubernertes`);
  const { status, stderr } = await spawnSync('npx', ['@endeavorb2b/rancher2cli', 'dl', key, value, image]);
  if (status !== 0) {
    const err = await stderr.toString();
    error('Image deployment failed!', err);
  }
};

const main = async () => { // eslint-disable-line consistent-return
  const keys = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'DOCKER_USERNAME',
    'DOCKER_PASSWORD',
    'RANCHER_CLUSTERID',
    'RANCHER_TOKEN',
    'RANCHER_URL',
    'TRAVIS_REPO_SLUG',
    'TRAVIS_TAG',
    'ENVIRONMENT',
    'SLACK_WEBHOOK_URL',
  ];
  if (!keys.every((k) => process.env[k])) {
    return error(
      'Deployment aborted: mandatory environment variables are missing.',
      keys.filter((key) => !process.env[key]),
    );
  }

  // Force initial docker login to bypass rate limiting on image pulls
  await docker(['login', '-u', DOCKER_USERNAME, '-p', DOCKER_PASSWORD]);

  if (await shouldBuild()) {
    log('Image was not found, building.');
    await build();
    log('Build complete.');
  } else {
    log('Image found, skipping build.');
  }

  await deploy({
    key: 'lead-management-service',
    value: serviceName,
    image: `${AWS_ECR_REGISTRY}/${repository}:${version}`,
  });
  log('  Deploy complete.\n');
};

main().catch(error);
