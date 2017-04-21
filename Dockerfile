FROM keymetrics/pm2-docker-alpine

RUN mkdir -p /usr/node_app
COPY . /usr/node_app
WORKDIR /usr/node_app
RUN npm install pm2 -g
RUN npm install

CMD ["pm2-docker", "mqttt-energycurb-bridge.js"]
