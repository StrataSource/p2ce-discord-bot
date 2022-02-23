import * as config from '../config.json';

export function hasToken(): boolean {
	return config.token !== null && config.token !== undefined && config.token !== '';
}
