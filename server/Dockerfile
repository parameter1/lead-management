FROM node:14.14

WORKDIR /app
COPY . /app

ENV NODE_ENV production
RUN yarn install --production

ENTRYPOINT ["node", "src/index.js"]
