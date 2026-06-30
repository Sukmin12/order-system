import { useState, useEffect, useRef } from "react";

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

  const selected = options.find(o => String(o.value) === String(value));
  const filtered = query ? options.filter(o => o.label.includes(query)) : options;

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
  const [sortMode, setSortMode] = useState("asc");

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

  const saveItem = () => {
    if (!form.name) return;
    let u;
    if (editing) {
      u = products.map(p => p.id === editing ? { ...form, id: editing } : p);
      setEditing(null);
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
  const remove = (id) => { if (!window.confirm("삭제할까요?")) return; const u = products.filter(p => p.id !== id); setProducts(u); saveSynced("order-products", u); };

  const filtered = sortList(products.filter(p => p.name.includes(search)));

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

      {adding && (
        <div style={{ ...S.card, marginBottom: 18, backgroundColor: C.accentLight, border: `1.5px solid ${C.accent}` }}>
          {editing ? (
            <>
              <div style={{ fontWeight: 800, marginBottom: 14 }}>물품 수정</div>
              <Grid cols={3} w={w}>
                <Field label="품명 *"><input style={S.input} value={form.name} onChange={e => setF("name", e.target.value)} placeholder="감귤 5kg" /></Field>
                <Field label="매입원가(입고가)"><input style={S.input} type="number" value={form.cost} onChange={e => setF("cost", e.target.value)} placeholder="20000" /></Field>
                <Field label="판매가"><input style={S.input} type="number" value={form.price} onChange={e => setF("price", e.target.value)} placeholder="23000" /></Field>
              </Grid>
              {findDuplicate(form.name, editing) && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: C.yellowLight, color: C.yellow, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                  ⚠️ 이미 같은 이름의 물품이 있어요 — {findDuplicate(form.name, editing).name} ({won(findDuplicate(form.name, editing).price)})
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: C.muted }}>예상 마진</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: margin >= 0 ? C.green : C.red }}>{won(margin)}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={S.btn()} onClick={saveItem}>수정 저장</button>
                <button style={S.btnGhost} onClick={() => { setAdding(false); setEditing(null); }}>취소</button>
              </div>
            </>
          ) : (
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
          )}
        </div>
      )}

      <input style={{ ...S.input, marginBottom: 12 }} placeholder="품명 검색" value={search} onChange={e => setSearch(e.target.value)} />

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {sortOptions.map(s => (
          <button key={s.id} onClick={() => setSortMode(s.id)} style={{ border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", backgroundColor: sortMode === s.id ? C.accent : C.bg, color: sortMode === s.id ? "#fff" : C.muted, fontFamily: "inherit" }}>{s.label}</button>
        ))}
      </div>

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
//  회원 교적관리 (엑셀식 표)
// ════════════════════════════════════════════════════════════════════
function MemberRegistry({ members, setMembers, w }) {
  const mob = isMob(w);
  const [rows, setRows] = useState(members);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);

  useEffect(() => { setRows(members); }, [members]);

  // 🤖 표 컬럼 (번호 제외, 요청하신 순서 그대로)
  const cols = [
    { key: "birthYear1", label: "출생년도", w: 80 },
    { key: "visit", label: "심방여부", w: 70, type: "check" },
    { key: "group1", label: "회원구분1", w: 90 },
    { key: "group2", label: "회원구분2", w: 90 },
    { key: "name", label: "이름", w: 90 },
    { key: "phone", label: "연락처", w: 120 },
    { key: "address", label: "주소", w: 160 },
    { key: "birthYear2", label: "출생년도", w: 80 },
    { key: "birthMonth", label: "월", w: 50 },
    { key: "birthDay", label: "일", w: 50 },
    { key: "husband", label: "남편", w: 90 },
    { key: "childBirth", label: "자녀(출생년도)", w: 120 },
    { key: "note", label: "비고", w: 120 },
    { key: "childbirth", label: "출산", w: 80 },
    { key: "celebrate", label: "축하내용", w: 140 },
  ];

  const blankRow = () => {
    const r = { id: Date.now() + Math.random() };
    cols.forEach(c => { r[c.key] = c.type === "check" ? false : ""; });
    return r;
  };

  const commit = (u) => { setRows(u); setMembers(u); saveSynced("order-members", u); };

  const addRow = () => {
    const nr = blankRow();
    const u = [...rows, nr];
    commit(u);
    setForm(nr); setEditingId(nr.id);
  };
  const removeRow = (id) => {
    if (!window.confirm("이 회원을 삭제할까요?")) return;
    const u = rows.filter(r => r.id !== id);
    commit(u);
    if (editingId === id) { setEditingId(null); setForm(null); }
  };

  const openEdit = (r) => { setForm({ ...r }); setEditingId(r.id); };
  const closeEdit = () => { setEditingId(null); setForm(null); };
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const saveEdit = () => {
    if (!form) return;
    const u = rows.map(r => r.id === editingId ? { ...form } : r);
    commit(u);
    closeEdit();
  };

  // 🤖 엑셀 붙여넣기 — 표 컬럼 순서와 동일하게 매칭
  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text");
    if (!text || !text.includes("\t")) return;
    e.preventDefault();
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
    const yes = (v) => { const t = (v || "").trim(); return t === "O" || t === "o" || t === "예"; };
    const parsed = lines.map(line => {
      const c = line.split("\t");
      const r = { id: Date.now() + Math.random() };
      cols.forEach((col, i) => {
        const raw = (c[i] || "").trim();
        r[col.key] = col.type === "check" ? yes(raw) : raw;
      });
      return r;
    }).filter(r => r.name && r.name !== "이름");
    if (parsed.length === 0) return;
    commit([...rows, ...parsed]);
  };

  const filtered = rows.filter(r => r.name.includes(search)).sort((a, b) => a.name.localeCompare(b.name, "ko"));
  const editIndex = editingId ? filtered.findIndex(r => r.id === editingId) : -1;
  const goPrev = () => { if (editIndex > 0) openEdit(filtered[editIndex - 1]); };
  const goNext = () => { if (editIndex >= 0 && editIndex < filtered.length - 1) openEdit(filtered[editIndex + 1]); };

  const exportExcel = () => {
    const header = ["번호", ...cols.map(c => c.label)];
    const escapeCell = (v) => {
      const s = String(v == null ? "" : v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const body = filtered.map((r, i) => [i + 1, ...cols.map(c => {
      if (c.type === "check") return r[c.key] ? "O" : "";
      return r[c.key] || "";
    })].map(escapeCell).join(","));
    const csv = [header.join(","), ...body].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); // 🤖 BOM 포함 — 엑셀에서 한글 깨짐 방지
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `회원교적부_${todayStr()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Title eyebrow="Registry" title="회원 교적관리" sub="표에서 이름을 클릭하면 팝업으로 세부 정보를 입력/수정할 수 있어요" w={w}
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

      {/* 🤖 팝업(모달) 수정 화면 */}
      {form && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, backgroundColor: "rgba(15,46,79,0.45)", display: "flex", alignItems: mob ? "flex-end" : "center", justifyContent: "center", padding: mob ? 0 : 20 }} onClick={closeEdit}>
          <div
            style={{ backgroundColor: C.surface, borderRadius: mob ? "16px 16px 0 0" : 16, padding: mob ? "20px 18px" : "28px 30px", maxWidth: 640, width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(15,46,79,0.35)" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{form.name || "새 회원"} 정보</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={goPrev} disabled={editIndex <= 0} title="이전 회원"
                  style={{ border: `1px solid ${C.border}`, backgroundColor: C.surface, color: editIndex <= 0 ? C.border : C.ink, width: 34, height: 34, borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: editIndex <= 0 ? "default" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
                <span style={{ fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>{editIndex + 1} / {filtered.length}</span>
                <button onClick={goNext} disabled={editIndex < 0 || editIndex >= filtered.length - 1} title="다음 회원"
                  style={{ border: `1px solid ${C.border}`, backgroundColor: C.surface, color: (editIndex < 0 || editIndex >= filtered.length - 1) ? C.border : C.ink, width: 34, height: 34, borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: (editIndex < 0 || editIndex >= filtered.length - 1) ? "default" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>
                <button onClick={closeEdit} style={{ border: "none", backgroundColor: C.bg, color: C.muted, width: 32, height: 32, borderRadius: 8, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>
            </div>

            <Grid cols={3} w={w}>
              <Field label="이름 *"><input style={S.input} value={form.name} onChange={e => setF("name", e.target.value)} placeholder="홍길동" /></Field>
              <Field label="연락처"><input style={S.input} value={form.phone} onChange={e => setF("phone", e.target.value)} placeholder="010-0000-0000" /></Field>
              <Field label="심방여부">
                <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 4px", cursor: "pointer" }}>
                  <input type="checkbox" checked={!!form.visit} onChange={e => setF("visit", e.target.checked)} style={{ width: 17, height: 17, cursor: "pointer" }} />
                  <span style={{ fontSize: 13 }}>심방함</span>
                </label>
              </Field>
            </Grid>
            <Grid cols={3} w={w}>
              <Field label="회원구분1"><input style={S.input} value={form.group1} onChange={e => setF("group1", e.target.value)} /></Field>
              <Field label="회원구분2"><input style={S.input} value={form.group2} onChange={e => setF("group2", e.target.value)} /></Field>
              <Field label="출생년도"><input style={S.input} value={form.birthYear1} onChange={e => setF("birthYear1", e.target.value)} placeholder="1990" /></Field>
            </Grid>
            <Field label="주소"><input style={{ ...S.input, marginBottom: 12 }} value={form.address} onChange={e => setF("address", e.target.value)} placeholder="주소" /></Field>

            <Grid cols={3} w={w}>
              <Field label="출생년도(2)"><input style={S.input} value={form.birthYear2} onChange={e => setF("birthYear2", e.target.value)} placeholder="1990" /></Field>
              <Field label="월"><input style={S.input} value={form.birthMonth} onChange={e => setF("birthMonth", e.target.value)} placeholder="01" /></Field>
              <Field label="일"><input style={S.input} value={form.birthDay} onChange={e => setF("birthDay", e.target.value)} placeholder="01" /></Field>
            </Grid>
            <Grid cols={2} w={w}>
              <Field label="남편"><input style={S.input} value={form.husband} onChange={e => setF("husband", e.target.value)} placeholder="남편 이름" /></Field>
              <Field label="자녀(출생년도)"><input style={S.input} value={form.childBirth} onChange={e => setF("childBirth", e.target.value)} placeholder="예: 2015, 2018" /></Field>
            </Grid>
            <Grid cols={3} w={w}>
              <Field label="출산"><input style={S.input} value={form.childbirth} onChange={e => setF("childbirth", e.target.value)} /></Field>
              <Field label="축하내용"><input style={S.input} value={form.celebrate} onChange={e => setF("celebrate", e.target.value)} placeholder="예: 결혼, 출산 등" /></Field>
              <Field label="비고"><input style={S.input} value={form.note} onChange={e => setF("note", e.target.value)} /></Field>
            </Grid>

            <div style={{ display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap", marginTop: 6 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={S.btn()} onClick={saveEdit}>저장</button>
                <button style={S.btnGhost} onClick={closeEdit}>닫기</button>
              </div>
              <button style={{ ...S.btn(C.red), padding: "10px 16px" }} onClick={() => removeRow(editingId)}>회원 삭제</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <label style={S.label}>📋 엑셀에서 복사한 표 붙여넣기 (출생년도, 심방여부(O), 회원구분1, 회원구분2, 이름, 연락처, 주소, 출생년도, 월, 일, 남편, 자녀(출생년도), 비고, 출산, 축하내용 순서)</label>
        <textarea onPaste={handlePaste} placeholder="엑셀에서 해당 열들을 표 순서 그대로 드래그해서 복사한 뒤 여기에 Ctrl+V 하세요" style={{ ...S.textareaSmall, minHeight: 56 }} defaultValue="" />
      </div>

      <input style={{ ...S.input, marginBottom: 12, maxWidth: 280 }} placeholder="이름 검색" value={search} onChange={e => setSearch(e.target.value)} />

      <div style={{ ...S.card, padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 1380 }}>
          <thead>
            <tr style={{ backgroundColor: C.bg }}>
              <th style={{ padding: "9px 6px", textAlign: "center", fontWeight: 700, color: C.muted, fontSize: 11, borderBottom: `1px solid ${C.border}`, minWidth: 36 }}>번호</th>
              {cols.map((c, i) => <th key={c.key + i} style={{ padding: "9px 6px", textAlign: "left", fontWeight: 700, color: C.muted, fontSize: 11, borderBottom: `1px solid ${C.border}`, minWidth: c.w }}>{c.label}</th>)}
              <th style={{ padding: "9px 6px", borderBottom: `1px solid ${C.border}`, minWidth: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={cols.length + 2} style={{ padding: 40, textAlign: "center", color: C.muted }}>등록된 회원이 없습니다. 위에서 붙여넣거나 + 회원 추가를 눌러보세요.</td></tr>
              : filtered.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: editingId === r.id ? C.accentLight : "transparent" }}>
                  <td style={{ padding: "9px 6px", textAlign: "center", color: C.muted, fontWeight: 600 }}>{i + 1}</td>
                  {cols.map((c, ci) => (
                    <td key={c.key + ci} style={{ padding: "9px 6px", cursor: c.key === "name" ? "pointer" : "default", fontWeight: c.key === "name" ? 700 : 400, color: c.key === "name" ? C.accent : C.ink }}
                      onClick={c.key === "name" ? () => openEdit(r) : undefined}>
                      {c.type === "check"
                        ? (r[c.key] ? <span style={{ color: C.green, fontWeight: 800 }}>✓</span> : <span style={{ color: C.border }}>–</span>)
                        : (r[c.key] || <span style={{ color: C.border }}>–</span>)}
                    </td>
                  ))}
                  <td style={{ padding: "6px" }}>
                    <button style={{ ...S.btn(C.red), padding: "3px 8px", fontSize: 10 }} onClick={() => removeRow(r.id)}>×</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
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
                <CompactSelect value={memberId} onChange={setMemberId} options={memberOptions} placeholder="회원을 선택하세요" />
              </Field>
              <Field label="물품 선택">
                <CompactSelect value={pickProduct} onChange={setPickProduct} options={productOptions} placeholder="물품을 선택하세요" />
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
  const [view, setView] = useState("list"); // list | aggregate
  const [filter, setFilter] = useState("전체");
  const [roundFilter, setRoundFilter] = useState(currentRound ? currentRound.name : "전체");
  const [sortMode, setSortMode] = useState("none"); // none | priceHigh | priceLow
  const [expanded, setExpanded] = useState(null);
  const [aggTab, setAggTab] = useState("product");
  const [aggSort, setAggSort] = useState("priceHigh");

  const togglePaid = (id) => {
    const u = orders.map(o => o.id === id ? { ...o, paid: !o.paid, paidAmount: !o.paid ? o.totalPrice : 0 } : o);
    setOrders(u); saveSynced("order-orders", u);
  };
  const updatePaidAmount = (id, amt) => {
    const u = orders.map(o => o.id === id ? { ...o, paidAmount: Number(amt), paid: Number(amt) >= o.totalPrice } : o);
    setOrders(u); saveSynced("order-orders", u);
  };
  const remove = (id) => { if (!window.confirm("주문을 삭제할까요?")) return; const u = orders.filter(o => o.id !== id); setOrders(u); saveSynced("order-orders", u); };

  const roundOptions = [{ value: "전체", label: "전체 차수" }, ...rounds.map(r => ({ value: r.name, label: r.name + (r.active ? " (진행 중)" : "") }))];

  const byRound = orders.filter(o => {
    if (roundFilter === "전체") return true;
    const r = rounds.find(rr => rr.name === roundFilter);
    return r && o.roundId === r.id;
  });
  const byStatus = byRound.filter(o => filter === "전체" ? true : filter === "입금완료" ? o.paid : !o.paid);

  const sortList = (list) => {
    if (sortMode === "priceHigh") return [...list].sort((a, b) => b.totalPrice - a.totalPrice);
    if (sortMode === "priceLow") return [...list].sort((a, b) => a.totalPrice - b.totalPrice);
    return [...list].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  };
  const filtered = sortList(byStatus);

  const totalPrice = byRound.reduce((s, o) => s + o.totalPrice, 0);
  const totalCost = byRound.reduce((s, o) => s + o.totalCost, 0);
  const totalMargin = byRound.reduce((s, o) => s + o.totalMargin, 0);
  const totalPaid = byRound.reduce((s, o) => s + (o.paidAmount || 0), 0);
  const totalUnpaid = totalPrice - totalPaid;

  const roundName = (roundId) => rounds.find(r => r.id === roundId)?.name || "차수 미지정";

  // ── 집계 (구 보고서) ──
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
  byRound.forEach(o => {
    if (!memberAgg[o.memberName]) memberAgg[o.memberName] = { name: o.memberName, qty: 0, cost: 0, price: 0, margin: 0, paid: 0 };
    memberAgg[o.memberName].qty += o.items.reduce((s, i) => s + i.qty, 0);
    memberAgg[o.memberName].cost += o.totalCost;
    memberAgg[o.memberName].price += o.totalPrice;
    memberAgg[o.memberName].margin += o.totalMargin;
    memberAgg[o.memberName].paid += o.paidAmount || 0;
  });
  const memberList = sortAgg(Object.values(memberAgg));

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

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[{ id: "list", label: "📋 주문 내역" }, { id: "aggregate", label: "📊 집계 보기" }].map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{ border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", backgroundColor: view === t.id ? C.accent : C.bg, color: view === t.id ? "#fff" : C.muted, fontFamily: "inherit" }}>{t.label}</button>
        ))}
      </div>

      {view === "list" ? (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {["전체","입금완료","미입금"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", backgroundColor: filter === f ? C.accent : C.bg, color: filter === f ? "#fff" : C.muted, fontFamily: "inherit" }}>{f}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {[{ id: "none", label: "기본순" }, { id: "priceHigh", label: "금액 높은순" }, { id: "priceLow", label: "금액 낮은순" }].map(s => (
              <button key={s.id} onClick={() => setSortMode(s.id)} style={{ border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", backgroundColor: sortMode === s.id ? C.navy : C.bg, color: sortMode === s.id ? "#fff" : C.muted, fontFamily: "inherit" }}>{s.label}</button>
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
                      {roundFilter === "전체" && <div style={{ fontSize: 11, color: C.accent, marginTop: 2 }}>{roundName(o.roundId)}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: C.accent }}>{won(o.totalPrice)}</div>
                      <div style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>마진 {won(o.totalMargin)}</div>
                      {!o.paid && o.paidAmount > 0 && <div style={{ fontSize: 11, color: C.red }}>미수 {won(o.totalPrice - o.paidAmount)}</div>}
                    </div>
                  </div>

                  {expanded === o.id && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 14 }}>
                        <thead><tr>{["물품","수량","매입가","판매가","마진"].map(h => <th key={h} style={{ textAlign: h === "물품" ? "left" : "right", padding: "6px 8px", color: C.muted, fontSize: 11, fontWeight: 700 }}>{h}</th>)}</tr></thead>
                        <tbody>
                          {o.items.map((it, i) => (
                            <tr key={i}>
                              <td style={{ padding: "6px 8px" }}>{it.name}</td>
                              <td style={{ padding: "6px 8px", textAlign: "right" }}>{it.qty}개</td>
                              <td style={{ padding: "6px 8px", textAlign: "right", color: C.muted }}>{won(it.cost * it.qty)}</td>
                              <td style={{ padding: "6px 8px", textAlign: "right" }}>{won(it.price * it.qty)}</td>
                              <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: C.green }}>{won((it.price - it.cost) * it.qty)}</td>
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
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[{ id: "product", label: "📦 물품별" }, { id: "member", label: "👤 인원별" }].map(t => (
              <button key={t.id} onClick={() => setAggTab(t.id)} style={{ border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", backgroundColor: aggTab === t.id ? C.accent : C.bg, color: aggTab === t.id ? "#fff" : C.muted, fontFamily: "inherit" }}>{t.label}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {aggSortOptions.map(s => (
              <button key={s.id} onClick={() => setAggSort(s.id)} style={{ border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", backgroundColor: aggSort === s.id ? C.navy : C.bg, color: aggSort === s.id ? "#fff" : C.muted, fontFamily: "inherit" }}>{s.label}</button>
            ))}
          </div>

          {aggTab === "product" && (
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
                    <td style={{ padding: "11px 14px", textAlign: "right" }}>{productList.reduce((s,p)=>s+p.qty,0)}개</td>
                    <td style={{ padding: "11px 14px", textAlign: "right" }}>{won(totalCost)}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right" }}>{won(totalPrice)}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right", color: C.green }}>{won(totalMargin)}</td>
                  </tr></tfoot>
                )}
              </table>
            </div>
          )}

          {aggTab === "member" && (
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
                    <td style={{ padding: "11px 14px", textAlign: "right" }}>{memberList.reduce((s,m)=>s+m.qty,0)}개</td>
                    <td style={{ padding: "11px 14px", textAlign: "right" }}>{won(totalPrice)}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right", color: C.green }}>{won(totalPaid)}</td>
                    <td style={{ padding: "11px 14px", textAlign: "right", color: C.red }}>{won(totalUnpaid)}</td>
                  </tr></tfoot>
                )}
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  차수 관리 (간소화 — 새 차수 시작 + 현재 차수 선택만)
// ════════════════════════════════════════════════════════════════════
function RoundManager({ rounds, setRounds, orders, products, w }) {
  const mob = isMob(w);
  const thisYear = new Date().getFullYear();
  const [newYear, setNewYear] = useState(thisYear);
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
  const [newWeek, setNewWeek] = useState("첫째주");
  const [dateFilter, setDateFilter] = useState("latest"); // latest | oldest | manual

  // 🤖 차수별 판매물품 선택 팝업 — pickerTarget: null=신규 차수 생성, roundId=기존 차수 물품 수정
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null);
  const [pickerSelected, setPickerSelected] = useState([]);
  const [pickerSearch, setPickerSearch] = useState("");

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
    setPickerOpen(true);
  };

  const openEditPicker = (round) => {
    setPickerSelected(round.productIds && round.productIds.length > 0 ? round.productIds : products.map(p => p.id));
    setPickerTarget(round.id);
    setPickerSearch("");
    setPickerOpen(true);
  };

  const togglePick = (id) => setPickerSelected(ps => ps.includes(id) ? ps.filter(x => x !== id) : [...ps, id]);
  const pickAll = () => setPickerSelected(products.map(p => p.id));
  const pickNone = () => setPickerSelected([]);

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
  const sortKeyOf = (r) => r.sortKey !== undefined ? r.sortKey : 0;

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

  const filteredPickerProducts = products.filter(p => p.name.includes(pickerSearch));

  return (
    <div>
      <Title eyebrow="Rounds" title="차수 관리" sub="연도/월/주차를 선택해서 새 차수를 만들고, 현재 진행할 차수만 선택하면 돼요" w={w} />

      {/* 🤖 차수별 판매물품 선택 팝업 */}
      {pickerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, backgroundColor: "rgba(15,46,79,0.45)", display: "flex", alignItems: mob ? "flex-end" : "center", justifyContent: "center", padding: mob ? 0 : 20 }} onClick={() => setPickerOpen(false)}>
          <div
            style={{ backgroundColor: C.surface, borderRadius: mob ? "16px 16px 0 0" : 16, padding: mob ? "20px 18px" : "26px 28px", maxWidth: 520, width: "100%", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(15,46,79,0.35)" }}
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

            <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, marginBottom: 8 }}>{pickerSelected.length}개 선택됨 (전체 {products.length}개)</div>

            <div style={{ flex: 1, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 16 }}>
              {filteredPickerProducts.length === 0
                ? <div style={{ padding: 30, textAlign: "center", color: C.muted, fontSize: 13 }}>등록된 물품이 없습니다</div>
                : filteredPickerProducts.map(p => (
                  <label key={p.id} onClick={() => togglePick(p.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", backgroundColor: pickerSelected.includes(p.id) ? C.accentLight : "transparent" }}>
                    <input type="checkbox" readOnly checked={pickerSelected.includes(p.id)} style={{ width: 17, height: 17, cursor: "pointer" }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: C.muted }}>{won(p.price)}</span>
                  </label>
                ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btn(), flex: 1 }} onClick={confirmPicker}>{pickerTarget === null ? "이 물품으로 차수 시작" : "저장"}</button>
              <button style={S.btnGhost} onClick={() => setPickerOpen(false)}>취소</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ ...S.card, marginBottom: 20, backgroundColor: C.accentLight, border: `1.5px solid ${C.accent}` }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>🗓 새 차수 시작</div>
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
              style={{ ...S.card, opacity: dragIndex === idx ? 0.4 : 1, border: overIndex === idx && dragIndex !== idx ? `1.5px dashed ${C.accent}` : S.card.border, transition: "opacity 0.15s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {dateFilter === "manual" && <span title="드래그해서 순서 변경" style={{ cursor: "grab", color: C.muted, fontSize: 16, padding: "2px 4px", userSelect: "none" }}>☰</span>}
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{r.name}</span>
                  {r.active && <Badge text="진행 중" color={C.green} bg={C.greenLight} />}
                  <span style={{ fontSize: 12, color: C.muted }}>주문 {orderCountOf(r.id)}건</span>
                  <span style={{ fontSize: 12, color: C.muted }}>· 판매물품 {productCountOf(r)}개</span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button style={S.btnOutline} onClick={() => openEditPicker(r)}>📦 판매물품 설정</button>
                  {r.active ? (
                    <button disabled style={{ ...S.btn(C.green), padding: "8px 14px", fontSize: 12, opacity: 0.6, cursor: "default" }}>✓ 선택됨</button>
                  ) : (
                    <button style={{ ...S.btn(C.green), padding: "8px 14px", fontSize: 12 }} onClick={() => setActiveRound(r.id)}>이 차수로 선택</button>
                  )}
                  <button style={{ ...S.btn(C.red), padding: "8px 14px", fontSize: 12 }} onClick={() => removeRound(r.id)}>삭제</button>
                </div>
              </div>
            </div>
          ))}
      </div>
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
  const [rounds, setRounds] = useState(() => load("order-rounds", []));
  const [syncStatus, setSyncStatus] = useState("loading");
  const [showUploadPrompt, setShowUploadPrompt] = useState(false);

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
      if (data.rounds) { setRounds(data.rounds); save("order-rounds", data.rounds); }
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
    { id: "members", label: "회원 교적관리", icon: "📇" },
  ];
  const goTo = (id) => { setPage(id); setMenuOpen(false); };

  const renderPage = () => {
    switch (page) {
      case "entry": return <OrderEntry members={members} products={products} orders={orders} setOrders={setOrders} currentRound={currentRound} w={w} />;
      case "orders": return <OrderList orders={orders} setOrders={setOrders} rounds={rounds} currentRound={currentRound} w={w} />;
      case "rounds": return <RoundManager rounds={rounds} setRounds={setRounds} orders={orders} products={products} w={w} />;
      case "products": return <ProductManager products={products} setProducts={setProducts} w={w} />;
      case "members": return <MemberRegistry members={members} setMembers={setMembers} w={w} />;
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
        <>
          <div style={{ position: "sticky", top: 0, zIndex: 200, backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
            <div style={{ fontWeight: 900, fontSize: 15, color: C.accent }}>✝️ 로이스6 주문관리</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SyncBadge status={syncStatus} />
              <button onClick={() => setMenuOpen(true)} style={{ border: "none", backgroundColor: "transparent", fontSize: 20, cursor: "pointer" }}>☰</button>
            </div>
          </div>
          {menuOpen && (
            <div style={{ position: "fixed", inset: 0, zIndex: 300, backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setMenuOpen(false)}>
              <div style={{ position: "absolute", top: 0, left: 0, width: 250, height: "100%", backgroundColor: C.surface, padding: "20px 12px" }} onClick={e => e.stopPropagation()}>
                <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 20, padding: "0 8px", color: C.accent }}>✝️ 로이스6 주문관리</div>
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
              <div style={{ fontSize: isTab(w) ? 14 : 16, fontWeight: 900, marginBottom: 8 }}>사업물품 주문관리</div>
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
