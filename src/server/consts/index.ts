export { ROUTE } from './routes';
export const MESSAGES = {
	BOT_HEALTH_OK: 'Bot health is OK',
};

export enum HTTP_STATUS {
	OK = 200,
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	NOT_FOUND = 404,
	INTERNAL_SERVER_ERROR = 500,
}
