import { redirect } from 'next/navigation';

// Admins use the same receipt view as employees.
export default async function AdminReceiptRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/receipts/${id}`);
}
