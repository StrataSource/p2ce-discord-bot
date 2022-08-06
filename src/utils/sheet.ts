import { GoogleSpreadsheet } from 'google-spreadsheet';

import * as config from '../config.json';

const sheets = new GoogleSpreadsheet(config.key_application_sheet_id);
sheets.useApiKey(config.google_api_key);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let sheet: any;
sheets.loadInfo().then(() => sheet = sheets.sheetsByIndex[0]);

export function isSheetLoaded() {
	return Boolean(sheet);
}
