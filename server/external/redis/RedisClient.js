/**
 * Copyright 2021 Cisco and its affiliates
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * File Name : RedisClient.js
 * Creation Date : 02-07-2021
 * Written by : Jean Diaconu <jdiaconu@cisco.com>
 */

'use strict'

const log4js = require('log4js')
const logger = log4js.getLogger('external.redis')

// Redis client
const redis = require('redis')

// Redis mock client
const redisMock = require('redis-mock')

const _ = require('lodash')

class RedisClient {
    init() {
        logger.info('Redis client initialized')
        if (process.env.NODE_ENV === 'test') {
            this.client = redisMock.createClient({ legacyMode: true })
        } else {
            this.client = redis.createClient({
                url: `redis://${process.env.REDIS_ADDR}?db=${process.env.REDIS_DB}&password=${process.env.REDIS_PASSWORD}`,
                legacyMode: true,
            })
        }
    }

    get(jti) {
        return new Promise((resolve, reject) => {
            this.client.get(jti, (err, res) => {
                if (err) {
                    logger.error(err)
                    return reject(err)
                }

                return resolve(_.isEmpty(res) ? {} : JSON.parse(res))
            })
        })
    }

    deny(jti, values) {
        return new Promise((resolve, reject) => {
            logger.debug(`Saving values ${JSON.stringify(values)} for jti ${jti}`)
            this.client.set(jti, JSON.stringify(values), (err, _res) => {
                if (err) {
                    logger.error(err)
                    return reject(err)
                }

                return resolve()
            })
        })
    }
}

module.exports = new RedisClient()
