# # pull official base image
# FROM node:13.12.0-alpine

# # set working directory
# WORKDIR /app

# # add `/app/node_modules/.bin` to $PATH
# ENV PATH /app/node_modules/.bin:$PATH

# # install app dependencies
# COPY package.json ./
# COPY package-lock.json ./
# RUN npm install --silent
# RUN npm install react-scripts@3.4.1 -g --silent
# RUN npm i -g notablog

# # add app
# COPY . ./

# # start app
# CMD ["npm", "start"]

#Start from the pre-existing official Node image
FROM node:20.3.1
#Specifies directory for all subsequent actions in image filesystem (never host's filesystem)
#"/usr/local/bin/" is what Heroku takes as the "root" folder. Files MUST be added here or they cannot be found!
WORKDIR /usr/local/bin/web
#Copies the app's source code into the image's filesystem
COPY . /usr/local/bin/web/
#Installs packages for Express framework. Runs in container root directory.
RUN npm install
#Installs packages for React app
RUN npm install --prefix client
#Builds React app
RUN npm run --prefix client build
#Runs the app when container launches. Same as running in console
CMD ["npm", "start"]