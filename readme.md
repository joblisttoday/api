> [!IMPORTANT]
> **joblist.today has closed (October 2026).** This repository is archived and read-only. The joblist.today domain and its services are retired. Thanks to everyone who used and contributed to joblist over the years.

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

## stripe + ngrok
To receive stripe webhooks, don't forget to set the `.dev.vars` values, and:

```bash
ngrok http 8787 --hostname lively-promoted-lemming.ngrok-free.app
```
In Stripe add the webhook to `https://lively-promoted-lemming.ngrok-free.app/webhooks/stripe`

To test the webhooks sending from stripe, need to [install and login
the stripe
cli](https://docs.stripe.com/stripe-cli?install-method=apt).

while developing to send a test webhook, use:
```bash
stripe trigger payment_intent.succeeded
stripe listen --forward-to https://lively-promoted-lemming.ngrok-free.app/webhooks/stripe
```


## production deployment

> should only deploy with CI/CD, for versioning purpose

### CI/CD 

### github + cloudflare
The repo si bound the the `main` branch on cloudflare which will rebuild on new commits.

### gitlab (obsolete)
For example to deploy version `0.0.1` of the api:

- in `package.json` bumb `version` to `0.0.1`, then push this as a comit
- in gitlab UI create a new tag `v0.0.1`
- this will trigger the `deploy_api` job (see file `.gitlab-ci.yml`), which will publish the api to cloudflare workers (using wrangler)

ENV variables needed in gitlab ci:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

> note: these variables are defined on the gitlab organisation level and only availabe on protected branches (`main`) and tags (`v*`).

Docs:
- https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/
- https://developers.cloudflare.com/workers/wrangler/configuration/

### Manually

```bash
npx wrangler publish ./src/index.ts
```

### custom domain

> tld: do not add with the cloudflare DNS UI, but the cloudflare worker toml config file, as we're having our site DNS zone on cloudfalre (joblist.today)

- https://developers.cloudflare.com/workers/platform/routing/custom-domains/

## docs
- See: https://honojs.dev/docs/getting-started/cloudflare-workers/


### Tests

Not yet setup, see here:
- https://github.com/honojs/hono-minimal
- https://honojs.dev/docs/getting-started/cloudflare-workers
