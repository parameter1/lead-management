FROM danlynn/ember-cli:3.8.1 as builder
ADD . /app
WORKDIR /app

RUN yarn install
RUN ember build --environment=production

FROM nginx:stable

COPY default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/ /usr/share/nginx/html/app
