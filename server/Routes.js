/*
 * File Name : Routes.js
 * Creation Date : 14-04-2021
 * Written by : Jean Diaconu <jdiaconu@cisco.com>
 * Copyright (C) Cisco System Inc - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict'

// Get package version
const pjson = require('../package.json')

const JWT = require('./controllers/JWTController')

module.exports = function (router) {
    // Health Check route
    router.get('/', (_req, res) => {
        res.send(
            'Auth Service Version ' +
                pjson.version +
                ' in ' +
                (process.env.NODE_ENV || 'production') +
                ' is up & running'
        )
    })

    // API Routes
    router.get('/.well-known/jwks.json', JWT.publicKeyStore)
    router.post('/token', JWT.token)
}
