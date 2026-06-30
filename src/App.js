import { useState, useEffect } from "react";

// ── 색상 (로이스6 — 따뜻한 마켓 톤) ──────────────────────────────────
const C = {
  bg: "#FAF7F2", surface: "#FFFFFF", ink: "#2B241C", muted: "#8A7F6E",
  border: "#E8E0D3", accent: "#B5562C", accentLight: "#FBEEE6",
  green: "#5C7A4F", greenLight: "#EEF3EA", red: "#C0392B", redLight: "#FDECEA",
  yellow: "#C9962B", yellowLight: "#FCF3E1", navy: "#3A4A5C",
};

// ── 반응형 ────────────────────────────────────────────────────────────
const useWidth = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
};
const isMob = (w) => w < 768;
const isTab = (w) => w >= 768 && w < 1024;

// ── 헬퍼 ──────────────────────────────────────────────────────────────
const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const won = (n) => `₩${Number(n || 0).toLocaleString("ko-KR")}`;
const todayStr = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) => { if (!d) return "-"; const dt = new Date(d); return `${dt.getFullYear()}.${String(dt.getMonth()+1).padStart(2,"0")}.${String(dt.getDate()).padStart(2,"0")}`; };

// ── 스타일 ────────────────────────────────────────────────────────────
const S = {
  input: { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: C.ink, backgroundColor: C.surface, outline: "none", fontFamily: "inherit" },
  select: { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: C.ink, backgroundColor: C.surface, outline: "none", fontFamily: "inherit", cursor: "pointer" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4 },
  btn: (color = C.accent) => ({ backgroundColor: color, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }),
  btnOutline: { backgroundColor: "transparent", color: C.accent, border: `1.5px solid ${C.accent}`, borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  btnGhost: { backgroundColor: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
  card: { backgroundColor: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px" },
};

const Badge = ({ text, color = C.accent, bg = C.accentLight }) => (
  <span style={{ backgroundColor: bg, color, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{text}</span>
);
const Field = ({ label, children }) => <div><label style={S.label}>{label}</label>{children}</div>;
const Grid = ({ cols = 2, w, children, gap = 12 }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${isMob(w) ? 1 : cols}, 1fr)`, gap, marginBottom: gap }}>{children}</div>
);
const Title = ({ eyebrow, title, sub, action, w }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
    <div>
      {eyebrow && <div style={{ fontSize: 11, fontWeight: 800, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{eyebrow}</div>}
      <h2 style={{ margin: 0, fontSize: isMob(w) ? 19 : 24, fontWeight: 900, letterSpacing: "-0.02em" }}>{title}</h2>
      {sub && <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>{sub}</p>}
    </div>
    {action}
  </div>
);

// ════════════════════════════════════════════════════════════════════
//  물품 관리
// ════════════════════════════════════════════════════════════════════
function ProductManager({ products, setProducts, w }) {
  const mob = isMob(w);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const blank = { name: "", cost: "", price: "" };
  const [form, setForm] = useState(blank);
  const setF = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const [search, setSearch] = useState("");

  const margin = (Number(form.price) || 0) - (Number(form.cost) || 0);

  const saveItem = () => {
    if (!form.name) return;
    let u;
    if (editing) {
      u = products.map(p => p.id === editing ? { ...form, id: editing } : p);
      setEditing(null);
    } else {
      u = [...products, { ...form, id: Date.now() }];
    }
    setProducts(u); save("order-products", u);
    setForm(blank); setAdding(false);
  };
  const startEdit = (p) => { setForm({ name: p.name, cost: p.cost, price: p.price }); setEditing(p.id); setAdding(true); };
  const remove = (id) => { if (!window.confirm("삭제할까요?")) return; const u = products.filter(p => p.id !== id); setProducts(u); save("order-products", u); };

  const filtered = products.filter(p => p.name.includes(search));

  return (
    <div>
      <Title eyebrow="Products" title="물품 관리" sub={`등록된 물품 ${products.length}개`} w={w}
        action={<button style={S.btn()} onClick={() => { setForm(blank); setEditing(null); setAdding(!adding); }}>+ 물품 추가</button>} />

      {adding && (
        <div style={{ ...S.card, marginBottom: 18, backgroundColor: C.accentLight, border: `1.5px solid ${C.accent}` }}>
          <div style={{ fontWeight: 800, marginBottom: 14 }}>{editing ? "물품 수정" : "새 물품 등록"}</div>
          <Grid cols={3} w={w}>
            <Field label="품명 *"><input style={S.input} value={form.name} onChange={e => setF("name", e.target.value)} placeholder="감귤 5kg" /></Field>
            <Field label="매입원가(입고가)"><input style={S.input} type="number" value={form.cost} onChange={e => setF("cost", e.target.value)} placeholder="20000" /></Field>
            <Field label="판매가"><input style={S.input} type="number" value={form.price} onChange={e => setF("price", e.target.value)} placeholder="23000" /></Field>
          </Grid>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: C.muted }}>예상 마진</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: margin >= 0 ? C.green : C.red }}>{won(margin)}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btn()} onClick={saveItem}>{editing ? "수정 저장" : "저장"}</button>
            <button style={S.btnGhost} onClick={() => { setAdding(false); setEditing(null); }}>취소</button>
          </div>
        </div>
      )}

      <input style={{ ...S.input, marginBottom: 14 }} placeholder="품명 검색" value={search} onChange={e => setSearch(e.target.value)} />

      <div style={{ ...S.card, padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: mob ? 480 : 600 }}>
          <thead>
            <tr style={{ backgroundColor: C.bg }}>
              {["품명","매입원가(입고가)","판매가","마진",""].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: h === "품명" ? "left" : "right", fontWeight: 700, color: C.muted, borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: C.muted }}>등록된 물품이 없습니다</td></tr>
              : filtered.map(p => {
                const m = (Number(p.price) || 0) - (Number(p.cost) || 0);
                return (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "11px 14px", fontWeight: 700 }}>{p.name}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right", color: C.muted }}>{won(p.cost)}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 600 }}>{won(p.price)}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 700, color: m >= 0 ? C.green : C.red }}>{won(m)}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button style={{ ...S.btn(C.navy), padding: "5px 10px", fontSize: 11 }} onClick={() => startEdit(p)}>수정</button>
                        <button style={{ ...S.btn(C.red), padding: "5px 10px", fontSize: 11 }} onClick={() => remove(p.id)}>삭제</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  회원 관리
// ════════════════════════════════════════════════════════════════════
function MemberManager({ members, setMembers, w }) {
  const mob = isMob(w);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const blank = { name: "", phone: "", note: "" };
  const [form, setForm] = useState(blank);
  const setF = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const [search, setSearch] = useState("");

  const saveMember = () => {
    if (!form.name) return;
    let u;
    if (editing) {
      u = members.map(m => m.id === editing ? { ...form, id: editing } : m);
      setEditing(null);
    } else {
      u = [...members, { ...form, id: Date.now() }];
    }
    setMembers(u); save("order-members", u);
    setForm(blank); setAdding(false);
  };
  const startEdit = (m) => { setForm({ name: m.name, phone: m.phone, note: m.note }); setEditing(m.id); setAdding(true); };
  const remove = (id) => { if (!window.confirm("삭제할까요?")) return; const u = members.filter(m => m.id !== id); setMembers(u); save("order-members", u); if (editing === id) { setEditing(null); setAdding(false); setForm(blank); } };
  const filtered = members.filter(m => m.name.includes(search));

  return (
    <div>
      <Title eyebrow="Members" title="회원 관리" sub={`등록된 회원 ${members.length}명 · 회원 카드를 클릭하면 수정할 수 있어요`} w={w}
        action={<button style={S.btn()} onClick={() => { setForm(blank); setEditing(null); setAdding(!adding); }}>+ 회원 추가</button>} />

      {adding && (
        <div style={{ ...S.card, marginBottom: 18, backgroundColor: C.accentLight, border: `1.5px solid ${C.accent}` }}>
          <div style={{ fontWeight: 800, marginBottom: 14 }}>{editing ? "회원 정보 수정" : "새 회원 등록"}</div>
          <Grid cols={3} w={w}>
            <Field label="이름 *"><input style={S.input} value={form.name} onChange={e => setF("name", e.target.value)} placeholder="홍길동" /></Field>
            <Field label="연락처"><input style={S.input} value={form.phone} onChange={e => setF("phone", e.target.value)} placeholder="010-0000-0000" /></Field>
            <Field label="메모"><input style={S.input} value={form.note} onChange={e => setF("note", e.target.value)} placeholder="구역, 직분 등" /></Field>
          </Grid>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btn()} onClick={saveMember}>{editing ? "수정 저장" : "저장"}</button>
            <button style={S.btnGhost} onClick={() => { setAdding(false); setEditing(null); setForm(blank); }}>취소</button>
          </div>
        </div>
      )}

      <input style={{ ...S.input, marginBottom: 14 }} placeholder="이름 검색" value={search} onChange={e => setSearch(e.target.value)} />

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
        {filtered.length === 0
          ? <div style={{ ...S.card, gridColumn: "1/-1", textAlign: "center", color: C.muted }}>등록된 회원이 없습니다</div>
          : filtered.map(m => (
            <div key={m.id} style={{ ...S.card, padding: 14, cursor: "pointer" }} onClick={() => startEdit(m)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{m.name}</div>
                  {m.phone && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{m.phone}</div>}
                  {m.note && <div style={{ fontSize: 11, color: C.accent, marginTop: 4 }}>{m.note}</div>}
                </div>
                <button style={{ ...S.btn(C.red), padding: "4px 9px", fontSize: 10 }} onClick={e => { e.stopPropagation(); remove(m.id); }}>삭제</button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  주문 입력 (장바구니식)
// ════════════════════════════════════════════════════════════════════
function OrderEntry({ members, products, orders, setOrders, w }) {
  const mob = isMob(w);
  const [memberId, setMemberId] = useState("");
  const [items, setItems] = useState([]);
  const [pickProduct, setPickProduct] = useState("");
  const [pickQty, setPickQty] = useState(1);

  const addItem = () => {
    if (!pickProduct) return;
    const product = products.find(p => p.id === Number(pickProduct));
    if (!product) return;
    const existing = items.find(c => c.productId === product.id);
    if (existing) {
      setItems(items.map(c => c.productId === product.id ? { ...c, qty: c.qty + Number(pickQty) } : c));
    } else {
      setItems([...items, { productId: product.id, name: product.name, cost: Number(product.cost) || 0, price: Number(product.price) || 0, qty: Number(pickQty) }]);
    }
    setPickProduct(""); setPickQty(1);
  };
  const removeItem = (productId) => setItems(items.filter(c => c.productId !== productId));
  const updateQty = (productId, qty) => setItems(items.map(c => c.productId === productId ? { ...c, qty: Math.max(1, Number(qty)) } : c));

  const totalCost = items.reduce((s, c) => s + c.cost * c.qty, 0);
  const totalPrice = items.reduce((s, c) => s + c.price * c.qty, 0);
  const totalMargin = totalPrice - totalCost;

  // 🤖 "주문" 누르면 즉시 주문 리스트에 추가되고, 입력창은 다음 사람 받을 준비로 초기화
  const submitOrder = () => {
    if (!memberId || items.length === 0) return;
    const member = members.find(m => m.id === Number(memberId));
    const newOrder = {
      id: Date.now(),
      memberId: Number(memberId),
      memberName: member.name,
      items,
      totalCost,
      totalPrice,
      totalMargin,
      paid: false,
      paidAmount: 0,
      date: todayStr(),
    };
    const u = [...orders, newOrder];
    setOrders(u); save("order-orders", u);
    setItems([]); setMemberId("");
  };

  return (
    <div>
      <Title eyebrow="New Order" title="주문 입력" sub="회원을 선택하고 물품을 추가한 뒤 주문 버튼을 누르면 주문 리스트에 바로 등록돼요" w={w} />

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 360px", gap: 16 }}>
        {/* 왼쪽: 입력 */}
        <div>
          <div style={{ ...S.card, marginBottom: 14 }}>
            <Field label="주문자 (회원) *">
              <select style={S.select} value={memberId} onChange={e => setMemberId(e.target.value)}>
                <option value="">회원을 선택하세요</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}{m.note ? ` (${m.note})` : ""}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ ...S.card, marginBottom: 14 }}>
            <div style={{ fontWeight: 800, marginBottom: 14 }}>물품 추가</div>
            <Grid cols={3} w={w}>
              <div style={{ gridColumn: mob ? "auto" : "span 2" }}>
                <label style={S.label}>물품 선택</label>
                <select style={S.select} value={pickProduct} onChange={e => setPickProduct(e.target.value)}>
                  <option value="">물품을 선택하세요</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} — {won(p.price)}</option>)}
                </select>
              </div>
              <Field label="수량"><input style={S.input} type="number" min="1" value={pickQty} onChange={e => setPickQty(e.target.value)} /></Field>
            </Grid>
            <button style={S.btn(C.navy)} onClick={addItem}>+ 물품 추가</button>
          </div>

          {/* 담긴 물품 */}
          <div style={S.card}>
            <div style={{ fontWeight: 800, marginBottom: 14 }}>주문 물품 ({items.length})</div>
            {items.length === 0
              ? <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "30px 0" }}>아직 추가한 물품이 없습니다</div>
              : items.map(c => (
                <div key={c.productId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}`, flexWrap: mob ? "wrap" : "nowrap" }}>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 14, minWidth: 100 }}>{c.name}</span>
                  <input type="number" min="1" value={c.qty} onChange={e => updateQty(c.productId, e.target.value)} style={{ ...S.input, width: 60, padding: "6px 8px", textAlign: "center" }} />
                  <span style={{ fontSize: 13, color: C.muted, width: 36 }}>개</span>
                  <span style={{ fontWeight: 700, fontSize: 14, width: 90, textAlign: "right" }}>{won(c.price * c.qty)}</span>
                  <button style={{ ...S.btn(C.red), padding: "5px 10px", fontSize: 11 }} onClick={() => removeItem(c.productId)}>삭제</button>
                </div>
              ))}
          </div>
        </div>

        {/* 오른쪽: 요약 + 주문 버튼 */}
        <div>
          <div style={{ ...S.card, position: mob ? "static" : "sticky", top: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>주문 요약</div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.muted }}>주문자</span><span style={{ fontWeight: 700 }}>{members.find(m => m.id === Number(memberId))?.name || "-"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.muted }}>총 개수</span><span style={{ fontWeight: 700 }}>{items.reduce((s, c) => s + c.qty, 0)}개</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.muted }}>총 매입가</span><span>{won(totalCost)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.muted }}>예상 마진</span><span style={{ color: C.green, fontWeight: 700 }}>{won(totalMargin)}</span>
            </div>
            <div style={{ backgroundColor: C.accentLight, borderRadius: 10, padding: 14, margin: "14px 0", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, marginBottom: 4 }}>받아야 할 금액</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: C.accent }}>{won(totalPrice)}</div>
            </div>
            <button style={{ ...S.btn(), width: "100%", padding: "13px", fontSize: 14 }} onClick={submitOrder} disabled={!memberId || items.length === 0}>주문</button>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 8, textAlign: "center" }}>누르면 바로 주문 리스트에 추가돼요</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  주문 리스트 (+ 입금관리)
// ════════════════════════════════════════════════════════════════════
function OrderList({ orders, setOrders, w }) {
  const mob = isMob(w);
  const [filter, setFilter] = useState("전체");
  const [expanded, setExpanded] = useState(null);

  const togglePaid = (id) => {
    const u = orders.map(o => o.id === id ? { ...o, paid: !o.paid, paidAmount: !o.paid ? o.totalPrice : 0 } : o);
    setOrders(u); save("order-orders", u);
  };
  const updatePaidAmount = (id, amt) => {
    const u = orders.map(o => o.id === id ? { ...o, paidAmount: Number(amt), paid: Number(amt) >= o.totalPrice } : o);
    setOrders(u); save("order-orders", u);
  };
  const remove = (id) => { if (!window.confirm("주문을 삭제할까요?")) return; const u = orders.filter(o => o.id !== id); setOrders(u); save("order-orders", u); };

  const filtered = orders.filter(o => filter === "전체" ? true : filter === "입금완료" ? o.paid : !o.paid);
  const totalPrice = orders.reduce((s, o) => s + o.totalPrice, 0);
  const totalPaid = orders.reduce((s, o) => s + (o.paidAmount || 0), 0);
  const totalUnpaid = totalPrice - totalPaid;

  return (
    <div>
      <Title eyebrow="Orders" title="주문 리스트" sub={`전체 ${orders.length}건`} w={w} />

      {/* 요약 */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "총 판매액", value: totalPrice, color: C.ink, bg: C.bg },
          { label: "입금 완료", value: totalPaid, color: C.green, bg: C.greenLight },
          { label: "미수금", value: totalUnpaid, color: totalUnpaid > 0 ? C.red : C.muted, bg: totalUnpaid > 0 ? C.redLight : C.bg },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: s.bg, borderRadius: 12, padding: mob ? "14px" : "18px" }}>
            <div style={{ fontSize: 12, color: s.color, fontWeight: 700, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: mob ? 18 : 22, fontWeight: 900, color: s.color }}>{won(s.value)}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {["전체","입금완료","미입금"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", backgroundColor: filter === f ? C.accent : C.bg, color: filter === f ? "#fff" : C.muted, fontFamily: "inherit" }}>{f}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0
          ? <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: 40 }}>주문 내역이 없습니다</div>
          : filtered.map(o => (
            <div key={o.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer", flexWrap: "wrap", gap: 8 }} onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>{o.memberName}</span>
                    <button
                      onClick={e => { e.stopPropagation(); togglePaid(o.id); }}
                      style={{ border: "none", cursor: "pointer", fontFamily: "inherit", backgroundColor: o.paid ? C.greenLight : C.redLight, color: o.paid ? C.green : C.red, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}
                      title="클릭해서 입금 상태 전환"
                    >
                      {o.paid ? "✓ 입금완료" : "○ 미입금"}
                    </button>
                    <span style={{ fontSize: 12, color: C.muted }}>{fmtDate(o.date)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{o.items.map(i => `${i.name} ${i.qty}개`).join(", ")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.accent }}>{won(o.totalPrice)}</div>
                  {!o.paid && o.paidAmount > 0 && <div style={{ fontSize: 11, color: C.red }}>미수 {won(o.totalPrice - o.paidAmount)}</div>}
                </div>
              </div>

              {expanded === o.id && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 14 }}>
                    <thead><tr>{["물품","수량","단가","합계"].map(h => <th key={h} style={{ textAlign: h === "물품" ? "left" : "right", padding: "6px 8px", color: C.muted, fontSize: 11, fontWeight: 700 }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {o.items.map((it, i) => (
                        <tr key={i}>
                          <td style={{ padding: "6px 8px" }}>{it.name}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right" }}>{it.qty}개</td>
                          <td style={{ padding: "6px 8px", textAlign: "right" }}>{won(it.price)}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700 }}>{won(it.price * it.qty)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={o.paid} onChange={() => togglePaid(o.id)} style={{ width: 16, height: 16 }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>입금 완료</span>
                    </label>
                    <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, color: C.muted }}>입금액</span>
                      <input type="number" value={o.paidAmount || 0} onChange={e => updatePaidAmount(o.id, e.target.value)} style={{ ...S.input, width: 110, padding: "5px 8px" }} />
                    </div>
                    <button style={{ ...S.btn(C.red), marginLeft: "auto", padding: "6px 14px", fontSize: 11 }} onClick={e => { e.stopPropagation(); remove(o.id); }}>주문 삭제</button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  보고서 (물품별 / 인원별 자동 집계)
// ════════════════════════════════════════════════════════════════════
function ReportPage({ orders, w }) {
  const mob = isMob(w);
  const [tab, setTab] = useState("product");

  // 🤖 물품별 자동 집계
  const productAgg = {};
  orders.forEach(o => o.items.forEach(it => {
    if (!productAgg[it.name]) productAgg[it.name] = { name: it.name, qty: 0, cost: 0, price: 0, margin: 0 };
    productAgg[it.name].qty += it.qty;
    productAgg[it.name].cost += it.cost * it.qty;
    productAgg[it.name].price += it.price * it.qty;
    productAgg[it.name].margin += (it.price - it.cost) * it.qty;
  }));
  const productList = Object.values(productAgg).sort((a, b) => b.price - a.price);

  // 🤖 인원별 자동 집계
  const memberAgg = {};
  orders.forEach(o => {
    if (!memberAgg[o.memberName]) memberAgg[o.memberName] = { name: o.memberName, qty: 0, cost: 0, price: 0, margin: 0, paid: 0 };
    memberAgg[o.memberName].qty += o.items.reduce((s, i) => s + i.qty, 0);
    memberAgg[o.memberName].cost += o.totalCost;
    memberAgg[o.memberName].price += o.totalPrice;
    memberAgg[o.memberName].margin += o.totalMargin;
    memberAgg[o.memberName].paid += o.paidAmount || 0;
  });
  const memberList = Object.values(memberAgg).sort((a, b) => b.price - a.price);

  const grandTotal = {
    qty: orders.reduce((s, o) => s + o.items.reduce((s2, i) => s2 + i.qty, 0), 0),
    cost: orders.reduce((s, o) => s + o.totalCost, 0),
    price: orders.reduce((s, o) => s + o.totalPrice, 0),
    margin: orders.reduce((s, o) => s + o.totalMargin, 0),
    paid: orders.reduce((s, o) => s + (o.paidAmount || 0), 0),
  };

  const copyReport = () => {
    let text = `📦 로이스6 사업물품 주문 보고서 (${fmtDate(todayStr())})\n\n`;
    text += `■ 물품별 집계\n`;
    productList.forEach(p => { text += `- ${p.name}: ${p.qty}개 / 매출 ${won(p.price)} / 마진 ${won(p.margin)}\n`; });
    text += `\n■ 인원별 집계\n`;
    memberList.forEach(m => { text += `- ${m.name}: ${m.qty}개 / ${won(m.price)} (입금 ${won(m.paid)})\n`; });
    text += `\n■ 총계\n총 ${grandTotal.qty}개 / 매출 ${won(grandTotal.price)} / 마진 ${won(grandTotal.margin)} / 입금 ${won(grandTotal.paid)} / 미수금 ${won(grandTotal.price - grandTotal.paid)}`;
    navigator.clipboard.writeText(text);
    alert("보고서가 클립보드에 복사되었습니다!");
  };

  return (
    <div>
      <Title eyebrow="Report" title="보고서" sub="실시간 자동 집계" w={w}
        action={<button style={S.btn(C.navy)} onClick={copyReport}>📋 보고서 복사</button>} />

      {/* 총계 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "총 수량", value: `${grandTotal.qty}개`, color: C.ink },
          { label: "총 매입가", value: won(grandTotal.cost), color: C.muted },
          { label: "총 판매가", value: won(grandTotal.price), color: C.accent },
          { label: "총 마진", value: won(grandTotal.margin), color: C.green },
          { label: "미수금", value: won(grandTotal.price - grandTotal.paid), color: grandTotal.price - grandTotal.paid > 0 ? C.red : C.muted },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px" }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: mob ? 14 : 17, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[{ id: "product", label: "📦 물품별" }, { id: "member", label: "👤 인원별" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", backgroundColor: tab === t.id ? C.accent : C.bg, color: tab === t.id ? "#fff" : C.muted, fontFamily: "inherit" }}>{t.label}</button>
        ))}
      </div>

      {tab === "product" && (
        <div style={{ ...S.card, padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: mob ? 500 : 600 }}>
            <thead>
              <tr style={{ backgroundColor: C.bg }}>
                {["물품","수량","총 매입가","총 판매가","총 마진"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: h === "물품" ? "left" : "right", fontWeight: 700, color: C.muted, fontSize: 12, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productList.length === 0
                ? <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: C.muted }}>주문 데이터가 없습니다</td></tr>
                : productList.map(p => (
                  <tr key={p.name} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "11px 14px", fontWeight: 700 }}>{p.name}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right" }}>{p.qty}개</td>
                    <td style={{ padding: "11px 14px", textAlign: "right", color: C.muted }}>{won(p.cost)}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 700 }}>{won(p.price)}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 700, color: C.green }}>{won(p.margin)}</td>
                  </tr>
                ))}
            </tbody>
            {productList.length > 0 && (
              <tfoot><tr style={{ backgroundColor: C.accentLight, fontWeight: 800 }}>
                <td style={{ padding: "11px 14px" }}>합계</td>
                <td style={{ padding: "11px 14px", textAlign: "right" }}>{grandTotal.qty}개</td>
                <td style={{ padding: "11px 14px", textAlign: "right" }}>{won(grandTotal.cost)}</td>
                <td style={{ padding: "11px 14px", textAlign: "right" }}>{won(grandTotal.price)}</td>
                <td style={{ padding: "11px 14px", textAlign: "right", color: C.green }}>{won(grandTotal.margin)}</td>
              </tr></tfoot>
            )}
          </table>
        </div>
      )}

      {tab === "member" && (
        <div style={{ ...S.card, padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: mob ? 540 : 660 }}>
            <thead>
              <tr style={{ backgroundColor: C.bg }}>
                {["이름","수량","총 판매가","입금액","미수금"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: h === "이름" ? "left" : "right", fontWeight: 700, color: C.muted, fontSize: 12, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {memberList.length === 0
                ? <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: C.muted }}>주문 데이터가 없습니다</td></tr>
                : memberList.map(m => {
                  const unpaid = m.price - m.paid;
                  return (
                    <tr key={m.name} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "11px 14px", fontWeight: 700 }}>{m.name}</td>
                      <td style={{ padding: "11px 14px", textAlign: "right" }}>{m.qty}개</td>
                      <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 700 }}>{won(m.price)}</td>
                      <td style={{ padding: "11px 14px", textAlign: "right", color: C.green }}>{won(m.paid)}</td>
                      <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 700, color: unpaid > 0 ? C.red : C.muted }}>{unpaid > 0 ? won(unpaid) : "-"}</td>
                    </tr>
                  );
                })}
            </tbody>
            {memberList.length > 0 && (
              <tfoot><tr style={{ backgroundColor: C.accentLight, fontWeight: 800 }}>
                <td style={{ padding: "11px 14px" }}>합계</td>
                <td style={{ padding: "11px 14px", textAlign: "right" }}>{grandTotal.qty}개</td>
                <td style={{ padding: "11px 14px", textAlign: "right" }}>{won(grandTotal.price)}</td>
                <td style={{ padding: "11px 14px", textAlign: "right", color: C.green }}>{won(grandTotal.paid)}</td>
                <td style={{ padding: "11px 14px", textAlign: "right", color: C.red }}>{won(grandTotal.price - grandTotal.paid)}</td>
              </tr></tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  앱 루트
// ════════════════════════════════════════════════════════════════════
export default function App() {
  const w = useWidth();
  const mob = isMob(w);
  const [page, setPageRaw] = useState(() => load("order-current-page", "entry"));
  const setPage = (id) => { setPageRaw(id); save("order-current-page", id); };
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState(() => load("order-products", []));
  const [members, setMembers] = useState(() => load("order-members", []));
  const [orders, setOrders] = useState(() => load("order-orders", []));

  const nav = [
    { id: "entry", label: "주문 입력", icon: "🛒" },
    { id: "orders", label: "주문 리스트", icon: "📋" },
    { id: "report", label: "보고서", icon: "📊" },
    { id: "products", label: "물품 관리", icon: "📦" },
    { id: "members", label: "회원 관리", icon: "👤" },
  ];
  const goTo = (id) => { setPage(id); setMenuOpen(false); };

  const renderPage = () => {
    switch (page) {
      case "entry": return <OrderEntry members={members} products={products} orders={orders} setOrders={setOrders} w={w} />;
      case "orders": return <OrderList orders={orders} setOrders={setOrders} w={w} />;
      case "report": return <ReportPage orders={orders} w={w} />;
      case "products": return <ProductManager products={products} setProducts={setProducts} w={w} />;
      case "members": return <MemberManager members={members} setMembers={setMembers} w={w} />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, fontFamily: "'Pretendard','Apple SD Gothic Neo','Noto Sans KR',sans-serif", color: C.ink }}>
      {mob ? (
        <>
          <div style={{ position: "sticky", top: 0, zIndex: 200, backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
            <div style={{ fontWeight: 900, fontSize: 15, color: C.accent }}>🍊 로이스6 주문관리</div>
            <button onClick={() => setMenuOpen(true)} style={{ border: "none", backgroundColor: "transparent", fontSize: 20, cursor: "pointer" }}>☰</button>
          </div>
          {menuOpen && (
            <div style={{ position: "fixed", inset: 0, zIndex: 300, backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setMenuOpen(false)}>
              <div style={{ position: "absolute", top: 0, left: 0, width: 250, height: "100%", backgroundColor: C.surface, padding: "20px 12px" }} onClick={e => e.stopPropagation()}>
                <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 20, padding: "0 8px", color: C.accent }}>🍊 로이스6 주문관리</div>
                {nav.map(n => (
                  <button key={n.id} onClick={() => goTo(n.id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "13px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 15, fontWeight: page === n.id ? 700 : 400, backgroundColor: page === n.id ? C.accentLight : "transparent", color: page === n.id ? C.accent : C.ink, marginBottom: 2, fontFamily: "inherit" }}>
                    <span style={{ fontSize: 18 }}>{n.icon}</span><span>{n.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ padding: "16px 14px", paddingBottom: 80 }}>{renderPage()}</div>
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100 }}>
            {nav.map(n => (
              <button key={n.id} onClick={() => goTo(n.id)} style={{ flex: 1, border: "none", backgroundColor: "transparent", padding: "8px 2px 6px", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: 19 }}>{n.icon}</span>
                <span style={{ fontSize: 9, fontWeight: page === n.id ? 700 : 400, color: page === n.id ? C.accent : C.muted }}>{n.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div style={{ display: "flex" }}>
          <div style={{ width: isTab(w) ? 180 : 220, minHeight: "100vh", backgroundColor: C.surface, borderRight: `1px solid ${C.border}`, flexShrink: 0, position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "24px 20px 18px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>로이스6</div>
              <div style={{ fontSize: isTab(w) ? 14 : 16, fontWeight: 900 }}>사업물품 주문관리</div>
            </div>
            <div style={{ padding: 12, flex: 1 }}>
              {nav.map(n => (
                <button key={n.id} onClick={() => setPage(n.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: isTab(w) ? 13 : 14, fontWeight: page === n.id ? 700 : 400, backgroundColor: page === n.id ? C.accentLight : "transparent", color: page === n.id ? C.accent : C.ink, marginBottom: 2, fontFamily: "inherit" }}>
                  <span>{n.icon}</span><span>{n.label}</span>
                </button>
              ))}
            </div>
            <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.muted }}>
              물품 {products.length}개 · 회원 {members.length}명 · 주문 {orders.length}건
            </div>
          </div>
          <div style={{ flex: 1, padding: isTab(w) ? "24px" : "32px 36px", overflowY: "auto", maxHeight: "100vh" }}>
            {renderPage()}
          </div>
        </div>
      )}
    </div>
  );
}
