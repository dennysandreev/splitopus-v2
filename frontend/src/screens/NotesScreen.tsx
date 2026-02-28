import { FormEvent, useEffect, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";

interface NotesScreenProps {
  tripId: string;
  onBack: () => void;
  onOpenSettings: () => void;
}

function NotesScreen({ tripId, onBack, onOpenSettings }: NotesScreenProps) {
  const [text, setText] = useState("");
  const notes = useStore((state) => state.notes);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const fetchNotes = useStore((state) => state.fetchNotes);
  const addNote = useStore((state) => state.addNote);

  useEffect(() => {
    void fetchNotes(tripId);
  }, [tripId, fetchNotes]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    await addNote(tripId, trimmed);
    setText("");
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <Navbar onBack={onBack} onSettings={onOpenSettings} title="Notes" />
      </header>

      <main className="app-main pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id}>
              <p className="text-sm text-textMain">{note.text}</p>
              <p className="mt-2 text-xs text-textMuted">{note.author}</p>
            </Card>
          ))}
          {!loading && notes.length === 0 ? (
            <Card>
              <p className="text-sm text-textMuted">Заметок пока нет</p>
            </Card>
          ) : null}
          {loading ? <p className="text-sm text-textMuted">Загрузка заметок...</p> : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
      </main>

      <form
        className="flex-none border-t border-borderSoft bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center gap-2">
          <input
            className="input-premium flex-1"
            onChange={(event) => setText(event.target.value)}
            placeholder="Написать заметку..."
            type="text"
            value={text}
          />
          <Button disabled={loading} type="submit">
            Add
          </Button>
        </div>
      </form>
    </div>
  );
}

export default NotesScreen;
