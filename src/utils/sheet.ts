import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

import * as config from '../config.json';

let sheets: GoogleSpreadsheet;
export let sheet: GoogleSpreadsheetWorksheet;

if (config.keyapp_legacy.auth.sheet_id.length > 0) {
	sheets = new GoogleSpreadsheet(config.keyapp_legacy.auth.sheet_id, new JWT({
		email: config.keyapp_legacy.auth.credentials.client_email,
		key: config.keyapp_legacy.auth.credentials.private_key,
		scopes: ['https://www.googleapis.com/auth/spreadsheets'],
	}));
	sheets.loadInfo().then(() => sheet = sheets.sheetsByIndex[0]);
}
