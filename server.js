/*
 * File Name : server.js
 * Creation Date : 14-02-2021
 * Written by : Jean Diaconu <jdiaconu@cisco.com>
 * Copyright (C) Cisco System Inc - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict'

const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const log4js = require('log4js')
const compress = require('compression')
const helmet = require('helmet')
const promBundle = require('express-prom-bundle')

const Utils = require('./server/Utils')

// Configuration
require('dotenv').config()

// Running context
const app = express()

// Make the loggers
log4js.configure({
    appenders: [
        {
            type: 'console',
        },
    ],
    replaceConsole: true,
    levels: {
        '[all]': process.env.LOG_LEVEL,
    },
})
const logger = log4js.getLogger('server')

// Configure the server
app.use(compress())
app.use(bodyParser.json({ limit: '5mb' }))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(helmet()) // iFrame + XSS injection protection
app.disable('x-powered-by') // removes the express 'advert' header value

// Configure CORS
const cors = require('cors')
if (process.env.NODE_ENV === 'development') {
    logger.debug('Using CORS')
    app.options('*', cors())

    app.all('/*', function (_req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'PUT,GET,DELETE,PATCH')
        res.setHeader('Access-Control-Allow-Credentials', true)
        res.setHeader(
            'Access-Control-Allow-Headers',
            'X-Requested-With,content-type,Origin,Accept,Authorization'
        )
        next()
    })
} else if (process.env.UI_URL) {
    app.options(process.env.UI_URL, cors())

    app.all('/*', function (_req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', process.env.UI_URL)
        res.setHeader('Access-Control-Allow-Methods', 'PUT,GET,DELETE,PATCH')
        res.setHeader('Access-Control-Allow-Credentials', true)
        res.setHeader(
            'Access-Control-Allow-Headers',
            'X-Requested-With,content-type,Origin,Accept,Authorization'
        )
        next()
    })
}

// Setup metrics
if (process.env.METRICS_ENABLED === 'true') {
    const metricsMiddleware = promBundle({ includeMethod: true })
    app.use(metricsMiddleware)
}

//************************
//* Clients
//************************
if (process.env.NODE_ENV !== 'test') {
    const redis = require('./server/external/redis/RedisClient')
    redis.init()
}

// Setup the API routes
const API_Router = express.Router()
require('./server/Routes')(API_Router)
app.use('/api/v1', API_Router)

// Catch some errors

// Catch 404 and forward to error handler
app.use(function (_req, _res, next) {
    const err = new Error('Not Found')
    err.status = 404
    next(err)
})

// Error handler
app.use(function (err, req, res, _next) {
    const status = err.status || 500
    logger.error({
        url: req.url,
        body: req.body,
    })
    logger.error(err)
    logger.error(err.stack)
    res.status(status)
    res.send(err.message)
})

// API Log
app.use((req, _res, next) => {
    // Log route
    logger.info(JSON.stringify(Utils.prettyReq(req)))

    next()
})

// Start the server
const port = process.env.SERVER_PORT || 8080
const server = app.listen(port, () => {
    logger.info(`Listening on ${port}`)
})
module.exports = server
