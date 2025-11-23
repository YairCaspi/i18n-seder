import { useEffect, useState, useMemo } from "react";
import { ScrollArea, TextInput, Title, Container } from "@mantine/core";
import { DataTable } from "mantine-datatable";
import EditDialog from "./EditDialog";
import { apiFetch } from "./api";

// Mantine core styles
import "@mantine/core/styles.css";
import 'mantine-datatable/styles.layer.css';

export default function App() {
  const [data, setData] = useState({ translations: {}, allKeys: [], mainLang: "en" });
  const [selectedRow, setSelectedRow] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [sortStatus, setSortStatus] = useState({
    columnAccessor: 'key',
    direction: 'asc',
  });

  useEffect(() => {
    apiFetch("/api/translations")
      .then(r => r.json())
      .then(d => setData(d));
  }, []);

  useEffect(() => {
    console.log('sort status', sortStatus, rows);
    // const sortData = data.translations.map()
  }, [sortStatus]);

  const languages = useMemo(() => {
    const langs = Object.keys(data.translations || {});
    if (!langs.includes(data.mainLang) && data.mainLang) langs.unshift(data.mainLang);
    langs.sort((a,b) => (a===data.mainLang?-1:b===data.mainLang?1:a.localeCompare(b)));
    return langs;
  }, [data]);

  const rows = useMemo(() => {
    return (data.allKeys || [])
      .filter(key => key.toLowerCase().includes(search.toLowerCase()))
      .map(key => {
        const row = { key };
        languages.forEach(lang => {
          row[lang] = data.translations[lang]?.[key] || "";
        });
        return row;
      })
      .sort((a, b) => {
        const first = sortStatus.direction === 'asc' ? a : b;
        const second = sortStatus.direction === 'asc' ? b : a;
        return first[sortStatus.columnAccessor].localeCompare(second[sortStatus.columnAccessor])
      });
  }, [data, languages, search, sortStatus]);

  const openEditDialog = ({ record }) => {
    const currentValues = {};
    languages.forEach(lang => {
      currentValues[lang] = record[lang];
    });
    setEditValues(currentValues);
    setSelectedRow(record.key);
  };

  const handleSave = async (key, values) => {
    setSaving(true);
    console.log({key, values, languages});
    
    try {
      const payload = {
        key,
        values
      };
      // languages.forEach(lang => {
      //   payload[lang] = { [key]: values[lang] };
      // });

      const res = await apiFetch("/api/update-translation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({...payload})
      });

      if (!res.ok) throw new Error("Save failed");

      setData(prev => {
        const newTrans = { ...prev.translations };
        languages.forEach(lang => {
          newTrans[lang] = { ...newTrans[lang], [key]: values[lang] };
        });
        return { ...prev, translations: newTrans };
      });

      setSelectedRow(null);
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container size="xl" style={{ paddingTop: 24 }}>
      <Title order={2} mb="md">Translation Editor</Title>

      <TextInput
        placeholder="Search keys..."
        mb="md"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />

      <ScrollArea style={{ height: "70vh" }} type="scroll">
        <div style={{ height: "600px", overflow: "auto" }}>
          <DataTable
            pinFirstColumn
            columns={
              [
                {
                  sortable: true,
                  accessor: 'key',
                  title: 'key'
                },
                ...languages.map(lang => ({
                  sortable: true,
                  accessor: lang,
                  title: lang,
                }))]
            }
            styles={{
              header: {
                backgroundColor: '#e3e3e3'
              }
            }}
            records={rows}
            striped
            highlightOnHover
            withColumnBorders
            withRowBorders
            withTableBorder
            onRowClick={openEditDialog}
            rowStyle={(row, index) => ({
              backgroundColor: index % 2 === 0 ? "#d5deffff" : "#ffffff",
              cursor: "pointer"
            })}
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            horizontalSpacing="md"
            verticalSpacing="sm"
          />
        </div>
      </ScrollArea>

      {selectedRow && (
        <EditDialog
          selectedRow={selectedRow}
          editValues={editValues}
          setSelectedRow={setSelectedRow}
          setEditValues={setEditValues}
          handleSave={handleSave}
          saving={saving}
          languages={languages}
        />
      )}
    </Container>
  );
}
