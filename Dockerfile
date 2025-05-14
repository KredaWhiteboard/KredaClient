FROM node:24-alpine3.20 AS base

WORKDIR /workspace


FROM base AS build

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build


FROM nginx:1.27-alpine3.21

COPY ./docker/default.conf.template /etc/nginx/conf.d/default.conf

COPY --from=build /workspace/dist /var/www