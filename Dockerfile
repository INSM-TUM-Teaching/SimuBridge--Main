FROM node:16-alpine AS baseimage
ENV NODE_ENV development
# Add a work directory
WORKDIR /app

FROM baseimage as installapplication
COPY package.json .
COPY package-lock.json .

# Copy only the node workspaces to main folder
COPY . tmp/allfiles
RUN sh -c "npx json -f package.json | npx json -c \"this.workspaces.forEach(workspace => console.log('cp -r ./tmp/allfiles/' +  workspace + ' ./'+workspace))\" | /bin/sh"
RUN rm -r ./tmp/allfiles

FROM installapplication as installdependencies
# Cache and Install dependencies
RUN npm install  --legacy-peer-deps

FROM installdependencies as run
# Expose port
EXPOSE 3000
# Start the app 
## change "dev" to "client" when u are ready to test production build sherry: i change it for hotreloading
CMD [ "npm", "run", "client" ]
