FROM node:14.15 as build

WORKDIR /app
ENV NODE_ENV production
ADD package.json yarn.lock /app/
ADD packages /app/packages

ARG SERVICE_PATH
ADD $SERVICE_PATH /app/$SERVICE_PATH

# @todo purge unused packages/dependencies
RUN yarn --production --pure-lockfile

FROM node:14.15-alpine
ENV NODE_ENV production
COPY --from=build /app /app
ENTRYPOINT [ "node", "." ]
ARG SERVICE_PATH
WORKDIR /app/$SERVICE_PATH
