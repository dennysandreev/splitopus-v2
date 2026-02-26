import { FormEvent, useEffect, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Navbar from "../components/Navbar";
import { useStore } from "../store/useStore";

interface NotesScreenProps {
  tripId: string;
  onBack: () => void;
}

function NotesScreen({ tripId, onBack }: NotesScreenProps) {
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
    if (!trimmed) {
      return;
    }

    await addNote(tripId, trimmed);
    setText("");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onBack={onBack} title="Заметки" />
      <main className="space-y-4 p-4 pb-28">
        {loading ? <p className="text-sm text-slate-500">Загрузка заметок...</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <section className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id}>
              <p className="text-sm text-slate-900">{note.text}</p>
              <p className="mt-2 text-xs text-slate-500">{note.author}</p>
            </Card>
          ))}
          {!loading && notes.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500">Заметок пока нет</p>
            </Card>
          ) : null}
        </section>
      </main>

      <form
        className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-4"
        onSubmit={handleSubmit}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <input
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            onChange={(event) => setText(event.target.value)}
            placeholder="Написать заметку..."
            type="text"
            value={text}
          />
          <Button disabled={loading} type="submit">
            Добавить
          </Button>
        </div>
      </form>
    </div>
  );
}

export default NotesScreen;
