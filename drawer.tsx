const [isSaving, setIsSaving] = useState(false);

const [error, setError] = useState<string | null>(null);



async function handleSave() {
  setError(null);
  setIsSaving(true);
  try {
    const basicOk = await basicFormRef.current?.handleSave();
    if (!basicOk) { setError('Failed to save amenity details.'); return; }

    if (showActiveForm) {
      const scheduleOk = await activeFormRef.current?.handleSave();
      if (!scheduleOk) { setError('Failed to save schedule.'); return; }
    }
    onClose();
  } finally {
    setIsSaving(false);
  }
}
