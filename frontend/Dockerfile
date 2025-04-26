FROM node:18
WORKDIR /app
COPY package.json .
COPY vite.config.js .
RUN npm install --verbose
RUN mkdir node_modules/.vite && chmod -R 777 node_modules/.vite
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]