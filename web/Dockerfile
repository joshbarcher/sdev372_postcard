# Two stages. The first has node, npm and every dev dependency; the second has
# nginx and the built files. Only the second is shipped -- about 50 MB instead
# of about 400.
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# VITE_ variables are read at BUILD time, not at run time. This is the thing
# that surprises people: changing the API address means rebuilding the image.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
