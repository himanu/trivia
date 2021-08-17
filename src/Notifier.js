import {notification} from './utils';

export function send(message, type = "default", timeout,typeOfNotification) {
	notification.set({ type, message, timeout,typeOfNotification });
}

export function info(msg,typeOfNotification,timeout) {
	send(msg, "info", timeout,typeOfNotification);
}