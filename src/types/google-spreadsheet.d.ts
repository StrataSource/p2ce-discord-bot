declare module 'google-spreadsheet' {
	export class GoogleSpreadsheetCell {
		value: boolean | number | string | undefined;
		backgroundColor?: { red?: number, green?: number, blue?: number };
	}

	export class GoogleSpreadsheetWorksheet {
		loadCells(cellRange: string): Promise<void>;
		getCellByA1(cell: string): GoogleSpreadsheetCell;
		rowCount: number;
	}

	export class GoogleSpreadsheet {
		constructor(sheet_key: string);
		useApiKey(key: string): void;
		loadInfo(): Promise<void>;
		sheetsByIndex: Array<GoogleSpreadsheetWorksheet>;
	}	
}
