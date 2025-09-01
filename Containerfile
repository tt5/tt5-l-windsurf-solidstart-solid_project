FROM node:22-alpine as builder

WORKDIR /build
COPY package.json ./
COPY package-lock.json ./

RUN npm ci --omit=dev --ignore-scripts

COPY . .
RUN npm run build

FROM node:22-alpine

RUN apk update && apk add --no-cache dumb-init
ENV HOME=/home/app
ENV APP_HOME=$HOME/node/
ENV NODE_ENV=production
WORKDIR $APP_HOME
COPY --chown=node:node --from=builder /build/.output $APP_HOME
USER node
EXPOSE 3000
ENTRYPOINT ["dumb-init"]
CMD ["node", "server/index.mjs"]
