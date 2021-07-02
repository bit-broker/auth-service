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

const log4js = require('log4js')
const logger = log4js.getLogger('jwt.controller')

const Utils = require('../Utils')

// JWT Controller
class JWTController {
    static publicKeyStore(_req, res, next) {
        logger.info('Returning the JWKS')

        return Utils.response(JWTService.publicKeyStore(), res, next)
    }

    static token(req, res, next) {
        logger.info('Signing a token with JWKS')

        return Utils.response(JWTService.token(req.body), res, next)
    }

    static deny(req, res, next) {
        logger.info('Adding JTIs to the denylist')

        return Utils.response(JWTService.deny(req.body.jtis), res, next)
    }

    static check(req, res, next) {
        logger.info('Checking if jti allowed')

        return Utils.response(JWTService.check(req.params.jti), res, next)
    }
}

module.exports = JWTController
