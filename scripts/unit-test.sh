#!/bin/bash -e
docker run $(docker build -q .) npm run coverage
