'use client';

import { useActionState, useMemo, useState } from 'react';
import { placeOrderAction } from '@/lib/actions';
import { formatKwd } from '@/lib/money';
import { SubmitButton } from '@/components/SubmitButton';

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
        ) : (
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

            {state?.error && <div className="alert alert-error">{state.error}</div>}

            <form action={formAction}>
              <input type="hidden" name="cart" value={cartPayload} />
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="deliveryOffice">Office</label>
                  <input id="deliveryOffice" name="deliveryOffice" defaultValue={defaultOffice} placeholder="Office #" />
                </div>
                <div className="field">
                  <label htmlFor="deliveryFloor">Floor</label>
                  <input id="deliveryFloor" name="deliveryFloor" defaultValue={defaultFloor} placeholder="Floor" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="customerNote">Note for the cafeteria</label>
                <textarea id="customerNote" name="customerNote" rows={2} />
              </div>
              <SubmitButton className="btn btn-primary btn-block" pendingText="Placing order…">
                Place order
              </SubmitButton>
            </form>
          </>
        )}
      </aside>
    </div>
  );
}
