FROM node:14.15-alpine as build
WORKDIR /app
ENV NODE_ENV production
ADD package.json yarn.lock /app/
ADD services/exports /app/services/exports
ADD packages /app/packages
RUN yarn --production --pure-lockfile
WORKDIR /app/services/exports

FROM node:14.15-alpine
ENV NODE_ENV production
ENV PORT 80
COPY --from=build /app /app
WORKDIR /app/services/exports
ENTRYPOINT [ "node", "src/index.js" ]
