'use client';

import { useActionState } from 'react';
import { saveMenuItemAction } from '@/lib/actions';
import { SubmitButton } from '@/components/SubmitButton';
import { ImageUploadField } from '@/components/ImageUploadField';

type Item = {
  id: string;
  name: string;
  description: string;
  priceKwd: string;
  categoryId: string;
  imageUrl: string | null;
  isAvailable: boolean;
  displayOrder: number;
};

export function MenuItemForm({
  categories,
  item
}: {
  categories: { id: string; name: string }[];
  item: Item | null;
}) {
  const [state, formAction] = useActionState(saveMenuItemAction, null);

  return (
    <div className="card">
      {state?.error && <div className="alert alert-error">{state.error}</div>}
      <form action={formAction}>
        {item && <input type="hidden" name="id" value={item.id} />}
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" defaultValue={item?.name} required />
        </div>
        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={2} defaultValue={item?.description} />
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="price">Price (KWD)</label>
            <input id="price" name="price" inputMode="decimal" placeholder="e.g. 1.250" defaultValue={item?.priceKwd} required />
          </div>
          <div className="field">
            <label htmlFor="categoryId">Category</label>
            <select id="categoryId" name="categoryId" defaultValue={item?.categoryId ?? ''}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <ImageUploadField name="imageUrl" defaultUrl={item?.imageUrl ?? null} />

        <div className="grid-2">
          <div className="field">
            <label htmlFor="displayOrder">Display order</label>
            <input id="displayOrder" name="displayOrder" type="number" defaultValue={item?.displayOrder ?? 0} />
          </div>
          <label className="row" style={{ gap: 8, alignItems: 'center', marginTop: 28 }}>
            <input type="checkbox" name="isAvailable" defaultChecked={item ? item.isAvailable : true} style={{ width: 'auto' }} />
            Available to order
          </label>
        </div>

        <SubmitButton pendingText="Saving…">{item ? 'Save changes' : 'Add item'}</SubmitButton>
      </form>
    </div>
  );
}
