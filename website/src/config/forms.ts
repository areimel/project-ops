/**
 * Every string and setting for the signup and contact forms.
 * To rebrand, edit the files in this folder.
 */
import { product } from "./product";

/** Submission settings. Feeds scripts/forms.ts and the hidden fields in ContactForm. */
export const formSettings = {
  endpoint: "https://api.web3forms.com/submit",
  timeoutMs: 15000,
  signupSubject: `${product.name} release signup`,
  inquirySubject: `${product.name} contact inquiry`,
  fromName: `${product.name} website`,
};

/** Name of the signup consent checkbox; it is also the key in the submitted payload. */
export const consentField = "launch_updates_consent";

/** Copy for the signup section shown on the home and download pages. Feeds SignupSection. */
export const signupSection = {
  heading: "Follow new releases",
  text: `Leave your email to hear when a new version of ${product.name} is published. You will not get anything else.`,
};

/** Labels, placeholders, notes and status messages. Feeds ContactForm and scripts/forms.ts. */
export const forms = {
  signup: {
    legend: "Sign up for release updates",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    consentLabel: `I'd like to receive ${product.name} release updates by email.`,
    consentValue: `Yes, send me ${product.name} release updates`,
    button: "Get release updates",
    privacy: `Your email is sent to the ${product.name} maintainer through Web3Forms so you can get release updates. Ask to have it removed at any time using the contact form.`,
    success: "Thanks. Your request for release updates has been received.",
  },
  inquiry: {
    legend: "Send a message",
    nameLabel: "Your name",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    messageLabel: "Message",
    button: "Send message",
    privacy: `Your details are sent to the ${product.name} maintainer through Web3Forms so they can reply. Sending a message does not subscribe you to updates.`,
    success: "Message received. Thanks for getting in touch.",
  },
  status: {
    sending: "Sending your details...",
    sendingButton: "Sending...",
    error: "We couldn't confirm delivery. Your details are still here; please try again.",
    timeout: "The request timed out. Your details are still here; please try again.",
    unconfigured: "This form is not connected yet. Please check back soon.",
    noscript: "Submitting opens Web3Forms to confirm delivery.",
  },
};
