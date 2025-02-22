import { Hono } from "hono";
import { cors } from "hono/cors";
import initDb, { sqliteToJson } from "./utils/db.js";

const sqliteRoute = new Hono();
sqliteRoute.use("/*", cors());

const DEFAULT_DAYS = 365;

const FRAGMENTS = {
	company:
		"*, JSON_EXTRACT(positions, '$') as positions, JSON_EXTRACT(tags, '$') as tags",
};
const QUERIES = {
	stats: `
		SELECT
			(SELECT COUNT(*) FROM companies) AS total_companies,
			(SELECT COUNT(*) FROM jobs) AS total_jobs
	`,
	companies: `SELECT ${FRAGMENTS.company} FROM companies`,
	company: `SELECT ${FRAGMENTS.company} FROM companies WHERE id = ?`,
	searchCompanies: "SELECT * FROM companies_fts WHERE companies_fts MATCH ?",
	searchJobs: "SELECT * FROM jobs_fts WHERE jobs_fts MATCH ?",
	searchCompanyJobs:
		"SELECT * FROM jobs_fts WHERE company_id = ? AND jobs_fts MATCH ?",
	jobs: "SELECT * FROM jobs",
	job: "SELECT * FROM jobs WHERE objectId = ?",
	heatmap:
		"SELECT count(*) AS total, company_id, published_date AS date FROM jobs WHERE published_date >= DATE('now', '-' || ? || ' ' || 'days') GROUP BY date",
	heatmapCompany:
		"SELECT count(*) AS total, company_id, published_date AS date FROM jobs WHERE published_date >= DATE('now', '-' || ? || ' ' || 'days') AND company_id = ? GROUP BY date;",
	tagsCompanies:
		"SELECT tag, COUNT(*) AS count FROM (SELECT json_each.value AS tag FROM companies, json_each(companies.tags)) AS tags GROUP BY tag",
	tagsCompany: `SELECT ${FRAGMENTS.company} FROM companies WHERE EXISTS (SELECT 1 FROM json_each(companies.tags) AS tags WHERE tags.value = ?)`,
};

const buildQuery = (name) => {
	const query = QUERIES[name];
	return query.toString();
};

sqliteRoute.get("/", (c) => {
	return c.json({
		companies: "/companies",
		"companies/:id": "/companies/:id",
		jobs: "/jobs",
		"jobs/:id": "/jobs/:id",
		heatmap: "/heatmap/jobs",
		"heatmap/:id": "/heatmap/:id",
		"stats": "/stats",
	});
});

sqliteRoute.get("/search/companies", async (c) => {
	const db = await initDb();
	const query = c.req.query("query") || "";
	const res = await db.exec(QUERIES.searchCompanies, [query]);
	return c.json(sqliteToJson(res));
});

sqliteRoute.get("/search/jobs", async (c) => {
	const db = await initDb();
	const query = c.req.query("query") || "";
	const res = await db.exec(QUERIES.searchJobs, [query]);
	return c.json(sqliteToJson(res));
});

sqliteRoute.get("/search/jobs/:id", async (c) => {
	const db = await initDb();
	const { id } = c.req.param();
	const query = c.req.query("query") || "";
	const res = await db.exec(QUERIES.searchCompanyJobs, [id, query]);
	return c.json(sqliteToJson(res));
});

sqliteRoute.get("/companies", async (c) => {
	const db = await initDb();
	const res = await db.exec(QUERIES.companies);
	return c.json(sqliteToJson(res));
});
sqliteRoute.get("/companies/:id", async (c) => {
	const db = await initDb();
	const { id } = c.req.param();
	const res = await db.exec(QUERIES.company, [id]);
	return c.json(sqliteToJson(res));
});
sqliteRoute.get("/jobs", async (c) => {
	const db = await initDb();
	const res = await db.exec(QUERIES.jobs);
	return c.json(sqliteToJson(res));
});
sqliteRoute.get("/jobs/:id", async (c) => {
	const db = await initDb();
	const { id } = c.req.param();
	const res = await db.exec(QUERIES.job, [id]);
	return c.json(sqliteToJson(res));
});
sqliteRoute.get("/heatmap", async (c) => {
	const db = await initDb();
	const days = c.req.query("days") || DEFAULT_DAYS;
	const res = await db.exec(QUERIES.heatmap, [days]);
	return c.json(sqliteToJson(res));
});
sqliteRoute.get("/heatmap/:id", async (c) => {
	const db = await initDb();
	const { id } = c.req.param();
	const days = c.req.query("days") || DEFAULT_DAYS;
	const res = await db.exec(QUERIES.heatmapCompany, [days, id]);
	return c.json(sqliteToJson(res));
});

sqliteRoute.get("/tags/companies", async (c) => {
	const db = await initDb();
	const res = await db.exec(QUERIES.tagsCompanies);
	return c.json(sqliteToJson(res));
});

sqliteRoute.get("/tags/companies/:tag", async (c) => {
	const db = await initDb();
	const { tag } = c.req.param();
	const days = c.req.query("days") || DEFAULT_DAYS;
	const res = await db.exec(QUERIES.tagsCompany, [tag]);
	return c.json(sqliteToJson(res));
});

sqliteRoute.get("/stats", async (c) => {
	const db = await initDb();
	const res = await db.exec(QUERIES.stats);
	return c.json(sqliteToJson(res)[0]); // Extract first result object
});

export default sqliteRoute;
