import { Hono } from "hono";
import { cors } from "hono/cors";
import initDb, { sqliteToJson } from "./utils/db.js";

const DEFAULT_DAYS = 365;

const sqliteRoute = new Hono();
sqliteRoute.use("/*", cors());

sqliteRoute.get("/", (c) => {
	return c.json({
		companies: "/companies",
		"companies/:slug": "/companies/:slug",
		jobs: "/jobs",
		"jobs/:id": "/jobs/:id",
		"heatmap/jobs": "/heatmap/jobs",
		"heatmap/companies": "/heatmap/companies",
		"heatmap/companies/:slug": "/heatmap/companies/:slug",
	});
});

sqliteRoute.get("/companies", async (c) => {
	const db = await initDb();
	const res = await db.exec("SELECT * FROM companies");
	return c.json(sqliteToJson(res));
});
sqliteRoute.get("/companies/:slug", async (c) => {
	const db = await initDb();
	const { slug } = c.req.param();
	const res = await db.exec(`SELECT * FROM companies WHERE slug = ?`, [slug]);
	return c.json(sqliteToJson(res));
});
sqliteRoute.get("/jobs", async (c) => {
	const db = await initDb();
	const res = await db.exec("SELECT * FROM jobs");
	return c.json(sqliteToJson(res));
});
sqliteRoute.get("/jobs/:id", async (c) => {
	const db = await initDb();
	const { id } = c.req.param();
	const res = await db.exec(`SELECT * FROM jobs WHERE objectId = ?`, [id]);
	return c.json(sqliteToJson(res));
});
sqliteRoute.get("/heatmap", async (c) => {
	const db = await initDb();
	const days = c.req.query("days") || DEFAULT_DAYS;
	const res = await db.exec(
		`select count(*) as total, company_slug, published_date AS date FROM jobs WHERE published_date >= DATE('now', '-' || ? || ' ' || 'days') GROUP BY date;`,
		[days],
	);
	return c.json(sqliteToJson(res));
});
sqliteRoute.get("/heatmap/:slug", async (c) => {
	const db = await initDb();
	const { slug } = c.req.param();
	const days = c.req.query("days") || DEFAULT_DAYS;
	const res = await db.exec(
		`select count(*) as total, company_slug, published_date AS date FROM jobs WHERE published_date >= DATE('now', '-' || ? || ' ' || 'days') AND company_slug = ? GROUP BY date;`,
		[days, slug],
	);
	return c.json(sqliteToJson(res));
});

export default sqliteRoute;
