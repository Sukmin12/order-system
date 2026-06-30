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

// ── 구글 시트 동기화 ─────────────────────────────────────────────────
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbwTlJ2_ygAWMLTU2L0nXlEw7aF6wcPh6yKUvNmlJybItkUiHp_XINLCNtsk_qTzy2P1xw/exec";

// localStorage 키 ↔ 구글시트 탭 이름 매핑
const SHEET_MAP = {
  "order-members": "members",
  "order-products": "products",
  "order-rounds": "rounds",
  "order-orders": "orders",
};

// 🤖 로컬 저장 + 구글시트 전송을 한 번에 처리
const saveSynced = (key, value) => {
  save(key, value); // 로컬에는 즉시 저장 (오프라인에서도 끊김 없이 동작)
  const sheetName = SHEET_MAP[key];
  if (!sheetName) return;
  fetch(SHEET_API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sheet: sheetName, rows: value }),
  }).catch(() => {}); // 네트워크 실패해도 로컬 데이터는 보존되므로 조용히 무시
};

// 🤖 구글시트에서 전체 데이터 불러오기
const fetchAllFromSheet = async () => {
  try {
    const res = await fetch(SHEET_API_URL);
    const json = await res.json();
    if (json.result !== "success") return null;
    return json.data; // { members, products, rounds, orders }
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

// 🤖 구글시트 동기화 상태 표시
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

      <div style={{ display: "inline-flex", alignItems: "center", gap: 12, backgroundColor: C.navy, color: "#fff", padding: mob ? "12px 18px" : "14px 24px", borderRadius: 14, marginBottom: 18 }}>
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
//  회원 관리
// ════════════════════════════════════════════════════════════════════
function MemberManager({ members, setMembers, orders, rounds, w }) {
  const mob = isMob(w);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const blank = { name: "", phone: "", note: "" };
  const [form, setForm] = useState(blank);
  const setF = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("position");

  const blankRow = () => ({ rowId: Date.now() + Math.random(), name: "", phone: "", note: "" });
  const [rows, setRows] = useState([blankRow()]);
  const setRow = (rowId, f, v) => setRows(rows.map(r => r.rowId === rowId ? { ...r, [f]: v } : r));
  const addRow = () => setRows([...rows, blankRow()]);
  const removeRow = (rowId) => setRows(rows.length === 1 ? rows : rows.filter(r => r.rowId !== rowId));

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text");
    if (!text || !text.includes("\t")) return;
    e.preventDefault();
    const parsedRows = text.split(/\r?\n/).filter(line => line.trim() !== "").map(line => {
      const cols = line.split("\t");
      return { rowId: Date.now() + Math.random(), name: (cols[0] || "").trim(), phone: (cols[1] || "").trim(), note: (cols[2] || "").trim() };
    }).filter(r => r.name && r.name !== "이름");
    if (parsedRows.length === 0) return;
    setRows(parsedRows);
  };

  const findDuplicateMember = (name, excludeId) => {
    const n = name.trim();
    if (!n) return null;
    return members.find(m => m.name.trim() === n && m.id !== excludeId) || null;
  };

  const positionRank = (note) => {
    const n = (note || "").trim();
    if (n === "회장" || n.includes("회장")) return 0;
    if (n === "총무" || n.includes("총무")) return 1;
    if (n.includes("부장")) return 2;
    return 3;
  };

  const sortByName = (list) => [...list].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  const sortList = (list) => {
    if (sortMode === "asc") return [...list].sort((a, b) => a.name.localeCompare(b.name, "ko"));
    if (sortMode === "desc") return [...list].sort((a, b) => b.name.localeCompare(a.name, "ko"));
    return [...list].sort((a, b) => {
      const r = positionRank(a.note) - positionRank(b.note);
      if (r !== 0) return r;
      return a.name.localeCompare(b.name, "ko");
    });
  };

  const persistMember = (data) => {
    if (!data.name) return members;
    const cleaned = { ...data, note: data.note.trim() || "회원" };
    const u = sortByName(members.map(m => m.id === editing ? { ...cleaned, id: editing } : m));
    setMembers(u); saveSynced("order-members", u);
    return u;
  };

  const saveMember = () => {
    if (!form.name) return;
    const data = { ...form, note: form.note.trim() || "회원" };
    let u;
    if (editing) {
      u = members.map(m => m.id === editing ? { ...data, id: editing } : m);
      setEditing(null);
    } else {
      u = [...members, { ...data, id: Date.now() }];
    }
    u = sortByName(u);
    setMembers(u); saveSynced("order-members", u);
    setForm(blank); setAdding(false);
  };

  const saveBulk = () => {
    const valid = rows.filter(r => r.name.trim());
    if (valid.length === 0) return;
    const newMembers = valid.map(r => ({ id: Date.now() + Math.random(), name: r.name.trim(), phone: r.phone.trim(), note: r.note.trim() || "회원" }));
    const u = sortByName([...members, ...newMembers]);
    setMembers(u); saveSynced("order-members", u);
    setRows([blankRow()]); setAdding(false);
  };

  const startEdit = (m) => { setForm({ name: m.name, phone: m.phone, note: m.note }); setEditing(m.id); setAdding(true); };
  const remove = (id) => { if (!window.confirm("삭제할까요?")) return; const u = members.filter(m => m.id !== id); setMembers(u); saveSynced("order-members", u); if (editing === id) { setEditing(null); setAdding(false); setForm(blank); } };
  const filtered = sortList(members.filter(m => m.name.includes(search)));

  const roundName = (roundId) => rounds.find(r => r.id === roundId)?.name || "차수 미지정";
  const memberOrders = editing ? orders.filter(o => o.memberId === editing) : [];
  const historyByRound = [];
  memberOrders.forEach(o => {
    let group = historyByRound.find(g => g.roundId === o.roundId);
    if (!group) { group = { roundId: o.roundId, roundName: roundName(o.roundId), items: [], totalPrice: 0, paidAmount: 0 }; historyByRound.push(group); }
    o.items.forEach(it => {
      const existing = group.items.find(i => i.name === it.name);
      if (existing) existing.qty += it.qty;
      else group.items.push({ name: it.name, qty: it.qty });
    });
    group.totalPrice += o.totalPrice;
    group.paidAmount += o.paidAmount || 0;
  });
  const memberTotalPrice = memberOrders.reduce((s, o) => s + o.totalPrice, 0);
  const memberTotalQty = memberOrders.reduce((s, o) => s + o.items.reduce((s2, i) => s2 + i.qty, 0), 0);

  const currentIndex = editing ? filtered.findIndex(m => m.id === editing) : -1;
  const goPrev = () => {
    if (currentIndex <= 0) return;
    persistMember(form);
    startEdit(filtered[currentIndex - 1]);
  };
  const goNext = () => {
    if (currentIndex < 0 || currentIndex >= filtered.length - 1) return;
    persistMember(form);
    startEdit(filtered[currentIndex + 1]);
  };

  const sortOptions = [
    { id: "position", label: "직분 우선순" },
    { id: "asc", label: "가나다 오름차순" },
    { id: "desc", label: "가나다 내림차순" },
  ];

  return (
    <div>
      <Title eyebrow="Members" title="회원 관리" sub="회원 카드를 클릭하면 수정할 수 있어요" w={w}
        action={<button style={S.btn()} onClick={() => { setForm(blank); setRows([blankRow()]); setEditing(null); setAdding(!adding); }}>+ 회원 추가</button>} />

      <div style={{ display: "inline-flex", alignItems: "center", gap: 12, backgroundColor: C.accent, color: "#fff", padding: mob ? "12px 18px" : "14px 24px", borderRadius: 14, marginBottom: 18 }}>
        <span style={{ fontSize: mob ? 22 : 26 }}>👤</span>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.85 }}>등록된 회원</div>
          <div style={{ fontSize: mob ? 20 : 24, fontWeight: 900 }}>{members.length}명</div>
        </div>
      </div>

      {adding && (
        <div style={{ ...S.card, marginBottom: 18, backgroundColor: C.accentLight, border: `1.5px solid ${C.accent}` }}>
          {editing ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 17 }}>{form.name} 정보</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={goPrev} disabled={currentIndex <= 0} title="이전 회원"
                    style={{ border: `1px solid ${C.border}`, backgroundColor: C.surface, color: currentIndex <= 0 ? C.border : C.ink, width: 34, height: 34, borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: currentIndex <= 0 ? "default" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ←
                  </button>
                  <span style={{ fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>{currentIndex + 1} / {filtered.length}</span>
                  <button onClick={goNext} disabled={currentIndex >= filtered.length - 1} title="다음 회원"
                    style={{ border: `1px solid ${C.border}`, backgroundColor: C.surface, color: currentIndex >= filtered.length - 1 ? C.border : C.ink, width: 34, height: 34, borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: currentIndex >= filtered.length - 1 ? "default" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    →
                  </button>
                  <button onClick={() => { setAdding(false); setEditing(null); setForm(blank); }}
                    style={{ border: "none", backgroundColor: C.surface, color: C.muted, width: 32, height: 32, borderRadius: 8, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ×
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: C.surface, borderRadius: 12, padding: mob ? 16 : 20, border: `1px solid ${C.border}`, marginBottom: 16 }}>
                <div style={{ fontWeight: 800, marginBottom: 14 }}>✏️ 회원 정보 수정</div>
                <Grid cols={3} w={w}>
                  <Field label="이름 *"><input style={S.input} value={form.name} onChange={e => setF("name", e.target.value)} placeholder="홍길동" /></Field>
                  <Field label="연락처"><input style={S.input} value={form.phone} onChange={e => setF("phone", e.target.value)} placeholder="010-0000-0000" /></Field>
                  <Field label="메모"><input style={S.input} value={form.note} onChange={e => setF("note", e.target.value)} placeholder="구역, 직분 등" /></Field>
                </Grid>
                {findDuplicateMember(form.name, editing) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: C.yellowLight, color: C.yellow, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                    ⚠️ 이미 같은 이름의 회원이 있어요 — 동명이인인지 확인해주세요
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={S.btn()} onClick={saveMember}>수정 저장</button>
                  <button style={S.btnGhost} onClick={() => { setAdding(false); setEditing(null); setForm(blank); }}>닫기</button>
                </div>
              </div>

              <div style={{ backgroundColor: C.surface, borderRadius: 12, padding: mob ? 16 : 20, border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>🛒 구매 이력</div>
                  <div style={{ fontSize: 13, color: C.muted }}>누적 <strong style={{ color: C.ink }}>{memberTotalQty}개</strong> · <strong style={{ color: C.accent }}>{won(memberTotalPrice)}</strong></div>
                </div>
                <div style={{ height: 1, backgroundColor: C.border, margin: "12px 0 16px" }} />
                {historyByRound.length === 0
                  ? <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "30px 0" }}>구매 이력이 없습니다</div>
                  : (
                    <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
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
                  )}
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>새 회원 등록</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>여러 명을 한 번에 입력하고 저장할 수 있어요</div>

              <div style={{ marginBottom: 18 }}>
                <label style={S.label}>📋 엑셀에서 복사한 표 붙여넣기 (이름, 연락처, 메모 순서)</label>
                <textarea
                  onPaste={handlePaste}
                  placeholder="엑셀에서 이름 / 연락처 / 메모 칸을 드래그해서 복사한 뒤 여기에 Ctrl+V 하세요"
                  style={{ ...S.textareaSmall, minHeight: 64 }}
                  defaultValue=""
                />
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>붙여넣으면 아래 표가 자동으로 채워져요. 채워진 내용은 직접 수정할 수 있어요.</div>
              </div>

              {rows.map((r, i) => (
                <div key={r.rowId} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: mob ? "wrap" : "nowrap" }}>
                    <div style={{ flex: mob ? "1 1 100%" : 2, minWidth: mob ? "auto" : 0 }}>
                      {i === 0 && <label style={S.label}>이름 *</label>}
                      <input style={S.input} value={r.name} onChange={e => setRow(r.rowId, "name", e.target.value)} placeholder="홍길동" />
                    </div>
                    <div style={{ flex: mob ? "1 1 45%" : 2, minWidth: mob ? "auto" : 0 }}>
                      {i === 0 && <label style={S.label}>연락처</label>}
                      <input style={S.input} value={r.phone} onChange={e => setRow(r.rowId, "phone", e.target.value)} placeholder="010-0000-0000" />
                    </div>
                    <div style={{ flex: mob ? "1 1 45%" : 2, minWidth: mob ? "auto" : 0 }}>
                      {i === 0 && <label style={S.label}>메모</label>}
                      <input style={S.input} value={r.note} onChange={e => setRow(r.rowId, "note", e.target.value)} placeholder="구역, 직분 등" />
                    </div>
                    <button style={{ ...S.btn(C.red), padding: "9px 12px", flexShrink: 0 }} onClick={() => removeRow(r.rowId)} disabled={rows.length === 1}>×</button>
                  </div>
                  {findDuplicateMember(r.name, null) && (
                    <div style={{ fontSize: 11, color: C.yellow, marginTop: 4, fontWeight: 600 }}>
                      ⚠️ 이미 등록된 이름과 같아요 — 동명이인인지 확인해주세요
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

      <input style={{ ...S.input, marginBottom: 12 }} placeholder="이름 검색" value={search} onChange={e => setSearch(e.target.value)} />

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {sortOptions.map(s => (
          <button key={s.id} onClick={() => setSortMode(s.id)} style={{ border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", backgroundColor: sortMode === s.id ? C.accent : C.bg, color: sortMode === s.id ? "#fff" : C.muted, fontFamily: "inherit" }}>{s.label}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
        {filtered.length === 0
          ? <div style={{ ...S.card, gridColumn: "1/-1", textAlign: "center", color: C.muted }}>등록된 회원이 없습니다</div>
          : filtered.map(m => {
            const rank = positionRank(m.note);
            return (
              <div key={m.id} style={{ ...S.card, padding: 14, cursor: "pointer" }} onClick={() => startEdit(m)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800, fontSize: 15 }}>{m.name}</span>
                      {rank < 3 && m.note && <Badge text={m.note} color={rank === 0 ? C.accent : rank === 1 ? C.navy : C.green} bg={rank === 0 ? C.accentLight : rank === 1 ? C.bg : C.greenLight} />}
                    </div>
                    {m.phone && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{m.phone}</div>}
                    {rank === 3 && m.note && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{m.note}</div>}
                  </div>
                  <button style={{ ...S.btn(C.red), padding: "4px 9px", fontSize: 10 }} onClick={e => { e.stopPropagation(); remove(m.id); }}>삭제</button>
                </div>
              </div>
            );
          })}
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
        <div style={{ display: "flex", alignItems: "center", gap: 14, backgroundColor: C.accent, color: "#fff", padding: mob ? "16px 18px" : "20px 26px", borderRadius: 16, marginBottom: 20 }}>
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
                <select style={S.select} value={memberId} onChange={e => setMemberId(e.target.value)}>
                  <option value="">회원을 선택하세요</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}{m.note ? ` (${m.note})` : ""}</option>)}
                </select>
              </Field>
              <div style={{ gridColumn: mob ? "auto" : "span 1" }}>
                <label style={S.label}>물품 선택</label>
                <select style={S.select} value={pickProduct} onChange={e => setPickProduct(e.target.value)}>
                  <option value="">물품을 선택하세요</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} — {won(p.price)}</option>)}
                </select>
              </div>
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
//  주문 리스트 (+ 입금관리)
// ════════════════════════════════════════════════════════════════════
function OrderList({ orders, setOrders, rounds, w }) {
  const mob = isMob(w);
  const [filter, setFilter] = useState("전체");
  const [roundFilter, setRoundFilter] = useState("전체");
  const [expanded, setExpanded] = useState(null);

  const togglePaid = (id) => {
    const u = orders.map(o => o.id === id ? { ...o, paid: !o.paid, paidAmount: !o.paid ? o.totalPrice : 0 } : o);
    setOrders(u); saveSynced("order-orders", u);
  };
  const updatePaidAmount = (id, amt) => {
    const u = orders.map(o => o.id === id ? { ...o, paidAmount: Number(amt), paid: Number(amt) >= o.totalPrice } : o);
    setOrders(u); saveSynced("order-orders", u);
  };
  const remove = (id) => { if (!window.confirm("주문을 삭제할까요?")) return; const u = orders.filter(o => o.id !== id); setOrders(u); saveSynced("order-orders", u); };

  const roundOptions = ["전체", ...rounds.map(r => r.name)];
  const byRound = orders.filter(o => {
    if (roundFilter === "전체") return true;
    const r = rounds.find(rr => rr.name === roundFilter);
    return r && o.roundId === r.id;
  });
  const filtered = byRound.filter(o => filter === "전체" ? true : filter === "입금완료" ? o.paid : !o.paid);
  const totalPrice = byRound.reduce((s, o) => s + o.totalPrice, 0);
  const totalPaid = byRound.reduce((s, o) => s + (o.paidAmount || 0), 0);
  const totalUnpaid = totalPrice - totalPaid;

  const roundName = (roundId) => rounds.find(r => r.id === roundId)?.name || "차수 미지정";

  return (
    <div>
      <Title eyebrow="Orders" title="주문 리스트" sub={`전체 ${orders.length}건`} w={w} />

      <div style={{ marginBottom: 14 }}>
        <label style={S.label}>차수 선택</label>
        <select style={{ ...S.select, maxWidth: mob ? "100%" : 280 }} value={roundFilter} onChange={e => setRoundFilter(e.target.value)}>
          {roundOptions.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

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
                  {roundFilter === "전체" && <div style={{ fontSize: 11, color: C.accent, marginTop: 2 }}>{roundName(o.roundId)}</div>}
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
function ReportPage({ orders, rounds, w }) {
  const mob = isMob(w);
  const [tab, setTab] = useState("product");
  const [roundFilter, setRoundFilter] = useState("전체");

  const roundOptions = ["전체", ...rounds.map(r => r.name)];
  const scoped = orders.filter(o => {
    if (roundFilter === "전체") return true;
    const r = rounds.find(rr => rr.name === roundFilter);
    return r && o.roundId === r.id;
  });

  const productAgg = {};
  scoped.forEach(o => o.items.forEach(it => {
    if (!productAgg[it.name]) productAgg[it.name] = { name: it.name, qty: 0, cost: 0, price: 0, margin: 0 };
    productAgg[it.name].qty += it.qty;
    productAgg[it.name].cost += it.cost * it.qty;
    productAgg[it.name].price += it.price * it.qty;
    productAgg[it.name].margin += (it.price - it.cost) * it.qty;
  }));
  const productList = Object.values(productAgg).sort((a, b) => b.price - a.price);

  const memberAgg = {};
  scoped.forEach(o => {
    if (!memberAgg[o.memberName]) memberAgg[o.memberName] = { name: o.memberName, qty: 0, cost: 0, price: 0, margin: 0, paid: 0 };
    memberAgg[o.memberName].qty += o.items.reduce((s, i) => s + i.qty, 0);
    memberAgg[o.memberName].cost += o.totalCost;
    memberAgg[o.memberName].price += o.totalPrice;
    memberAgg[o.memberName].margin += o.totalMargin;
    memberAgg[o.memberName].paid += o.paidAmount || 0;
  });
  const memberList = Object.values(memberAgg).sort((a, b) => b.price - a.price);

  const grandTotal = {
    qty: scoped.reduce((s, o) => s + o.items.reduce((s2, i) => s2 + i.qty, 0), 0),
    cost: scoped.reduce((s, o) => s + o.totalCost, 0),
    price: scoped.reduce((s, o) => s + o.totalPrice, 0),
    margin: scoped.reduce((s, o) => s + o.totalMargin, 0),
    paid: scoped.reduce((s, o) => s + (o.paidAmount || 0), 0),
  };

  const copyReport = () => {
    let text = `📦 로이스6 사업물품 주문 보고서 (${roundFilter === "전체" ? "전체 기간" : roundFilter})\n\n`;
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
      <Title eyebrow="Report" title="보고서" sub={roundFilter === "전체" ? "전체 기간 자동 집계" : `${roundFilter} 자동 집계`} w={w}
        action={<button style={S.btn(C.navy)} onClick={copyReport}>📋 보고서 복사</button>} />

      <div style={{ marginBottom: 18 }}>
        <label style={S.label}>차수 선택</label>
        <select style={{ ...S.select, maxWidth: mob ? "100%" : 280 }} value={roundFilter} onChange={e => setRoundFilter(e.target.value)}>
          {roundOptions.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

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
//  차수 관리 (+ 과거 주문 수동 입력)
// ════════════════════════════════════════════════════════════════════
function RoundManager({ rounds, setRounds, orders, setOrders, members, products, w }) {
  const mob = isMob(w);
  const [newRoundName, setNewRoundName] = useState("");
  const [pastOpen, setPastOpen] = useState(null);
  const [memberId, setMemberId] = useState("");
  const [items, setItems] = useState([]);
  const [pickProduct, setPickProduct] = useState("");
  const [pickQty, setPickQty] = useState(1);
  const [pastDate, setPastDate] = useState(todayStr());
  const [paid, setPaid] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);

  const startRound = () => {
    if (!newRoundName.trim()) return;
    const u = [...rounds.map(r => ({ ...r, active: false })), { id: Date.now(), name: newRoundName.trim(), active: true, createdAt: todayStr() }];
    setRounds(u); saveSynced("order-rounds", u);
    setNewRoundName("");
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

  const addItem = () => {
    if (!pickProduct) return;
    const product = products.find(p => p.id === Number(pickProduct));
    if (!product) return;
    const existing = items.find(c => c.productId === product.id);
    if (existing) setItems(items.map(c => c.productId === product.id ? { ...c, qty: c.qty + Number(pickQty) } : c));
    else setItems([...items, { productId: product.id, name: product.name, cost: Number(product.cost) || 0, price: Number(product.price) || 0, qty: Number(pickQty) }]);
    setPickProduct(""); setPickQty(1);
  };
  const removeItem = (productId) => setItems(items.filter(c => c.productId !== productId));
  const totalPrice = items.reduce((s, c) => s + c.price * c.qty, 0);
  const totalCost = items.reduce((s, c) => s + c.cost * c.qty, 0);

  const submitPastOrder = (roundId) => {
    if (!memberId || items.length === 0) return;
    const member = members.find(m => m.id === Number(memberId));
    const newOrder = {
      id: Date.now(),
      roundId,
      memberId: Number(memberId),
      memberName: member.name,
      items,
      totalCost,
      totalPrice,
      totalMargin: totalPrice - totalCost,
      paid,
      paidAmount: paid ? totalPrice : Number(paidAmount),
      date: pastDate,
    };
    const u = [...orders, newOrder];
    setOrders(u); saveSynced("order-orders", u);
    setItems([]); setMemberId(""); setPaid(false); setPaidAmount(0); setPastDate(todayStr());
  };

  const activeRound = rounds.find(r => r.active);

  return (
    <div>
      <Title eyebrow="Rounds" title="차수 관리" sub="매 회차(예: 6월 4째주 주문)를 만들고, 지난 기록도 차수별로 입력할 수 있어요" w={w} />

      <div style={{ ...S.card, marginBottom: 20, backgroundColor: C.accentLight, border: `1.5px solid ${C.accent}` }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>🗓 새 차수 시작</div>
        {activeRound && (
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>현재 진행 중: <strong style={{ color: C.accent }}>{activeRound.name}</strong> · 새 차수를 시작하면 자동으로 선택돼요. 아래 목록에서 다른 차수를 "이 차수로 선택"해도 돼요</div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: mob ? "wrap" : "nowrap" }}>
          <input style={{ ...S.input, flex: 1 }} value={newRoundName} onChange={e => setNewRoundName(e.target.value)} placeholder="예: 6월 4째주 주문" onKeyDown={e => e.key === "Enter" && startRound()} />
          <button style={{ ...S.btn(), flexShrink: 0 }} onClick={startRound}>새 차수 시작</button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rounds.length === 0
          ? <div style={{ ...S.card, textAlign: "center", color: C.muted }}>등록된 차수가 없습니다. 위에서 첫 차수를 시작해보세요.</div>
          : rounds.slice().reverse().map(r => (
            <div key={r.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{r.name}</span>
                  {r.active && <Badge text="진행 중" color={C.green} bg={C.greenLight} />}
                  <span style={{ fontSize: 12, color: C.muted }}>주문 {orderCountOf(r.id)}건</span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {!r.active && <button style={{ ...S.btn(C.green), padding: "8px 14px", fontSize: 12 }} onClick={() => setActiveRound(r.id)}>이 차수로 선택</button>}
                  <button style={S.btnOutline} onClick={() => setPastOpen(pastOpen === r.id ? null : r.id)}>{pastOpen === r.id ? "닫기" : "+ 지난 주문 입력"}</button>
                  <button style={{ ...S.btn(C.red), padding: "8px 14px", fontSize: 12 }} onClick={() => removeRound(r.id)}>삭제</button>
                </div>
              </div>

              {pastOpen === r.id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                  <Grid cols={3} w={w}>
                    <Field label="주문자 (회원) *">
                      <select style={S.select} value={memberId} onChange={e => setMemberId(e.target.value)}>
                        <option value="">회원을 선택하세요</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </Field>
                    <Field label="주문 날짜"><input type="date" style={S.input} value={pastDate} onChange={e => setPastDate(e.target.value)} /></Field>
                    <Field label="입금 여부">
                      <select style={S.select} value={paid ? "완료" : "미입금"} onChange={e => setPaid(e.target.value === "완료")}>
                        <option value="미입금">미입금</option>
                        <option value="완료">입금완료</option>
                      </select>
                    </Field>
                  </Grid>
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
                  <button style={{ ...S.btn(C.navy), marginBottom: 14 }} onClick={addItem}>+ 물품 추가</button>

                  {items.length > 0 && (
                    <div style={{ backgroundColor: C.bg, borderRadius: 8, padding: 12, marginBottom: 14 }}>
                      {items.map(c => (
                        <div key={c.productId} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13 }}>
                          <span>{c.name} × {c.qty}</span>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <span style={{ fontWeight: 700 }}>{won(c.price * c.qty)}</span>
                            <button style={{ ...S.btn(C.red), padding: "3px 8px", fontSize: 10 }} onClick={() => removeItem(c.productId)}>삭제</button>
                          </div>
                        </div>
                      ))}
                      <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
                        <span>합계</span><span style={{ color: C.accent }}>{won(totalPrice)}</span>
                      </div>
                    </div>
                  )}

                  <button style={{ ...S.btn(), width: "100%" }} onClick={() => submitPastOrder(r.id)} disabled={!memberId || items.length === 0}>이 차수에 주문 등록</button>
                </div>
              )}
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
    { id: "entry", label: "주문 입력", icon: "🛒" },
    { id: "orders", label: "주문 리스트", icon: "📋" },
    { id: "report", label: "보고서", icon: "📊" },
    { id: "rounds", label: "차수 관리", icon: "🗓" },
    { id: "products", label: "물품 관리", icon: "📦" },
    { id: "members", label: "회원 관리", icon: "👤" },
  ];
  const goTo = (id) => { setPage(id); setMenuOpen(false); };

  const renderPage = () => {
    switch (page) {
      case "entry": return <OrderEntry members={members} products={products} orders={orders} setOrders={setOrders} currentRound={currentRound} w={w} />;
      case "orders": return <OrderList orders={orders} setOrders={setOrders} rounds={rounds} w={w} />;
      case "report": return <ReportPage orders={orders} rounds={rounds} w={w} />;
      case "rounds": return <RoundManager rounds={rounds} setRounds={setRounds} orders={orders} setOrders={setOrders} members={members} products={products} w={w} />;
      case "products": return <ProductManager products={products} setProducts={setProducts} w={w} />;
      case "members": return <MemberManager members={members} setMembers={setMembers} orders={orders} rounds={rounds} w={w} />;
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
            <div style={{ fontWeight: 900, fontSize: 15, color: C.accent }}>🍊 로이스6 주문관리</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SyncBadge status={syncStatus} />
              <button onClick={() => setMenuOpen(true)} style={{ border: "none", backgroundColor: "transparent", fontSize: 20, cursor: "pointer" }}>☰</button>
            </div>
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
            {nav.slice(0, 4).map(n => (
              <button key={n.id} onClick={() => goTo(n.id)} style={{ flex: 1, border: "none", backgroundColor: "transparent", padding: "8px 2px 6px", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: 19 }}>{n.icon}</span>
                <span style={{ fontSize: 9, fontWeight: page === n.id ? 700 : 400, color: page === n.id ? C.accent : C.muted }}>{n.label}</span>
              </button>
            ))}
            <button onClick={() => setMenuOpen(true)} style={{ flex: 1, border: "none", backgroundColor: "transparent", padding: "8px 2px 6px", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 19 }}>•••</span>
              <span style={{ fontSize: 9, color: C.muted }}>더보기</span>
            </button>
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
