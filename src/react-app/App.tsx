import { useState } from "react";
import "./App.css";

const waitlistEndpoint = import.meta.env.VITE_WAITLIST_ENDPOINT ?? "/api/subscribe";

async function submitWaitlistEmail(email: string) {
	const response = await fetch(waitlistEndpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ email, source: "khomor-landing" }),
	});

	const payload = (await response.json().catch(() => null)) as
		| { message?: string; duplicate?: boolean }
		| null;

	if (!response.ok) {
		throw new Error(payload?.message ?? "Failed to save the email.");
	}

	return payload;
}

function App() {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
	const [message, setMessage] = useState("");

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!email.trim()) {
			setStatus("error");
			setMessage("Please enter an email address.");
			return;
		}

		try {
			setStatus("submitting");
			setMessage("");
			const result = await submitWaitlistEmail(email.trim());
			setStatus("success");
			setMessage(
				result?.duplicate
					? "This email is already on the waitlist."
					: "Thanks, you are on the waitlist.",
			);
			setEmail("");
		} catch (error) {
			setStatus("error");
			setMessage(
				error instanceof Error
					? error.message
					: "Could not save your email yet. Please try again later.",
			);
		}
	}

	return (
		<main className="landing-page">
			<h1>
				Good things come
				<br />
				to those <span className="title-emphasis">who wait.</span>
			</h1>
			<div className="newsletter-block">
				<p className="eyebrow">khomor waitlist</p>
				<form className="newsletter-form" onSubmit={handleSubmit}>
					<label className="sr-only" htmlFor="email">
						Email address
					</label>
					<input
						id="email"
						type="email"
						name="email"
						placeholder="name@email.com"
						autoComplete="email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						disabled={status === "submitting"}
					/>
					<button type="submit" disabled={status === "submitting"}>
						{status === "submitting" ? "Saving..." : "Subscribe"}
					</button>
				</form>
				{message ? <p className={`newsletter-message ${status}`}>{message}</p> : null}
			</div>
		</main>
	);
}

export default App;
