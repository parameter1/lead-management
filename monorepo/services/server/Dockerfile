FROM node:14.15-alpine as build
WORKDIR /app
ENV NODE_ENV production
RUN apk update && apk upgrade && \
  apk add --no-cache git
ADD package.json yarn.lock /app/
ADD services/server /app/services/server
ADD packages /app/packages
RUN yarn --production --pure-lockfile
WORKDIR /app/services/server

FROM node:14.15-alpine
ENV NODE_ENV production
ENV PORT 80
COPY --from=build /app /app
WORKDIR /app/services/server
ENTRYPOINT [ "node", "src/index.js" ]
