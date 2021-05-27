#!/bin/bash
set -e

pip install awscli
eval $(aws ecr get-login --no-include-email --region us-east-1)

IMAGE="$1:$TRAVIS_TAG"
docker build -t $IMAGE .
docker tag $IMAGE "300927244991.dkr.ecr.us-east-1.amazonaws.com/$IMAGE"
docker push "300927244991.dkr.ecr.us-east-1.amazonaws.com/$IMAGE"
docker image rm $IMAGE
