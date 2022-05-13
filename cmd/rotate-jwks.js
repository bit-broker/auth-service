/**
 * Copyright 2022 Cisco and its affiliates
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

/* eslint-disable no-console */

const jose = require('node-jose')

// Get old key store
if (!process.argv[2]) {
    console.log('Old KS needs to be provided')
    process.exit(1)
}

jose.JWK.asKeyStore(Buffer.from(process.argv[2], 'base64').toString())
    .then((keyStore) => {
        // Don't rotate if 2 keys exist
        const json = keyStore.toJSON(true)
        if (json.keys.length > 1) {
            console.log(Buffer.from(JSON.stringify(json)).toString('base64'))
            process.exit(1)
        }

        return keyStore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' }).then((_result) => {
            // Ouput new keys
            console.log(
                Buffer.from(JSON.stringify(keyStore.toJSON(true).keys.reverse())).toString('base64')
            )
        })
    })
    .catch((_error) => {
        console.log(_error)
        process.exit(1)
    })
