import { Hono } from "hono";

/* not working */
/* import personioApi from "@joblist/components"; */

import personio from "@joblist/job-board-providers/src/apis/personio.js";
import recruitee from "@joblist/job-board-providers/src/apis/recruitee.js";
import greenhouse from "@joblist/job-board-providers/src/apis/greenhouse.js";
import smartrecruiters from "@joblist/job-board-providers/src/apis/smartrecruiters.js";
import ashby from "@joblist/job-board-providers/src/apis/ashby.js";
import lever from "@joblist/job-board-providers/src/apis/lever.js";
import workable from "@joblist/job-board-providers/src/apis/workable.js";

const providerMap = {
	workable,
	lever,
	ashby,
	smartrecruiters,
	greenhouse,
	recruitee,
	personio,
};
const providerIds = Object.entries(providerMap).map(
	([_id, provider]) => provider.id,
);

/* routes */
const providersRoute = new Hono();

providersRoute.get("/", (c) => {
	return c.json([...providerIds]);
});

providersRoute.get("/:id/:hostname", async (c) => {
	const { id, hostname } = c.req.param();

	const provider = providersMap[id];
	if (!provider || typeof provider.getJobs !== "function") {
		return c.json({
			error: "Unkown provider or no getJobs() method",
		});
	}

	let data;
	try {
		data = await provider.getJobs({
			hostname,
			companyTitle: hostname,
			companyId: hostname,
		});
	} catch (error) {
		console.log("Error fetching jobs", id, hostname);
	}

	const jobs = data;
	return c.json(jobs);
});

export default providersRoute;
