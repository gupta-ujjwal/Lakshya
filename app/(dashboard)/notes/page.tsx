"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  isPinned: boolean;
}

const mockNotes: Note[] = [
  {
    id: "1",
    title: "Key Concepts: Cardiovascular Physiology",
    content: "Cardiac cycle phases: systole and diastole. Key points about cardiac output, stroke volume, and heart rate regulation. Frank-Starling mechanism and its clinical significance.",
    subject: "Physiology",
    createdAt: new Date("2026-04-23"),
    updatedAt: new Date("2026-04-23"),
    tags: ["cardiovascular", "heart", "physiology"],
    isPinned: true,
  },
  {
    id: "2",
    title: "Drug Classifications: Antihypertensives",
    content: "ACE Inhibitors: Lisinopril, Enalapril. ARBs: Losartan, Valsartan. Beta Blockers: Metoprolol, Atenolol. Calcium Channel Blockers: Amlodipine, Diltiazem.",
    subject: "Pharmacology",
    createdAt: new Date("2026-04-22"),
    updatedAt: new Date("2026-04-22"),
    tags: ["pharmacology", "antihypertensives", "drugs"],
    isPinned: false,
  },
  {
    id: "3",
    title: "Biochemical Pathways Summary",
    content: "Glycolysis: 10 enzyme steps, yields 2 ATP and 2 NADH. Gluconeogenesis: reverse of glycolysis with key bypass enzymes. Krebs Cycle: 8 steps, yields 3 NADH, 1 FADH2, 1 GTP per acetyl-CoA.",
    subject: "Biochemistry",
    createdAt: new Date("2026-04-21"),
    updatedAt: new Date("2026-04-21"),
    tags: ["biochemistry", "metabolism", "pathways"],
    isPinned: true,
  },
  {
    id: "4",
    title: "Neuroanatomy: Brain Stem Structures",
    content: "Midbrain: Superior and inferior colliculi, cerebral peduncles. Pons: Motor and sensory nuclei, pneumotaxic center. Medulla: Respiratory center, cardiovascular center, olive.",
    subject: "Anatomy",
    createdAt: new Date("2026-04-20"),
    updatedAt: new Date("2026-04-20"),
    tags: ["neuroanatomy", "brain stem", "anatomy"],
    isPinned: false,
  },
  {
    id: "5",
    title: "Pathology: Myocardial Infarction",
    content: "Types: STEMI (ST elevation), NSTEMI (troponin elevated), Unstable angina. ECG changes: ST elevation in leads over infarct area. Troponin I/T peaks at 12-24 hours.",
    subject: "Pathology",
    createdAt: new Date("2026-04-19"),
    updatedAt: new Date("2026-04-19"),
    tags: ["pathology", "cardiovascular", "MI"],
    isPinned: false,
  },
  {
    id: "6",
    title: "Renal Physiology Notes",
    content: "GFR normal: 120-125 mL/min. Filtration fraction: 20%. Tubular reabsorption: Na+ 65%, water 65%, glucose 100%, amino acids 100%. Countercurrent mechanism for concentration.",
    subject: "Physiology",
    createdAt: new Date("2026-04-18"),
    updatedAt: new Date("2026-04-18"),
    tags: ["renal", "kidney", "physiology"],
    isPinned: false,
  },
];

const subjects = ["All Subjects", "Physiology", "Pharmacology", "Biochemistry", "Anatomy", "Pathology"];

const subjectColors: Record<string, string> = {
  Physiology: "text-success bg-success-soft",
  Pharmacology: "text-accent bg-accent-soft",
  Biochemistry: "text-warning bg-warning-soft",
  Anatomy: "text-danger bg-danger-soft",
  Pathology: "text-purple-500 bg-purple-50 dark:text-purple-400 dark:bg-purple-950",
};

const subjectsList = Object.keys(subjectColors);

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [searchQuery] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredNotes = notes.filter((note) => {
    if (selectedSubject !== "All Subjects" && note.subject !== selectedSubject) return false;
    if (searchQuery && !note.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !note.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const regularNotes = filteredNotes.filter((n) => !n.isPinned);

  const togglePin = (noteId: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, isPinned: !note.isPinned } : note
      )
    );
  };

  const openEditor = (note?: Note) => {
    setEditingNote(note || null);
    setShowEditor(true);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Notes"
        subtitle={`${notes.length} notes`}
        showSearch
        actions={
          <>
            <ThemeToggle />
            <div className="flex items-center gap-1 bg-bg-secondary rounded-lg p-1 border border-border">
              <button
                onClick={() => setViewMode("grid")}
                className={`
                  p-2 rounded-md transition-all
                  ${viewMode === "grid" ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"}
                `}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`
                  p-2 rounded-md transition-all
                  ${viewMode === "list" ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"}
                `}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <button onClick={() => openEditor()} className="btn btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Note
            </button>
          </>
        }
      />

      <div className="flex items-center gap-3">
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="input w-auto"
        >
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            Pinned
          </h2>
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                viewMode={viewMode}
                onPin={() => togglePin(note.id)}
                onEdit={() => openEditor(note)}
              />
            ))}
          </div>
        </div>
      )}

      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
        {regularNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            viewMode={viewMode}
            onPin={() => togglePin(note.id)}
            onEdit={() => openEditor(note)}
          />
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No notes yet</h3>
          <p className="text-text-secondary mb-4">Create your first note to get started</p>
          <button onClick={() => openEditor()} className="btn btn-primary">
            Create Note
          </button>
        </div>
      )}

      {showEditor && (
        <NoteEditor
          note={editingNote}
          onClose={() => {
            setShowEditor(false);
            setEditingNote(null);
          }}
          onSave={(newNote) => {
            if (editingNote) {
              setNotes((prev) =>
                prev.map((n) => (n.id === editingNote.id ? { ...n, ...newNote, updatedAt: new Date() } : n))
              );
            } else {
              setNotes((prev) => [
                { ...newNote, id: Date.now().toString(), createdAt: new Date(), updatedAt: new Date() },
                ...prev,
              ]);
            }
            setShowEditor(false);
            setEditingNote(null);
          }}
        />
      )}
    </div>
  );
}

function NoteCard({
  note,
  viewMode,
  onPin,
  onEdit,
}: {
  note: Note;
  viewMode: "grid" | "list";
  onPin: () => void;
  onEdit: () => void;
}) {
  const subjectColor = subjectColors[note.subject] || "text-text-secondary bg-bg-tertiary";

  if (viewMode === "list") {
    return (
      <div
        className="card p-4 flex items-start gap-4 cursor-pointer hover:border-border-strong transition-all"
        onClick={onEdit}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {note.isPinned && (
              <svg className="w-4 h-4 text-warning flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
              </svg>
            )}
            <h3 className="font-semibold text-text-primary truncate">{note.title}</h3>
          </div>
          <p className="text-sm text-text-secondary line-clamp-2 mb-2">{note.content}</p>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${subjectColor}`}>
              {note.subject}
            </span>
            <span className="text-xs text-text-tertiary">
              {note.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
          className="p-2 text-text-tertiary hover:text-warning transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      className="card p-4 cursor-pointer hover:border-border-strong transition-all flex flex-col h-full"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between mb-2">
        {note.isPinned && (
          <svg className="w-4 h-4 text-warning flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
          </svg>
        )}
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${subjectColor}`}>
          {note.subject}
        </span>
      </div>
      <h3 className="font-semibold text-text-primary mb-2 line-clamp-2">{note.title}</h3>
      <p className="text-sm text-text-secondary line-clamp-3 flex-1">{note.content}</p>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <span className="text-xs text-text-tertiary">
          {note.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
          className="p-1.5 text-text-tertiary hover:text-warning transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function NoteEditor({
  note,
  onClose,
  onSave,
}: {
  note: Note | null;
  onClose: () => void;
  onSave: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [subject, setSubject] = useState(note?.subject || "Physiology");
  const [tags, setTags] = useState(note?.tags.join(", ") || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      content,
      subject,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      isPinned: note?.isPinned || false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <h2 className="text-xl font-display font-bold text-text-primary mb-4">
          {note ? "Edit Note" : "New Note"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Note title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input"
            >
              {subjectsList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input min-h-[200px] resize-y"
              placeholder="Write your note here..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input"
              placeholder="cardiovascular, physiology, heart"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              {note ? "Save Changes" : "Create Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}