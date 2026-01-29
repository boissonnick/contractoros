import * as functions from "firebase-functions";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send an email using Mailgun API.
 *
 * Required environment variables:
 * - MAILGUN_API_KEY: Your Mailgun API key
 * - MAILGUN_DOMAIN: Your Mailgun sending domain (e.g., mg.contractoros.com)
 *
 * Optional:
 * - MAILGUN_REGION: 'us' (default) or 'eu' for EU region
 *
 * Can also be set via Firebase config:
 * firebase functions:config:set mailgun.api_key="key-xxx" mailgun.domain="mg.example.com"
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.MAILGUN_API_KEY || functions.config()?.mailgun?.api_key;
  const domain = process.env.MAILGUN_DOMAIN || functions.config()?.mailgun?.domain;
  const region = process.env.MAILGUN_REGION || functions.config()?.mailgun?.region || "us";

  if (!apiKey) {
    console.warn("MAILGUN_API_KEY not configured. Email not sent:", options.subject);
    return false;
  }

  if (!domain) {
    console.warn("MAILGUN_DOMAIN not configured. Email not sent:", options.subject);
    return false;
  }

  // Mailgun API base URL differs by region
  const baseUrl = region === "eu"
    ? "https://api.eu.mailgun.net"
    : "https://api.mailgun.net";

  const url = `${baseUrl}/v3/${domain}/messages`;

  // Mailgun uses Basic Auth with "api" as username and API key as password
  const authHeader = "Basic " + Buffer.from(`api:${apiKey}`).toString("base64");

  // Mailgun expects form-urlencoded data
  const formData = new URLSearchParams();
  formData.append("from", options.from || "ContractorOS <noreply@contractoros.com>");
  formData.append("to", options.to);
  formData.append("subject", options.subject);
  formData.append("html", options.html);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Mailgun API error:", response.status, error);
      return false;
    }

    const result = await response.json();
    console.log(`Email sent to ${options.to}: ${options.subject}`, result.id);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
