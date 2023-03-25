import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';

import * as config from '../config.json';

let sheets: GoogleSpreadsheet;
export let sheet: GoogleSpreadsheetWorksheet;

if (config.keyapp.auth.sheet_id.length > 0) {
	sheets = new GoogleSpreadsheet(config.keyapp.auth.sheet_id);
	sheets.useServiceAccountAuth(
		config.keyapp.auth.credentials
	).then(
		() => sheets.loadInfo()
	).then(
		() => sheet = sheets.sheetsByIndex[0]
	);
}

export function isSheetLoaded() {
	return Boolean(sheet);
}
