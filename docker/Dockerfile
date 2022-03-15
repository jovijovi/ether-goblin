ARG NODE_VER

FROM node:${NODE_VER} as builder
MAINTAINER pedro

ADD conf /opt/app_src/conf
ADD contracts /opt/app_src/contracts
ADD lib /opt/app_src/lib
ADD src /opt/app_src/src
COPY package.json /opt/app_src/
COPY tsconfig.json /opt/app_src/
COPY yarn.lock /opt/app_src/
COPY hardhat.config.ts /opt/app_src/
COPY git.json /opt/app_src/

WORKDIR /opt/app_src
RUN apt-get update \
    && apt-get install -y libudev-dev \
    && yarn install --frozen-lockfile \
    && yarn build

FROM node:${NODE_VER}-alpine as runtime

RUN apk add --no-cache bash

COPY --from=builder /opt/app_src/dist /opt/app
COPY --from=builder /opt/app_src/node_modules /opt/app/node_modules
COPY --from=builder /opt/app_src/git.json /opt/app/

USER root
WORKDIR /opt/app
ENTRYPOINT [ "node" ]
CMD ["src/main/index.js", "--config", "./conf/app.config.yaml"]
