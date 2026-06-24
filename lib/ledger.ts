import { LedgerType, Prisma } from '@prisma/client';

/**
 * Apply a signed credit change to an employee atomically.
 *
 * Everything happens inside one transaction: we re-read the user's current
 * balance (FOR UPDATE semantics via the transaction), write a ledger entry with
 * a running balanceAfter snapshot, and update the cached User.balanceFils. The
 * cached value is therefore always equal to the latest ledger entry's
 * balanceAfter, and the full history is reconstructable from the ledger alone.
 *
 * Negative balances are allowed only down to negativeLimitFils (a positive
 * number, e.g. 5000 => balance may reach -5.000 KWD). Pass enforceLimit=false
 * for admin top-ups/refunds, which only ever increase the balance.
 */
export async function applyLedger(
  tx: Prisma.TransactionClient,
  params: {
    ownerId: string;
    type: LedgerType;
    amountFils: number; // signed
    note?: string | null;
    orderId?: string | null;
    createdById?: string | null;
    enforceLimit?: boolean;
    negativeLimitFils?: number;
  }
) {
  const owner = await tx.user.findUnique({ where: { id: params.ownerId } });
  if (!owner) throw new Error('Employee not found.');

  const newBalance = owner.balanceFils + params.amountFils;

  if (params.enforceLimit) {
    const floor = -(params.negativeLimitFils ?? 0);
    if (newBalance < floor) {
      throw new Error('INSUFFICIENT_CREDIT');
    }
  }

  const entry = await tx.ledgerEntry.create({
    data: {
      ownerId: params.ownerId,
      type: params.type,
      amountFils: params.amountFils,
      balanceAfter: newBalance,
      note: params.note ?? null,
      orderId: params.orderId ?? null,
      createdById: params.createdById ?? null
    }
  });

  await tx.user.update({
    where: { id: params.ownerId },
    data: { balanceFils: newBalance }
  });

  return entry;
}

/**
 * Generate a readable document number, e.g. CAF-1042 / INV-3090 / RCP-2051.
 * Numbers start at a per-prefix base so each series looks distinct, and are
 * derived from the current row count. Uniqueness is still guaranteed by the
 * unique column on each table; on the rare collision the caller retries.
 */
const NUMBER_BASE: Record<string, number> = {
  CAF: 1000, // orders
  INV: 3000, // invoices
  RCP: 2000 // receipts
};

export function makeNumber(prefix: string, count: number): string {
  const base = NUMBER_BASE[prefix] ?? 1000;
  return `${prefix}-${base + count + 1}`;
}
