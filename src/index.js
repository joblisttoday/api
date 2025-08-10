import { Hono } from "hono";
import providersRoute from "./providers.js";
import sqliteRoute from "./sqlite.js";
import webhooksRoute from "./webhooks.js";

// the global app root routes
const app = new Hono();

// routes
app.notFound((c) => {
	return c.text("404 — Page not found", 404);
});
app.onError((error, c) => {
	return c.json({
		error,
	});
});

/* root route */
app.get("/", (c) => {
	return c.json({
		message: "Welcome to the joblist api (internal alpha)",
		documentationUrl: "https://gitlab.com/joblist/api-wrangler",
	});
});

/* sub routes apps */
app.route("/providers", providersRoute);
app.route("/sqlite", sqliteRoute);
app.route("/webhooks", webhooksRoute);

export default app;
