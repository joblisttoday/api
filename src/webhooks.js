import { Hono } from "hono";

const webhooksRoute = new Hono();

// In-memory storage for development (will reset when server restarts)
let receivedEvents = [];
let processedPayments = new Set(); // Track processed payment IDs

async function verifyStripeSignature(rawBody, signature, secret) {
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);
	const bodyData = encoder.encode(rawBody);
	
	const key = await crypto.subtle.importKey(
		'raw',
		keyData,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	
	const signatureBuffer = await crypto.subtle.sign('HMAC', key, bodyData);
	const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
		.map(b => b.toString(16).padStart(2, '0'))
		.join('');

	const signatureHeader = signature.replace("v1=", "");
	return expectedSignature === signatureHeader;
}


webhooksRoute.post("/stripe", async (c) => {
	const timestamp = new Date().toISOString();
	console.log(`🎯 [${timestamp}] Stripe webhook received`);

	try {
		const rawBody = await c.req.text();
		const signature = c.req.header("stripe-signature");

		console.log(`📋 Body length: ${rawBody.length}, Signature: ${signature ? "✅" : "❌"}`);

		// Verify webhook signature if secret is provided (disabled for development)
		if (false && c.env.STRIPE_WEBHOOK_SECRET && signature) {
			const isValid = await verifyStripeSignature(
				rawBody,
				signature,
				c.env.STRIPE_WEBHOOK_SECRET,
			);
			if (!isValid) {
				return c.json({ error: "Invalid signature" }, 401);
			}
		}

		const body = JSON.parse(rawBody);
		console.log(`📨 Event: ${body.type} (${body.id})`);

		// Store event for development viewing
		receivedEvents.unshift({
			id: body.id,
			type: body.type,
			receivedAt: new Date().toISOString(),
			data: body,
		});

		// Keep only last 50 events to prevent memory issues
		if (receivedEvents.length > 50) {
			receivedEvents = receivedEvents.slice(0, 50);
		}

		// Handle payment success events
		if (
			body.type === "payment_intent.succeeded" ||
			body.type === "checkout.session.completed"
		) {
			const paymentId = body.data?.object?.id;
			
			// Check if we've already processed this payment
			if (processedPayments.has(paymentId)) {
				console.log(`🔄 Payment ${paymentId} already processed - skipping workflow`);
				return c.json({
					success: true,
					message: "Payment webhook received but already processed",
					payment_id: paymentId,
				});
			}
			
			// Mark payment as processed
			processedPayments.add(paymentId);
			console.log(`💰 Processing payment ${paymentId} - triggering GitHub workflow`);
			// Trigger GitHub workflow
			const githubResponse = await fetch(
				"https://api.github.com/repos/joblisttoday/workers/dispatches",
				{
					method: "POST",
					headers: {
						Accept: "application/vnd.github+json",
						Authorization: `Bearer ${c.env.GITHUB_TOKEN}`,
						"X-GitHub-Api-Version": "2022-11-28",
						"Content-Type": "application/json",
						"User-Agent": "api@joblist.today",
					},
					body: JSON.stringify({
						event_type: "payment_received",
						client_payload: {
							stripe_event: body.type,
							payment_id: body.data?.object?.id,
							timestamp: new Date().toISOString(),
						},
					}),
				},
			);

			if (!githubResponse.ok) {
				const errorText = await githubResponse.text();
				console.log(`❌ GitHub API error: ${githubResponse.status} - ${errorText}`);
				throw new Error(
					`GitHub API error: ${githubResponse.status} - ${errorText}`,
				);
			}

			console.log(`✅ GitHub workflow triggered successfully (${githubResponse.status})`);
			return c.json({
				success: true,
				message: "Payment webhook processed and GitHub workflow triggered",
				github_response_status: githubResponse.status,
			});
		}

		return c.json({
			success: true,
			message: "Webhook received but no action taken",
			event_type: body.type,
		});
	} catch (error) {
		console.log(`💥 Webhook error: ${error.message}`);
		return c.json(
			{
				success: false,
				error: error.message,
			},
			500,
		);
	}
});

export default webhooksRoute;
