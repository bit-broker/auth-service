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

    static response(promise, res, next) {
        promise
            .then((response) => {
                return res.json(response)
            })
            .catch((err) => {
                return next(err)
            })
    }
}

module.exports = Utils
