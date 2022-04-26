import axios from "axios";
import constants from "./constants.js";



let _axios = axios.create({
    timeout: constants.DOWNLOAD_TIMEOUT
});


export function download<T>(url: string): Promise<T> {
    return _axios.get(url)
        .then(response => {
            return response.data as T;
        });
}


export function downloads<T>(urls: string[]): Promise<T[]> {
    return Promise.all(urls.map<Promise<T>>(u => download(u)))
}
