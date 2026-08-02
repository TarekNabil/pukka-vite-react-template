import { useState } from "react";
import "./App.css";

const waitlistEndpoint = import.meta.env.VITE_WAITLIST_ENDPOINT;

async function submitWaitlistEmail(email: string) {
	if (!waitlistEndpoint) {
		throw new Error("Waitlist endpoint is not configured.");
	}

	const response = await fetch(waitlistEndpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ email }),
	});

	if (!response.ok) {
		throw new Error("Failed to save the email.");
	}
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
			await submitWaitlistEmail(email.trim());
			setStatus("success");
			setMessage("Thanks, you are on the waitlist.");
			setEmail("");
		} catch {
			setStatus("error");
			setMessage("Could not save your email yet. Please try again later.");
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
