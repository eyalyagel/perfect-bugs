import { useState, useEffect } from "react";

const STATUS_OPTIONS = ["Open", "In Progress", "Resolved", "Rejected"];
const SORT_OPTIONS   = ["Newest First", "Oldest First", "Project A→Z", "Project Z→A"];
const STATUS_STYLES  = {
  "Open":        { bg: "#ef4444", text: "#fff" },
  "In Progress": { bg: "#f59e0b", text: "#fff" },
  "Resolved":    { bg: "#22c55e", text: "#fff" },
  "Rejected":    { bg: "#7c3aed", text: "#fff" },
};

const STORAGE_KEY = "annotation-errors-records";
async function loadRecords() {
  try { const r = await window.storage.get(STORAGE_KEY); return r ? JSON.parse(r.value) : []; }
  catch { return []; }
}
async function saveRecords(records) {
  try { await window.storage.set(STORAGE_KEY, JSON.stringify(records)); }
  catch (e) { console.error("Storage error", e); }
}

function nowStr() { return new Date().toLocaleString("he-IL", { hour12: false }); }
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

const inputBase = (err) => ({
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: `1.5px solid ${err ? "#ef4444" : "#334155"}`,
  background: "#0f172a", color: "#e2e8f0", fontSize: 14,
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
});
const labelStyle = { fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 5, display: "block" };
const errMsg     = { color: "#ef4444", fontSize: 12, marginTop: 3 };

function Badge({ status }) {
  const s = STATUS_STYLES[status] || { bg: "#475569", text: "#fff" };
  return (
    <span style={{ background: s.bg, color: s.text, padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

// ── DATA ENTRY ────────────────────────────────────────────────────────────────
function DataEntryPage({ onSave }) {
  const empty = { user_name: "", tech_name: "", clip_name: "", project_name: "", frame_id: "", object_id: "", comment: "", image: null };
  const [form, setForm]       = useState(empty);
  const [preview, setPreview] = useState(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors]   = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    set("image", b64); setPreview(b64);
  };
  const clearImage = (e) => { e.preventDefault(); set("image", null); setPreview(null); };

  const validate = () => {
    const errs = {};
    if (!form.user_name.trim())    errs.user_name    = "Required";
    if (!form.clip_name.trim())    errs.clip_name    = "Required";
    if (!form.project_name.trim()) errs.project_name = "Required";
    if (form.frame_id === "")      errs.frame_id     = "Required";
    if (form.object_id === "")     errs.object_id    = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    const record = {
      id: Date.now(), user_name: form.user_name.trim(), tech_name: form.tech_name.trim(),
      clip_name: form.clip_name.trim(), project_name: form.project_name.trim(),
      frame_id: Number(form.frame_id), object_id: Number(form.object_id),
      comment: form.comment.trim(), image: form.image,
      status: "Open", timestamp: nowStr(), comments: [],
    };
    await onSave(record);
    setForm(empty); setPreview(null); setSuccess(true);
    setTimeout(() => setSuccess(false), 3500);
  };

  return (
    <div>
      <h2 style={{ color: "#e2e8f0", marginTop: 0, marginBottom: 4 }}>🐛 Perfect Bugs</h2>
      <p style={{ color: "#64748b", marginBottom: 24, fontSize: 14 }}>Fill in the form below to record a new annotation error.</p>

      {success && (
        <div style={{ background: "#14532d", border: "1px solid #22c55e", color: "#86efac", padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
          ✅ Record saved successfully!
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <div>
          <label style={labelStyle}>👤 User Name *</label>
          <input style={inputBase(errors.user_name)} value={form.user_name} placeholder="e.g. John Smith" onChange={e => set("user_name", e.target.value)} />
          {errors.user_name && <div style={errMsg}>{errors.user_name}</div>}
        </div>
        <div>
          <label style={labelStyle}>🔧 Tech Name</label>
          <input style={inputBase(false)} value={form.tech_name} placeholder="e.g. AD" onChange={e => set("tech_name", e.target.value)} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <div>
          <label style={labelStyle}>Clip Name *</label>
          <input style={inputBase(errors.clip_name)} value={form.clip_name} placeholder="e.g. clip_0042" onChange={e => set("clip_name", e.target.value)} />
          {errors.clip_name && <div style={errMsg}>{errors.clip_name}</div>}
        </div>
        <div>
          <label style={labelStyle}>Project Name *</label>
          <input style={inputBase(errors.project_name)} value={form.project_name} placeholder="e.g. Wildlife-Q3" onChange={e => set("project_name", e.target.value)} />
          {errors.project_name && <div style={errMsg}>{errors.project_name}</div>}
        </div>
        <div>
          <label style={labelStyle}>Frame ID *</label>
          <input type="number" style={inputBase(errors.frame_id)} value={form.frame_id} placeholder="0" min={0} onChange={e => set("frame_id", e.target.value)} />
          {errors.frame_id && <div style={errMsg}>{errors.frame_id}</div>}
        </div>
        <div>
          <label style={labelStyle}>Object ID *</label>
          <input type="number" style={inputBase(errors.object_id)} value={form.object_id} placeholder="0" min={0} onChange={e => set("object_id", e.target.value)} />
          {errors.object_id && <div style={errMsg}>{errors.object_id}</div>}
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>Comment</label>
        <textarea style={{ ...inputBase(false), minHeight: 180, resize: "vertical" }} value={form.comment} placeholder="Describe the annotation error in detail…" onChange={e => set("comment", e.target.value)} />
      </div>

      <div style={{ marginBottom: 26 }}>
        <label style={labelStyle}>Upload Image (JPG / PNG)</label>
        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed #334155", borderRadius: 10, padding: 20, cursor: "pointer", background: "#0f172a", color: "#64748b", fontSize: 13, minHeight: 120 }}>
          {preview ? (
            <>
              <img src={preview} alt="preview" style={{ maxHeight: 150, maxWidth: "100%", borderRadius: 8, objectFit: "contain" }} />
              <button onClick={clearImage} style={{ marginTop: 10, background: "#334155", border: "none", color: "#e2e8f0", borderRadius: 6, padding: "4px 14px", cursor: "pointer", fontSize: 12 }}>✕ Remove</button>
            </>
          ) : (
            <>
              <span style={{ fontSize: 38, marginBottom: 6 }}>📎</span>
              <span>Click to upload image</span>
              <span style={{ fontSize: 11, marginTop: 4, color: "#475569" }}>JPG, JPEG, PNG</span>
            </>
          )}
          <input type="file" accept=".jpg,.jpeg,.png" style={{ display: "none" }} onChange={handleImage} />
        </label>
      </div>

      <button onClick={submit} style={{ width: "100%", padding: "13px 0", borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: ".03em" }}>
        💾 Save Record
      </button>
    </div>
  );
}

// ── RECORD CARD ───────────────────────────────────────────────────────────────
function RecordCard({ record: r, onStatusChange, onAddComment }) {
  const [open, setOpen]             = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [newComment, setNewComment] = useState("");

  const allComments = r.comments?.length
    ? r.comments
    : r.comment
      ? [{ text: r.comment, timestamp: r.timestamp, author: r.user_name }]
      : [];

  const submitComment = () => {
    if (!newComment.trim()) return;
    onAddComment(r.id, newComment.trim());
    setNewComment(""); setCommenting(false);
  };

  return (
    <div style={{ background: "#1e293b", border: "1px solid #2d3f55", borderRadius: 12, marginBottom: 14, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "13px 18px", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>🎞 {r.clip_name}</span>
            <Badge status={r.status} />
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 1.7 }}>
            Project: <b style={{ color: "#94a3b8" }}>{r.project_name}</b>
            {r.user_name && <>&nbsp;·&nbsp;👤 <b style={{ color: "#a5b4fc" }}>{r.user_name}</b></>}
            {r.tech_name && <>&nbsp;·&nbsp;🔧 <b style={{ color: "#67e8f9" }}>{r.tech_name}</b></>}
            &nbsp;·&nbsp;{r.timestamp}
          </div>
        </div>
        <select value={r.status} onChange={e => onStatusChange(r.id, e.target.value)}
          style={{ padding: "7px 10px", borderRadius: 8, border: "1.5px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: 13, cursor: "pointer" }}>
          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => setOpen(o => !o)}
          style={{ background: "none", border: "1px solid #334155", color: "#94a3b8", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>
          {open ? "▲ Hide" : "▼ Details"}
        </button>
      </div>

      {open && (
        <div style={{ borderTop: "1px solid #2d3f55", padding: "16px 18px" }}>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
                {[["Frame ID", r.frame_id], ["Object ID", r.object_id], ["User", r.user_name || "—"], ["Tech", r.tech_name || "—"]].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".06em" }}>{l}</div>
                    <div style={{ fontSize: 14, color: "#c7d2fe", fontWeight: 700 }}>{v}</div>
                  </div>
                ))}
              </div>

              {allComments.map((c, i) => (
                <div key={i} style={{ borderLeft: "3px solid #6366f1", paddingLeft: 12, marginBottom: 10, color: "#94a3b8", fontSize: 13, fontStyle: "italic", lineHeight: 1.6 }}>
                  {c.text}
                  <div style={{ fontSize: 11, color: "#475569", fontStyle: "normal", marginTop: 2 }}>
                    {c.author && <span>👤 {c.author} · </span>}{c.timestamp}
                  </div>
                </div>
              ))}

              {commenting ? (
                <div style={{ marginTop: 10 }}>
                  <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment…"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: 13, resize: "vertical", minHeight: 70, boxSizing: "border-box", fontFamily: "inherit", outline: "none" }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <button onClick={submitComment} style={{ padding: "6px 16px", borderRadius: 7, background: "#6366f1", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>💬 Save</button>
                    <button onClick={() => { setCommenting(false); setNewComment(""); }}
                      style={{ padding: "6px 16px", borderRadius: 7, background: "transparent", color: "#94a3b8", border: "1px solid #334155", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setCommenting(true)}
                  style={{ marginTop: 6, padding: "5px 14px", borderRadius: 7, background: "transparent", color: "#6366f1", border: "1.5px solid #6366f1", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  + Add Comment
                </button>
              )}
            </div>
            {r.image && (
              <div style={{ flexShrink: 0 }}>
                <img src={r.image} alt="annotation" style={{ maxWidth: 190, maxHeight: 140, borderRadius: 8, objectFit: "cover", border: "1px solid #334155" }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function DashboardPage({ records, onStatusChange, onAddComment }) {
  const [filterStatus, setFilterStatus] = useState([...STATUS_OPTIONS]);
  const [filterUser,   setFilterUser]   = useState("All");
  const [sortBy,       setSortBy]       = useState("Newest First");
  const [search,       setSearch]       = useState("");

  const toggleStatus = (s) => setFilterStatus(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const allUsers = ["All", ...Array.from(new Set(records.map(r => r.user_name).filter(Boolean))).sort()];

  let filtered = records.filter(r =>
    filterStatus.includes(r.status) &&
    (filterUser === "All" || r.user_name === filterUser) &&
    (r.clip_name.toLowerCase().includes(search.toLowerCase()) || r.project_name.toLowerCase().includes(search.toLowerCase()))
  );
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "Newest First") return b.id - a.id;
    if (sortBy === "Oldest First") return a.id - b.id;
    if (sortBy === "Project A→Z")  return a.project_name.localeCompare(b.project_name);
    if (sortBy === "Project Z→A")  return b.project_name.localeCompare(a.project_name);
    return 0;
  });

  const exportToCSV = (rows) => {
    const headers = ["Timestamp","User Name","Tech Name","Clip Name","Project Name","Frame ID","Object ID","Status","Comment"];
    const escape  = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines   = [
      headers.map(escape).join(","),
      ...rows.map(r => [r.timestamp, r.user_name, r.tech_name || "", r.clip_name, r.project_name, r.frame_id, r.object_id, r.status, r.comment || ""].map(escape).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `annotation_errors_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const count = (s) => records.filter(r => r.status === s).length;
  const selectStyle = { padding: "8px 12px", borderRadius: 8, border: "1.5px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: 13, cursor: "pointer" };
  const metrics = [
    { label: "Total",       value: records.length,        color: "#6366f1" },
    { label: "Open",        value: count("Open"),          color: "#ef4444" },
    { label: "In Progress", value: count("In Progress"),   color: "#f59e0b" },
    { label: "Resolved",    value: count("Resolved"),      color: "#22c55e" },
    { label: "Rejected",    value: count("Rejected"),      color: "#7c3aed" },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>All logged annotation errors.</p>
        <button onClick={() => exportToCSV(filtered)}
          style={{ padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, border: "1.5px solid #22c55e", color: "#22c55e", background: "transparent", display: "flex", alignItems: "center", gap: 7 }}
          onMouseEnter={e => { e.currentTarget.style.background = "#14532d"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          📥 Export to CSV <span style={{ fontSize: 11, opacity: .7 }}>({filtered.length})</span>
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: "#1e293b", border: `1px solid ${m.color}33`, borderRadius: 10, padding: "14px 20px", textAlign: "center", flex: 1, minWidth: 70 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#1e293b", border: "1px solid #2d3f55", borderRadius: 10, padding: "14px 18px", marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search clip / project…" style={{ ...selectStyle, flex: 1, minWidth: 150 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>👤 User</span>
            <select value={filterUser} onChange={e => setFilterUser(e.target.value)} style={selectStyle}>
              {allUsers.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>⇅ Sort</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
              {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>Status:</span>
          {STATUS_OPTIONS.map(s => {
            const active = filterStatus.includes(s);
            const st     = STATUS_STYLES[s];
            return (
              <button key={s} onClick={() => toggleStatus(s)}
                style={{ padding: "5px 14px", borderRadius: 20, border: `1.5px solid ${st.bg}`, background: active ? st.bg : "transparent", color: active ? st.text : st.bg, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <p style={{ color: "#475569", fontSize: 13, marginBottom: 14 }}>
        Showing <b style={{ color: "#94a3b8" }}>{filtered.length}</b> of {records.length} records
        {sortBy !== "Newest First" && <span style={{ color: "#6366f1" }}> · {sortBy}</span>}
        {filterUser !== "All"      && <span style={{ color: "#8b5cf6" }}> · 👤 {filterUser}</span>}
      </p>

      {filtered.length === 0
        ? <div style={{ textAlign: "center", color: "#475569", fontSize: 15, background: "#1e293b", borderRadius: 10, padding: "50px 0" }}>No records match your filters.</div>
        : filtered.map(r => <RecordCard key={r.id} record={r} onStatusChange={onStatusChange} onAddComment={onAddComment} />)
      }
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page,    setPage]    = useState("entry");
  const [records, setRecords] = useState([]);
  const [loaded,  setLoaded]  = useState(false);

  useEffect(() => {
    loadRecords().then(r => { setRecords(r); setLoaded(true); });
  }, []);

  const handleSave = async (record) => {
    const u = [record, ...records]; setRecords(u); await saveRecords(u);
  };

  const handleStatusChange = async (id, status) => {
    const u = records.map(r => r.id === id ? { ...r, status } : r);
    setRecords(u); await saveRecords(u);
  };

  const handleAddComment = async (id, text) => {
    const u = records.map(r => {
      if (r.id !== id) return r;
      const existing = r.comments?.length
        ? r.comments
        : r.comment ? [{ text: r.comment, timestamp: r.timestamp, author: r.user_name }] : [];
      return { ...r, comments: [...existing, { text, timestamp: nowStr(), author: "" }] };
    });
    setRecords(u); await saveRecords(u);
  };

  const navBtn = (id, label) => (
    <button onClick={() => setPage(id)} style={{ width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: 8, background: page === id ? "#6366f1" : "transparent", color: page === id ? "#fff" : "#94a3b8", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
      {label}
    </button>
  );

  if (!loaded) return (
    <div style={{ background: "#0f172a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>Loading…</div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f172a", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: 220, flexShrink: 0, background: "#0a1020", borderRight: "1px solid #1e293b", padding: "28px 16px", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0" }}>🎬 Annotation</div>
          <div style={{ fontSize: 12, color: "#475569" }}>Error Tracker</div>
        </div>
        {navBtn("entry",     "📝 Data Entry")}
        {navBtn("dashboard", "📊 Dashboard")}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: "#334155", paddingTop: 20, borderTop: "1px solid #1e293b" }}>
          {records.length} record{records.length !== 1 ? "s" : ""} stored
        </div>
      </div>
      <div style={{ flex: 1, padding: "36px 40px", overflowY: "auto", maxHeight: "100vh" }}>
        {page === "entry"
          ? <DataEntryPage onSave={handleSave} />
          : <DashboardPage records={records} onStatusChange={handleStatusChange} onAddComment={handleAddComment} />
        }
      </div>
    </div>
  );
}
