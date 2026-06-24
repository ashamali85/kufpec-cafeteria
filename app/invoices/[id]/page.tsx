import { notFound, redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { InvoiceDoc } from '@/components/InvoiceDoc';
import { PrintButton } from '@/components/PrintButton';

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { order: { include: { items: true, customer: true } } }
  });
  if (!invoice) notFound();

  // Employees may only see their own; admins may see all.
  const isStaff = user.role === UserRole.CAFETERIA_ADMIN || user.role === UserRole.SUPER_ADMIN;
  if (!isStaff && invoice.order.customerId !== user.id) notFound();

  const settings = await getSettings();

  return (
    <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <div className="center print-hide" style={{ marginBottom: 16 }}>
        <PrintButton />
      </div>
      <InvoiceDoc
        cafeteriaName={settings.cafeteriaName}
        invoiceNumber={invoice.invoiceNumber}
        orderNumber={invoice.order.orderNumber}
        employeeName={invoice.order.customer.name}
        deliveryOffice={invoice.order.deliveryOffice}
        deliveryFloor={invoice.order.deliveryFloor}
        items={invoice.order.items.map((i) => ({
          nameSnapshot: i.nameSnapshot,
          quantity: i.quantity,
          lineTotalFils: i.lineTotalFils,
          note: i.note
        }))}
        totalFils={invoice.totalFils}
        createdAt={invoice.createdAt}
      />
    </main>
  );
}
