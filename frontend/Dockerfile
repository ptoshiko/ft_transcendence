FROM nginx:1.24-bullseye

COPY nginx.conf /etc/nginx/nginx.conf

WORKDIR /app

COPY index.html .

COPY ./src ./src