/**
 * The single source of truth for how the product names and describes itself.
 * Change the brand here, never by editing strings across components.
 *
 * Technical identifiers deliberately keep their original names so people's saved data and
 * earlier exports keep working: the IndexedDB database (`lifeatlas-demo`), the export
 * manifest schema (`lifeatlas.archive`), local-storage keys (`lifeatlas.*`) and the
 * `NEXT_PUBLIC_LIFEATLAS_MODE` variable. See docs/ARCHITECTURE.md.
 */
export const brand = {
  /** The company and website. */
  name: "OurLifeCapsule",
  /** What a customer creates and owns: "Create your LifeCapsule". */
  product: "LifeCapsule",
  productPlural: "LifeCapsules",
  /** Lower-case noun for running text: "a capsule for your parents". */
  noun: "capsule",
  philosophy: "Every life is a story worth keeping.",
  promise: "A beautiful place to preserve the stories, voices, photographs, relationships, and moments that make a life extraordinary.",
  /** The intended domain. DNS and hosting are not assumed to be configured. */
  domain: "ourlifecapsule.com",
  /**
   * Addresses the business intends to use. `active: false` means no inbox is connected yet,
   * so the interface must not tell anyone to write to them.
   */
  contact: {
    active: false,
    hello: "hello@ourlifecapsule.com",
    support: "support@ourlifecapsule.com",
    privacy: "privacy@ourlifecapsule.com",
  },
  /** Shown in footers and documents produced in this preview. */
  legalLine: "OurLifeCapsule, product preview",
  /** File names for things people download: `ourlifecapsule-margaret-ellis-2026-10-14.zip`. */
  filePrefix: "ourlifecapsule",
} as const;

export type Brand = typeof brand;
