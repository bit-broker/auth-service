/*
 * File Name : JWTService.js
 * Creation Date : 14-04-2021
 * Written by : Jean Diaconu <jdiaconu@cisco.com>
 * Copyright (C) Cisco System Inc - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict'

const crypto = require('crypto')

const log4js = require('log4js')
const logger = log4js.getLogger('jwt.service')

const redis = require('../external/redis/RedisClient')

const jose = require('node-jose')

const _ = require('lodash')

const Utils = require('../Utils')

// JWT Service
class JWTService {
    static publicKeyStore() {
        logger.debug('Reading the JWKS')

        return new Promise((resolve, reject) => {
            // Read JWKS from env
            const data = process.env.JWKS

            jose.JWK.asKeyStore(data.toString())
                .then((keyStore) => {
                    // IMPORTANT: Without true to hide the private part
                    resolve(keyStore.toJSON())
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }

    static token(values) {
        logger.debug('Signing a token with JWKS')

        return new Promise((resolve, reject) => {
            if (!values.scope) {
                reject(Utils.createError('Invalid values', 400))
                return
            }

            // Read JWKS from env
            const data = process.env.JWKS

            jose.JWK.asKeyStore(data.toString())
                .then(async (keyStore) => {
                    const [key] = keyStore.all({ use: 'sig' })

                    // Construct the payload
                    const jti = crypto.randomUUID()
                    const opt = { compact: true, jwk: key, fields: { typ: 'jwt' } }
                    const payload = JSON.stringify({
                        iss: process.env.ISSUER,
                        aud: values.aud,
                        jti: jti,
                        scp: values.scope,
                    })

                    // Sign the payload
                    const token = await jose.JWS.createSign(opt, key).update(payload).final()

                    // Return the token and the identifier
                    resolve({ token, jti })
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }

    static deny(jtis) {
        logger.debug(`Denying jtis ${JSON.stringify(jtis)}`)
        if (!_.isArray(jtis)) {
            return new Promise((_resolve, reject) => {
                reject(Utils.createError('Invalid values', 400))
            })
        }

        // Build promises array
        const promises = []
        for (const jti of jtis) {
            // Check valid UUIDv4
            if (Utils.isUUIDv4(jti)) {
                promises.push(
                    redis.deny(jti, {
                        date: Date.now(),
                    })
                )
            }
        }

        return Promise.allSettled(promises)
    }

    static check(jti) {
        logger.debug(`Checking jti ${JSON.stringify(jti)}`)
        return new Promise((resolve, reject) => {
            if (!Utils.isUUIDv4(jti)) {
                reject(Utils.createError('Invalid value', 400))
                return
            }

            redis
                .get(jti)
                .then((values) => {
                    if (!_.isEmpty(values)) {
                        reject(Utils.createError('Denied', 403))
                        return
                    }

                    resolve()
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }
}

module.exports = JWTService
