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

    let index = urls.length;
    const results: T[] = [];

    return new Promise((resolve, reject) => {

        const f = async () => {
            const result = await download<T>(urls[--index]).catch(err => {
                return undefined as unknown as T;
            });
            results.push(result);
            if (results.length === urls.length) {
                resolve(results);
            } else if (index >= 0) {
                f();
            }
        }

        for (let i = 0; i < Math.min(urls.length, constants.DOWNLOAD_INSTANCES); i++) {
            f();
        }
    });

}
