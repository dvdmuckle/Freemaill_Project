FROM cusspvz/node
COPY . /app
RUN npm install -g
ENTRYPOINT ["node", "bin/www"]
