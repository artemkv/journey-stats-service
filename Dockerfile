FROM node:10

RUN mkdir -p /home/node/journey.services.stats/node_modules && mkdir -p /home/node/journey.services.stats/log && chown -R node:node /home/node/journey.services.stats

WORKDIR /home/node/journey.services.stats

COPY package*.json ./

RUN npm install --only=production

COPY . .

COPY --chown=node:node . .

USER node

EXPOSE 8700

ENV NODE_IP=0.0.0.0
ENV NODE_PORT=8700

CMD [ "node", "app.js" ]