'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { LedgerType, OrderStatus, UserRole } from '@prisma/client';
import {
  authenticate,
  clearSession,
  createSession,
  getSessionUser,
  hashPassword,
  requireCafeteriaAdmin,
  requireSuperAdmin,
  requireUser
} from '@/lib/auth';
import { prisma } from '@/lib/db';
import { applyLedger, makeNumber } from '@/lib/ledger';
import { parseKwdToFils } from '@/lib/money';
import { getSettings, getAllowedDomains, emailDomainAllowed } from '@/lib/settings';
import { getString, getOptionalString, getInt } from '@/lib/utils';

async function logAction(
  actorUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  entityName?: string,
  details?: string
) {
  await prisma.auditLog.create({
    data: { actorUserId, action, entityType, entityId, entityName, details }
  });
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function loginAction(_prev: unknown, formData: FormData) {
  const email = getString(formData, 'email').toLowerCase();
  const password = getString(formData, 'password');
  if (!email || !password) return { error: 'Enter your email and password.' };

  const user = await authenticate(email, password);
  if (!user) return { error: 'Those credentials did not match. Try again.' };

  await createSession({ id: user.id });
  if (user.role === UserRole.SUPER_ADMIN) redirect('/super');
  if (user.role === UserRole.CAFETERIA_ADMIN) redirect('/admin');
  redirect('/menu');
}

export async function logoutAction() {
  await clearSession();
  redirect('/login');
}

const signupSchema = z.object({
  name: z.string().min(2, 'Enter your full name.'),
  email: z.string().email('Enter a valid email.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
  phone: z.string().optional(),
  officeNumber: z.string().optional(),
  floorNumber: z.string().optional()
});

export async function signupAction(_prev: unknown, formData: FormData) {
  const parsed = signupSchema.safeParse({
    name: getString(formData, 'name'),
    email: getString(formData, 'email').toLowerCase(),
    password: getString(formData, 'password'),
    phone: getOptionalString(formData, 'phone') ?? undefined,
    officeNumber: getOptionalString(formData, 'officeNumber') ?? undefined,
    floorNumber: getOptionalString(formData, 'floorNumber') ?? undefined
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }
  const data = parsed.data;

  const domains = await getAllowedDomains();
  if (domains.length > 0 && !emailDomainAllowed(data.email, domains)) {
    return { error: `Sign-up is limited to ${domains.map((d) => '@' + d).join(', ')} email addresses.` };
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return { error: 'An account with that email already exists.' };

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      role: UserRole.EMPLOYEE,
      phone: data.phone ?? null,
      officeNumber: data.officeNumber ?? null,
      floorNumber: data.floorNumber ?? null
    }
  });

  await createSession({ id: user.id });
  redirect('/menu');
}

// ---------------------------------------------------------------------------
// Profile (employee self-service)
// ---------------------------------------------------------------------------

export async function updateProfileAction(_prev: unknown, formData: FormData) {
  const user = await requireUser();
  const name = getString(formData, 'name');
  if (name.length < 2) return { error: 'Enter your full name.' };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      phone: getOptionalString(formData, 'phone'),
      officeNumber: getOptionalString(formData, 'officeNumber'),
      floorNumber: getOptionalString(formData, 'floorNumber')
    }
  });
  revalidatePath('/profile');
  return { ok: 'Profile updated.' };
}

export async function changePasswordAction(_prev: unknown, formData: FormData) {
  const user = await requireUser();
  const current = getString(formData, 'currentPassword');
  const next = getString(formData, 'newPassword');
  if (next.length < 8) return { error: 'New password must be at least 8 characters.' };

  const check = await authenticate(user.email, current);
  if (!check) return { error: 'Your current password is incorrect.' };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) }
  });
  return { ok: 'Password changed.' };
}

// ---------------------------------------------------------------------------
// Ordering (employee)
// ---------------------------------------------------------------------------

/**
 * Place an order. We DO NOT deduct credit here. The order is created as PENDING
 * with a snapshot of each line's name + base price. The cafeteria admin later
 * sets the final price (accounting for toppings / special requests) and only
 * then is credit deducted and an invoice generated.
 *
 * The cart is submitted as a JSON string of [{ menuItemId, quantity, note }].
 */
export async function placeOrderAction(_prev: unknown, formData: FormData) {
  const user = await requireUser();
  if (user.role !== UserRole.EMPLOYEE) {
    return { error: 'Only employee accounts can place orders.' };
  }

  let cart: { menuItemId: string; quantity: number; note?: string }[];
  try {
    cart = JSON.parse(getString(formData, 'cart'));
  } catch {
    return { error: 'Your cart could not be read. Please try again.' };
  }
  if (!Array.isArray(cart) || cart.length === 0) {
    return { error: 'Your cart is empty.' };
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { error: 'Account not found.' };

  const itemIds = cart.map((c) => c.menuItemId);
  const items = await prisma.menuItem.findMany({
    where: { id: { in: itemIds }, isAvailable: true }
  });
  const byId = new Map(items.map((i) => [i.id, i]));

  const lines = cart
    .map((c) => {
      const item = byId.get(c.menuItemId);
      if (!item) return null;
      const quantity = Math.max(1, Math.min(50, Math.floor(c.quantity || 1)));
      return {
        menuItemId: item.id,
        nameSnapshot: item.name,
        unitPriceFils: item.priceFils,
        quantity,
        lineTotalFils: item.priceFils * quantity,
        note: (c.note || '').trim() || null
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  if (lines.length === 0) {
    return { error: 'None of the items in your cart are available right now.' };
  }

  const requestedTotal = lines.reduce((sum, l) => sum + l.lineTotalFils, 0);
  const orderCount = await prisma.order.count();

  const order = await prisma.order.create({
    data: {
      orderNumber: makeNumber('CAF', orderCount),
      customerId: user.id,
      status: OrderStatus.PENDING,
      deliveryOffice: getOptionalString(formData, 'deliveryOffice') ?? dbUser.officeNumber,
      deliveryFloor: getOptionalString(formData, 'deliveryFloor') ?? dbUser.floorNumber,
      customerNote: getOptionalString(formData, 'customerNote'),
      requestedTotalFils: requestedTotal,
      items: { create: lines }
    }
  });

  await logAction(user.id, 'PLACE_ORDER', 'Order', order.id, order.orderNumber);
  redirect(`/orders/${order.id}`);
}

export async function cancelOwnOrderAction(formData: FormData) {
  const user = await requireUser();
  const orderId = getString(formData, 'orderId');
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.customerId !== user.id) return;
  if (order.status !== OrderStatus.PENDING) return; // can only cancel before approval

  await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.CANCELLED }
  });
  await logAction(user.id, 'CANCEL_ORDER', 'Order', order.id, order.orderNumber);
  revalidatePath('/orders');
  revalidatePath(`/orders/${orderId}`);
}

// ---------------------------------------------------------------------------
// Order processing (cafeteria admin)
// ---------------------------------------------------------------------------

/**
 * Approve an order with the final, possibly adjusted, line prices.
 * Form fields: orderId, line_<orderItemId> = final line total in KWD, adminNote.
 *
 * In one transaction we: set each line's final total, set the order's finalTotal,
 * deduct the customer's credit (honouring the negative limit), create the
 * invoice, and write the ledger entry. If the customer lacks credit beyond the
 * allowed negative limit, the whole thing rolls back.
 */
export async function approveOrderAction(_prev: unknown, formData: FormData) {
  const admin = await requireCafeteriaAdmin();
  const orderId = getString(formData, 'orderId');

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, customer: true }
  });
  if (!order) return { error: 'Order not found.' };
  if (order.status !== OrderStatus.PENDING) {
    return { error: 'This order has already been processed.' };
  }

  // Read adjusted per-line totals (in KWD) from the form.
  const lineTotals = new Map<string, number>();
  for (const item of order.items) {
    const raw = getString(formData, `line_${item.id}`);
    const fils = raw ? parseKwdToFils(raw) : item.lineTotalFils;
    if (fils === null || fils < 0) {
      return { error: `Enter a valid price for "${item.nameSnapshot}".` };
    }
    lineTotals.set(item.id, fils);
  }
  const finalTotal = [...lineTotals.values()].reduce((a, b) => a + b, 0);
  const settings = await getSettings();

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update each line's final total.
      for (const [itemId, fils] of lineTotals) {
        await tx.orderItem.update({ where: { id: itemId }, data: { lineTotalFils: fils } });
      }

      // 2. Deduct credit (enforcing the negative floor).
      await applyLedger(tx, {
        ownerId: order.customerId,
        type: LedgerType.ORDER_CHARGE,
        amountFils: -finalTotal,
        note: `Order ${order.orderNumber}`,
        orderId: order.id,
        createdById: admin.id,
        enforceLimit: true,
        negativeLimitFils: settings.negativeLimitFils
      });

      // 3. Mark the order approved.
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.APPROVED,
          finalTotalFils: finalTotal,
          adminNote: getOptionalString(formData, 'adminNote'),
          handledById: admin.id,
          approvedAt: new Date()
        }
      });

      // 4. Create the invoice.
      const invoiceCount = await tx.invoice.count();
      await tx.invoice.create({
        data: {
          invoiceNumber: makeNumber('INV', invoiceCount),
          orderId: order.id,
          totalFils: finalTotal
        }
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'INSUFFICIENT_CREDIT') {
      return {
        error: `${order.customer.name} does not have enough credit for this total, even with the allowed negative limit. Ask them to top up first.`
      };
    }
    throw err;
  }

  await logAction(admin.id, 'APPROVE_ORDER', 'Order', order.id, order.orderNumber);
  revalidatePath('/admin');
  revalidatePath(`/admin/orders/${order.id}`);
  redirect(`/admin/orders/${order.id}`);
}

export async function rejectOrderAction(_prev: unknown, formData: FormData) {
  const admin = await requireCafeteriaAdmin();
  const orderId = getString(formData, 'orderId');
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: 'Order not found.' };
  if (order.status !== OrderStatus.PENDING) {
    return { error: 'This order has already been processed.' };
  }
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.REJECTED,
      adminNote: getOptionalString(formData, 'adminNote'),
      handledById: admin.id
    }
  });
  await logAction(admin.id, 'REJECT_ORDER', 'Order', order.id, order.orderNumber);
  revalidatePath('/admin');
  redirect('/admin');
}

// ---------------------------------------------------------------------------
// Top-ups (cafeteria admin records cash received, credits the employee)
// ---------------------------------------------------------------------------

/**
 * Record a manual top-up: the employee paid cash at the cafeteria, the admin
 * credits their account and a printable receipt is generated.
 */
export async function topUpAction(_prev: unknown, formData: FormData) {
  const admin = await requireCafeteriaAdmin();
  const ownerId = getString(formData, 'employeeId');
  const amountFils = parseKwdToFils(getString(formData, 'amount'));

  if (!ownerId) return { error: 'Choose an employee.' };
  if (amountFils === null || amountFils <= 0) {
    return { error: 'Enter a top-up amount greater than zero.' };
  }

  const employee = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!employee || employee.role !== UserRole.EMPLOYEE) {
    return { error: 'That employee account was not found.' };
  }

  let receiptId = '';
  await prisma.$transaction(async (tx) => {
    const entry = await applyLedger(tx, {
      ownerId,
      type: LedgerType.TOPUP,
      amountFils,
      note: getOptionalString(formData, 'note') ?? 'Cash top-up at cafeteria',
      createdById: admin.id,
      enforceLimit: false
    });
    const receiptCount = await tx.receipt.count();
    const receipt = await tx.receipt.create({
      data: { receiptNumber: makeNumber('RCP', receiptCount), ledgerEntryId: entry.id }
    });
    receiptId = receipt.id;
  });

  await logAction(admin.id, 'TOPUP', 'User', ownerId, employee.name);
  revalidatePath('/admin/topup');
  redirect(`/admin/receipts/${receiptId}`);
}

/** Manual balance correction (super admin only), e.g. fixing a mistake. */
export async function adjustBalanceAction(_prev: unknown, formData: FormData) {
  const admin = await requireSuperAdmin();
  const ownerId = getString(formData, 'employeeId');
  const signedKwd = getString(formData, 'amount'); // may be "-2.5"
  const negative = signedKwd.startsWith('-');
  const amountFils = parseKwdToFils(signedKwd.replace('-', ''));
  if (!ownerId || amountFils === null || amountFils === 0) {
    return { error: 'Enter an employee and a non-zero amount.' };
  }
  const signed = negative ? -amountFils : amountFils;

  await prisma.$transaction(async (tx) => {
    await applyLedger(tx, {
      ownerId,
      type: LedgerType.ADJUSTMENT,
      amountFils: signed,
      note: getOptionalString(formData, 'note') ?? 'Manual adjustment',
      createdById: admin.id,
      enforceLimit: false
    });
  });
  await logAction(admin.id, 'ADJUST_BALANCE', 'User', ownerId);
  revalidatePath('/super/users');
  return { ok: 'Balance adjusted.' };
}

// ---------------------------------------------------------------------------
// Menu management (super admin)
// ---------------------------------------------------------------------------

export async function saveCategoryAction(_prev: unknown, formData: FormData) {
  await requireSuperAdmin();
  const id = getString(formData, 'id');
  const name = getString(formData, 'name');
  if (name.length < 2) return { error: 'Enter a category name.' };
  const data = {
    name,
    displayOrder: getInt(formData, 'displayOrder', 0),
    isActive: getString(formData, 'isActive') === 'on'
  };
  if (id) {
    await prisma.menuCategory.update({ where: { id }, data });
  } else {
    await prisma.menuCategory.create({ data });
  }
  revalidatePath('/super/menu');
  redirect('/super/menu');
}

export async function deleteCategoryAction(formData: FormData) {
  await requireSuperAdmin();
  const id = getString(formData, 'id');
  await prisma.menuCategory.delete({ where: { id } });
  revalidatePath('/super/menu');
}

export async function saveMenuItemAction(_prev: unknown, formData: FormData) {
  await requireSuperAdmin();
  const id = getString(formData, 'id');
  const name = getString(formData, 'name');
  const priceFils = parseKwdToFils(getString(formData, 'price'));
  const categoryId = getString(formData, 'categoryId');
  if (name.length < 2) return { error: 'Enter an item name.' };
  if (priceFils === null || priceFils < 0) return { error: 'Enter a valid price in KWD.' };
  if (!categoryId) return { error: 'Choose a category.' };

  const data = {
    name,
    categoryId,
    description: getOptionalString(formData, 'description'),
    priceFils,
    imageUrl: getOptionalString(formData, 'imageUrl'),
    isAvailable: getString(formData, 'isAvailable') === 'on',
    displayOrder: getInt(formData, 'displayOrder', 0)
  };
  if (id) {
    await prisma.menuItem.update({ where: { id }, data });
  } else {
    await prisma.menuItem.create({ data });
  }
  revalidatePath('/super/menu');
  revalidatePath('/menu');
  redirect('/super/menu');
}

export async function deleteMenuItemAction(formData: FormData) {
  await requireSuperAdmin();
  const id = getString(formData, 'id');
  await prisma.menuItem.delete({ where: { id } });
  revalidatePath('/super/menu');
  revalidatePath('/menu');
}

export async function toggleItemAvailabilityAction(formData: FormData) {
  await requireCafeteriaAdmin(); // admins can mark items sold-out
  const id = getString(formData, 'id');
  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item) return;
  await prisma.menuItem.update({ where: { id }, data: { isAvailable: !item.isAvailable } });
  revalidatePath('/menu');
  revalidatePath('/admin/menu');
}

// ---------------------------------------------------------------------------
// User management (super admin)
// ---------------------------------------------------------------------------

export async function createStaffAction(_prev: unknown, formData: FormData) {
  await requireSuperAdmin();
  const name = getString(formData, 'name');
  const email = getString(formData, 'email').toLowerCase();
  const password = getString(formData, 'password');
  const role = getString(formData, 'role') as UserRole;
  if (name.length < 2 || !email || password.length < 8) {
    return { error: 'Enter a name, email, and a password of at least 8 characters.' };
  }
  if (role !== UserRole.CAFETERIA_ADMIN && role !== UserRole.SUPER_ADMIN) {
    return { error: 'Choose a valid staff role.' };
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: 'An account with that email already exists.' };

  const user = await prisma.user.create({
    data: { name, email, role, passwordHash: await hashPassword(password) }
  });
  const me = await getSessionUser();
  if (me) await logAction(me.id, 'CREATE_STAFF', 'User', user.id, user.name);
  revalidatePath('/super/users');
  redirect('/super/users');
}

export async function toggleUserActiveAction(formData: FormData) {
  const admin = await requireSuperAdmin();
  const id = getString(formData, 'id');
  if (id === admin.id) return; // never lock yourself out
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return;
  await prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
  await logAction(admin.id, 'TOGGLE_USER_ACTIVE', 'User', id, user.name);
  revalidatePath('/super/users');
}

export async function saveSettingsAction(_prev: unknown, formData: FormData) {
  await requireSuperAdmin();
  const negativeLimitFils = parseKwdToFils(getString(formData, 'negativeLimit'));
  if (negativeLimitFils === null || negativeLimitFils < 0) {
    return { error: 'Enter a valid negative limit in KWD.' };
  }
  await prisma.appSetting.upsert({
    where: { id: 'singleton' },
    update: {
      negativeLimitFils,
      allowedEmailDomains: getString(formData, 'allowedEmailDomains') || 'kufpec.com',
      cafeteriaName: getString(formData, 'cafeteriaName') || 'KUFPEC Cafeteria'
    },
    create: {
      id: 'singleton',
      negativeLimitFils,
      allowedEmailDomains: getString(formData, 'allowedEmailDomains') || 'kufpec.com',
      cafeteriaName: getString(formData, 'cafeteriaName') || 'KUFPEC Cafeteria'
    }
  });
  revalidatePath('/super/settings');
  return { ok: 'Settings saved.' };
}
