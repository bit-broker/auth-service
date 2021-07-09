/*
 * File Name : RedisClient.js
 * Creation Date : 02-07-2021
 * Written by : Jean Diaconu <jdiaconu@cisco.com>
 * Copyright (C) Cisco System Inc - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
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
            this.client = redisMock.createClient()
        } else {
            this.client = redis.createClient(
                `redis://${process.env.REDIS_ADDR}?db=${process.env.REDIS_DB}&password=${process.env.REDIS_PASSWORD}`
            )
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
