// frontend/src/App.jsx
// Translation editor with improved UI and column sorting by header click
import { useEffect, useState, useMemo } from "react";

export default function App() {
  const [data, setData] = useState({ translations: {}, allKeys: [], mainLang: "en" });
  const [local, setLocal] = useState({});
  const [dirty, setDirty] = useState(new Set());
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState("key"); // current sorting column
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/translations")
      .then(r => r.json())
      .then(d => {
        // Flatten each language
        const flatTranslations = {};
        for (const lang in d.translations) {
          flatTranslations[lang] = flatten(d.translations[lang]);
        }
        setData({ ...d });
        setLocal(flatTranslations);
      });
  }, []);

  const languages = useMemo(() => {
    const langs = Object.keys(local);
    // ensure mainLang is first
    langs.sort((a, b) => (a === data.mainLang ? -1 : b === data.mainLang ? 1 : a.localeCompare(b)));
    return langs;
  }, [local, data.mainLang]);

  const keys = useMemo(() => {
    let all = data.allKeys || [];
    if (filter) {
      const f = filter.toLowerCase();
      all = all.filter(k =>
        k.toLowerCase().includes(f) ||
        languages.some(l => (local[l]?.[k] || "").toLowerCase().includes(f))
      );
    }
    // sorting
    return all.sort((a, b) => {
      if (sortBy === "key") return a.localeCompare(b);
      const langValues = local[sortBy] || {};
      return (langValues[a] || "").localeCompare(langValues[b] || "");
    });
  }, [data.allKeys, filter, local, languages, sortBy]);

  const onChange = (lang, key, val) => {
    setLocal(prev => ({ ...prev, [lang]: { ...(prev[lang] || {}), [key]: val } }));
    setDirty(prev => new Set(prev).add(`${lang}||${key}`));
  };

  const saveAll = async () => {
    setSaving(true);

    const nestedTranslations = {};
    for (const lang in local) {
      nestedTranslations[lang] = unflatten(local[lang]);
    }

    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ translations: nestedTranslations })
    });

    setDirty(new Set());
    setSaving(false);
    alert("Saved");
  };

  // Flatten nested object to { "a.b.c": value }
  function flatten(obj, prefix = "") {
    const res = {};
    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      const val = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (val && typeof val === "object" && !Array.isArray(val)) {
        // Merge recursively flattened object
        Object.assign(res, flatten(val, newKey));
      } else {
        res[newKey] = val;
      }
    }
    return res;
  }

  // Unflatten { "a.b.c": value } to nested object
  function unflatten(obj) {
    const res = {};
    for (const flatKey in obj) {
      const parts = flatKey.split(".");
      let curr = res;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          curr[part] = obj[flatKey];
        } else {
          curr[part] = curr[part] || {};
          curr = curr[part];
        }
      }
    }
    return res;
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={{ margin: 0, marginBottom: 12 }}>Translation Editor</h1>

        <div style={styles.topBar}>
          <input
            placeholder="Search keys or values"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th
                  style={{ ...styles.th, ...(sortBy === "key" ? styles.activeHeader : {}) }}
                  onClick={() => setSortBy("key")}
                >
                  Key
                </th>
                {languages.map(lang => (
                  <th
                    key={lang}
                    style={{ ...styles.th, ...(sortBy === lang ? styles.activeHeader : {}) }}
                    onClick={() => setSortBy(lang)}
                  >
                    {lang}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map(key => (
                <tr key={key}>
                  <td style={{ ...styles.td, fontFamily: "monospace", width: 220 }}>{key}</td>
                  {languages.map(lang => {
                    const value = (local[lang] && local[lang][key]) || "";
                    const isDirty = dirty.has(`${lang}||${key}`);
                    return (
                      <td key={lang} style={{ ...styles.td, ...(isDirty ? styles.dirty : {}) }}>
                        <input
                          value={value}
                          onChange={e => onChange(lang, key, e.target.value)}
                          style={styles.input}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.bottomBar}>
          <div>{dirty.size} unsaved changes</div>
          <button onClick={saveAll} disabled={dirty.size === 0 || saving} style={styles.saveButton}>
            {saving ? "Saving..." : "Save all"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { padding: 24, fontFamily: "Inter, Arial, sans-serif", background: "#f5f7fa", minHeight: "100vh" },
  container: { maxWidth: 1200, margin: "0 auto", background: "white", padding: 20, borderRadius: 12, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" },
  topBar: { display: "flex", gap: 12, alignItems: "center", marginBottom: 12 },
  searchInput: { flex: 1, padding: 8, borderRadius: 6, border: "1px solid #ddd" },
  table: { width: "100%", borderCollapse: "collapse" },
  headerRow: { background: "#f0f3f7" },
  th: { textAlign: "left", padding: 12, borderBottom: "1px solid #eee", cursor: "pointer", color: "#333" },
  activeHeader: { background: "#2563eb", color: "white" },
  td: { padding: 10, borderBottom: "1px solid #e1e4e8", verticalAlign: "top", color: "#222" },
  input: { width: "100%", border: "1px solid #ccc", borderRadius: 6, padding: 6, background: "#fff", color: "#111" },
  dirty: { background: "#fff8e1" },
  bottomBar: { marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" },
  saveButton: { padding: "8px 14px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }
};
