FROM nginx:1.24-bullseye

RUN mkdir /etc/nginx/ssl

RUN	apt-get update

RUN	apt-get install -y openssl

RUN openssl req -newkey rsa:4096 -x509 -sha256 -days 365 -nodes \
       -out /etc/nginx/ssl/mmalphit.crt \
       -keyout /etc/nginx/ssl/mmalphit.key \
       -subj "/C=FR/ST=Paris/L=Paris/O=42 School/OU=mmalphit/CN=mmalphit/"

COPY nginx.conf /etc/nginx/nginx.conf

WORKDIR /app

COPY index.html .

COPY style.css .

COPY ./src ./src