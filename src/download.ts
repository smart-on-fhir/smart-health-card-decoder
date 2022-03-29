// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import axios from "axios";
import constants from "./constants.js";



let _axios = axios.create({
    timeout: constants.DOWNLOAD_TIMEOUT
});


function download<T>(url: string): Promise<T> {

    return _axios.get(url)
        .then(response => {
            return response.data as T;
        });

}

export default download;