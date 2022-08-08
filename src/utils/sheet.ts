/* eslint-disable @typescript-eslint/no-explicit-any */

import { GoogleSpreadsheet } from 'google-spreadsheet';

import * as config from '../config.json';

let sheets: any;
export let sheet: any;

if (config.google_api_key.length > 0) {
	sheets = new GoogleSpreadsheet(config.key_application_sheet_id);
	sheets.useApiKey(config.google_api_key);
	sheets.loadInfo().then(() => sheet = sheets.sheetsByIndex[0]);
}

export function isSheetLoaded() {
	return Boolean(sheet);
}
