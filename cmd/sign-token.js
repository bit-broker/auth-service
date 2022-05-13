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

// Check params
if (!process.argv[2]) {
    console.log('Scope needs to be provided')
    process.exit(1)
}

if (!process.argv[3]) {
    console.log('JTI needs to be provided')
    process.exit(1)
}

jose.JWK.asKeyStore(process.env.JWKS.toString().toString())
    .then(async (keyStore) => {
        const [key] = keyStore.all({ use: 'sig' })

        // Construct the payload
        const opt = { compact: true, jwk: key, fields: { typ: 'jwt' } }
        const payload = JSON.stringify({
            iss: process.env.ISSUER,
            jti: process.argv[3],
            scp: process.argv[2],
        })

        // Sign the payload
        const token = await jose.JWS.createSign(opt, key).update(payload).final()
        console.log(token)
    })
    .catch((_error) => {
        console.log(_error)
        process.exit(1)
    })
