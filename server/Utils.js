/*
 * File Name : Utils.js
 * Creation Date : 14-04-2021
 * Written by : Jean Diaconu <jdiaconu@cisco.com>
 * Copyright (C) Cisco System Inc - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict'

class Utils {
    // Common
    static isUUIDv4(uuid) {
        const UUIDv4regex = /^[A-F\d]{8}-[A-F\d]{4}-4[A-F\d]{3}-[89AB][A-F\d]{3}-[A-F\d]{12}$/i
        return UUIDv4regex.test(uuid)
    }

    static prettyReq(req) {
        return {
            api: {
                route: req.url,
                params: req.params,
                method: req.method,
            },
            body: req.body,
            query: req.query,
        }
    }

    static next(promise, next) {
        return promise
            .then(() => {
                return next()
            })
            .catch((error) => {
                return next(error)
            })
    }

    static response(promise, res, next) {
        promise
            .then((response) => {
                return res.json(response)
            })
            .catch((err) => {
                return next(err)
            })
    }

    static createError(message, status) {
        const error = new Error(message)
        if (status) {
            error.status = status
        }
        return error
    }

    static newError(message, status) {
        throw this.createError(message, status)
    }
}

module.exports = Utils
