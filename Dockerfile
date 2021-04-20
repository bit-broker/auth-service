# Pull base image.
FROM node:latest

# Create a group and user
RUN addgroup web && useradd web -g web

RUN mkdir /var/web && \
    chown -R web:web /var/web

# Set the working directory
WORKDIR /var/web

# Install Node packages
ADD --chown=web:web package.json ./package.json
RUN npm install

# Bundle app source
ADD --chown=web:web . .

# Create logs folder and expose it as a volume
RUN mkdir -p ./logs && \
    chown -R web:web /var/web
VOLUME /var/web/logs

# Expose data volume
RUN mkdir /data && \
    chown -R web:web /data
VOLUME /data

# Set non root user
USER web

# Expose port and start the application
EXPOSE  3000
CMD ["node", "--max-old-space-size=4096", "server.js"]
