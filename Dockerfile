FROM nginx:1.12-alpine

RUN rm -rf /usr/share/nginx/html
COPY app /usr/share/nginx/html

EXPOSE 80
