import { Hono } from "hono";
type Bindings = {
	WAITLIST_ENDPOINT?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.post("/api/subscribe", async (c) => {
	const endpoint = c.env.WAITLIST_ENDPOINT;

	if (!endpoint) {
		return c.json(
			{ ok: false, message: "Waitlist endpoint is not configured on the server." },
			500,
		);
	}

	let body: { email?: string; source?: string };

	try {
		body = await c.req.json();
	} catch {
		return c.json({ ok: false, message: "Invalid JSON body." }, 400);
	}

	const email = String(body.email ?? "").trim().toLowerCase();
	const source = String(body.source ?? "khomor-landing").trim();

	if (!emailPattern.test(email)) {
		return c.json({ ok: false, message: "Please provide a valid email." }, 400);
	}

	let upstreamResponse: Response;

	try {
		upstreamResponse = await fetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, source }),
		});
	} catch {
		return c.json({ ok: false, message: "Could not reach waitlist service." }, 502);
	}

	const responseText = await upstreamResponse.text();
	let responseJson: Record<string, unknown> | null = null;

	try {
		responseJson = JSON.parse(responseText) as Record<string, unknown>;
	} catch {
		responseJson = null;
	}

	if (!upstreamResponse.ok) {
		const googleAccessDenied =
			upstreamResponse.status === 401 ||
			upstreamResponse.status === 403 ||
			responseText.includes("Request access") ||
			responseText.includes("access") ||
			responseText.includes("طلب الإذن");

		return c.json(
			{
				ok: false,
				message: googleAccessDenied
					? "Google Apps Script denied access. Deploy the web app with access set to Anyone and use the /exec URL."
					: typeof responseJson?.message === "string"
						? responseJson.message
						: `Waitlist service returned an error (${upstreamResponse.status}).`,
			},
			502,
		);
	}

	return c.json({
		ok: true,
		duplicate: responseJson?.duplicate === true,
		message:
			typeof responseJson?.message === "string"
				? responseJson.message
				: "Thanks, you are on the waitlist.",
	});
});

export default app;
