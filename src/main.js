import * as Sentry from "@sentry/browser";
import App from "./App.svelte";

if (process.env.APP_ENV === "prod") {
	Sentry.init({
		dsn: "https://e2fe533d9a284126a1b10787757ce805@o422923.ingest.sentry.io/5918714",
		tracesSampleRate: 1.0,
	});
}

const app = new App({
	target: document.body,
});

export default app;
