import Context from './context.js';
import {download as urlDownload} from './download.js';
import constants from './constants.js';
import { CvxCode } from './types.js';

const LABEL = 'CVX';

async function download(context: Context): Promise<{ [key: number]: CvxCode } | undefined> {

    const log = context.log(LABEL);

    const url = constants.CVX_ALL_CODES_URL;

    const data = await urlDownload<string>(url).catch(err => {
        log.fatal(`Error downloading CVX codes ${err.toString()}.`);
        return;
    })

    if (!data || typeof data !== 'string') {
        log.fatal(`No CVX data downloaded.`);
        return;
    }

    const rows: string[] = data.trim().split(/\r?\n/);

    const allCvxCodes = rows
        .map(row => {
            const [name, description, cvx, manufacturer, mvx, mvxStatus, status, updated] = row.split('|');
            return {
                name,
                description,
                cvx: parseInt(cvx.trim()),
                manufacturer: manufacturer.trim().replace(', Inc', ''),
                mvx: mvx.trim(),
                mvxStatus,
                status,
                updated: new Date(updated)
            };
        });

    const covidCvxCodes = allCvxCodes.filter(entry => entry.description?.startsWith('COVID-19'));

    const indexCvxCodes: { [key: number]: CvxCode } = {};

    covidCvxCodes.forEach(code => {
        indexCvxCodes[code.cvx] = code;
    });

    return indexCvxCodes;
}

// default list for when we don't download the latest list
let defaults: { [key: number]: CvxCode } = constants.CVX_DEFAULT_CODES;

export { download, defaults };
