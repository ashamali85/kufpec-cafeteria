import { notFound, redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { ReceiptDoc } from '@/components/ReceiptDoc';
import { PrintButton } from '@/components/PrintButton';

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: { ledgerEntry: { include: { owner: true, createdBy: true } } }
  });
  if (!receipt) notFound();

  const isStaff = user.role === UserRole.CAFETERIA_ADMIN || user.role === UserRole.SUPER_ADMIN;
  if (!isStaff && receipt.ledgerEntry.ownerId !== user.id) notFound();

  const settings = await getSettings();

  return (
    <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <div className="center print-hide" style={{ marginBottom: 16 }}>
        <PrintButton />
      </div>
      <ReceiptDoc
        cafeteriaName={settings.cafeteriaName}
        receiptNumber={receipt.receiptNumber}
        employeeName={receipt.ledgerEntry.owner.name}
        employeeEmail={receipt.ledgerEntry.owner.email}
        amountFils={receipt.ledgerEntry.amountFils}
        balanceAfter={receipt.ledgerEntry.balanceAfter}
        note={receipt.ledgerEntry.note}
        handledByName={receipt.ledgerEntry.createdBy?.name ?? null}
        createdAt={receipt.createdAt}
      />
    </main>
  );
}
