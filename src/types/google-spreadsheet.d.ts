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
		useServiceAccountAuth(creds: {
			type: string,
			project_id: string,
			private_key_id: string,
			private_key: string,
			client_email: string,
			client_id: string,
			auth_uri: string,
			token_uri: string,
			auth_provider_x509_cert_url: string,
			client_x509_cert_url: string,
		}): Promise<void>;
		loadInfo(): Promise<void>;
		sheetsByIndex: Array<GoogleSpreadsheetWorksheet>;
	}	
}
