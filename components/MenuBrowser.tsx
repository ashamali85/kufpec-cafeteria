'use client';

import { useActionState, useMemo, useState } from 'react';
import { placeOrderAction } from '@/lib/actions';
import { formatKwd } from '@/lib/money';
import { SubmitButton } from '@/components/SubmitButton';
import { ProcessingOverlay } from '@/components/ProcessingOverlay';

type Item = {
  id: string;
  name: string;
  description: string | null;
  priceFils: number;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryName: string;
};

type CartLine = { item: Item; quantity: number; note: string };

export function MenuBrowser({
  items,
  categories,
  defaultOffice,
  defaultFloor
}: {
  items: Item[];
  categories: string[];
  defaultOffice: string;
  defaultFloor: string;
}) {
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [activeCat, setActiveCat] = useState<string>('All');
  const [reviewing, setReviewing] = useState(false);
  const [office, setOffice] = useState(defaultOffice);
  const [floor, setFloor] = useState(defaultFloor);
  const [customerNote, setCustomerNote] = useState('');
  const [state, formAction] = useActionState(placeOrderAction, null);

  const visible = useMemo(
    () => (activeCat === 'All' ? items : items.filter((i) => i.categoryName === activeCat)),
    [items, activeCat]
  );

  const lines = Object.values(cart);
  const total = lines.reduce((sum, l) => sum + l.item.priceFils * l.quantity, 0);
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);

  function add(item: Item) {
    setCart((c) => {
      const existing = c[item.id];
      return { ...c, [item.id]: { item, quantity: (existing?.quantity ?? 0) + 1, note: existing?.note ?? '' } };
    });
  }
  function setQty(id: string, qty: number) {
    setCart((c) => {
      if (qty <= 0) {
        const next = { ...c };
        delete next[id];
        return next;
      }
      return { ...c, [id]: { ...c[id], quantity: qty } };
    });
  }
  function setNote(id: string, note: string) {
    setCart((c) => ({ ...c, [id]: { ...c[id], note } }));
  }

  const cartPayload = JSON.stringify(
    lines.map((l) => ({ menuItemId: l.item.id, quantity: l.quantity, note: l.note }))
  );

  return (
    <div className="row wrap" style={{ alignItems: 'flex-start', gap: 24 }}>
      <div className="grow" style={{ minWidth: 280 }}>
        <div className="row wrap" style={{ marginBottom: 16, gap: 8 }}>
          <button
            className={`btn btn-sm ${activeCat === 'All' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveCat('All')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`btn btn-sm ${activeCat === cat ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="menu-grid">
          {visible.map((item) => {
            const inCart = cart[item.id]?.quantity ?? 0;
            return (
              <article key={item.id} className={`menu-item ${item.isAvailable ? '' : 'sold-out'}`}>
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="menu-item-photo" />
                ) : (
                  <div className="menu-item-photo-fallback">{item.name.charAt(0)}</div>
                )}
                <div className="menu-item-body">
                  <strong>{item.name}</strong>
                  {item.description && <span className="small muted">{item.description}</span>}
                  <span className="menu-item-price">{formatKwd(item.priceFils)}</span>
                  <div className="mt-2">
                    {!item.isAvailable ? (
                      <span className="badge badge-cancelled">Sold out</span>
                    ) : inCart > 0 ? (
                      <div className="row" style={{ gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setQty(item.id, inCart - 1)}>–</button>
                        <strong>{inCart}</strong>
                        <button className="btn btn-ghost btn-sm" onClick={() => setQty(item.id, inCart + 1)}>+</button>
                      </div>
                    ) : (
                      <button className="btn btn-accent btn-sm btn-block" onClick={() => add(item)}>Add</button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Cart panel */}
      <aside className="card" style={{ width: 320, position: 'sticky', top: 16 }}>
        <h3 style={{ marginBottom: 12 }}>Your order {count > 0 && <span className="muted">({count})</span>}</h3>

        {lines.length === 0 ? (
          <p className="muted small">Add items from the menu and they’ll show up here.</p>
        ) : !reviewing ? (
          /* ---------- STEP 1: edit cart ---------- */
          <>
            <div className="stack" style={{ gap: 12 }}>
              {lines.map((l) => (
                <div key={l.item.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
                  <div className="row-between">
                    <strong className="small">{l.item.name}</strong>
                    <span className="small">{formatKwd(l.item.priceFils * l.quantity)}</span>
                  </div>
                  <div className="row" style={{ gap: 6, marginTop: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setQty(l.item.id, l.quantity - 1)}>–</button>
                    <span>{l.quantity}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setQty(l.item.id, l.quantity + 1)}>+</button>
                  </div>
                  <input
                    className="mt-2"
                    placeholder="Note (e.g. no onions, extra cheese)"
                    value={l.note}
                    onChange={(e) => setNote(l.item.id, e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                  />
                </div>
              ))}
            </div>

            <div className="alert alert-info mt-4 small">
              This is an estimate. The cafeteria confirms the final price (toppings, extras) before
              charging your credit.
            </div>
            <div className="row-between" style={{ fontWeight: 700, margin: '8px 0 14px' }}>
              <span>Estimated total</span>
              <span>{formatKwd(total)}</span>
            </div>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="deliveryOffice">Office</label>
                <input id="deliveryOffice" value={office} onChange={(e) => setOffice(e.target.value)} placeholder="Office #" />
              </div>
              <div className="field">
                <label htmlFor="deliveryFloor">Floor</label>
                <input id="deliveryFloor" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Floor" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="customerNote">Note for the cafeteria</label>
              <textarea id="customerNote" value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} rows={2} />
            </div>

            <button className="btn btn-primary btn-block" onClick={() => setReviewing(true)}>
              Review order
            </button>
          </>
        ) : (
          /* ---------- STEP 2: final review + submit ---------- */
          <>
            <div className="alert alert-info small" style={{ marginBottom: 12 }}>
              Final review — check everything below, then submit your order.
            </div>

            <div className="stack" style={{ gap: 8 }}>
              {lines.map((l) => (
                <div key={l.item.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
                  <div className="row-between">
                    <span className="small"><strong>{l.quantity}×</strong> {l.item.name}</span>
                    <span className="small">{formatKwd(l.item.priceFils * l.quantity)}</span>
                  </div>
                  {l.note && <div className="muted small" style={{ marginTop: 2 }}>↳ {l.note}</div>}
                </div>
              ))}
            </div>

            <div className="stack small" style={{ gap: 4, margin: '12px 0' }}>
              <div className="row-between"><span className="muted">Deliver to office</span><strong>{office || '—'}</strong></div>
              <div className="row-between"><span className="muted">Floor</span><strong>{floor || '—'}</strong></div>
              {customerNote.trim() && (
                <div className="row-between"><span className="muted">Note</span><strong style={{ textAlign: 'right' }}>{customerNote.trim()}</strong></div>
              )}
            </div>

            <div className="row-between" style={{ fontWeight: 700, margin: '8px 0 14px' }}>
              <span>Estimated total</span>
              <span>{formatKwd(total)}</span>
            </div>

            {state?.error && <div className="alert alert-error">{state.error}</div>}

            <form action={formAction}>
              <ProcessingOverlay label="Submitting your order…" />
              <input type="hidden" name="cart" value={cartPayload} />
              <input type="hidden" name="deliveryOffice" value={office} />
              <input type="hidden" name="deliveryFloor" value={floor} />
              <input type="hidden" name="customerNote" value={customerNote} />
              <SubmitButton className="btn btn-primary btn-block" pendingText="Submitting…">
                Submit order
              </SubmitButton>
              <button
                type="button"
                className="btn btn-ghost btn-block mt-2"
                onClick={() => setReviewing(false)}
              >
                Back to edit
              </button>
            </form>
          </>
        )}
      </aside>
    </div>
  );
}
