## endpoints

### `/` home

A message with the link to this document

### `/providers`

The list of know proviver unique ids, which can be used in the `/provider/:id/*` endpoints

### `/providers/:id/:hostname`

Where:

- `id` is a known provider id from the `/providers` endpoint
- `hostname` is the id of a company, as defined when registered on at the provider's services (often a "slugified version" of the company's name).

This endpoint returns a list of jobs

The know providers, and the job serialization come from https://gitlab.com/joblist/job-board-providers

Examples:
- https://api.joblist.today/providers/greenhouse/greenhouse
- https://api.joblist.today/providers/lever/lever

## development

Install dependencies (`npm`, `wrangler`, `hono`):

```bash
npm install
```

Run the development server

```bash
npx wrangler dev src/index.ts
```

## production deployment

tbd (gitlab ci?)

### Manually

```bash
npx wrangler publish ./src/index.ts
```

### custom domain

- https://developers.cloudflare.com/workers/platform/routing/custom-domains/

## docs
- See: https://honojs.dev/docs/getting-started/cloudflare-workers/
