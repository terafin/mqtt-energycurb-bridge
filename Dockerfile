FROM keymetrics/pm2-docker-alpine

RUN npm install pm2 -g
RUN mkdir -p /usr/node_app
COPY . /usr/node_app
WORKDIR /usr/node_app
RUN npm install --production

CMD ["pm2-docker", "mqttt-energycurb-bridge.js"]
