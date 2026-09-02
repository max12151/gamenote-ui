# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------------
# Étape 1 : construction du bundle Angular
# ---------------------------------------------------------------------------------
FROM node:24-alpine AS build

WORKDIR /build

# Les manifestes seuls d'abord : tant que les dépendances ne bougent pas, Docker
# réutilise la couche `npm ci` au lieu de tout réinstaller à chaque changement de code.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# `npm run build` utilise la configuration `production` par défaut (angular.json), donc
# le remplacement de fichier d'environnement s'applique : apiUrl devient vide et les
# appels partent en chemins relatifs, relayés par nginx vers l'API.
RUN npm run build

# ---------------------------------------------------------------------------------
# Étape 2 : service des fichiers statiques
#
# L'image finale ne contient ni Node, ni les sources, ni node_modules : uniquement le
# bundle et nginx.
# ---------------------------------------------------------------------------------
FROM nginx:alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist/gamenote-ui/browser /usr/share/nginx/html

EXPOSE 80
