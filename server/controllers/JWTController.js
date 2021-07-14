/*
 * File Name : JWTController.js
 * Creation Date : 14-04-2021
 * Written by : Jean Diaconu <jdiaconu@cisco.com>
 * Copyright (C) Cisco System Inc - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict'

const JWTService = require('../services/JWTService')

const crypto = require('crypto')

const log4js = require('log4js')
const logger = log4js.getLogger('jwt.controller')

const Utils = require('../Utils')

const _ = require('lodash')

// JWT Controller
class JWTController {
    static publicKeyStore(_req, res, next) {
        logger.info('Returning the JWKS')

        return Utils.response(JWTService.publicKeyStore(), res, next)
    }

    static token(req, res, next) {
        logger.info('Signing a token with JWKS')

        // Check values and generate payload
        const values = req.body
        const payload = {}

        // Add aud
        payload.aud = values.aud

        // Check if scope is present
        if (!values.scope) {
            return next(Utils.createError('Invalid values', 400))
        }
        payload.scope = values.scope

        // Get current time
        const currentTime = Math.round(new Date().getTime() / 1000)

        // Check and convert exp value
        const parsedExp = Math.round(Number(values.exp))
        if (!_.isUndefined(values.exp) && (_.isNaN(parsedExp) || parsedExp <= currentTime)) {
            return next(Utils.createError('Invalid values', 400))
        }
        payload.exp = isNaN(parsedExp)
            ? currentTime + Math.round(Number(process.env.JWT_DURATION))
            : parsedExp

        // Generate payload
        payload.iss = process.env.ISSUER
        payload.iat = currentTime
        payload.jti = crypto.randomUUID()

        // Check if needs refresh token
        if (isNaN(parsedExp)) {
            const refreshPayload = {
                iat: payload.iat,
                iss: payload.iss,
                jti: payload.jti,
                typ: 'Refresh',
                claims: {
                    scope: payload.scope,
                    aud: payload.aud,
                },
            }

            return Utils.response(
                Promise.all([JWTService.create(payload), JWTService.create(refreshPayload)]).then(
                    (values) => {
                        return { token: values[0], jti: payload.jti, refresh_token: values[1] }
                    }
                ),
                res,
                next
            )
        } else {
            return Utils.response(
                JWTService.create(payload).then((token) => {
                    return { token, jti: payload.jti }
                }),
                res,
                next
            )
        }
    }

    static decode(req, _res, next) {
        logger.info('Decoding token')

        // Get and validate refresh token
        const refreshToken = req.body.refresh_token || req.body.token
        if (_.isUndefined(refreshToken)) {
            return next(Utils.createError('Invalid values', 400))
        }

        return Utils.next(
            JWTService.decode(refreshToken).then((payload) => {
                logger.debug(`Checking payload ${JSON.stringify(payload)}`)

                // Set payload
                req.payload = payload
                req.jti = payload.jti
            }),
            next
        )
    }

    static refresh(req, res, next) {
        logger.info('Refreshing a token')

        // Check refresh type
        if (req.payload.typ !== 'Refresh') {
            return next(Utils.createError('Invalid refresh token', 400))
        }

        // Get current time
        const currentTime = Math.round(new Date().getTime() / 1000)

        // Create payload
        const payload = {
            iat: currentTime,
            iss: req.payload.iss,
            jti: req.jti,
            exp: currentTime + Math.round(Number(process.env.JWT_DURATION)),
            scope: req.payload.claims.scope,
            aud: req.payload.claims.aud,
        }

        return Utils.response(
            JWTService.create(payload).then((token) => {
                return { token, jti: payload.jti }
            }),
            res,
            next
        )
    }

    static deny(req, res, next) {
        logger.info('Adding JTIs to the denylist')

        // Check jtis format
        const jtis = req.body.jtis
        if (!_.isArray(jtis)) {
            return next(Utils.createError('Invalid values', 400))
        }

        return Utils.response(JWTService.deny(jtis), res, next)
    }

    static checkJti(req, _res, next) {
        logger.info('Checking if jti allowed')

        const jti = req.jti || req.params.jti || req.headers['x-auth-jti']
        if (!Utils.isUUIDv4(jti)) {
            return next(Utils.createError('Invalid value', 400))
        }

        return Utils.next(
            JWTService.check(jti).catch((error) => {
                throw Utils.newError(error.message, 403)
            }),
            next
        )
    }

    static jtiOk(_req, res, _next) {
        logger.info('Sending jti allowed')

        res.sendStatus(200)
    }
}

module.exports = JWTController
