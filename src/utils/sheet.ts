import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

import * as config from '../config.json';

let sheets: GoogleSpreadsheet;
export let sheet: GoogleSpreadsheetWorksheet;

if (config.keyapp.auth.sheet_id.length > 0) {
	sheets = new GoogleSpreadsheet(config.keyapp.auth.sheet_id, new JWT({
		email: config.keyapp.auth.credentials.client_email,
		key: config.keyapp.auth.credentials.private_key,
		scopes: [
			'https://www.googleapis.com/auth/spreadsheets',
		],
	}));
	sheets.loadInfo().then(() => sheet = sheets.sheetsByIndex[0]);
}

export function isSheetLoaded() {
	return Boolean(sheet);
}
