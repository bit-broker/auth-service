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
    console.log('KS needs to be provided')
    process.exit(1)
}

jose.JWK.asKeyStore(Buffer.from(process.argv[2], 'base64').toString())
    .then((_keyStore) => {
        // Exit with success
        process.exit(0)
    })
    .catch((_error) => {
        // Exit with error
        process.exit(1)
    })
