import { Hono } from "hono";
import providersRoute from "./providers.js";
import sqliteRoute from "./sqlite.js";

// the global app root routes
const app = new Hono();

// routes
app.notFound((c) => {
	return c.text("Custom 404 Message", 404);
});

app.onError((error, c) => {
	return c.json({
		error,
	});
});
app.get("/", (c) => {
	return c.json({
		message: "Welcome to the joblist api",
		documentationUrl: "https://gitlab.com/joblist/api-wrangler",
	});
});
app.route("/providers", providersRoute);
app.route("/sqlite", sqliteRoute);

export default app;
