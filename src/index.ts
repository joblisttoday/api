import { Hono } from 'hono'
import { providerIds, providersMap } from './providers'

// types
type Job = {
	id: string
}

// the providers sub-routes
const providersRoute = new Hono()

providersRoute.get('/', (c) => {
	return c.json([
		...providerIds
	])
})

providersRoute.get('/:id/:hostname', async (c) => {
	const { id, hostname } = c.req.param()

	const provider = providersMap[id]
	if (!provider || typeof provider.getJobs !== 'function') {
		return c.json({
			error: 'Unkown provider or no getJobs() method'
		})
	}

	let data
	try {
		data = await provider.getJobs({
			hostname,
			companyTitle: hostname,
			companySlug: hostname,
		})
	} catch(error) {
		console.log('Error fetching jobs', id, hostname)
	}

	const jobs: Job[] = data
	return c.json(jobs)
})

// the global app root routes
const app = new Hono()

// routes
app.notFound((c) => {
	return c.text('Custom 404 Message', 404)
})

app.onError((err, c) => {
	console.error(`${err}`)
	return c.text('Custom Error Message', 500)
})


app.get('/', (c) => {
	return c.json({
		message: 'Welcome to the joblist api',
		documentationUrl: 'https://gitlab.com/joblist/api-wrangler',
	})
})

// the app's sub routes
app.route('/providers', providersRoute)

export default app
