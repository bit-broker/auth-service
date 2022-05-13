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
 * File Name : Routes.js
 * Creation Date : 14-04-2021
 * Written by : Jean Diaconu <jdiaconu@cisco.com>
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
    router.delete('/token', JWT.deny)
    router.get('/token/check/:jti', JWT.checkJti, JWT.jtiOk)
    router.post('/token/check', JWT.checkJti, JWT.jtiOk)
    router.post('/token', JWT.token)
    router.post('/token/refresh', JWT.decode, JWT.checkJti, JWT.refresh)
}
