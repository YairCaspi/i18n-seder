import { Modal, Button, TextInput, Stack } from "@mantine/core";

export default function EditDialog({ selectedRow, editValues, setSelectedRow, setEditValues, handleSave, saving, languages }) {
  const onChange = (lang, value) => {
    setEditValues(prev => ({ ...prev, [lang]: value }));
  };

  return (
    <Modal
      opened={!!selectedRow}
      onClose={() => setSelectedRow(null)}
      title={`Edit: ${selectedRow}`}
      centered
      overlayOpacity={0.5}
      size="xl"
    >
      <Stack>
        {languages.map(lang => (
          <TextInput
            key={lang}
            label={lang}
            value={editValues[lang] || ""}
            onChange={(e) => onChange(lang, e.target.value)}
          />
        ))}

        <Button onClick={() => handleSave(selectedRow, editValues)} loading={saving}>
          Save
        </Button>
        <Button variant="outline" onClick={() => setSelectedRow(null)}>
          Close
        </Button>
      </Stack>
    </Modal>
  );
}
