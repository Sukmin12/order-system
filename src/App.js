import React, { useState, useEffect, useRef } from "react";

// ── 색상 (로고 — 오직 주님 블루 그라데이션 톤) ────────────────────────
const C = {
  bg: "#F4F8FC", surface: "#FFFFFF", ink: "#1B2A3D", muted: "#6E859C",
  border: "#DCE6F0", accent: "#1E5DA8", accentLight: "#E7F0FA",
  green: "#3E8E6E", greenLight: "#E9F5F0", red: "#C0392B", redLight: "#FDECEA",
  yellow: "#C9962B", yellowLight: "#FCF3E1", navy: "#0F2E4F",
  gradient: "linear-gradient(135deg, #5BA3E0 0%, #1E5DA8 55%, #0F2E4F 100%)",
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

// 🤖 구글시트 동기화 과정에서 productIds(배열)가 문자열로 깨져서 올 수도 있어 — 다시 배열로 복구
const normalizeRounds = (roundsArr) => {
  if (!Array.isArray(roundsArr)) return roundsArr;
  return roundsArr.map(r => {
    if (Array.isArray(r.productIds)) return { ...r, productIds: r.productIds.map(Number).filter(n => !isNaN(n)) };
    if (typeof r.productIds === "string" && r.productIds.trim()) {
      try {
        const parsed = JSON.parse(r.productIds);
        if (Array.isArray(parsed)) return { ...r, productIds: parsed.map(Number).filter(n => !isNaN(n)) };
      } catch {}
      const split = r.productIds.split(",").map(s => Number(s.trim())).filter(n => !isNaN(n));
      if (split.length > 0) return { ...r, productIds: split };
    }
    return r;
  });
};

// 🤖 팝업이 열려있을 때 ESC 키를 누르면 닫히도록 하는 공용 훅
const useEscapeClose = (isOpen, onClose) => {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
};

// ── 구글 시트 동기화 ─────────────────────────────────────────────────
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbwTlJ2_ygAWMLTU2L0nXlEw7aF6wcPh6yKUvNmlJybItkUiHp_XINLCNtsk_qTzy2P1xw/exec";

const SHEET_MAP = {
  "order-members": "members",
  "order-products": "products",
  "order-rounds": "rounds",
  "order-orders": "orders",
};

const saveSynced = (key, value) => {
  save(key, value);
  const sheetName = SHEET_MAP[key];
  if (!sheetName) return;
  fetch(SHEET_API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sheet: sheetName, rows: value }),
  }).catch(() => {});
};

const fetchAllFromSheet = async () => {
  try {
    const res = await fetch(SHEET_API_URL);
    const json = await res.json();
    if (json.result !== "success") return null;
    return json.data;
  } catch {
    return null;
  }
};

// ── 스타일 ────────────────────────────────────────────────────────────
const S = {
  input: { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: C.ink, backgroundColor: C.surface, outline: "none", fontFamily: "inherit" },
  select: { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: C.ink, backgroundColor: C.surface, outline: "none", fontFamily: "inherit", cursor: "pointer" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4 },
  btn: (color = C.accent) => ({ backgroundColor: color, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }),
  btnOutline: { backgroundColor: "transparent", color: C.accent, border: `1.5px solid ${C.accent}`, borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  btnGhost: { backgroundColor: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
  card: { backgroundColor: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px" },
  textareaSmall: { width: "100%", boxSizing: "border-box", border: `1.5px dashed ${C.accent}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, color: C.ink, backgroundColor: C.surface, outline: "none", fontFamily: "inherit", resize: "vertical" },
};

const Badge = ({ text, color = C.accent, bg = C.accentLight }) => (
  <span style={{ backgroundColor: bg, color, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{text}</span>
);

const SyncBadge = ({ status }) => {
  if (status === "off") return null;
  const map = {
    loading: { text: "⏳ 동기화 중", color: C.yellow, bg: C.yellowLight },
    synced: { text: "☁️ 동기화됨", color: C.green, bg: C.greenLight },
    error: { text: "⚠️ 연결 실패", color: C.red, bg: C.redLight },
  };
  const s = map[status];
  if (!s) return null;
  return <Badge text={s.text} color={s.color} bg={s.bg} />;
};
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
//  컴팩트 드롭다운 — 긴 목록도 한 번에 6~7개만 보이고 내부 스크롤
// ════════════════════════════════════════════════════════════════════
function CompactSelect({ value, onChange, options, placeholder = "선택하세요", disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQuery(""); } };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("touchstart", h); };
  }, []);
  useEscapeClose(open, () => { setOpen(false); setQuery(""); });

  const selected = options.find(o => String(o.value) === String(value));
  const filtered = query ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase())) : options;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => { if (!disabled) setOpen(!open); }}
        style={{ ...S.select, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: disabled ? 0.55 : 1, cursor: disabled ? "default" : "pointer" }}
      >
        <span style={{ color: selected ? C.ink : C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected ? selected.label : placeholder}</span>
        <span style={{ fontSize: 10, color: C.muted, marginLeft: 8, flexShrink: 0 }}>▾</span>
      </div>
      {open && !disabled && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 60, backgroundColor: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(43,36,28,0.16)", overflow: "hidden" }}>
          {options.length > 6 && (
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="검색"
              style={{ width: "100%", boxSizing: "border-box", border: "none", borderBottom: `1px solid ${C.border}`, padding: "9px 12px", fontSize: 13, outline: "none", fontFamily: "inherit" }}
            />
          )}
          <div style={{ maxHeight: 216, overflowY: "auto" }}>
            {filtered.length === 0
              ? <div style={{ padding: "12px", fontSize: 13, color: C.muted, textAlign: "center" }}>결과 없음</div>
              : filtered.map(o => (
                <div
                  key={o.value}
                  onClick={() => { onChange(o.value); setOpen(false); setQuery(""); }}
                  style={{ padding: "10px 12px", fontSize: 13, cursor: "pointer", backgroundColor: String(o.value) === String(value) ? C.accentLight : "transparent", color: String(o.value) === String(value) ? C.accent : C.ink, fontWeight: String(o.value) === String(value) ? 700 : 400 }}
                  onMouseDown={e => e.preventDefault()}
                >
                  {o.label}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  편집 가능한 드롭다운 — 직접 타이핑해서 검색하고, 엔터/탭으로 자동완성
// ════════════════════════════════════════════════════════════════════
function EditableSelect({ value, onChange, options, placeholder = "입력 또는 선택", onConfirm }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = options.find(o => String(o.value) === String(value));

  // 🤖 외부에서 value가 바뀌면(예: 주문 등록 후 초기화) 입력창 텍스트도 같이 동기화
  useEffect(() => { setQuery(selected ? selected.label : ""); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("touchstart", h); };
  }, []);

  const filtered = query ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase())) : options;

  const pick = (o) => {
    onChange(o.value);
    setQuery(o.label);
    setOpen(false);
    if (onConfirm) onConfirm(o.value);
  };

  // 🤖 엔터/탭 — 검색된 목록 중 맨 위(가장 잘 맞는) 항목으로 바로 확정
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0) pick(filtered[0]);
    } else if (e.key === "Tab") {
      if (filtered.length > 0 && query && String(filtered[0].value) !== String(value)) pick(filtered[0]);
      else setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(""); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={S.input}
      />
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 60, backgroundColor: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(43,36,28,0.16)", overflow: "hidden" }}>
          <div style={{ maxHeight: 216, overflowY: "auto" }}>
            {filtered.length === 0
              ? <div style={{ padding: "12px", fontSize: 13, color: C.muted, textAlign: "center" }}>결과 없음</div>
              : filtered.map((o, i) => (
                <div
                  key={o.value}
                  onClick={() => pick(o)}
                  onMouseDown={e => e.preventDefault()}
                  style={{ padding: "10px 12px", fontSize: 13, cursor: "pointer", backgroundColor: i === 0 ? C.accentLight : "transparent", color: i === 0 ? C.accent : C.ink, fontWeight: i === 0 ? 700 : 400 }}
                >
                  {o.label}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  물품 관리
// ════════════════════════════════════════════════════════════════════
function ProductManager({ products, setProducts, orders, setOrders, w }) {
  const mob = isMob(w);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const blank = { name: "", cost: "", price: "" };
  const [form, setForm] = useState(blank);
  const setF = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("asc");
  const [selectedProdIds, setSelectedProdIds] = useState([]);

  const toggleProdSelect = (id) => setSelectedProdIds(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  // 🤖 모바일에는 더블클릭이 없어서 짧은 시간 안에 같은 행을 두 번 탭하면 더블클릭과 동일하게 수정 팝업을 연다
  const lastTapRef = useRef({ id: null, time: 0 });
  const handleRowTap = (p) => {
    if (mob) {
      const now = Date.now();
      if (lastTapRef.current.id === p.id && now - lastTapRef.current.time < 350) {
        lastTapRef.current = { id: null, time: 0 };
        setSelectedProdIds([]);
        startEdit(p);
        return;
      }
      lastTapRef.current = { id: p.id, time: now };
    }
    toggleProdSelect(p.id);
  };
  const toggleProdSelectAll = (ids) => {
    const allSelected = ids.every(id => selectedProdIds.includes(id));
    setSelectedProdIds(allSelected ? selectedProdIds.filter(id => !ids.includes(id)) : [...new Set([...selectedProdIds, ...ids])]);
  };
  const bulkDeleteProducts = () => {
    if (selectedProdIds.length === 0) return;
    if (!window.confirm(`선택한 ${selectedProdIds.length}개 물품을 삭제할까요?`)) return;
    const u = products.filter(p => !selectedProdIds.includes(p.id));
    setProducts(u); saveSynced("order-products", u);
    setSelectedProdIds([]);
  };

  const blankRow = () => ({ rowId: Date.now() + Math.random(), name: "", cost: "", price: "" });
  const [rows, setRows] = useState([blankRow()]);
  const setRow = (rowId, f, v) => setRows(rows.map(r => r.rowId === rowId ? { ...r, [f]: v } : r));
  const addRow = () => setRows([...rows, blankRow()]);
  const removeRow = (rowId) => setRows(rows.length === 1 ? rows : rows.filter(r => r.rowId !== rowId));
  const rowMargin = (r) => (Number(r.price) || 0) - (Number(r.cost) || 0);

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text");
    if (!text || !text.includes("\t")) return;
    e.preventDefault();
    const parsedRows = text.split(/\r?\n/).filter(line => line.trim() !== "").map(line => {
      const cols = line.split("\t");
      const clean = (v) => (v || "").replace(/[₩,\s]/g, "");
      return { rowId: Date.now() + Math.random(), name: (cols[0] || "").trim(), cost: clean(cols[1]), price: clean(cols[2]) };
    }).filter(r => r.name && r.name !== "품명");
    if (parsedRows.length === 0) return;
    setRows(parsedRows);
  };

  const margin = (Number(form.price) || 0) - (Number(form.cost) || 0);

  const findDuplicate = (name, excludeId) => {
    const n = name.trim();
    if (!n) return null;
    return products.find(p => p.name.trim() === n && p.id !== excludeId) || null;
  };

  const sortList = (list) => {
    if (sortMode === "desc") return [...list].sort((a, b) => b.name.localeCompare(a.name, "ko"));
    if (sortMode === "priceHigh") return [...list].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    if (sortMode === "priceLow") return [...list].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  };

  // 🤖 물품 정보를 수정하면 그 물품을 담고 있던 과거 주문들도 같이 갱신(이름/매입가/판매가 + 주문 합계 재계산)
  const syncOrdersWithProduct = (productId, updated) => {
    if (!orders || !setOrders) return;
    let touched = false;
    const u = orders.map(o => {
      let changed = false;
      const items = o.items.map(it => {
        if (it.productId === productId) {
          changed = true;
          return { ...it, name: updated.name, cost: Number(updated.cost) || 0, price: Number(updated.price) || 0 };
        }
        return it;
      });
      if (!changed) return o;
      touched = true;
      const totalPrice = items.reduce((s, it) => s + it.price * it.qty, 0);
      const totalCost = items.reduce((s, it) => s + it.cost * it.qty, 0);
      return { ...o, items, totalPrice, totalCost, totalMargin: totalPrice - totalCost };
    });
    if (touched) { setOrders(u); saveSynced("order-orders", u); }
  };

  const saveItem = () => {
    if (!form.name) return;
    let u;
    if (editing) {
      u = products.map(p => p.id === editing ? { ...form, id: editing } : p);
      setEditing(null);
      syncOrdersWithProduct(editing, form);
    } else {
      u = [...products, { ...form, id: Date.now() }];
    }
    setProducts(u); saveSynced("order-products", u);
    setForm(blank); setAdding(false);
  };

  const saveBulk = () => {
    const valid = rows.filter(r => r.name.trim());
    if (valid.length === 0) return;
    const newItems = valid.map(r => ({ id: Date.now() + Math.random(), name: r.name.trim(), cost: r.cost, price: r.price }));
    const u = [...products, ...newItems];
    setProducts(u); saveSynced("order-products", u);
    setRows([blankRow()]); setAdding(false);
  };

  const startEdit = (p) => { setForm({ name: p.name, cost: p.cost, price: p.price }); setEditing(p.id); setAdding(true); };

  const filtered = sortList(products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())));

  const sortOptions = [
    { id: "asc", label: "가나다 오름차순" },
    { id: "desc", label: "가나다 내림차순" },
    { id: "priceHigh", label: "판매가 높은순" },
    { id: "priceLow", label: "판매가 낮은순" },
  ];

  return (
    <div>
      <Title eyebrow="Products" title="물품 관리" sub="표에서 수정/삭제 버튼으로 바로 관리할 수 있어요" w={w}
        action={<button style={S.btn()} onClick={() => { setForm(blank); setRows([blankRow()]); setEditing(null); setAdding(!adding); }}>+ 물품 추가</button>} />

      <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: C.gradient, color: "#fff", padding: mob ? "12px 18px" : "14px 24px", borderRadius: 14, marginBottom: 18, boxShadow: "0 6px 18px rgba(15,46,79,0.18)" }}>
        <span style={{ fontSize: mob ? 22 : 26 }}>📦</span>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.85 }}>등록된 물품</div>
          <div style={{ fontSize: mob ? 20 : 24, fontWeight: 900 }}>{products.length}개</div>
        </div>
      </div>

      {/* 🤖 물품 수정 팝업 — 더블클릭 시 오버레이로 표시 */}
      {adding && editing && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => { setAdding(false); setEditing(null); }}>
          <div style={{ backgroundColor: C.surface, borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(15,46,79,0.35)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>✏️ 물품 수정</div>
              <button onClick={() => { setAdding(false); setEditing(null); }} style={{ border: "none", backgroundColor: C.bg, color: C.muted, width: 32, height: 32, borderRadius: 8, fontSize: 16, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>수정하면 이 물품이 들어간 과거 주문들의 이름·가격·합계도 함께 갱신돼요</div>
            <Grid cols={3} w={w}>
              <Field label="품명 *"><input style={S.input} value={form.name} onChange={e => setF("name", e.target.value)} placeholder="감귤 5kg" autoFocus /></Field>
              <Field label="매입원가(입고가)"><input style={S.input} type="number" value={form.cost} onChange={e => setF("cost", e.target.value)} placeholder="20000" /></Field>
              <Field label="판매가"><input style={S.input} type="number" value={form.price} onChange={e => setF("price", e.target.value)} placeholder="23000" /></Field>
            </Grid>
            {findDuplicate(form.name, editing) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: C.yellowLight, color: C.yellow, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                ⚠️ 이미 같은 이름의 물품이 있어요 — {findDuplicate(form.name, editing).name} ({won(findDuplicate(form.name, editing).price)})
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <span style={{ fontSize: 13, color: C.muted }}>예상 마진</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: margin >= 0 ? C.green : C.red }}>{won(margin)}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn()} onClick={saveItem}>수정 저장</button>
              <button style={S.btnGhost} onClick={() => { setAdding(false); setEditing(null); }}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 🤖 물품 신규 등록 폼 — 인라인 */}
      {adding && !editing && (
        <div style={{ ...S.card, marginBottom: 18, backgroundColor: C.accentLight, border: `1.5px solid ${C.accent}` }}>
          <>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>새 물품 등록</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>여러 물품을 한 번에 입력하고 저장할 수 있어요</div>

            <div style={{ marginBottom: 18 }}>
              <label style={S.label}>📋 엑셀에서 복사한 표 붙여넣기 (품명, 매입원가, 판매가 순서)</label>
              <textarea
                onPaste={handlePaste}
                placeholder="엑셀에서 품명 / 매입원가 / 판매가 칸을 드래그해서 복사한 뒤 여기에 Ctrl+V 하세요"
                style={{ ...S.textareaSmall, minHeight: 64 }}
                defaultValue=""
              />
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>붙여넣으면 아래 표가 자동으로 채워져요. 채워진 내용은 직접 수정할 수 있어요.</div>
            </div>

            {rows.map((r, i) => (
              <div key={r.rowId} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: mob ? "wrap" : "nowrap" }}>
                  <div style={{ flex: mob ? "1 1 100%" : 2, minWidth: mob ? "auto" : 0 }}>
                    {i === 0 && <label style={S.label}>품명 *</label>}
                    <input style={S.input} value={r.name} onChange={e => setRow(r.rowId, "name", e.target.value)} placeholder="감귤 5kg" />
                  </div>
                  <div style={{ flex: mob ? "1 1 45%" : 1.4, minWidth: mob ? "auto" : 0 }}>
                    {i === 0 && <label style={S.label}>매입원가</label>}
                    <input style={S.input} type="number" value={r.cost} onChange={e => setRow(r.rowId, "cost", e.target.value)} placeholder="20000" />
                  </div>
                  <div style={{ flex: mob ? "1 1 45%" : 1.4, minWidth: mob ? "auto" : 0 }}>
                    {i === 0 && <label style={S.label}>판매가</label>}
                    <input style={S.input} type="number" value={r.price} onChange={e => setRow(r.rowId, "price", e.target.value)} placeholder="23000" />
                  </div>
                  <div style={{ flex: mob ? "1 1 45%" : 1, minWidth: mob ? "auto" : 0, textAlign: "right" }}>
                    {i === 0 && <label style={S.label}>마진</label>}
                    <div style={{ padding: "9px 4px", fontSize: 13, fontWeight: 700, color: rowMargin(r) >= 0 ? C.green : C.red }}>{won(rowMargin(r))}</div>
                  </div>
                  <button style={{ ...S.btn(C.red), padding: "9px 12px", flexShrink: 0 }} onClick={() => removeRow(r.rowId)} disabled={rows.length === 1}>×</button>
                </div>
                {findDuplicate(r.name, null) && (
                  <div style={{ fontSize: 11, color: C.yellow, marginTop: 4, fontWeight: 600 }}>
                    ⚠️ 이미 등록된 물품과 이름이 같아요 — {findDuplicate(r.name, null).name} ({won(findDuplicate(r.name, null).price)})
                  </div>
                )}
              </div>
            ))}
            <button style={{ ...S.btnOutline, marginBottom: 14 }} onClick={addRow}>+ 줄 추가</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn()} onClick={saveBulk}>전체 저장</button>
              <button style={S.btnGhost} onClick={() => { setAdding(false); setRows([blankRow()]); }}>취소</button>
            </div>
          </>
        </div>
      )}

      <input style={{ ...S.input, marginBottom: 12 }} placeholder="품명 검색" value={search} onChange={e => setSearch(e.target.value)} />

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {sortOptions.map(s => (
          <button key={s.id} onClick={() => setSortMode(s.id)} style={{ border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", backgroundColor: sortMode === s.id ? C.accent : C.bg, color: sortMode === s.id ? "#fff" : C.muted, fontFamily: "inherit" }}>{s.label}</button>
        ))}
      </div>

      {/* 🤖 CRUD 바 — 항상 고정 표시. 모바일에서는 줄바꿈 허용 + 안내 문구 숨김으로 무너짐 방지 */}
      <div style={{ ...S.card, padding: 0, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, rowGap: 6, padding: "8px 10px", minHeight: 40, borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginRight: 4, visibility: selectedProdIds.length > 0 ? "visible" : "hidden" }}>{selectedProdIds.length}개 선택됨</span>
          <button style={{ ...S.btnGhost, padding: "5px 10px", fontSize: 12, visibility: selectedProdIds.length > 0 ? "visible" : "hidden" }} onClick={() => setSelectedProdIds([])}>선택 해제</button>
          <button style={{ ...S.btn(C.navy), padding: "5px 12px", fontSize: 12, visibility: selectedProdIds.length === 1 ? "visible" : "hidden" }} onClick={() => {
            const p = filtered.find(x => x.id === selectedProdIds[0]);
            if (p) startEdit(p);
          }}>수정</button>
          <button style={{ ...S.btn(C.red), padding: "5px 12px", fontSize: 12, visibility: selectedProdIds.length > 0 ? "visible" : "hidden" }} onClick={() => bulkDeleteProducts()}>삭제</button>
          {!mob && <span style={{ fontSize: 11, color: C.muted, marginLeft: 8, whiteSpace: "nowrap" }}>클릭 선택 · 더블클릭 수정</span>}
        </div>
        <div style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: mob ? 520 : 640 }}>
          <thead>
            <tr style={{ backgroundColor: C.bg }}>
              <th style={{ padding: "12px 10px", textAlign: "center", borderBottom: `2px solid ${C.border}`, width: 40 }}>
                <input type="checkbox" checked={filtered.length > 0 && filtered.every(p => selectedProdIds.includes(p.id))} onChange={() => toggleProdSelectAll(filtered.map(p => p.id))} style={{ width: 15, height: 15, cursor: "pointer" }} />
              </th>
              <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: 800, color: C.muted, borderBottom: `2px solid ${C.border}`, fontSize: 11.5, whiteSpace: "nowrap", width: 56 }}>번호</th>
              {["품명","매입원가(입고가)","판매가","마진"].map(h => (
                <th key={h} style={{ padding: "12px 10px", textAlign: "center", fontWeight: 800, color: C.muted, borderBottom: `2px solid ${C.border}`, fontSize: 11.5, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: C.muted }}>등록된 물품이 없습니다</td></tr>
              : filtered.map((p, i) => {
                const m = (Number(p.price) || 0) - (Number(p.cost) || 0);
                const isSelected = selectedProdIds.includes(p.id);
                return (
                  <tr key={p.id}
                    onClick={() => handleRowTap(p)}
                    onDoubleClick={() => { setSelectedProdIds([]); startEdit(p); }}
                    title={mob ? "두 번 탭하면 수정" : "더블클릭하면 수정"}
                    style={{
                      cursor: "pointer",
                      backgroundColor: isSelected ? C.accentLight : (i % 2 === 1 ? "rgba(30,93,168,0.025)" : "transparent"),
                      boxShadow: isSelected ? `inset 3px 0 0 ${C.accent}` : "none",
                      borderBottom: `1px solid ${C.border}`,
                    }}>
                    <td style={{ padding: "12px 10px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleProdSelect(p.id)} style={{ width: 15, height: 15, cursor: "pointer" }} />
                    </td>
                    <td style={{ padding: "12px 10px", textAlign: "center", color: C.muted, fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 700, color: isSelected ? C.accent : C.ink }}>{p.name}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center", color: C.muted }}>{won(p.cost)}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 600 }}>{won(p.price)}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 700, color: m >= 0 ? C.green : C.red }}>{won(m)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  회원 명단
// ════════════════════════════════════════════════════════════════════
function MemberRegistry({ members, setMembers, orders, rounds, w }) {
  const mob = isMob(w);
  const [rows, setRows] = useState(members);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null); // 기존 회원 수정 대상 id (신규 작성 중엔 null)
  const [form, setForm] = useState(null);
  const [isNewDraft, setIsNewDraft] = useState(false); // 🤖 신규 작성 중인지 — 저장 누르기 전까진 목록에 추가 안 함
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedRowId, setSelectedRowId] = useState(null); // 🤖 행 선택(보더 강조) — 구매내역 버튼 노출용
  const [historyId, setHistoryId] = useState(null);
  const [historyTab, setHistoryTab] = useState("byRound"); // all | byRound
  const [sortMode, setSortMode] = useState("position"); // position | asc | desc

  useEffect(() => { setRows(members); }, [members]);

  // 🤖 회원 데이터 항목 — 이름/전화번호/직분/비고만 사용
  const blankRow = () => ({ id: Date.now() + Math.random(), name: "", phone: "", position: "", note: "" });

  const commit = (u) => { setRows(u); setMembers(u); saveSynced("order-members", u); };

  // "+ 회원 추가" → 바로 목록에 넣지 않고 팝업만 연다(저장 눌러야 진짜 추가됨)
  const addRow = () => {
    setForm(blankRow());
    setEditingId(null);
    setIsNewDraft(true);
  };

  const removeRow = (id) => {
    if (!window.confirm("이 회원을 삭제할까요?")) return;
    const u = rows.filter(r => r.id !== id);
    commit(u);
    if (editingId === id) { setEditingId(null); setForm(null); }
    setSelectedIds(sel => sel.filter(x => x !== id));
    if (selectedRowId === id) setSelectedRowId(null);
  };

  const toggleSelect = (id) => setSelectedIds(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  const toggleSelectAll = (idsOnScreen) => {
    const allSelected = idsOnScreen.every(id => selectedIds.includes(id));
    setSelectedIds(allSelected ? selectedIds.filter(id => !idsOnScreen.includes(id)) : [...new Set([...selectedIds, ...idsOnScreen])]);
  };
  const bulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`선택한 ${selectedIds.length}명을 삭제할까요? 되돌릴 수 없어요.`)) return;
    const u = rows.filter(r => !selectedIds.includes(r.id));
    commit(u);
    if (selectedIds.includes(editingId)) { setEditingId(null); setForm(null); }
    setSelectedIds([]);
  };

  // 🤖 클릭 = 체크박스 토글 + 행 하이라이트, 더블클릭 = 편집 팝업 열기
  const selectRow = (r) => { setSelectedRowId(r.id); toggleSelect(r.id); };

  // 🤖 모바일에는 더블클릭이 없어서 짧은 시간 안에 같은 행을 두 번 탭하면 더블클릭과 동일하게 수정 팝업을 연다
  const lastTapRef = useRef({ id: null, time: 0 });
  const handleRowTap = (r) => {
    if (mob) {
      const now = Date.now();
      if (lastTapRef.current.id === r.id && now - lastTapRef.current.time < 350) {
        lastTapRef.current = { id: null, time: 0 };
        openEdit(r);
        return;
      }
      lastTapRef.current = { id: r.id, time: now };
    }
    selectRow(r);
  };

  const openEdit = (r) => { setForm({ ...r }); setEditingId(r.id); setIsNewDraft(false); };
  const closeEdit = () => { setEditingId(null); setForm(null); setIsNewDraft(false); };
  useEscapeClose(!!form, closeEdit);
  useEscapeClose(!!historyId, () => setHistoryId(null));
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveEdit = () => {
    if (!form || !form.name.trim()) return;
    if (isNewDraft) {
      const u = [...rows, form];
      commit(u);
    } else {
      const u = rows.map(r => r.id === editingId ? { ...form } : r);
      commit(u);
    }
    closeEdit();
  };

  // 🤖 엑셀 붙여넣기 — 이름, 전화번호, 직분, 비고 순서
  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text");
    if (!text || !text.includes("\t")) return;
    e.preventDefault();
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
    const parsed = lines.map(line => {
      const c = line.split("\t");
      return {
        id: Date.now() + Math.random(),
        name: (c[0] || "").trim(), phone: (c[1] || "").trim(), position: (c[2] || "").trim(), note: (c[3] || "").trim(),
      };
    }).filter(r => r.name && r.name !== "이름");
    if (parsed.length === 0) return;
    commit([...rows, ...parsed]);
  };

  // 🤖 기본순(직분 우선) 정렬용 — 회장 > 총무 > OO부장(가나다순) > 그 외(가나다순)
  // 직분 정보가 'position' 필드에 없으면(예전 데이터) 'note' 필드도 같이 확인
  const positionRank = (r) => {
    const p = ((r.position || "") + " " + (r.note || "")).trim();
    if (p.includes("회장")) return 0;
    if (p.includes("총무")) return 1;
    if (p.includes("부장")) return 2;
    return 3;
  };
  const sortRows = (list) => {
    if (sortMode === "asc") return [...list].sort((a, b) => a.name.localeCompare(b.name, "ko"));
    if (sortMode === "desc") return [...list].sort((a, b) => b.name.localeCompare(a.name, "ko"));
    return [...list].sort((a, b) => {
      const r = positionRank(a) - positionRank(b);
      if (r !== 0) return r;
      return a.name.localeCompare(b.name, "ko");
    });
  };
  const filtered = sortRows(rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase())));
  const editIndex = (!isNewDraft && editingId) ? filtered.findIndex(r => r.id === editingId) : -1;
  const goPrev = () => { if (editIndex > 0) openEdit(filtered[editIndex - 1]); };
  const goNext = () => { if (editIndex >= 0 && editIndex < filtered.length - 1) openEdit(filtered[editIndex + 1]); };

  const exportExcel = () => {
    const header = ["번호", "이름", "전화번호", "직분", "비고"];
    const escapeCell = (v) => {
      const s = String(v == null ? "" : v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const body = filtered.map((r, i) => [i + 1, r.name, r.phone, r.position, r.note].map(escapeCell).join(","));
    const csv = [header.join(","), ...body].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `회원명단_${todayStr()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 🤖 구매내역 집계
  const roundName = (roundId) => rounds.find(r => r.id === roundId)?.name || "차수 미지정";
  const historyMember = historyId ? rows.find(r => r.id === historyId) : null;
  const memberOrders = historyId ? orders.filter(o => o.memberId === historyId) : [];
  const historyByRound = [];
  memberOrders.forEach(o => {
    let group = historyByRound.find(g => g.roundId === o.roundId);
    if (!group) { group = { roundId: o.roundId, roundName: roundName(o.roundId), items: [], totalPrice: 0, paidAmount: 0, date: o.date }; historyByRound.push(group); }
    o.items.forEach(it => {
      const existing = group.items.find(i => i.name === it.name);
      if (existing) existing.qty += it.qty;
      else group.items.push({ name: it.name, qty: it.qty });
    });
    group.totalPrice += o.totalPrice;
    group.paidAmount += o.paidAmount || 0;
  });
  historyByRound.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const historyTotalPrice = memberOrders.reduce((s, o) => s + o.totalPrice, 0);
  const historyTotalQty = memberOrders.reduce((s, o) => s + o.items.reduce((s2, i) => s2 + i.qty, 0), 0);

  // 🤖 전체 구매내역 — 차수 구분 없이 물품별로 합산
  const historyAllItems = [];
  memberOrders.forEach(o => o.items.forEach(it => {
    const existing = historyAllItems.find(i => i.name === it.name);
    if (existing) { existing.qty += it.qty; existing.total += it.price * it.qty; }
    else historyAllItems.push({ name: it.name, qty: it.qty, total: it.price * it.qty });
  }));
  historyAllItems.sort((a, b) => b.total - a.total);

  return (
    <div>
      <Title eyebrow="Members" title="회원 명단" sub="클릭하면 선택, 더블클릭하면 정보수정 팝업이 열려요" w={w}
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={S.btnOutline} onClick={exportExcel}>⬇️ 엑셀 다운로드</button>
            <button style={S.btn()} onClick={addRow}>+ 회원 추가</button>
          </div>
        } />

      <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: C.gradient, color: "#fff", padding: mob ? "12px 18px" : "14px 24px", borderRadius: 14, marginBottom: 18, boxShadow: "0 6px 18px rgba(15,46,79,0.18)" }}>
        <span style={{ fontSize: mob ? 22 : 26 }}>📇</span>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.85 }}>등록된 회원</div>
          <div style={{ fontSize: mob ? 20 : 24, fontWeight: 900 }}>{rows.length}명</div>
        </div>
      </div>

      {/* 🤖 팝업(모달) 수정/추가 화면 — 이름/전화번호/직분/비고만 입력 */}
      {form && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, backgroundColor: "rgba(15,46,79,0.45)", display: "flex", alignItems: mob ? "flex-end" : "center", justifyContent: "center", padding: mob ? 0 : 20 }} onClick={closeEdit}>
          <div
            style={{ backgroundColor: C.surface, borderRadius: mob ? "16px 16px 0 0" : 16, padding: mob ? "20px 18px" : "28px 30px", maxWidth: 480, width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(15,46,79,0.35)" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{isNewDraft ? "새 회원 추가" : `${form.name || "회원"} 정보 수정`}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {!isNewDraft && (
                  <>
                    <button onClick={goPrev} disabled={editIndex <= 0} title="이전 회원"
                      style={{ border: `1px solid ${C.border}`, backgroundColor: C.surface, color: editIndex <= 0 ? C.border : C.ink, width: 34, height: 34, borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: editIndex <= 0 ? "default" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
                    <span style={{ fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>{editIndex + 1} / {filtered.length}</span>
                    <button onClick={goNext} disabled={editIndex < 0 || editIndex >= filtered.length - 1} title="다음 회원"
                      style={{ border: `1px solid ${C.border}`, backgroundColor: C.surface, color: (editIndex < 0 || editIndex >= filtered.length - 1) ? C.border : C.ink, width: 34, height: 34, borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: (editIndex < 0 || editIndex >= filtered.length - 1) ? "default" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>
                  </>
                )}
                <button onClick={closeEdit} style={{ border: "none", backgroundColor: C.bg, color: C.muted, width: 32, height: 32, borderRadius: 8, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>
            </div>

            <Field label="이름 *"><input style={{ ...S.input, marginBottom: 12 }} value={form.name} onChange={e => setF("name", e.target.value)} placeholder="홍길동" autoFocus /></Field>
            <Field label="전화번호"><input style={{ ...S.input, marginBottom: 12 }} value={form.phone} onChange={e => setF("phone", e.target.value)} placeholder="010-0000-0000" /></Field>
            <Field label="직분"><input style={{ ...S.input, marginBottom: 12 }} value={form.position} onChange={e => setF("position", e.target.value)} placeholder="예: 집사, 권사" /></Field>
            <Field label="비고"><input style={{ ...S.input, marginBottom: 4 }} value={form.note} onChange={e => setF("note", e.target.value)} placeholder="메모" /></Field>

            <div style={{ display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap", marginTop: 16 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={S.btn()} onClick={saveEdit} disabled={!form.name.trim()}>저장</button>
                <button style={S.btnGhost} onClick={closeEdit}>취소</button>
              </div>
              {!isNewDraft && <button style={{ ...S.btn(C.red), padding: "10px 16px" }} onClick={() => removeRow(editingId)}>회원 삭제</button>}
            </div>
          </div>
        </div>
      )}

      {/* 🤖 구매내역 팝업 */}
      {historyId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, backgroundColor: "rgba(15,46,79,0.45)", display: "flex", alignItems: mob ? "flex-end" : "center", justifyContent: "center", padding: mob ? 0 : 20 }} onClick={() => setHistoryId(null)}>
          <div
            style={{ backgroundColor: C.surface, borderRadius: mob ? "16px 16px 0 0" : 16, padding: mob ? "20px 18px" : "26px 28px", maxWidth: 560, width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(15,46,79,0.35)" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>🛒 {historyMember?.name} 구매내역</div>
              <button onClick={() => setHistoryId(null)} style={{ border: "none", backgroundColor: C.bg, color: C.muted, width: 32, height: 32, borderRadius: 8, fontSize: 16, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>누적 <strong style={{ color: C.ink }}>{historyTotalQty}개</strong> · <strong style={{ color: C.accent }}>{won(historyTotalPrice)}</strong></div>

            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {[{ id: "byRound", label: "차수별 구매내역" }, { id: "all", label: "전체 구매내역" }].map(t => (
                <button key={t.id} onClick={() => setHistoryTab(t.id)} style={{ border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", backgroundColor: historyTab === t.id ? C.accent : C.bg, color: historyTab === t.id ? "#fff" : C.muted, fontFamily: "inherit" }}>{t.label}</button>
              ))}
            </div>

            {historyTab === "byRound" ? (
              historyByRound.length === 0
                ? <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "30px 0" }}>구매 이력이 없습니다</div>
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {historyByRound.map(g => (
                      <div key={g.roundId || "none"} style={{ backgroundColor: C.bg, borderRadius: 10, padding: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <Badge text={g.roundName} color={C.accent} bg={C.accentLight} />
                          <span style={{ fontSize: 14, fontWeight: 800 }}>{won(g.totalPrice)}</span>
                        </div>
                        <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.6, marginBottom: 8 }}>{g.items.map(i => `${i.name} ${i.qty}개`).join(", ")}</div>
                        <Badge text={g.paidAmount >= g.totalPrice ? "입금완료" : `미수 ${won(g.totalPrice - g.paidAmount)}`} color={g.paidAmount >= g.totalPrice ? C.green : C.red} bg={g.paidAmount >= g.totalPrice ? C.greenLight : C.redLight} />
                      </div>
                    ))}
                  </div>
                )
            ) : (
              historyAllItems.length === 0
                ? <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "30px 0" }}>구매 이력이 없습니다</div>
                : (
                  <div style={{ ...S.card, padding: 0, overflow: "hidden", border: `1px solid ${C.border}` }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ backgroundColor: C.bg }}>
                          {["물품","수량","금액"].map(h => (
                            <th key={h} style={{ padding: "9px 12px", textAlign: h === "물품" ? "left" : "right", fontWeight: 700, color: C.muted, fontSize: 11.5, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {historyAllItems.map((it, i) => (
                          <tr key={it.name} style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: i % 2 === 1 ? "rgba(30,93,168,0.025)" : "transparent" }}>
                            <td style={{ padding: "9px 12px", fontWeight: 700 }}>{it.name}</td>
                            <td style={{ padding: "9px 12px", textAlign: "right" }}>{it.qty}개</td>
                            <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700 }}>{won(it.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ backgroundColor: C.accentLight, fontWeight: 800 }}>
                          <td style={{ padding: "9px 12px" }}>합계</td>
                          <td style={{ padding: "9px 12px", textAlign: "right" }}>{historyTotalQty}개</td>
                          <td style={{ padding: "9px 12px", textAlign: "right" }}>{won(historyTotalPrice)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )
            )}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <label style={S.label}>📋 엑셀에서 복사한 표 붙여넣기 (이름, 전화번호, 직분, 비고 순서)</label>
        <textarea onPaste={handlePaste} placeholder="엑셀에서 해당 열들을 드래그해서 복사한 뒤 여기에 Ctrl+V 하세요" style={{ ...S.textareaSmall, minHeight: 56 }} defaultValue="" />
      </div>

      <input style={{ ...S.input, marginBottom: 12, maxWidth: 280 }} placeholder="이름 검색" value={search} onChange={e => setSearch(e.target.value)} />

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[
          { id: "position", label: "기본순 (회장·총무·부장 순)" },
          { id: "asc", label: "가나다 오름차순" },
          { id: "desc", label: "가나다 내림차순" },
        ].map(s => (
          <button key={s.id} onClick={() => setSortMode(s.id)} style={{ border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", backgroundColor: sortMode === s.id ? C.accent : C.bg, color: sortMode === s.id ? "#fff" : C.muted, fontFamily: "inherit" }}>{s.label}</button>
        ))}
      </div>

      <div style={{ ...S.card, padding: 0, overflow: "hidden", border: `1px solid ${C.border}` }}>
        {/* 🤖 선택 삭제 바 — 항상 같은 자리에 고정 표시(선택 유무와 무관하게 높이 유지)해서 선택 시 아래 내용이 밀리지 않도록 함 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, rowGap: 6, padding: "8px 10px", minHeight: 40, borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginRight: 4, visibility: selectedIds.length > 0 ? "visible" : "hidden" }}>{selectedIds.length}명 선택됨</span>
          <button style={{ ...S.btnGhost, padding: "5px 10px", fontSize: 12, visibility: selectedIds.length > 0 ? "visible" : "hidden" }} onClick={() => setSelectedIds([])}>선택 해제</button>
          <button style={{ ...S.btn(C.navy), padding: "5px 12px", fontSize: 12, visibility: selectedIds.length === 1 ? "visible" : "hidden" }} onClick={() => {
            const r = filtered.find(x => x.id === selectedIds[0]);
            if (r) openEdit(r);
          }}>수정</button>
          <button style={{ ...S.btn(C.red), padding: "5px 12px", fontSize: 12, visibility: selectedIds.length > 0 ? "visible" : "hidden" }} onClick={() => bulkDelete()}>선택 삭제</button>
        </div>
        <div style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 640 }}>
          <thead>
            <tr style={{ backgroundColor: C.bg }}>
              <th style={{ padding: "12px 10px", textAlign: "center", borderBottom: `2px solid ${C.border}`, borderRight: `1px solid ${C.border}`, width: 40 }}>
                <input type="checkbox" checked={filtered.length > 0 && filtered.every(r => selectedIds.includes(r.id))} onChange={() => toggleSelectAll(filtered.map(r => r.id))} style={{ width: 15, height: 15, cursor: "pointer" }} />
              </th>
              <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: 800, color: C.muted, fontSize: 11.5, borderBottom: `2px solid ${C.border}`, borderRight: `1px solid ${C.border}`, whiteSpace: "nowrap", width: 56 }}>번호</th>
              <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: 800, color: C.muted, fontSize: 11.5, borderBottom: `2px solid ${C.border}`, borderRight: `1px solid ${C.border}`, minWidth: 110 }}>이름</th>
              <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: 800, color: C.muted, fontSize: 11.5, borderBottom: `2px solid ${C.border}`, borderRight: `1px solid ${C.border}`, minWidth: 130 }}>전화번호</th>
              <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: 800, color: C.muted, fontSize: 11.5, borderBottom: `2px solid ${C.border}`, borderRight: `1px solid ${C.border}`, minWidth: 90 }}>직분</th>
              <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: 800, color: C.muted, fontSize: 11.5, borderBottom: `2px solid ${C.border}`, borderRight: `1px solid ${C.border}`, minWidth: 140 }}>비고</th>
              <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: 800, color: C.muted, fontSize: 11.5, borderBottom: `2px solid ${C.border}`, minWidth: 180 }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: C.muted }}>등록된 회원이 없습니다. 위에서 붙여넣거나 + 회원 추가를 눌러보세요.</td></tr>
              : filtered.map((r, i) => {
                const isSelected = selectedRowId === r.id;
                return (
                  <tr key={r.id}
                    onClick={() => handleRowTap(r)}
                    onDoubleClick={() => openEdit(r)}
                    title={mob ? "두 번 탭하면 정보수정" : "더블클릭하면 정보수정"}
                    style={{
                      cursor: "pointer",
                      backgroundColor: selectedIds.includes(r.id) ? C.accentLight : isSelected ? C.bg : (i % 2 === 1 ? "rgba(30,93,168,0.025)" : "transparent"),
                      boxShadow: isSelected ? `inset 3px 0 0 ${C.accent}` : "none",
                    }}>
                    <td style={{ padding: "11px 10px", textAlign: "center", borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} style={{ width: 15, height: 15, cursor: "pointer" }} />
                    </td>
                    <td style={{ padding: "11px 10px", textAlign: "center", color: C.muted, fontWeight: 600, borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}>{i + 1}</td>
                    <td style={{ padding: "11px 10px", textAlign: "center", fontWeight: 700, color: isSelected ? C.accent : C.ink, borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}>{r.name}</td>
                    <td style={{ padding: "11px 10px", textAlign: "center", borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}>{r.phone || <span style={{ color: C.border }}>–</span>}</td>
                    <td style={{ padding: "11px 10px", textAlign: "center", borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}>{r.position || <span style={{ color: C.border }}>–</span>}</td>
                    <td style={{ padding: "11px 10px", textAlign: "center", borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, color: C.muted }}>{r.note || <span style={{ color: C.border }}>–</span>}</td>
                    <td style={{ padding: "8px 10px", textAlign: "center", borderBottom: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center", opacity: isSelected ? 1 : 0, pointerEvents: isSelected ? "auto" : "none", transition: "opacity 0.1s" }}>
                        <button style={{ ...S.btnOutline, padding: "4px 10px", fontSize: 11 }} onClick={() => setHistoryId(r.id)}>🛒 구매내역</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  주문 입력 (장바구니식)
// ════════════════════════════════════════════════════════════════════
function OrderEntry({ members, products, orders, setOrders, currentRound, w }) {
  const mob = isMob(w);
  const [memberId, setMemberId] = useState("");
  const [pickProduct, setPickProduct] = useState("");
  const [pickQty, setPickQty] = useState(1);
  const [cart, setCart] = useState([]);

  const memberOptions = members.map(m => ({ value: m.id, label: m.name }));
  const roundProducts = (currentRound?.productIds && currentRound.productIds.length > 0)
    ? products.filter(p => currentRound.productIds.includes(p.id))
    : products; // 🤖 차수에 판매물품이 지정 안 돼있으면(옛날 차수 등) 전체 물품 표시
  const productOptions = roundProducts.map(p => ({ value: p.id, label: `${p.name} — ${won(p.price)}` }));

  const addItem = () => {
    if (!memberId || !pickProduct) return;
    const member = members.find(m => m.id === Number(memberId));
    const product = products.find(p => p.id === Number(pickProduct));
    if (!member || !product) return;

    const existing = cart.find(c => c.memberId === member.id && c.productId === product.id);
    if (existing) {
      setCart(cart.map(c => c === existing ? { ...c, qty: c.qty + Number(pickQty) } : c));
    } else {
      setCart([...cart, {
        cartId: Date.now() + Math.random(),
        memberId: member.id,
        memberName: member.name,
        productId: product.id,
        name: product.name,
        cost: Number(product.cost) || 0,
        price: Number(product.price) || 0,
        qty: Number(pickQty),
      }]);
    }
    setPickProduct(""); setPickQty(1);
  };

  const removeCartItem = (cartId) => setCart(cart.filter(c => c.cartId !== cartId));
  const updateCartQty = (cartId, qty) => setCart(cart.map(c => c.cartId === cartId ? { ...c, qty: Math.max(1, Number(qty)) } : c));

  const groupedByMember = [];
  cart.forEach(c => {
    let group = groupedByMember.find(g => g.memberId === c.memberId);
    if (!group) { group = { memberId: c.memberId, memberName: c.memberName, items: [] }; groupedByMember.push(group); }
    group.items.push(c);
  });
  groupedByMember.forEach(g => {
    g.totalPrice = g.items.reduce((s, i) => s + i.price * i.qty, 0);
    g.totalCost = g.items.reduce((s, i) => s + i.cost * i.qty, 0);
  });

  const cartTotalCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartTotalPrice = cart.reduce((s, c) => s + c.price * c.qty, 0);

  const submitAll = () => {
    if (groupedByMember.length === 0) return;
    const newOrders = groupedByMember.map(g => ({
      id: Date.now() + Math.random(),
      roundId: currentRound?.id || null,
      memberId: g.memberId,
      memberName: g.memberName,
      items: g.items.map(i => ({ productId: i.productId, name: i.name, cost: i.cost, price: i.price, qty: i.qty })),
      totalCost: g.totalCost,
      totalPrice: g.totalPrice,
      totalMargin: g.totalPrice - g.totalCost,
      paid: false,
      paidAmount: 0,
      delivered: false,
      date: todayStr(),
    }));
    const u = [...orders, ...newOrders];
    setOrders(u); saveSynced("order-orders", u);
    setCart([]); setMemberId("");
  };

  return (
    <div>
      {currentRound ? (
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: C.gradient, color: "#fff", padding: mob ? "16px 18px" : "20px 26px", borderRadius: 16, marginBottom: 20, boxShadow: "0 8px 24px rgba(15,46,79,0.2)" }}>
          <span style={{ fontSize: mob ? 26 : 32 }}>🗓</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.85, marginBottom: 2 }}>현재 진행 중인 차수</div>
            <div style={{ fontSize: mob ? 20 : 26, fontWeight: 900, letterSpacing: "-0.02em" }}>{currentRound.name}</div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 14, backgroundColor: C.yellow, color: "#fff", padding: mob ? "16px 18px" : "20px 26px", borderRadius: 16, marginBottom: 20 }}>
          <span style={{ fontSize: mob ? 26 : 32 }}>⚠️</span>
          <div>
            <div style={{ fontSize: mob ? 16 : 19, fontWeight: 800 }}>진행 중인 차수가 없어요</div>
            <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>차수 관리 메뉴에서 새 차수를 시작해주세요</div>
          </div>
        </div>
      )}
      <Title eyebrow="New Order" title="주문 입력" sub="회원을 선택하고 물품을 추가하면 그 회원 이름 아래 바로 쌓여요. 다 모이면 주문 버튼으로 한 번에 등록해요" w={w} />

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 360px", gap: 16 }}>
        <div>
          <div style={{ ...S.card, marginBottom: 14 }}>
            <Grid cols={3} w={w} gap={12}>
              <Field label="주문자 (회원) *">
                <EditableSelect value={memberId} onChange={setMemberId} options={memberOptions} placeholder="이름 입력 또는 선택" />
              </Field>
              <Field label="물품 선택">
                <EditableSelect value={pickProduct} onChange={setPickProduct} options={productOptions} placeholder="물품명 입력 또는 선택" />
              </Field>
              <Field label="수량"><input style={S.input} type="number" min="1" value={pickQty} onChange={e => setPickQty(e.target.value)} /></Field>
            </Grid>
            <button style={S.btn(C.navy)} onClick={addItem} disabled={!memberId || !pickProduct}>+ 물품 추가</button>
            {!memberId && <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>회원을 먼저 선택해주세요</div>}
          </div>

          <div style={S.card}>
            <div style={{ fontWeight: 800, marginBottom: 14 }}>담긴 주문 — 인원 {groupedByMember.length}명 · 물품 {cart.length}건</div>
            {groupedByMember.length === 0
              ? <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "30px 0" }}>아직 담긴 주문이 없습니다</div>
              : groupedByMember.map(g => (
                <div key={g.memberId} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color: C.accent }}>{g.memberName}</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{won(g.totalPrice)}</span>
                  </div>
                  {g.items.map(c => (
                    <div key={c.cartId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", flexWrap: mob ? "wrap" : "nowrap" }}>
                      <span style={{ flex: 1, fontSize: 13, minWidth: 90 }}>{c.name}</span>
                      <input type="number" min="1" value={c.qty} onChange={e => updateCartQty(c.cartId, e.target.value)} style={{ ...S.input, width: 56, padding: "5px 6px", textAlign: "center", fontSize: 12 }} />
                      <span style={{ fontSize: 12, color: C.muted, width: 30 }}>개</span>
                      <span style={{ fontSize: 13, fontWeight: 600, width: 80, textAlign: "right" }}>{won(c.price * c.qty)}</span>
                      <button style={{ ...S.btn(C.red), padding: "4px 8px", fontSize: 10 }} onClick={() => removeCartItem(c.cartId)}>삭제</button>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </div>

        <div>
          <div style={{ ...S.card, position: mob ? "static" : "sticky", top: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>전체 주문 요약</div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.muted }}>담긴 인원</span><span style={{ fontWeight: 700 }}>{groupedByMember.length}명</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.muted }}>총 개수</span><span style={{ fontWeight: 700 }}>{cartTotalCount}개</span>
            </div>
            <div style={{ backgroundColor: C.accentLight, borderRadius: 10, padding: 14, margin: "14px 0", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, marginBottom: 4 }}>받아야 할 총 금액</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: C.accent }}>{won(cartTotalPrice)}</div>
            </div>
            <button style={{ ...S.btn(), width: "100%", padding: "13px", fontSize: 14 }} onClick={submitAll} disabled={groupedByMember.length === 0}>주문</button>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 8, textAlign: "center" }}>누르면 담긴 {groupedByMember.length}명 전체가 주문 리스트에 한 번에 추가돼요</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  주문 리스트 (+ 입금관리 + 보고서 집계 통합)
// ════════════════════════════════════════════════════════════════════
function OrderList({ orders, setOrders, rounds, currentRound, w }) {
  const mob = isMob(w);
  const [roundFilter, setRoundFilter] = useState(currentRound ? currentRound.name : "전체");
  const [aggTab, setAggTab] = useState("member");
  const [aggSort, setAggSort] = useState("priceHigh");

  const togglePaid = (id) => {
    const u = orders.map(o => o.id === id ? { ...o, paid: !o.paid, paidAmount: !o.paid ? o.totalPrice : 0 } : o);
    setOrders(u); saveSynced("order-orders", u);
  };
  const updatePaidAmount = (id, amt) => {
    const u = orders.map(o => o.id === id ? { ...o, paidAmount: Number(amt), paid: Number(amt) >= o.totalPrice } : o);
    setOrders(u); saveSynced("order-orders", u);
  };
  const toggleDelivered = (id) => {
    const u = orders.map(o => o.id === id ? { ...o, delivered: !o.delivered } : o);
    setOrders(u); saveSynced("order-orders", u);
  };
  const remove = (id) => { if (!window.confirm("주문을 삭제할까요?")) return; const u = orders.filter(o => o.id !== id); setOrders(u); saveSynced("order-orders", u); };

  // 🤖 주문 내 특정 물품의 수량을 수정하면 그 주문의 합계(판매가/매입가/마진)도 자동 재계산
  const updateItemQty = (orderId, itemIndex, qty) => {
    const newQty = Math.max(1, Number(qty) || 1);
    const u = orders.map(o => {
      if (o.id !== orderId) return o;
      const items = o.items.map((it, i) => i === itemIndex ? { ...it, qty: newQty } : it);
      const totalPrice = items.reduce((s, it) => s + it.price * it.qty, 0);
      const totalCost = items.reduce((s, it) => s + it.cost * it.qty, 0);
      return { ...o, items, totalPrice, totalCost, totalMargin: totalPrice - totalCost };
    });
    setOrders(u); saveSynced("order-orders", u);
  };
  const removeItemFromOrder = (orderId, itemIndex) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.items.length <= 1) { alert("주문에는 최소 1개의 물품이 있어야 해요. 전체 삭제하려면 '주문 삭제'를 사용하세요."); return; }
    if (!window.confirm("이 물품을 주문에서 뺄까요?")) return;
    const u = orders.map(o => {
      if (o.id !== orderId) return o;
      const items = o.items.filter((_, i) => i !== itemIndex);
      const totalPrice = items.reduce((s, it) => s + it.price * it.qty, 0);
      const totalCost = items.reduce((s, it) => s + it.cost * it.qty, 0);
      return { ...o, items, totalPrice, totalCost, totalMargin: totalPrice - totalCost };
    });
    setOrders(u); saveSynced("order-orders", u);
  };

  // 🤖 차수 정렬키(최신 차수가 위로 오도록) — sortKey 없으면 이름에서 복구
  const weekOptionsForSort = ["첫째주", "둘째주", "셋째주", "넷째주", "다섯째주"];
  const roundSortKeyDirect = (r) => {
    if (!r) return -1;
    if (r.sortKey) return r.sortKey;
    const match = (r.name || "").match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(.+)/);
    if (match) {
      const wi = weekOptionsForSort.indexOf(match[3].trim()) + 1;
      return Number(match[1]) * 10000 + Number(match[2]) * 100 + wi;
    }
    return 0;
  };

  const roundOptions = [
    { value: "전체", label: "전체 차수" },
    ...rounds.slice().sort((a, b) => roundSortKeyDirect(b) - roundSortKeyDirect(a)).map(r => ({ value: r.name, label: r.name + (r.active ? " (진행 중)" : "") })),
  ];

  const byRound = orders.filter(o => {
    if (roundFilter === "전체") return true;
    const r = rounds.find(rr => rr.name === roundFilter);
    return r && o.roundId === r.id;
  });

  const totalPrice = byRound.reduce((s, o) => s + o.totalPrice, 0);
  const totalCost = byRound.reduce((s, o) => s + o.totalCost, 0);
  const totalMargin = byRound.reduce((s, o) => s + o.totalMargin, 0);
  const totalPaid = byRound.reduce((s, o) => s + (o.paidAmount || 0), 0);
  const totalUnpaid = totalPrice - totalPaid;

  const roundName = (roundId) => rounds.find(r => r.id === roundId)?.name || "차수 미지정";

  // ── 집계 ──
  const sortAgg = (list) => {
    if (aggSort === "priceLow") return [...list].sort((a, b) => a.price - b.price);
    if (aggSort === "qtyHigh") return [...list].sort((a, b) => b.qty - a.qty);
    if (aggSort === "qtyLow") return [...list].sort((a, b) => a.qty - b.qty);
    if (aggSort === "nameAsc") return [...list].sort((a, b) => a.name.localeCompare(b.name, "ko"));
    return [...list].sort((a, b) => b.price - a.price);
  };
  const productAgg = {};
  byRound.forEach(o => o.items.forEach(it => {
    if (!productAgg[it.name]) productAgg[it.name] = { name: it.name, qty: 0, cost: 0, price: 0, margin: 0 };
    productAgg[it.name].qty += it.qty;
    productAgg[it.name].cost += it.cost * it.qty;
    productAgg[it.name].price += it.price * it.qty;
    productAgg[it.name].margin += (it.price - it.cost) * it.qty;
  }));
  const productList = sortAgg(Object.values(productAgg));

  const memberAgg = {};
  const memberOrdersDetail = {};
  byRound.forEach(o => {
    if (!memberAgg[o.memberName]) memberAgg[o.memberName] = { name: o.memberName, qty: 0, cost: 0, price: 0, margin: 0, paid: 0, orderCount: 0, deliveredCount: 0 };
    const m = memberAgg[o.memberName];
    m.qty += o.items.reduce((s, i) => s + i.qty, 0);
    m.cost += o.totalCost;
    m.price += o.totalPrice;
    m.margin += o.totalMargin;
    m.paid += o.paidAmount || 0;
    m.orderCount += 1;
    if (o.delivered) m.deliveredCount += 1;
    if (!memberOrdersDetail[o.memberName]) memberOrdersDetail[o.memberName] = [];
    memberOrdersDetail[o.memberName].push(o);
  });
  const memberList = sortAgg(Object.values(memberAgg));

  // 🤖 인원별 표에서 입금/전달 배지를 누르면 그 사람의 (현재 필터 범위) 주문 전체를 한 번에 전환
  const toggleMemberPaid = (memberName, makePaid) => {
    const ids = new Set((memberOrdersDetail[memberName] || []).map(o => o.id));
    const u = orders.map(o => ids.has(o.id) ? { ...o, paid: makePaid, paidAmount: makePaid ? o.totalPrice : 0 } : o);
    setOrders(u); saveSynced("order-orders", u);
  };
  const toggleMemberDelivered = (memberName, makeDelivered) => {
    const ids = new Set((memberOrdersDetail[memberName] || []).map(o => o.id));
    const u = orders.map(o => ids.has(o.id) ? { ...o, delivered: makeDelivered } : o);
    setOrders(u); saveSynced("order-orders", u);
  };

  // 🤖 물품별 → 구매한 사람별 상세(수량/매입가/판매가/마진) / 인원별 → 구매한 물품별 가격 — 행 클릭으로 펼쳐서 봄
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [expandedMember, setExpandedMember] = useState(null);
  const productBuyerDetail = {};
  byRound.forEach(o => o.items.forEach(it => {
    if (!productBuyerDetail[it.name]) productBuyerDetail[it.name] = {};
    const d = productBuyerDetail[it.name];
    if (!d[o.memberName]) d[o.memberName] = { name: o.memberName, qty: 0, cost: 0, price: 0 };
    d[o.memberName].qty += it.qty;
    d[o.memberName].cost += it.cost * it.qty;
    d[o.memberName].price += it.price * it.qty;
  }));
  const memberItemDetail = {};
  byRound.forEach(o => o.items.forEach(it => {
    if (!memberItemDetail[o.memberName]) memberItemDetail[o.memberName] = {};
    const d = memberItemDetail[o.memberName];
    if (!d[it.name]) d[it.name] = { name: it.name, qty: 0, price: 0 };
    d[it.name].qty += it.qty;
    d[it.name].price += it.price * it.qty;
  }));

  const aggSortOptions = [
    { id: "priceHigh", label: "금액 높은순" },
    { id: "priceLow", label: "금액 낮은순" },
    { id: "qtyHigh", label: "수량 많은순" },
    { id: "qtyLow", label: "수량 적은순" },
    { id: "nameAsc", label: "가나다순" },
  ];

  const copyReport = () => {
    let text = `📦 로이스6 사업물품 주문 보고서 (${roundFilter === "전체" ? "전체 기간" : roundFilter})\n\n`;
    text += `■ 물품별 집계\n`;
    productList.forEach(p => { text += `- ${p.name}: ${p.qty}개 / 매출 ${won(p.price)} / 마진 ${won(p.margin)}\n`; });
    text += `\n■ 인원별 집계\n`;
    memberList.forEach(m => { text += `- ${m.name}: ${m.qty}개 / ${won(m.price)} (입금 ${won(m.paid)})\n`; });
    text += `\n■ 총계\n총 매출 ${won(totalPrice)} / 마진 ${won(totalMargin)} / 입금 ${won(totalPaid)} / 미수금 ${won(totalUnpaid)}`;
    navigator.clipboard.writeText(text);
    alert("보고서가 클립보드에 복사되었습니다!");
  };

  // 🤖 인원별 펼침 영역 — 데스크톱 표/모바일 카드 양쪽에서 공용으로 쓰는 주문 건별 카드
  const renderMemberOrderCard = (o) => (
    <div key={o.id} style={{ ...S.card, backgroundColor: C.surface }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, fontSize: 12.5, color: C.accent }}>🗓 {roundName(o.roundId)}</span>
          <span style={{ fontSize: 11.5, color: C.muted }}>{fmtDate(o.date)}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => togglePaid(o.id)}
            style={{ border: "none", cursor: "pointer", fontFamily: "inherit", backgroundColor: o.paid ? C.greenLight : C.redLight, color: o.paid ? C.green : C.red, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}
          >
            {o.paid ? "✓ 입금완료" : "○ 미입금"}
          </button>
          <button
            onClick={() => toggleDelivered(o.id)}
            style={{ border: "none", cursor: "pointer", fontFamily: "inherit", backgroundColor: o.delivered ? C.accentLight : C.bg, color: o.delivered ? C.accent : C.muted, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}
          >
            {o.delivered ? "✓ 전달완료" : "○ 미전달"}
          </button>
        </div>
      </div>
      <div style={{ overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 10, minWidth: 420 }}>
        <thead><tr>{["물품","수량","매입가","판매가","마진",""].map(h => <th key={h} style={{ textAlign: h === "물품" ? "left" : "right", padding: "6px 8px", color: C.muted, fontSize: 11, fontWeight: 700 }}>{h}</th>)}</tr></thead>
        <tbody>
          {o.items.map((it, ii) => (
            <tr key={ii}>
              <td style={{ padding: "6px 8px" }}>{it.name}</td>
              <td style={{ padding: "4px 8px", textAlign: "right" }}>
                <input
                  type="number" min="1" value={it.qty}
                  onChange={e => updateItemQty(o.id, ii, e.target.value)}
                  style={{ ...S.input, width: 56, padding: "5px 6px", textAlign: "center", fontSize: 12, display: "inline-block" }}
                />
              </td>
              <td style={{ padding: "6px 8px", textAlign: "right", color: C.muted }}>{won(it.cost * it.qty)}</td>
              <td style={{ padding: "6px 8px", textAlign: "right" }}>{won(it.price * it.qty)}</td>
              <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: C.green }}>{won((it.price - it.cost) * it.qty)}</td>
              <td style={{ padding: "6px 4px", textAlign: "right" }}>
                <button style={{ ...S.btn(C.red), padding: "3px 7px", fontSize: 10 }} onClick={() => removeItemFromOrder(o.id, ii)}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: C.muted }}>입금액</span>
          <input type="number" value={o.paidAmount || 0} onChange={e => updatePaidAmount(o.id, e.target.value)} style={{ ...S.input, width: 110, padding: "5px 8px" }} />
        </div>
        <button style={{ ...S.btn(C.red), marginLeft: "auto", padding: "6px 14px", fontSize: 11 }} onClick={() => remove(o.id)}>주문 삭제</button>
      </div>
    </div>
  );

  return (
    <div>
      <Title eyebrow="Orders" title="주문 리스트" sub={`전체 ${orders.length}건`} w={w}
        action={<button style={S.btn(C.navy)} onClick={copyReport}>📋 보고서 복사</button>} />

      <div style={{ marginBottom: 14, maxWidth: mob ? "100%" : 280 }}>
        <label style={S.label}>차수 선택</label>
        <CompactSelect value={roundFilter} onChange={setRoundFilter} options={roundOptions} placeholder="전체 차수" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "총 판매가", value: totalPrice, color: C.ink, bg: C.bg },
          { label: "총 매입가", value: totalCost, color: C.muted, bg: C.bg },
          { label: "총 마진", value: totalMargin, color: C.green, bg: C.greenLight },
          { label: "입금 완료", value: totalPaid, color: C.green, bg: C.greenLight },
          { label: "미수금", value: totalUnpaid, color: totalUnpaid > 0 ? C.red : C.muted, bg: totalUnpaid > 0 ? C.redLight : C.bg },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: s.bg, borderRadius: 12, padding: mob ? "12px" : "16px" }}>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 700, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: mob ? 15 : 18, fontWeight: 900, color: s.color }}>{won(s.value)}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {[{ id: "member", label: "👤 인원별" }, { id: "product", label: "📦 물품별" }].map(t => (
          <button key={t.id} onClick={() => setAggTab(t.id)} style={{ border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", backgroundColor: aggTab === t.id ? C.accent : C.bg, color: aggTab === t.id ? "#fff" : C.muted, fontFamily: "inherit" }}>{t.label}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {aggSortOptions.map(s => (
          <button key={s.id} onClick={() => setAggSort(s.id)} style={{ border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", backgroundColor: aggSort === s.id ? C.navy : C.bg, color: aggSort === s.id ? "#fff" : C.muted, fontFamily: "inherit" }}>{s.label}</button>
        ))}
      </div>

      {[aggTab].map(section => section === "product" ? (
        mob ? (
          <div key="product" style={{ marginBottom: 16 }}>
            <div style={{ padding: "0 2px 10px", fontWeight: 800, fontSize: 13, color: C.accent }}>📦 물품별</div>
            {productList.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: 30 }}>주문 데이터가 없습니다</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {productList.map(p => {
                  const isOpen = expandedProduct === p.name;
                  const buyers = Object.values(productBuyerDetail[p.name] || {}).sort((a, b) => b.qty - a.qty);
                  return (
                    <div key={p.name} style={{ ...S.card, padding: 14 }}>
                      <div onClick={() => setExpandedProduct(isOpen ? null : p.name)} style={{ cursor: "pointer" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: 14.5, color: isOpen ? C.accent : C.ink }}>{p.name}</span>
                          <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>{p.qty}개</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12.5, flexWrap: "wrap", gap: 6 }}>
                          <span style={{ color: C.muted }}>매입 {won(p.cost)}</span>
                          <span style={{ fontWeight: 700 }}>판매 {won(p.price)}</span>
                          <span style={{ fontWeight: 700, color: C.green }}>마진 {won(p.margin)}</span>
                        </div>
                      </div>
                      {isOpen && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                          <div style={{ fontSize: 11.5, fontWeight: 800, color: C.muted, marginBottom: 8 }}>구매자별 상세</div>
                          {buyers.map(b => (
                            <div key={b.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, padding: "7px 0", borderBottom: `1px solid ${C.border}`, gap: 8 }}>
                              <span style={{ fontWeight: 600 }}>{b.name}</span>
                              <span style={{ color: C.muted }}>{b.qty}개</span>
                              <span style={{ fontWeight: 700 }}>{won(b.price)}</span>
                              <span style={{ fontWeight: 700, color: C.green }}>{won(b.price - b.cost)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div style={{ ...S.card, backgroundColor: C.accentLight, display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, fontWeight: 800, fontSize: 13 }}>
                  <span>합계 {productList.reduce((s,p)=>s+p.qty,0)}개</span>
                  <span>{won(totalPrice)}</span>
                  <span style={{ color: C.green }}>{won(totalMargin)}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
            <div key="product" style={{ ...S.card, padding: 0, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "12px 14px", fontWeight: 800, fontSize: 13, color: C.accent, borderBottom: `1px solid ${C.border}` }}>📦 물품별</div>
              <div style={{ overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 600 }}>
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
                    : productList.map(p => {
                      const isOpen = expandedProduct === p.name;
                      const buyers = Object.values(productBuyerDetail[p.name] || {}).sort((a, b) => b.qty - a.qty);
                      return (
                        <React.Fragment key={p.name}>
                          <tr onClick={() => setExpandedProduct(isOpen ? null : p.name)} style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", backgroundColor: isOpen ? C.accentLight : "transparent" }}>
                            <td style={{ padding: "11px 14px", fontWeight: 700, color: isOpen ? C.accent : C.ink }}>{p.name}</td>
                            <td style={{ padding: "11px 14px", textAlign: "right" }}>{p.qty}개</td>
                            <td style={{ padding: "11px 14px", textAlign: "right", color: C.muted }}>{won(p.cost)}</td>
                            <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 700 }}>{won(p.price)}</td>
                            <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 700, color: C.green }}>{won(p.margin)}</td>
                          </tr>
                          {isOpen && (
                            <tr>
                              <td colSpan={5} style={{ padding: 0, backgroundColor: C.bg, borderBottom: `1px solid ${C.border}` }}>
                                <div style={{ padding: "12px 16px" }}>
                                  <div style={{ fontSize: 11.5, fontWeight: 800, color: C.muted, marginBottom: 8 }}>구매자별 상세</div>
                                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                                    <thead>
                                      <tr>{["구매자","수량","매입가","판매가","마진"].map(h => <th key={h} style={{ textAlign: h === "구매자" ? "left" : "right", padding: "5px 8px", color: C.muted, fontSize: 11, fontWeight: 700 }}>{h}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                      {buyers.map(b => (
                                        <tr key={b.name}>
                                          <td style={{ padding: "5px 8px", fontWeight: 600 }}>{b.name}</td>
                                          <td style={{ padding: "5px 8px", textAlign: "right" }}>{b.qty}개</td>
                                          <td style={{ padding: "5px 8px", textAlign: "right", color: C.muted }}>{won(b.cost)}</td>
                                          <td style={{ padding: "5px 8px", textAlign: "right" }}>{won(b.price)}</td>
                                          <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 700, color: C.green }}>{won(b.price - b.cost)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
                {productList.length > 0 && (
                  <tfoot><tr style={{ backgroundColor: C.accentLight, fontWeight: 800 }}>
                    <td style={{ padding: "11px 14px" }}>합계</td>
                    <td style={{ padding: "11px 14px", textAlign: "right" }}>{productList.reduce((s,p)=>s+p.qty,0)}개</td>
                    <td style={{ padding: "11px 14px", textAlign: "right" }}>{won(totalCost)}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right" }}>{won(totalPrice)}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right", color: C.green }}>{won(totalMargin)}</td>
                  </tr></tfoot>
                )}
              </table>
              </div>
            </div>
        )
          ) : (
        mob ? (
          <div key="member" style={{ marginBottom: 16 }}>
            <div style={{ padding: "0 2px 10px", fontWeight: 800, fontSize: 13, color: C.accent }}>👤 인원별</div>
            {memberList.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: 30 }}>주문 데이터가 없습니다</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {memberList.map(m => {
                  const unpaid = m.price - m.paid;
                  const fullyPaid = unpaid <= 0;
                  const fullyDelivered = m.orderCount > 0 && m.deliveredCount === m.orderCount;
                  const isOpen = expandedMember === m.name;
                  const items = Object.values(memberItemDetail[m.name] || {}).sort((a, b) => b.price - a.price);
                  const memberOrders = (memberOrdersDetail[m.name] || []).slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
                  return (
                    <div key={m.name} style={{ ...S.card, padding: 14 }}>
                      <div onClick={() => setExpandedMember(isOpen ? null : m.name)} style={{ cursor: "pointer" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: 14.5, color: isOpen ? C.accent : C.ink }}>{m.name}</span>
                          <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }} onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => toggleMemberPaid(m.name, !fullyPaid)}
                              style={{ border: "none", cursor: "pointer", fontFamily: "inherit", backgroundColor: fullyPaid ? C.greenLight : C.redLight, color: fullyPaid ? C.green : C.red, fontSize: 10.5, fontWeight: 700, padding: "4px 8px", borderRadius: 20, whiteSpace: "nowrap" }}
                            >
                              {fullyPaid ? "✓ 입금완료" : "○ 미입금"}
                            </button>
                            <button
                              onClick={() => toggleMemberDelivered(m.name, !fullyDelivered)}
                              style={{ border: "none", cursor: "pointer", fontFamily: "inherit", backgroundColor: fullyDelivered ? C.accentLight : C.bg, color: fullyDelivered ? C.accent : C.muted, fontSize: 10.5, fontWeight: 700, padding: "4px 8px", borderRadius: 20, whiteSpace: "nowrap" }}
                            >
                              {fullyDelivered ? "✓ 전달완료" : "○ 미전달"}
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{items.map(it => `${it.name} ${it.qty}개`).join(", ")}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12.5, flexWrap: "wrap", gap: 6 }}>
                          <span style={{ color: C.muted }}>{m.qty}개</span>
                          <span style={{ fontWeight: 700 }}>{won(m.price)}</span>
                          <span style={{ fontWeight: 700, color: C.green }}>마진 {won(m.margin)}</span>
                          <span style={{ fontWeight: 700, color: unpaid > 0 ? C.red : C.muted }}>{unpaid > 0 ? `미수 ${won(unpaid)}` : "완결"}</span>
                        </div>
                      </div>
                      {isOpen && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }} onClick={e => e.stopPropagation()}>
                          {memberOrders.map(o => renderMemberOrderCard(o))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div style={{ ...S.card, backgroundColor: C.accentLight, display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, fontWeight: 800, fontSize: 13 }}>
                  <span>합계 {memberList.reduce((s,m)=>s+m.qty,0)}개</span>
                  <span>{won(totalPrice)}</span>
                  <span style={{ color: C.green }}>{won(totalMargin)}</span>
                  <span style={{ color: C.red }}>{won(totalUnpaid)}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
            <div key="member" style={{ ...S.card, padding: 0, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "12px 14px", fontWeight: 800, fontSize: 13, color: C.accent, borderBottom: `1px solid ${C.border}` }}>👤 인원별</div>
              <div style={{ overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 860 }}>
                <thead>
                  <tr style={{ backgroundColor: C.bg }}>
                    {["이름","입금상태","전달상태","구매물품","수량","총 판매가","총 마진","미수금"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: h === "이름" || h === "구매물품" ? "left" : (h === "입금상태" || h === "전달상태" ? "center" : "right"), fontWeight: 700, color: C.muted, fontSize: 12, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {memberList.length === 0
                    ? <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: C.muted }}>주문 데이터가 없습니다</td></tr>
                    : memberList.map(m => {
                      const unpaid = m.price - m.paid;
                      const fullyPaid = unpaid <= 0;
                      const fullyDelivered = m.orderCount > 0 && m.deliveredCount === m.orderCount;
                      const isOpen = expandedMember === m.name;
                      const items = Object.values(memberItemDetail[m.name] || {}).sort((a, b) => b.price - a.price);
                      const memberOrders = (memberOrdersDetail[m.name] || []).slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
                      return (
                        <React.Fragment key={m.name}>
                          <tr onClick={() => setExpandedMember(isOpen ? null : m.name)} style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", backgroundColor: isOpen ? C.accentLight : "transparent" }}>
                            <td style={{ padding: "11px 14px", fontWeight: 700, color: isOpen ? C.accent : C.ink }}>{m.name}</td>
                            <td style={{ padding: "11px 14px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => toggleMemberPaid(m.name, !fullyPaid)}
                                style={{ border: "none", cursor: "pointer", fontFamily: "inherit", backgroundColor: fullyPaid ? C.greenLight : C.redLight, color: fullyPaid ? C.green : C.red, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}
                                title="클릭해서 입금 상태 전환"
                              >
                                {fullyPaid ? "✓ 입금완료" : "○ 미입금"}
                              </button>
                            </td>
                            <td style={{ padding: "11px 14px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => toggleMemberDelivered(m.name, !fullyDelivered)}
                                style={{ border: "none", cursor: "pointer", fontFamily: "inherit", backgroundColor: fullyDelivered ? C.accentLight : C.bg, color: fullyDelivered ? C.accent : C.muted, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}
                                title="클릭해서 전달 상태 전환"
                              >
                                {fullyDelivered ? "✓ 전달완료" : "○ 미전달"}
                              </button>
                            </td>
                            <td style={{ padding: "11px 14px", fontSize: 12.5, maxWidth: 220 }}>
                              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{items.map(it => `${it.name} ${it.qty}개`).join(", ")}</div>
                            </td>
                            <td style={{ padding: "11px 14px", textAlign: "right" }}>{m.qty}개</td>
                            <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 700 }}>{won(m.price)}</td>
                            <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 700, color: C.green }}>{won(m.margin)}</td>
                            <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 700, color: unpaid > 0 ? C.red : C.muted }}>{unpaid > 0 ? won(unpaid) : "-"}</td>
                          </tr>
                          {isOpen && (
                            <tr>
                              <td colSpan={8} style={{ padding: 0, backgroundColor: C.bg, borderBottom: `1px solid ${C.border}` }}>
                                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }} onClick={e => e.stopPropagation()}>
                                  {memberOrders.map(o => renderMemberOrderCard(o))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
                {memberList.length > 0 && (
                  <tfoot><tr style={{ backgroundColor: C.accentLight, fontWeight: 800 }}>
                    <td colSpan={4} style={{ padding: "11px 14px" }}>합계</td>
                    <td style={{ padding: "11px 14px", textAlign: "right" }}>{memberList.reduce((s,m)=>s+m.qty,0)}개</td>
                    <td style={{ padding: "11px 14px", textAlign: "right" }}>{won(totalPrice)}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right", color: C.green }}>{won(totalMargin)}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right", color: C.red }}>{won(totalUnpaid)}</td>
                  </tr></tfoot>
                )}
              </table>
              </div>
            </div>
        )
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  차수 관리 (간소화 — 새 차수 시작 + 현재 차수 선택만)
// ════════════════════════════════════════════════════════════════════
function RoundManager({ rounds, setRounds, orders, products, setProducts, w }) {
  const mob = isMob(w);
  const thisYear = new Date().getFullYear();
  const [newYear, setNewYear] = useState(thisYear);
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
  const [newWeek, setNewWeek] = useState("첫째주");
  const [dateFilter, setDateFilter] = useState("latest"); // latest | oldest | manual
  const [newRoundOpen, setNewRoundOpen] = useState(false); // 🤖 "새 차수 시작" 카드 — 기본은 접힌 상태

  // 🤖 차수별 판매물품 선택 팝업 — pickerTarget: null=신규 차수 생성, roundId=기존 차수 물품 수정
  const [pickerOpen, setPickerOpen] = useState(false);
  useEscapeClose(pickerOpen, () => setPickerOpen(false));
  const [pickerTarget, setPickerTarget] = useState(null);
  const [pickerSelected, setPickerSelected] = useState([]);
  const [pickerSearch, setPickerSearch] = useState("");
  // 🤖 팝업 안에서 바로 새 물품을 등록하기 위한 폼
  const [newProdOpen, setNewProdOpen] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdCost, setNewProdCost] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");

  const weekOptions = ["첫째주", "둘째주", "셋째주", "넷째주", "다섯째주"];
  const weekIndex = (wk) => weekOptions.indexOf(wk) + 1;
  const makeSortKey = (year, month, week) => year * 10000 + month * 100 + weekIndex(week);
  const activeRound = rounds.find(r => r.active);

  // "새 차수 시작" 클릭 → 바로 만들지 않고 판매물품 선택 팝업부터 연다
  const openCreatePicker = () => {
    // 기본값: 직전 활성 차수가 팔던 물품을 그대로 가져옴(있으면). 없으면 전체 선택.
    const prevIds = activeRound?.productIds;
    setPickerSelected(prevIds && prevIds.length > 0 ? prevIds : products.map(p => p.id));
    setPickerTarget(null);
    setPickerSearch("");
    setNewProdOpen(false); setNewProdName(""); setNewProdCost(""); setNewProdPrice("");
    setPickerOpen(true);
  };

  const openEditPicker = (round) => {
    setPickerSelected(round.productIds && round.productIds.length > 0 ? round.productIds : products.map(p => p.id));
    setPickerTarget(round.id);
    setPickerSearch("");
    setNewProdOpen(false); setNewProdName(""); setNewProdCost(""); setNewProdPrice("");
    setPickerOpen(true);
  };

  const togglePick = (id) => setPickerSelected(ps => ps.includes(id) ? ps.filter(x => x !== id) : [...ps, id]);
  const pickAll = () => setPickerSelected(products.map(p => p.id));
  const pickNone = () => setPickerSelected([]);

  // 🤖 팝업에서 바로 새 물품 추가 — 물품관리 전체 목록에도 저장되고, 이 차수에 자동으로 체크됨
  const addNewProduct = () => {
    if (!newProdName.trim()) return;
    const np = { id: Date.now() + Math.random(), name: newProdName.trim(), cost: newProdCost, price: newProdPrice };
    const u = [...products, np];
    setProducts(u); saveSynced("order-products", u);
    setPickerSelected(ps => [...ps, np.id]);
    setNewProdName(""); setNewProdCost(""); setNewProdPrice(""); setNewProdOpen(false);
  };
  const newProdMargin = (Number(newProdPrice) || 0) - (Number(newProdCost) || 0);

  const confirmPicker = () => {
    if (pickerTarget === null) {
      // 신규 차수 생성
      const name = `${newYear}년 ${newMonth}월 ${newWeek}`;
      const u = [...rounds.map(r => ({ ...r, active: false })), {
        id: Date.now(), name, active: true, createdAt: todayStr(),
        year: newYear, month: newMonth, week: newWeek,
        sortKey: makeSortKey(newYear, newMonth, newWeek),
        productIds: pickerSelected,
      }];
      setRounds(u); saveSynced("order-rounds", u);
      setNewRoundOpen(false);
    } else {
      // 기존 차수 판매물품 수정
      const u = rounds.map(r => r.id === pickerTarget ? { ...r, productIds: pickerSelected } : r);
      setRounds(u); saveSynced("order-rounds", u);
    }
    setPickerOpen(false);
  };

  const removeRound = (id) => {
    if (!window.confirm("이 차수를 삭제할까요? 차수에 속한 주문은 '차수 미지정'으로 남아요.")) return;
    const u = rounds.filter(r => r.id !== id);
    setRounds(u); saveSynced("order-rounds", u);
  };

  const setActiveRound = (id) => {
    const u = rounds.map(r => ({ ...r, active: r.id === id }));
    setRounds(u); saveSynced("order-rounds", u);
  };

  const orderCountOf = (roundId) => orders.filter(o => o.roundId === roundId).length;
  const productCountOf = (round) => (round.productIds && round.productIds.length > 0) ? round.productIds.length : products.length;

  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [clickedId, setClickedId] = useState(null); // 🤖 카드를 클릭해서 선택한 상태(테두리 강조 + 선택 버튼 노출용)
  // 🤖 sortKey가 없으면(구글시트 동기화로 누락된 경우) 차수 이름("2026년 7월 첫째주")에서 복구해서 계산
  const sortKeyOf = (r) => {
    if (r.sortKey) return r.sortKey;
    const match = (r.name || "").match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(.+)/);
    if (match) return makeSortKey(Number(match[1]), Number(match[2]), match[3].trim());
    return 0;
  };

  // 🤖 "최신순" = 차수의 연/월/주차 기준 날짜가 가장 최근인(가장 큰) 것이 맨 위
  const displayedRounds =
    dateFilter === "latest" ? rounds.slice().sort((a, b) => sortKeyOf(b) - sortKeyOf(a)) :
    dateFilter === "oldest" ? rounds.slice().sort((a, b) => sortKeyOf(a) - sortKeyOf(b)) :
    rounds.slice().reverse();

  const handleDragStart = (idx) => { if (dateFilter !== "manual") return; setDragIndex(idx); };
  const handleDragOver = (e, idx) => { if (dateFilter !== "manual") return; e.preventDefault(); setOverIndex(idx); };
  const handleDrop = (idx) => {
    if (dateFilter !== "manual" || dragIndex === null || dragIndex === idx) { setDragIndex(null); setOverIndex(null); return; }
    const reordered = [...displayedRounds];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(idx, 0, moved);
    const newRounds = reordered.slice().reverse();
    setRounds(newRounds); saveSynced("order-rounds", newRounds);
    setDragIndex(null); setOverIndex(null);
  };
  const handleDragEnd = () => { setDragIndex(null); setOverIndex(null); };

  const filteredPickerProducts = products.filter(p => p.name.toLowerCase().includes(pickerSearch.toLowerCase()));

  return (
    <div>
      <Title eyebrow="Rounds" title="차수 관리" sub="연도/월/주차를 선택해서 새 차수를 만들고, 현재 진행할 차수만 선택하면 돼요" w={w} />

      {/* 🤖 차수별 판매물품 선택 팝업 */}
      {pickerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, backgroundColor: "rgba(15,46,79,0.45)", display: "flex", alignItems: mob ? "flex-end" : "center", justifyContent: "center", padding: mob ? 0 : 20 }} onClick={() => setPickerOpen(false)}>
          <div
            style={{ backgroundColor: C.surface, borderRadius: mob ? "16px 16px 0 0" : 16, padding: mob ? "20px 18px" : "26px 28px", maxWidth: 520, width: "100%", height: mob ? "82vh" : "640px", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(15,46,79,0.35)" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>📦 이 차수에 판매할 물품 선택</div>
              <button onClick={() => setPickerOpen(false)} style={{ border: "none", backgroundColor: C.bg, color: C.muted, width: 32, height: 32, borderRadius: 8, fontSize: 16, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
              {pickerTarget === null ? `"${newYear}년 ${newMonth}월 ${newWeek}"에서 판매할 물품에 체크하세요` : "이 차수에서 판매할 물품을 체크하세요"} · 물품 관리에 등록된 전체 물품 중 골라서 사용해요
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
              <input style={{ ...S.input, flex: 1 }} placeholder="물품 검색" value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} />
              <button style={{ ...S.btnGhost, padding: "8px 12px", fontSize: 12 }} onClick={pickAll}>전체선택</button>
              <button style={{ ...S.btnGhost, padding: "8px 12px", fontSize: 12 }} onClick={pickNone}>전체해제</button>
            </div>

            <div style={{ marginBottom: 10 }}>
              {!newProdOpen ? (
                <button style={{ ...S.btnOutline, width: "100%", padding: "9px" }} onClick={() => setNewProdOpen(true)}>+ 목록에 없는 새 물품 추가</button>
              ) : (
                <div style={{ backgroundColor: C.accentLight, border: `1.5px dashed ${C.accent}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: C.accent }}>새 물품 등록</div>
                  <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1.4fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <input style={S.input} placeholder="물품명" value={newProdName} onChange={e => setNewProdName(e.target.value)} />
                    <input style={S.input} type="number" placeholder="매입원가(입고가)" value={newProdCost} onChange={e => setNewProdCost(e.target.value)} />
                    <input style={S.input} type="number" placeholder="판매가" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: C.muted }}>마진(자동계산): <strong style={{ color: newProdMargin >= 0 ? C.green : C.red }}>{won(newProdMargin)}</strong></span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ ...S.btn(), padding: "7px 14px", fontSize: 12 }} onClick={addNewProduct} disabled={!newProdName.trim()}>추가</button>
                      <button style={{ ...S.btnGhost, padding: "7px 14px", fontSize: 12 }} onClick={() => setNewProdOpen(false)}>취소</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, marginBottom: 8 }}>{pickerSelected.length}개 선택됨 (전체 {products.length}개)</div>

            <div style={{ flex: 1, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 16 }}>
              {filteredPickerProducts.length === 0
                ? <div style={{ padding: 30, textAlign: "center", color: C.muted, fontSize: 13 }}>등록된 물품이 없습니다</div>
                : filteredPickerProducts.map(p => (
                  <div key={p.id} onClick={() => togglePick(p.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", backgroundColor: pickerSelected.includes(p.id) ? C.accentLight : "transparent" }}>
                    <input type="checkbox" readOnly checked={pickerSelected.includes(p.id)} style={{ width: 17, height: 17, pointerEvents: "none" }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: C.muted }}>{won(p.price)}</span>
                  </div>
                ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btn(), flex: 1 }} onClick={confirmPicker}>{pickerTarget === null ? "이 물품으로 차수 시작" : "저장"}</button>
              <button style={S.btnGhost} onClick={() => setPickerOpen(false)}>취소</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ ...S.card, marginBottom: 20, backgroundColor: C.accentLight, border: `1.5px solid ${C.accent}`, padding: newRoundOpen ? 20 : 0, overflow: "hidden" }}>
        <div
          onClick={() => setNewRoundOpen(o => !o)}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: newRoundOpen ? 0 : "16px 20px", marginBottom: newRoundOpen ? 10 : 0 }}
        >
          <div style={{ fontWeight: 800 }}>🗓 새 차수 시작</div>
          <span style={{ fontSize: 12, color: C.accent, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
            {newRoundOpen ? "접기" : "펼치기"} <span style={{ fontSize: 10, transform: newRoundOpen ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.15s" }}>▾</span>
          </span>
        </div>
        {newRoundOpen && (
          <>
            {activeRound && (
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>현재 진행 중: <strong style={{ color: C.accent }}>{activeRound.name}</strong> · 새 차수를 시작하면 자동으로 선택돼요. 아래 목록에서 다른 차수를 "이 차수로 선택"해도 돼요</div>
            )}
            <Grid cols={3} w={w}>
              <Field label="연도">
                <select style={S.select} value={newYear} onChange={e => setNewYear(Number(e.target.value))}>
                  {Array.from({ length: 6 }, (_, i) => thisYear - 1 + i).map(y => <option key={y} value={y}>{y}년</option>)}
                </select>
              </Field>
              <Field label="월">
                <select style={S.select} value={newMonth} onChange={e => setNewMonth(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}월</option>)}
                </select>
              </Field>
              <Field label="주차">
                <select style={S.select} value={newWeek} onChange={e => setNewWeek(e.target.value)}>
                  {weekOptions.map(wk => <option key={wk}>{wk}</option>)}
                </select>
              </Field>
            </Grid>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button style={S.btn()} onClick={openCreatePicker}>새 차수 시작</button>
              <span style={{ fontSize: 13, color: C.muted }}>→ "{newYear}년 {newMonth}월 {newWeek}"로 생성돼요 (판매물품 먼저 선택)</span>
            </div>
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[
          { id: "latest", label: "최신순" },
          { id: "oldest", label: "과거순" },
          { id: "manual", label: "직접 정렬 (드래그)" },
        ].map(f => (
          <button key={f.id} onClick={() => setDateFilter(f.id)} style={{ border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", backgroundColor: dateFilter === f.id ? C.accent : C.bg, color: dateFilter === f.id ? "#fff" : C.muted, fontFamily: "inherit" }}>{f.label}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rounds.length === 0
          ? <div style={{ ...S.card, textAlign: "center", color: C.muted }}>등록된 차수가 없습니다. 위에서 첫 차수를 시작해보세요.</div>
          : displayedRounds.map((r, idx) => (
            <div key={r.id}
              draggable={dateFilter === "manual"}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              onClick={() => setClickedId(clickedId === r.id ? null : r.id)}
              style={{
                ...S.card,
                cursor: "pointer",
                opacity: dragIndex === idx ? 0.4 : 1,
                border: clickedId === r.id ? `2px solid ${C.accent}` : (overIndex === idx && dragIndex !== idx ? `1.5px dashed ${C.accent}` : S.card.border),
                boxShadow: clickedId === r.id ? "0 4px 14px rgba(30,93,168,0.18)" : "none",
                transition: "opacity 0.15s, border-color 0.15s",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {dateFilter === "manual" && <span title="드래그해서 순서 변경" style={{ cursor: "grab", color: C.muted, fontSize: 16, padding: "2px 4px", userSelect: "none" }}>☰</span>}
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{r.name}</span>
                  {r.active && <Badge text="진행 중" color={C.green} bg={C.greenLight} />}
                  <span style={{ fontSize: 12, color: C.muted }}>주문 {orderCountOf(r.id)}건</span>
                  <span style={{ fontSize: 12, color: C.muted }}>· 판매물품 {productCountOf(r)}개</span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
                  {clickedId === r.id && <button style={S.btnOutline} onClick={() => openEditPicker(r)}>📦 판매물품 설정</button>}
                  {r.active ? (
                    <button disabled style={{ ...S.btn(C.green), padding: "8px 14px", fontSize: 12, opacity: 0.6, cursor: "default" }}>✓ 선택됨</button>
                  ) : clickedId === r.id ? (
                    <button style={{ ...S.btn(C.green), padding: "8px 14px", fontSize: 12 }} onClick={() => { setActiveRound(r.id); setClickedId(null); }}>이 차수로 선택</button>
                  ) : null}
                  {clickedId === r.id && <button style={{ ...S.btn(C.red), padding: "8px 14px", fontSize: 12 }} onClick={() => removeRound(r.id)}>삭제</button>}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════
//  분기별 보고 (월/차수별 사업회계 집계)
// ════════════════════════════════════════════════════════════════════
function QuarterlyReport({ orders, rounds, w }) {
  const mob = isMob(w);
  const thisYear = new Date().getFullYear();
  const thisMonth = new Date().getMonth() + 1;
  const defaultStart = Math.floor((thisMonth - 1) / 3) * 3 + 1; // 현재 달이 속한 분기의 시작월

  const [year, setYear] = useState(thisYear);
  const [startMonth, setStartMonth] = useState(defaultStart);
  const [endMonth, setEndMonth] = useState(defaultStart + 2);
  const [startWeek, setStartWeek] = useState(1); // 1=첫째주
  const [endWeek, setEndWeek] = useState(5); // 5=다섯째주(=그 달의 끝까지)

  const weekOptions = ["첫째주", "둘째주", "셋째주", "넷째주", "다섯째주"];
  const weekRoundNo = (week) => { const i = weekOptions.indexOf(week); return i >= 0 ? i + 1 : 0; };

  // 🤖 차수에 연도/월/주차 정보가 비어있으면(구글시트 동기화 등으로 누락된 경우) 차수 이름("2026년 3월 셋째주")에서 복구
  const parseRoundMeta = (r) => {
    let y = r.year, m = r.month, wk = r.week;
    if (!y || !m || !wk) {
      const match = (r.name || "").match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(.+)/);
      if (match) {
        if (!y) y = Number(match[1]);
        if (!m) m = Number(match[2]);
        if (!wk) wk = match[3].trim();
      }
    }
    return { year: y || null, month: m || null, week: wk || "" };
  };

  const quarterPresets = [
    { label: "1분기 (1~3월)", start: 1, end: 3 },
    { label: "2분기 (4~6월)", start: 4, end: 6 },
    { label: "3분기 (7~9월)", start: 7, end: 9 },
    { label: "4분기 (10~12월)", start: 10, end: 12 },
  ];
  const applyQuarter = (q) => { setStartMonth(q.start); setEndMonth(q.end); setStartWeek(1); setEndWeek(5); };

  // 🤖 선택한 기간(월+주차 단위)에 속한 차수를 월별로 묶음 — 연도/월 정보를 이름에서도 복구해서 매칭
  const startKey = startMonth * 10 + startWeek;
  const endKey = endMonth * 10 + endWeek;
  const roundsWithMeta = rounds.map(r => ({ ...r, _meta: parseRoundMeta(r) }));
  const roundsInRange = roundsWithMeta
    .filter(r => {
      if (r._meta.year !== year || !r._meta.month) return false;
      const k = r._meta.month * 10 + weekRoundNo(r._meta.week);
      return k >= startKey && k <= endKey;
    })
    .slice()
    .sort((a, b) => (a._meta.month - b._meta.month) || (weekRoundNo(a._meta.week) - weekRoundNo(b._meta.week)));

  const monthGroups = [];
  roundsInRange.forEach(r => {
    let g = monthGroups.find(m => m.month === r._meta.month);
    if (!g) { g = { month: r._meta.month, rounds: [] }; monthGroups.push(g); }
    g.rounds.push(r);
  });

  // 각 차수별 물품 집계(수량/단가/금액/마진) + 주차 소계
  const buildRoundItems = (round) => {
    const agg = {};
    orders.filter(o => o.roundId === round.id).forEach(o => o.items.forEach(it => {
      if (!agg[it.name]) agg[it.name] = { name: it.name, qty: 0, total: 0, cost: 0 };
      agg[it.name].qty += it.qty;
      agg[it.name].total += it.price * it.qty;
      agg[it.name].cost += (it.cost || 0) * it.qty;
    }));
    return Object.values(agg).map(it => ({ ...it, margin: it.total - it.cost }));
  };

  monthGroups.forEach(g => {
    g.roundData = g.rounds.map(r => {
      const items = buildRoundItems(r);
      const subtotal = items.reduce((s, i) => s + i.total, 0);
      const subtotalMargin = items.reduce((s, i) => s + i.margin, 0);
      return { round: r, items, subtotal, subtotalMargin };
    });
    g.monthTotal = g.roundData.reduce((s, rd) => s + rd.subtotal, 0);
    g.monthMargin = g.roundData.reduce((s, rd) => s + rd.subtotalMargin, 0);
  });
  const grandTotal = monthGroups.reduce((s, g) => s + g.monthTotal, 0);
  const grandMargin = monthGroups.reduce((s, g) => s + g.monthMargin, 0);
  const periodLabel = (startWeek === 1 && endWeek === 5)
    ? (startMonth === endMonth ? `${startMonth}월` : `${startMonth}~${endMonth}월`)
    : `${startMonth}월 ${weekOptions[startWeek - 1]} ~ ${endMonth}월 ${weekOptions[endWeek - 1]}`;

  // 🤖 분기 이름 계산 (1~4분기 또는 기간 표시)
  const quarterName = (() => {
    if (startWeek === 1 && endWeek === 5) {
      if (startMonth === 1 && endMonth === 3) return "1분기";
      if (startMonth === 4 && endMonth === 6) return "2분기";
      if (startMonth === 7 && endMonth === 9) return "3분기";
      if (startMonth === 10 && endMonth === 12) return "4분기";
    }
    return periodLabel;
  })();
  const reportTitle = `로이스6 ${quarterName} 사업보고`;

  // 🤖 A4 사이즈(1240×1754px) 캔버스에 표를 직접 그려서 JPG로 저장
  const downloadJpg = () => {
    const W = 1240, PAD = 52, COL_MONTH = 90;
    const COLS = [
      { label: "월구분", w: COL_MONTH },
      { label: "품명",   w: 280 },
      { label: "수량",   w: 80 },
      { label: "단가",   w: 140 },
      { label: "금액",   w: 160 },
      { label: "마진",   w: 160 },
    ];
    const tableW = W - PAD * 2;
    // 총 고정폭 계산 후 품명 칸을 나머지로 채우기
    const fixedW = COLS.filter(c => c.label !== "품명").reduce((s, c) => s + c.w, 0);
    COLS.find(c => c.label === "품명").w = tableW - fixedW;

    const ROW_H = 36, HEADER_H = 48, SECTION_H = 42, SUB_H = 38, MONTH_TOTAL_H = 42, TITLE_H = 90, META_H = 50, TOTAL_H = 50, FOOTER_H = 40;

    // 먼저 필요한 총 높이 계산
    let totalH = TITLE_H + META_H + HEADER_H + TOTAL_H + FOOTER_H + 40;
    monthGroups.forEach(g => {
      g.roundData.forEach(rd => {
        totalH += SECTION_H + (rd.items.length || 1) * ROW_H + SUB_H;
      });
      totalH += MONTH_TOTAL_H;
    });
    const H = Math.max(1754, totalH + PAD * 2);

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // 배경
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);

    // 컬러
    const ACCENT = "#1E5DA8", NAVY = "#0F2E4F", GREEN = "#3E8E6E";
    const ACCENT_LIGHT = "#E7F0FA", GREEN_LIGHT = "#E9F5F0";
    const BORDER = "#DCE6F0", MUTED = "#6E859C", INK = "#1B2A3D";

    const fillRect = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
    const strokeRect = (x, y, w, h, color = BORDER) => { ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); };
    const text = (txt, x, y, { color = INK, size = 14, weight = "normal", align = "center" } = {}) => {
      ctx.fillStyle = color;
      ctx.font = `${weight} ${size}px 'Apple SD Gothic Neo','Noto Sans KR',sans-serif`;
      ctx.textAlign = align;
      ctx.textBaseline = "middle";
      ctx.fillText(String(txt), x, y);
    };

    let y = PAD;

    // 제목 바
    fillRect(PAD, y, tableW, TITLE_H, ACCENT);
    text(reportTitle, PAD + tableW / 2, y + TITLE_H / 2, { color: "#fff", size: 28, weight: "bold" });
    y += TITLE_H + 10;

    // 메타 (기간/일시)
    const metaText = `${year}년 ${periodLabel} | 총 판매가 ${won(grandTotal)} | 총 마진 ${won(grandMargin)}`;
    fillRect(PAD, y, tableW, META_H, ACCENT_LIGHT);
    text(metaText, PAD + tableW / 2, y + META_H / 2, { color: ACCENT, size: 14, weight: "bold" });
    y += META_H + 14;

    // 표 헤더
    fillRect(PAD, y, tableW, HEADER_H, NAVY);
    let cx = PAD;
    COLS.forEach(c => {
      text(c.label, cx + c.w / 2, y + HEADER_H / 2, { color: "#fff", size: 13, weight: "bold" });
      cx += c.w;
    });
    y += HEADER_H;

    // 데이터 행
    monthGroups.forEach(g => {
      const monthRows = g.roundData.reduce((s, rd) => s + SECTION_H + (rd.items.length || 1) * ROW_H + SUB_H, 0) + MONTH_TOTAL_H;
      let monthY = y;

      g.roundData.forEach(rd => {
        // 차수 헤더
        fillRect(PAD + COLS[0].w, monthY, tableW - COLS[0].w, SECTION_H, ACCENT_LIGHT);
        strokeRect(PAD, monthY, tableW, SECTION_H);
        text(`${weekRoundNo(rd.round._meta.week)}차 (${rd.round._meta.week})`, PAD + COLS[0].w + (tableW - COLS[0].w) / 2, monthY + SECTION_H / 2, { color: ACCENT, size: 13, weight: "bold" });
        monthY += SECTION_H;

        // 품목 행
        const items = rd.items.length > 0 ? rd.items : [{ name: "주문 데이터 없음", qty: "", total: 0, margin: 0 }];
        items.forEach((it, ii) => {
          const bg = ii % 2 === 1 ? "#F4F8FC" : "#FFFFFF";
          fillRect(PAD + COLS[0].w, monthY, tableW - COLS[0].w, ROW_H, bg);
          strokeRect(PAD, monthY, tableW, ROW_H);
          cx = PAD + COLS[0].w;
          [it.name, it.qty ? `${it.qty}개` : "", it.qty ? won(Math.round(it.total / it.qty)) : "", won(it.total), won(it.margin)].forEach((val, vi) => {
            const col = COLS[vi + 1];
            text(val, cx + col.w / 2, monthY + ROW_H / 2, { color: vi === 4 ? GREEN : (vi === 2 ? MUTED : INK), size: 13, weight: vi === 0 ? "600" : "normal" });
            cx += col.w;
          });
          monthY += ROW_H;
        });

        // 소계
        fillRect(PAD + COLS[0].w, monthY, tableW - COLS[0].w, SUB_H, GREEN_LIGHT);
        strokeRect(PAD, monthY, tableW, SUB_H);
        text(`${weekRoundNo(rd.round._meta.week)}차 소계`, PAD + COLS[0].w + COLS[1].w / 2, monthY + SUB_H / 2, { color: GREEN, size: 13, weight: "bold" });
        cx = PAD + COLS[0].w + COLS[1].w + COLS[2].w + COLS[3].w;
        text(won(rd.subtotal), cx + COLS[4].w / 2, monthY + SUB_H / 2, { color: INK, size: 13, weight: "bold" });
        cx += COLS[4].w;
        text(won(rd.subtotalMargin), cx + COLS[5].w / 2, monthY + SUB_H / 2, { color: GREEN, size: 13, weight: "bold" });
        monthY += SUB_H;
      });

      // 월 구분 세로 셀
      fillRect(PAD, y, COLS[0].w, monthRows, ACCENT_LIGHT);
      strokeRect(PAD, y, COLS[0].w, monthRows);
      ctx.save();
      ctx.translate(PAD + COLS[0].w / 2, y + monthRows / 2);
      text(`${g.month}월`, 0, 0, { color: ACCENT, size: 18, weight: "bold" });
      ctx.restore();

      // 월 합계
      fillRect(PAD, monthY, tableW, MONTH_TOTAL_H, ACCENT_LIGHT);
      strokeRect(PAD, monthY, tableW, MONTH_TOTAL_H);
      text(`${g.month}월 합계`, PAD + (tableW - COLS[4].w - COLS[5].w) / 2, monthY + MONTH_TOTAL_H / 2, { color: INK, size: 14, weight: "bold" });
      cx = PAD + tableW - COLS[4].w - COLS[5].w;
      text(won(g.monthTotal), cx + COLS[4].w / 2, monthY + MONTH_TOTAL_H / 2, { color: INK, size: 14, weight: "bold" });
      text(won(g.monthMargin), cx + COLS[4].w + COLS[5].w / 2, monthY + MONTH_TOTAL_H / 2, { color: ACCENT, size: 14, weight: "bold" });
      y += monthRows;
    });

    // 총합계
    fillRect(PAD, y, tableW, TOTAL_H, NAVY);
    text(`${year}년 ${periodLabel} 사업회계 총합계`, PAD + (tableW - COLS[4].w - COLS[5].w) / 2, y + TOTAL_H / 2, { color: "#fff", size: 15, weight: "bold" });
    cx = PAD + tableW - COLS[4].w - COLS[5].w;
    text(won(grandTotal), cx + COLS[4].w / 2, y + TOTAL_H / 2, { color: "#fff", size: 15, weight: "bold" });
    text(won(grandMargin), cx + COLS[4].w + COLS[5].w / 2, y + TOTAL_H / 2, { color: "#fff", size: 15, weight: "bold" });
    y += TOTAL_H + 20;

    // 하단 날짜
    text(`출력일: ${new Date().toLocaleDateString("ko-KR")}`, PAD + tableW, y + FOOTER_H / 2, { color: MUTED, size: 12, align: "right" });

    // JPG 다운로드
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${year}년_${quarterName}_사업보고.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, "image/jpeg", 0.95);
  };

  return (
    <div>
      <Title eyebrow="Quarterly" title="분기별 보고" sub="기간을 정하면 그 안의 차수들을 월별로 묶어서 사업회계 보고서를 만들어줘요" w={w}
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={{ ...S.btnOutline, color: C.navy, border: `1.5px solid ${C.navy}` }} onClick={downloadJpg} disabled={monthGroups.length === 0}>🖼️ JPG 다운로드</button>
          </div>
        } />

      <div style={{ ...S.card, marginBottom: 20, backgroundColor: C.accentLight, border: `1.5px solid ${C.accent}` }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>🗓 기간 설정</div>
        <Grid cols={3} w={w}>
          <Field label="연도">
            <select style={S.select} value={year} onChange={e => setYear(Number(e.target.value))}>
              {Array.from({ length: 6 }, (_, i) => thisYear - 1 + i).map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
          </Field>
          <Field label="시작월">
            <select style={S.select} value={startMonth} onChange={e => setStartMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}월</option>)}
            </select>
          </Field>
          <Field label="시작 주차">
            <select style={S.select} value={startWeek} onChange={e => setStartWeek(Number(e.target.value))}>
              {weekOptions.map((wk, i) => <option key={wk} value={i + 1}>{wk}부터</option>)}
            </select>
          </Field>
        </Grid>
        <Grid cols={3} w={w}>
          <Field label="종료월">
            <select style={S.select} value={endMonth} onChange={e => setEndMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}월</option>)}
            </select>
          </Field>
          <Field label="종료 주차">
            <select style={S.select} value={endWeek} onChange={e => setEndWeek(Number(e.target.value))}>
              {weekOptions.map((wk, i) => <option key={wk} value={i + 1}>{wk}까지</option>)}
            </select>
          </Field>
        </Grid>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {quarterPresets.map(q => (
            <button key={q.label} onClick={() => applyQuarter(q)}
              style={{ borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", backgroundColor: startMonth === q.start && endMonth === q.end && startWeek === 1 && endWeek === 5 ? C.navy : C.surface, color: startMonth === q.start && endMonth === q.end && startWeek === 1 && endWeek === 5 ? "#fff" : C.muted, fontFamily: "inherit", border: `1px solid ${startMonth === q.start && endMonth === q.end && startWeek === 1 && endWeek === 5 ? C.navy : C.border}` }}>{q.label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: C.gradient, color: "#fff", padding: mob ? "12px 18px" : "14px 24px", borderRadius: 14, marginBottom: 20, boxShadow: "0 6px 18px rgba(15,46,79,0.18)" }}>
        <span style={{ fontSize: mob ? 22 : 26 }}>📊</span>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.85 }}>{year}년 {periodLabel} 사업회계 총합계</div>
          <div style={{ fontSize: mob ? 20 : 24, fontWeight: 900 }}>{won(grandTotal)}</div>
        </div>
      </div>

      {monthGroups.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: 40 }}>이 기간에 해당하는 차수가 없습니다. 연도/월을 다시 확인해보거나, 차수 이름이 "2026년 3월 첫째주"처럼 연도/월이 포함된 형식인지 확인해주세요.</div>
      ) : (
        <div style={{ ...S.card, padding: 0, overflow: "hidden", border: `1px solid ${C.border}` }}>
          <div style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 720 }}>
            <thead>
              <tr style={{ backgroundColor: C.accent }}>
                {["월구분","품명","수량","단가","금액","마진"].map(h => (
                  <th key={h} style={{ padding: "13px 10px", textAlign: "center", fontWeight: 800, color: "#fff", fontSize: 13, border: `1px solid rgba(255,255,255,0.18)` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthGroups.map(g => {
                const monthRowSpan = g.roundData.reduce((s, rd) => s + 2 + (rd.items.length || 1), 0); // 헤더1 + 소계1 + 품목(없으면 안내문 1줄)
                let monthCellUsed = false;
                return (
                  <React.Fragment key={g.month}>
                    {g.roundData.map((rd, ri) => (
                      <React.Fragment key={rd.round.id}>
                        <tr style={{ backgroundColor: C.bg }}>
                          {!monthCellUsed && (monthCellUsed = true) && (
                            <td rowSpan={monthRowSpan} style={{ padding: "12px", textAlign: "center", fontWeight: 900, color: C.accent, fontSize: 19, border: `1px solid ${C.border}`, backgroundColor: C.accentLight, verticalAlign: "middle" }}>{g.month}월</td>
                          )}
                          <td colSpan={5} style={{ padding: "10px 10px", textAlign: "center", fontWeight: 700, color: C.accent, backgroundColor: "rgba(30,93,168,0.08)", border: `1px solid ${C.border}`, fontSize: 13.5 }}>{weekRoundNo(rd.round._meta.week)}차({rd.round._meta.week})</td>
                        </tr>
                        {rd.items.length === 0 ? (
                          <tr><td colSpan={5} style={{ padding: "10px", textAlign: "center", color: C.muted, border: `1px solid ${C.border}` }}>주문 데이터가 없습니다</td></tr>
                        ) : rd.items.map((it, ii) => (
                          <tr key={ii} style={{ backgroundColor: ii % 2 === 1 ? "rgba(30,93,168,0.035)" : "transparent" }}>
                            <td style={{ padding: "10px", textAlign: "center", fontWeight: 600, border: `1px solid ${C.border}` }}>{it.name}</td>
                            <td style={{ padding: "10px", textAlign: "center", border: `1px solid ${C.border}` }}>{it.qty}</td>
                            <td style={{ padding: "10px", textAlign: "center", border: `1px solid ${C.border}`, color: C.muted }}>{won(Math.round(it.total / it.qty))}</td>
                            <td style={{ padding: "10px", textAlign: "center", border: `1px solid ${C.border}`, fontWeight: 700 }}>{won(it.total)}</td>
                            <td style={{ padding: "10px", textAlign: "center", border: `1px solid ${C.border}`, fontWeight: 700, color: C.green }}>{won(it.margin)}</td>
                          </tr>
                        ))}
                        <tr style={{ backgroundColor: C.greenLight }}>
                          <td colSpan={3} style={{ padding: "9px 10px", textAlign: "center", fontWeight: 700, fontSize: 13, color: C.green, border: `1px solid ${C.border}` }}>{weekRoundNo(rd.round._meta.week)}차({rd.round._meta.week}) 소계</td>
                          <td style={{ padding: "9px 10px", textAlign: "center", fontWeight: 800, fontSize: 13, color: C.ink, border: `1px solid ${C.border}` }}>{won(rd.subtotal)}</td>
                          <td style={{ padding: "9px 10px", textAlign: "center", fontWeight: 800, fontSize: 13, color: C.green, border: `1px solid ${C.border}` }}>{won(rd.subtotalMargin)}</td>
                        </tr>
                      </React.Fragment>
                    ))}
                    <tr style={{ backgroundColor: C.accentLight }}>
                      <td colSpan={4} style={{ padding: "12px 10px", textAlign: "center", fontWeight: 800, fontSize: 14, border: `1px solid ${C.border}`, color: C.ink }}>{g.month}월 합계</td>
                      <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 900, fontSize: 14, border: `1px solid ${C.border}`, color: C.ink }}>{won(g.monthTotal)}</td>
                      <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 900, fontSize: 14, border: `1px solid ${C.border}`, color: C.accent }}>{won(g.monthMargin)}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
              <tr style={{ background: C.gradient }}>
                <td colSpan={4} style={{ padding: "14px 10px", textAlign: "center", fontWeight: 900, fontSize: 15, color: "#fff", border: `1px solid rgba(255,255,255,0.18)` }}>{year}년 {periodLabel} 사업회계 총합계</td>
                <td style={{ padding: "14px 10px", textAlign: "center", fontWeight: 900, fontSize: 15, color: "#fff", border: `1px solid rgba(255,255,255,0.18)` }}>{won(grandTotal)}</td>
                <td style={{ padding: "14px 10px", textAlign: "center", fontWeight: 900, fontSize: 15, color: "#fff", border: `1px solid rgba(255,255,255,0.18)` }}>{won(grandMargin)}</td>
              </tr>
            </tbody>
          </table>
          </div>
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

  // 🤖 풀투리프레시 — 모바일에서 아래로 당기면 페이지 새로고침
  // (window.scrollY 대신 documentElement/body도 함께 체크 + preventDefault로 네이티브 스크롤/새로고침과 충돌 방지)
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(null);
  const draggingRef = useRef(false);
  const PULL_THRESHOLD = 80;

  const getScrollTop = () =>
    window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

  useEffect(() => {
    const onTouchStart = (e) => {
      if (getScrollTop() <= 0) {
        touchStartY.current = e.touches[0].clientY;
        draggingRef.current = true;
      } else {
        touchStartY.current = null;
        draggingRef.current = false;
      }
    };

    const onTouchMove = (e) => {
      if (!draggingRef.current || touchStartY.current === null) return;
      const dy = e.touches[0].clientY - touchStartY.current;
      if (dy > 0 && getScrollTop() <= 0) {
        // 네이티브 브라우저 풀투리프레시/바운스가 제스처를 가로채지 못하게 막음
        e.preventDefault();
        setIsPulling(true);
        setPullY(Math.min(dy * 0.4, PULL_THRESHOLD + 20));
      } else {
        // 위로 스와이프하거나 스크롤이 이미 됐으면 드래그 취소
        draggingRef.current = false;
        setIsPulling(false);
        setPullY(0);
      }
    };

    const onTouchEnd = () => {
      setPullY(currentPullY => {
        if (draggingRef.current && currentPullY >= PULL_THRESHOLD) {
          window.location.reload();
        }
        return 0;
      });
      draggingRef.current = false;
      touchStartY.current = null;
      setIsPulling(false);
    };

    // passive:false 필수 — 이게 있어야 preventDefault()가 실제로 먹힘
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const [products, setProducts] = useState(() => load("order-products", []));
  const [members, setMembers] = useState(() => load("order-members", []));
  const [orders, setOrders] = useState(() => load("order-orders", []));
  const [rounds, setRounds] = useState(() => normalizeRounds(load("order-rounds", [])));
  const [syncStatus, setSyncStatus] = useState("loading");
  const [showUploadPrompt, setShowUploadPrompt] = useState(false);
  useEscapeClose(menuOpen, () => setMenuOpen(false));
  useEscapeClose(showUploadPrompt, () => setShowUploadPrompt(false));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchAllFromSheet();
      if (cancelled) return;
      if (!data) { setSyncStatus("error"); return; }

      const sheetIsEmpty = (data.members || []).length === 0 && (data.products || []).length === 0 && (data.orders || []).length === 0;
      const localHasData = (load("order-members", []).length > 0) || (load("order-products", []).length > 0) || (load("order-orders", []).length > 0);

      if (sheetIsEmpty && localHasData) {
        setShowUploadPrompt(true);
        setSyncStatus("error");
        return;
      }

      if (data.members) { setMembers(data.members); save("order-members", data.members); }
      if (data.products) { setProducts(data.products); save("order-products", data.products); }
      if (data.rounds) { const normalized = normalizeRounds(data.rounds); setRounds(normalized); save("order-rounds", normalized); }
      if (data.orders) { setOrders(data.orders); save("order-orders", data.orders); }
      setSyncStatus("synced");
    })();
    return () => { cancelled = true; };
  }, []);

  const uploadLocalToSheet = async () => {
    setSyncStatus("loading");
    saveSynced("order-members", members);
    saveSynced("order-products", products);
    saveSynced("order-rounds", rounds);
    saveSynced("order-orders", orders);
    setShowUploadPrompt(false);
    setTimeout(() => setSyncStatus("synced"), 1200);
  };
  const currentRound = rounds.find(r => r.active) || null;

  const nav = [
    { id: "rounds", label: "차수 관리", icon: "🗓" },
    { id: "entry", label: "주문 입력", icon: "🛒" },
    { id: "orders", label: "주문 리스트", icon: "📋" },
    { id: "products", label: "물품 관리", icon: "📦" },
    { id: "members", label: "회원 명단", icon: "📇" },
    { id: "quarterly", label: "분기별 보고", icon: "📊" },
  ];
  const goTo = (id) => { setPage(id); setMenuOpen(false); };

  const renderPage = () => {
    switch (page) {
      case "entry": return <OrderEntry members={members} products={products} orders={orders} setOrders={setOrders} currentRound={currentRound} w={w} />;
      case "orders": return <OrderList orders={orders} setOrders={setOrders} rounds={rounds} currentRound={currentRound} w={w} />;
      case "rounds": return <RoundManager rounds={rounds} setRounds={setRounds} orders={orders} products={products} setProducts={setProducts} w={w} />;
      case "products": return <ProductManager products={products} setProducts={setProducts} orders={orders} setOrders={setOrders} w={w} />;
      case "members": return <MemberRegistry members={members} setMembers={setMembers} orders={orders} rounds={rounds} w={w} />;
      case "quarterly": return <QuarterlyReport orders={orders} rounds={rounds} w={w} />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, fontFamily: "'Pretendard','Apple SD Gothic Neo','Noto Sans KR',sans-serif", color: C.ink }}>
      {showUploadPrompt && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, backgroundColor: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ backgroundColor: C.surface, borderRadius: 16, padding: mob ? "28px 22px" : "36px 32px", maxWidth: 420, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>☁️</div>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>구글 시트가 비어있어요</div>
            <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>
              이 기기에 저장된 기존 데이터가 있어요.<br />
              <strong style={{ color: C.ink }}>회원 {members.length}명 · 물품 {products.length}개 · 주문 {orders.length}건</strong><br />
              아래 버튼을 눌러 구글 시트로 업로드하면, 이후 어떤 기기에서 접속해도 같은 데이터를 보게 돼요.
            </div>
            <button style={{ ...S.btn(), width: "100%", padding: "13px", marginBottom: 10 }} onClick={uploadLocalToSheet}>📤 지금 데이터 업로드하기</button>
            <button style={S.btnGhost} onClick={() => setShowUploadPrompt(false)}>나중에 하기</button>
          </div>
        </div>
      )}
      {mob ? (
        <div style={{ minHeight: "100vh" }}>
          {/* 🤖 풀투리프레시 인디케이터 */}
          {isPulling && (
            <div style={{ position: "fixed", top: `calc(env(safe-area-inset-top, 0px) + 66px)`, left: 0, right: 0, zIndex: 500, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ marginTop: 8, width: 36, height: 36, borderRadius: "50%", backgroundColor: pullY >= PULL_THRESHOLD ? C.green : C.surface, border: `2px solid ${pullY >= PULL_THRESHOLD ? C.green : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", transform: `rotate(${pullY / PULL_THRESHOLD * 360}deg)`, transition: "transform 0.05s, background-color 0.15s, border-color 0.15s" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ display: "block" }}>
                  <path fill={pullY >= PULL_THRESHOLD ? "#fff" : C.accent} d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                </svg>
              </div>
            </div>
          )}
          <div style={{ transform: isPulling ? `translateY(${pullY}px)` : "none", transition: isPulling ? "none" : "transform 0.25s ease" }}>
          <div style={{ position: "sticky", top: 0, zIndex: 200, backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, boxShadow: "0 4px 10px rgba(15,46,79,0.06)", paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)", paddingBottom: 12, paddingLeft: 16, paddingRight: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: C.accent }}>✝️ 로이스6 주문관리</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SyncBadge status={syncStatus} />
              <button onClick={() => setMenuOpen(true)} style={{ border: "none", backgroundColor: "transparent", fontSize: 20, cursor: "pointer" }}>☰</button>
            </div>
          </div>
          {menuOpen && (
            <div style={{ position: "fixed", inset: 0, zIndex: 300, backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setMenuOpen(false)}>
              <div style={{ position: "absolute", top: 0, left: 0, width: 250, height: "100%", backgroundColor: C.surface, padding: "20px 12px", paddingTop: "max(20px, calc(env(safe-area-inset-top, 0px) + 16px))" }} onClick={e => e.stopPropagation()}>
                <div style={{ fontWeight: 900, fontSize: 19, marginBottom: 20, padding: "0 8px", color: C.accent }}>✝️ 로이스6 주문관리</div>
                {nav.map(n => (
                  <button key={n.id} onClick={() => goTo(n.id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "13px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 15, fontWeight: page === n.id ? 700 : 400, backgroundColor: page === n.id ? C.accentLight : "transparent", color: page === n.id ? C.accent : C.ink, marginBottom: 2, fontFamily: "inherit" }}>
                    <span style={{ fontSize: 18 }}>{n.icon}</span><span>{n.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ padding: "28px 14px 16px", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))", paddingLeft: "max(14px, env(safe-area-inset-left, 0px))", paddingRight: "max(14px, env(safe-area-inset-right, 0px))" }}>{renderPage()}</div>
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom, 0px)", paddingLeft: "env(safe-area-inset-left, 0px)", paddingRight: "env(safe-area-inset-right, 0px)" }}>
            {nav.map(n => (
              <button key={n.id} onClick={() => goTo(n.id)} style={{ flex: 1, border: "none", backgroundColor: "transparent", padding: "10px 2px 8px", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: 20 }}>{n.icon}</span>
                <span style={{ fontSize: 10, fontWeight: page === n.id ? 700 : 400, color: page === n.id ? C.accent : C.muted }}>{n.label}</span>
              </button>
            ))}
          </div>
        </div>
        </div>
      ) : (
        <div style={{ display: "flex" }}>
          <div style={{ width: isTab(w) ? 180 : 220, minHeight: "100vh", backgroundColor: C.surface, borderRight: `1px solid ${C.border}`, flexShrink: 0, position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "24px 20px 18px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>로이스6</div>
              <div style={{ fontSize: isTab(w) ? 17 : 19, fontWeight: 900, marginBottom: 8, lineHeight: 1.3 }}>사업물품 주문관리</div>
              <SyncBadge status={syncStatus} />
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
