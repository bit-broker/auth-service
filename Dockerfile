# Copyright 2022 Cisco and its affiliates
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# SPDX-License-Identifier: Apache-2.0

# Pull base image.
FROM node:16-alpine3.12

# Create a group and user
RUN addgroup -S web && adduser -S -G web web

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
