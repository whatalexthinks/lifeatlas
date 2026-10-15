import type {
  CapsuleStatus,
  ContributionStatus,
  ExportStatus,
  FutureMessageStatus,
  HealthState,
  InvitationStatus,
  MemoryStatus,
  OrderStatus,
  PaymentState,
} from "@/domain/models";

/**
 * Declarative transition tables. Business rules live here, never in components.
 * See docs/DATA_MODEL.md for the diagrams.
 */
export type TransitionTable<S extends string> = Record<S, readonly S[]>;

export const capsuleTransitions: TransitionTable<CapsuleStatus> = {
  draft: ["active", "deletion_pending"],
  active: ["archived", "deletion_pending"],
  archived: ["active", "deletion_pending"],
  deletion_pending: ["active", "archived"], // grace period: deletion can be canceled
};

export const memoryTransitions: TransitionTable<MemoryStatus> = {
  draft: ["submitted", "approved"],
  submitted: ["under_review", "approved", "returned", "declined"],
  under_review: ["approved", "returned", "declined"],
  returned: ["submitted", "draft"],
  declined: ["draft"],
  approved: ["draft", "under_review"],
};

export const contributionTransitions: TransitionTable<ContributionStatus> = memoryTransitions;

/** Demo-suffixed states are reachable locally; plain states require a provider. */
export const invitationTransitions: TransitionTable<InvitationStatus> = {
  draft: ["prepared", "revoked_demo"],
  prepared: ["simulated_sent", "revoked_demo", "sent", "revoked"],
  simulated_sent: ["accepted_demo", "expired_demo", "revoked_demo", "simulated_sent"],
  accepted_demo: ["revoked_demo"],
  expired_demo: ["prepared"],
  revoked_demo: ["prepared"],
  sent: ["accepted", "expired", "revoked"],
  accepted: ["revoked"],
  expired: ["prepared"],
  revoked: ["prepared"],
};

export const PROVIDER_ONLY_INVITATION_STATES: InvitationStatus[] = ["sent", "accepted", "expired", "revoked"];

export const futureMessageTransitions: TransitionTable<FutureMessageStatus> = {
  draft: ["prepared", "canceled"],
  prepared: ["draft", "sealed_demo", "sealed", "canceled"],
  sealed_demo: ["draft"], // demo seal is reversible by design
  sealed: ["scheduled", "canceled"],
  scheduled: ["delivery_attempted", "canceled"],
  delivery_attempted: ["delivered", "failed", "scheduled"],
  delivered: [],
  failed: ["scheduled", "canceled"],
  canceled: ["draft"],
};

/** Production future-delivery states, unreachable without provider confirmation. */
export const PROVIDER_ONLY_FUTURE_STATES: FutureMessageStatus[] = ["sealed", "scheduled", "delivery_attempted", "delivered", "failed"];

export const exportTransitions: TransitionTable<ExportStatus> = {
  queued: ["building", "failed"],
  building: ["ready", "failed"],
  ready: ["expired"],
  failed: ["queued"],
  expired: ["queued"],
};

export const orderTransitions: TransitionTable<OrderStatus> = {
  draft: ["preview", "canceled_mock"],
  preview: ["payment_pending", "paid_mock", "canceled_mock"],
  payment_pending: ["paid_mock", "canceled_mock"],
  paid_mock: ["proof_required", "ready_for_fulfillment", "canceled_mock", "refunded_mock"],
  proof_required: ["ready_for_fulfillment", "canceled_mock", "refunded_mock"],
  ready_for_fulfillment: ["printing_mock", "canceled_mock", "refunded_mock"],
  printing_mock: ["shipped_mock"],
  shipped_mock: ["refunded_mock"],
  canceled_mock: [],
  refunded_mock: [],
};

export const paymentTransitions: TransitionTable<PaymentState> = {
  started: ["pending", "failed", "mock_uncharged"],
  pending: ["confirmed", "failed"],
  confirmed: ["refunded"],
  failed: ["started"],
  refunded: [],
  mock_uncharged: [],
};

/** "No pretending paid": confirmed requires a real billing provider. */
export const PROVIDER_ONLY_PAYMENT_STATES: PaymentState[] = ["confirmed", "refunded"];

export const preservationTransitions: TransitionTable<HealthState> = {
  unconfigured: ["checking"],
  checking: ["verified", "degraded", "failed"],
  verified: ["checking"],
  degraded: ["checking"],
  failed: ["checking"],
};

export function canTransition<S extends string>(table: TransitionTable<S>, from: S, to: S): boolean {
  return table[from]?.includes(to) ?? false;
}

export class TransitionError extends Error {
  constructor(
    public readonly machine: string,
    public readonly from: string,
    public readonly to: string,
  ) {
    super(`${machine}: cannot move from "${from}" to "${to}"`);
    this.name = "TransitionError";
  }
}

export function assertTransition<S extends string>(machine: string, table: TransitionTable<S>, from: S, to: S) {
  if (!canTransition(table, from, to)) throw new TransitionError(machine, from, to);
}

/** Verified/degraded/failed must carry evidence, no green badge without it. */
export function preservationStateIsHonest(state: HealthState, evidence: { checkedAt?: string; provider?: string } | undefined) {
  if (state === "unconfigured" || state === "checking") return true;
  return Boolean(evidence?.checkedAt && evidence.provider);
}
