import { Hono } from "hono";
import initDb, { sqliteToJson } from "./utils/db.js";

const sqliteRoute = new Hono();

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
sqliteRoute.get("/heatmap/companies/:slug", async (c) => {
	const db = await initDb();
	const { slug } = c.req.param();
	const days = 365;
	const res = await db.exec(
		`
WITH RECURSIVE date_range AS (
  SELECT MIN(published_date) AS min_date, MAX(published_date) AS max_date FROM jobs
  WHERE published_date > DATE('now', '-' || ? || ' ' || 'days')
  UNION ALL
  SELECT date(min_date, '+1 day'), max_date FROM date_range WHERE min_date < max_date
)
SELECT
  COALESCE(company_slug, ?) AS company_slug,
  date_range.min_date AS date,
  COALESCE(COUNT(DISTINCT ObjectId), 0) AS total,
  strftime('%Y', date_range.min_date) AS year,
  strftime('%w', date_range.min_date) AS dow,
  strftime('%W', date_range.min_date) AS woy
FROM
  date_range
LEFT JOIN
  jobs ON date_range.min_date = jobs.published_date
AND company_slug = ?
OR company_slug is null
GROUP BY 1,2
ORDER BY published_date ASC
		`,
		[days, slug, slug],
	);
	return c.json(sqliteToJson(res));
});
sqliteRoute.get("/heatmap/jobs", async (c) => {
	const db = await initDb();
	const days = 365;
	const res = await db.exec(
		`
WITH RECURSIVE date_range AS (
  SELECT
    MIN(published_date) AS min_date,
    MAX(published_date) AS max_date
  FROM jobs
  WHERE published_date > DATE('now', '-' || ? || ' days')
  UNION ALL
  SELECT DATE(min_date, '+1 day'), max_date
  FROM date_range
  WHERE min_date < max_date
)
SELECT
  date_range.min_date AS date,
  COALESCE(COUNT(DISTINCT jobs.ObjectId), 0) AS total,
  strftime('%Y', date_range.min_date) AS year,
  strftime('%m', date_range.min_date) AS month,
  strftime('%u', date_range.min_date) AS dow,
  strftime('%j', date_range.min_date) AS doy,
  strftime('%W', date_range.min_date) AS woy
FROM
  date_range
LEFT JOIN
  jobs ON DATE(date_range.min_date) = DATE(jobs.published_date)
GROUP BY
  date_range.min_date
ORDER BY
  date_range.min_date ASC;
		`,
		[days],
	);
	return c.json(sqliteToJson(res));
});

export default sqliteRoute;
