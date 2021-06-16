#!/bin/bash

rm -rf dist/lambda
mkdir -p dist/lambda
mkdir -p dist/lambda/packages

cp package.json dist/lambda
cp yarn.lock dist/lambda

cp -R packages/lambda dist/lambda/packages/
cp -R packages/mongodb dist/lambda/packages/
cp -R packages/omeda dist/lambda/packages/
cp -R packages/sync dist/lambda/packages/

cd dist/lambda
yarn --production --frozen-lockfile
zip -r ../lambda.zip . -x .git/\*
