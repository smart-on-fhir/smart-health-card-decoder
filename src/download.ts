// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import axios from "axios";
import Context from "./context.js";
import { ErrorCode } from "./error.js";


const DOWNLOAD_TIMEOUT = 5000; // 5 seconds

let _axios = axios.create({
    timeout: DOWNLOAD_TIMEOUT
});


function download<T>(url: string, context: Context): Promise<T|undefined> {

    return _axios.get(url)
        .then(response => {
            return response.data as T;
        })
        .catch(error => {
            context.log.fatal(`Failed to download ${url} : ${error.toString()}`, ErrorCode.DOWNLOAD_FAILED);
            return undefined;
        });

}

export default download;