#!/bin/bash
set -e
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

docker build -t "leads-manage:$TRAVIS_TAG" .
docker tag "leads-manage:$TRAVIS_TAG" "parameter1/leads-manage:$TRAVIS_TAG"
docker push "parameter1/leads-manage:$TRAVIS_TAG"
docker image rm "leads-manage:$TRAVIS_TAG"
