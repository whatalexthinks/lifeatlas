/**
 * Which real services this build is connected to. The interface reads these flags to decide
 * what it may claim — a letter is never "Scheduled" unless `futureDelivery` is true, an
 * invitation is never "Sent" unless `email` is true, and so on.
 *
 * Every flag is false in the preview. Turning one on is part of connecting the provider
 * (see docs/INTEGRATION_CHECKLIST.md), never a way to make the demo look finished.
 */
export interface Integrations {
  /** Accounts, sign-in and server-side permissions. */
  accounts: boolean;
  /** Private object storage with backups: "uploaded and securely stored". */
  cloudStorage: boolean;
  /** Email or SMS delivery for invitations and notices. */
  email: boolean;
  /** A payment processor. */
  payments: boolean;
  /** Durable scheduled jobs, retries, recipient verification and delivery logs for letters. */
  futureDelivery: boolean;
  /** A print vendor and carrier. */
  printFulfillment: boolean;
}

export const integrations: Integrations = {
  accounts: false,
  cloudStorage: false,
  email: false,
  payments: false,
  futureDelivery: false,
  printFulfillment: false,
};
