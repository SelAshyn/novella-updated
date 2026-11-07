"use client"

import { useCallback, useEffect, useState } from "react"
import { PageTitle } from "@/components/dashboard/app-shell"
import { useAuth } from "@/components/landing/auth-provider"
import {
  BookOpen, Check, Copy, List, Plus, Trash2, Users, X, AlertCircle, LogOut,
} from "lucide-react"
import posthog from "posthog-js"

// ── Types ─────────────────────────────────────────────────────────────────

interface Assignment {
  id: string
  title: string
  author: string
  chapters: string | null
  dueDate: string | null
  wordListId: string | null
}

interface ClassData {
  id: string
  name: string
  subject: string | null
  joinCode: string
  memberCount: number
  role: "teacher" | "student"
  assignments: Assignment[]
}

interface HardestWord {
  word: string
  missedPercentage: number
}

interface ClassMember {
  id: string
  name: string
  email: string
  role: string
  pagesRead: number
  reviewedThisWeek: boolean
  joinedAt: string
}

type OwnerTab = "overview" | "members" | "assignments" | "settings"

// ── Auth helper ────────────────────────────────────────────────────────────

function useClassApi() {
  const { user } = useAuth()

  const headers = useCallback(async (): Promise<HeadersInit> => {
    if (!user) throw new Error("Not authenticated")
    const token = await user.getIdToken()
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
  }, [user])

  return { headers, user }
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ClassPage() {
  const { headers, user } = useClassApi()
  const [classes, setClasses] = useState<ClassData[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null)
  const [activeTab, setActiveTab] = useState<OwnerTab>("overview")
  const [hardestWords, setHardestWords] = useState<HardestWord[]>([])
  const [members, setMembers] = useState<ClassMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAddAssignment, setShowAddAssignment] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  // ── Data fetching ──────────────────────────────────────────────────────

  const fetchClasses = useCallback(async () => {
    if (!user) return
    try {
      const h = await headers()
      const res = await fetch("/api/classes", { headers: h })
      if (!res.ok) throw new Error(`${res.status}`)
      const data: ClassData[] = await res.json()
      setClasses(data)
      if (data.length > 0 && !selectedClass) setSelectedClass(data[0])
    } catch (err: any) {
      setError("Failed to load classes: " + err.message)
    } finally {
      setLoading(false)
    }
  }, [user, headers, selectedClass])

  const fetchHardestWords = useCallback(async (classId: string) => {
    try {
      const h = await headers()
      const res = await fetch(`/api/classes/${classId}/hardest-words`, { headers: h })
      if (res.ok) setHardestWords(await res.json())
    } catch {}
  }, [headers])

  const fetchMembers = useCallback(async (classId: string) => {
    try {
      const h = await headers()
      const res = await fetch(`/api/classes/${classId}/members`, { headers: h })
      if (res.ok) setMembers(await res.json())
    } catch {}
  }, [headers])

  useEffect(() => { fetchClasses() }, [user])

  useEffect(() => {
    if (!selectedClass || selectedClass.role !== "teacher") return
    if (activeTab === "overview") fetchHardestWords(selectedClass.id)
    if (activeTab === "members") fetchMembers(selectedClass.id)
  }, [selectedClass, activeTab])

  // ── Actions ────────────────────────────────────────────────────────────

  async function handleJoinClass(joinCode: string) {
    const h = await headers()
    const res = await fetch("/api/classes/join", {
      method: "POST", headers: h,
      body: JSON.stringify({ joinCode }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.error || "Failed to join class")
    }
    posthog.capture("class_joined")
    setShowJoinDialog(false)
    setSelectedClass(null)
    fetchClasses()
  }

  async function handleCreateClass(name: string, subject: string) {
    const h = await headers()
    const res = await fetch("/api/classes", {
      method: "POST", headers: h,
      body: JSON.stringify({ name, subject }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.error || "Failed to create class")
    }
    const newClass = await res.json()
    posthog.capture("class_created", { class_id: newClass.id })
    setShowCreateDialog(false)
    setClasses((prev) => [...prev, newClass])
    setSelectedClass(newClass)
  }

  async function handleUpdateClass(classId: string, data: { name?: string; subject?: string; regenerateCode?: boolean }) {
    const h = await headers()
    const res = await fetch(`/api/classes/${classId}`, {
      method: "PATCH", headers: h,
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to update class")
    const { class: updated } = await res.json()
    setClasses((prev) => prev.map((c) => c.id === classId ? { ...c, ...updated } : c))
    setSelectedClass((prev) => prev?.id === classId ? { ...prev, ...updated } : prev)
  }

  async function handleDeleteClass(classId: string) {
    const h = await headers()
    const res = await fetch(`/api/classes/${classId}`, { method: "DELETE", headers: h })
    if (!res.ok) throw new Error("Failed to delete class")
    setClasses((prev) => prev.filter((c) => c.id !== classId))
    setSelectedClass(null)
  }

  async function handleLeaveClass(classId: string) {
    const h = await headers()
    const res = await fetch(`/api/classes/${classId}/leave`, { method: "POST", headers: h })
    if (!res.ok) throw new Error("Failed to leave class")
    setClasses((prev) => prev.filter((c) => c.id !== classId))
    setSelectedClass(null)
  }

  async function handleRemoveMember(classId: string, memberId: string) {
    const h = await headers()
    const res = await fetch(`/api/classes/${classId}/members`, {
      method: "DELETE", headers: h,
      body: JSON.stringify({ memberId }),
    })
    if (!res.ok) throw new Error("Failed to remove member")
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
  }

  async function handleAddAssignment(classId: string, data: { title: string; author: string; chapters?: string; dueDate?: string }) {
    const h = await headers()
    const res = await fetch(`/api/classes/${classId}/assignments`, {
      method: "POST", headers: h,
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to add assignment")
    const { assignment } = await res.json()
    posthog.capture("assignment_created", {
      class_id: classId,
      assignment_id: assignment.id,
      has_due_date: Boolean(assignment.dueDate),
    })
    setSelectedClass((prev) =>
      prev?.id === classId
        ? { ...prev, assignments: [{ ...assignment, dueDate: assignment.dueDate?.toISOString?.() ?? assignment.dueDate }, ...prev.assignments] }
        : prev
    )
    setShowAddAssignment(false)
  }

  async function handleDeleteAssignment(classId: string, assignmentId: string) {
    const h = await headers()
    const res = await fetch(`/api/classes/${classId}/assignments`, {
      method: "DELETE", headers: h,
      body: JSON.stringify({ assignmentId }),
    })
    if (!res.ok) throw new Error("Failed to delete assignment")
    setSelectedClass((prev) =>
      prev?.id === classId
        ? { ...prev, assignments: prev.assignments.filter((a) => a.id !== assignmentId) }
        : prev
    )
  }

  async function copyJoinCode(code: string) {
    await navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  // ── Render: loading / error ────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <PageTitle>Class</PageTitle>
        <p className="text-muted-foreground">Loading classes…</p>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageTitle>Class</PageTitle>
        <div className="sticker max-w-xl border-l-4 border-destructive p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      </>
    )
  }

  // ── Render: empty state ────────────────────────────────────────────────

  if (classes.length === 0) {
    return (
      <>
        <PageTitle kicker="Education">Class</PageTitle>
        <div className="sticker max-w-2xl p-10 text-center">
          <Users className="mx-auto size-12 text-muted-foreground mb-4" />
          <p className="font-display text-3xl">No classes yet</p>
          <p className="mt-2 text-muted-foreground">
            Join a class with a code from your teacher, or create your own.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => setShowJoinDialog(true)}
              className="kicker min-h-11 sticker-sm bg-muted px-5"
            >
              Join a class
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="kicker inline-flex min-h-11 items-center gap-2 sticker-sm bg-highlight px-5 text-highlight-foreground"
            >
              <Plus className="size-4" /> Create a class
            </button>
          </div>
        </div>
        {showJoinDialog && <JoinDialog onJoin={handleJoinClass} onClose={() => setShowJoinDialog(false)} />}
        {showCreateDialog && <CreateDialog onCreate={handleCreateClass} onClose={() => setShowCreateDialog(false)} />}
      </>
    )
  }

  const isTeacher = selectedClass?.role === "teacher"

  // ── Render: main ──────────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <PageTitle kicker={selectedClass?.subject ?? "Education"}>
          {selectedClass?.name ?? "Class"}
        </PageTitle>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowJoinDialog(true)}
            className="kicker min-h-11 sticker-sm bg-muted px-4 text-sm"
          >
            Join
          </button>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="kicker inline-flex min-h-11 items-center gap-2 sticker-sm bg-highlight px-4 text-highlight-foreground text-sm"
          >
            <Plus className="size-4" /> Create
          </button>
        </div>
      </div>

      {/* Class tabs when multiple */}
      {classes.length > 1 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => { setSelectedClass(cls); setActiveTab("overview") }}
              className={`kicker px-4 py-2 rounded-sm whitespace-nowrap ${
                selectedClass?.id === cls.id
                  ? "bg-highlight text-highlight-foreground"
                  : "border border-border hover:bg-muted"
              }`}
            >
              {cls.name}
              {cls.role === "teacher" && <span className="ml-1.5 opacity-60 text-[10px]">TEACHER</span>}
            </button>
          ))}
        </div>
      )}

      {selectedClass && (
        <>
          {/* Tab bar — teacher only */}
          {isTeacher && (
            <div className="mb-6 flex gap-0 border-b border-border overflow-x-auto">
              {(["overview", "members", "assignments", "settings"] as OwnerTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`kicker px-4 py-2.5 capitalize whitespace-nowrap border-b-2 -mb-px transition-colors ${
                    activeTab === tab
                      ? "border-highlight text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          {/* Teacher tabs */}
          {isTeacher && activeTab === "overview" && (
            <OwnerOverview
              classData={selectedClass}
              hardestWords={hardestWords}
              copiedCode={copiedCode}
              onCopyCode={copyJoinCode}
            />
          )}
          {isTeacher && activeTab === "members" && (
            <MembersView
              members={members}
              onRemove={(memberId) => handleRemoveMember(selectedClass.id, memberId)}
            />
          )}
          {isTeacher && activeTab === "assignments" && (
            <AssignmentsView
              assignments={selectedClass.assignments}
              isTeacher
              onAdd={() => setShowAddAssignment(true)}
              onDelete={(id) => handleDeleteAssignment(selectedClass.id, id)}
            />
          )}
          {isTeacher && activeTab === "settings" && (
            <ClassSettings
              classData={selectedClass}
              onUpdate={(data) => handleUpdateClass(selectedClass.id, data)}
              onDelete={() => {
                if (confirm(`Delete "${selectedClass.name}"? This cannot be undone.`)) {
                  handleDeleteClass(selectedClass.id).catch(console.error)
                }
              }}
            />
          )}

          {/* Student view */}
          {!isTeacher && (
            <StudentView
              classData={selectedClass}
              onLeave={() => {
                if (confirm(`Leave "${selectedClass.name}"?`)) {
                  handleLeaveClass(selectedClass.id).catch(console.error)
                }
              }}
            />
          )}
        </>
      )}

      {/* Dialogs */}
      {showJoinDialog && <JoinDialog onJoin={handleJoinClass} onClose={() => setShowJoinDialog(false)} />}
      {showCreateDialog && <CreateDialog onCreate={handleCreateClass} onClose={() => setShowCreateDialog(false)} />}
      {showAddAssignment && selectedClass && (
        <AddAssignmentDialog
          onAdd={(data) => handleAddAssignment(selectedClass.id, data)}
          onClose={() => setShowAddAssignment(false)}
        />
      )}
    </>
  )
}

// ── Dialogs ────────────────────────────────────────────────────────────────

function JoinDialog({ onJoin, onClose }: { onJoin: (code: string) => Promise<void>; onClose: () => void }) {
  const [code, setCode] = useState("")
  const [consented, setConsented] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    if (!code.trim() || !consented) return
    setPending(true)
    try {
      await onJoin(code.trim().toUpperCase())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal title="Join a class" onClose={onClose}>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Class code (e.g. ABC123)"
        className="min-h-11 w-full sticker-sm bg-card px-3 font-mono text-sm outline-none uppercase tracking-widest"
        autoFocus
      />
      <div className="mt-4 rounded-sm border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
        <strong>Privacy notice:</strong> Your teacher will see your reading progress and which words you find hardest. They will not see your personal notes.
      </div>
      <label className="mt-4 flex items-start gap-3">
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-foreground"
        />
        <span className="text-sm">I understand what my teacher can see and agree to join.</span>
      </label>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-5 flex gap-2">
        <button
          onClick={submit}
          disabled={!consented || !code.trim() || pending}
          className="kicker flex-1 min-h-11 sticker-sm bg-highlight text-highlight-foreground disabled:opacity-50"
        >
          {pending ? "Joining…" : "Join"}
        </button>
        <button onClick={onClose} className="kicker flex-1 min-h-11 sticker-sm bg-muted">
          Cancel
        </button>
      </div>
    </Modal>
  )
}

function CreateDialog({ onCreate, onClose }: { onCreate: (name: string, subject: string) => Promise<void>; onClose: () => void }) {
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    if (!name.trim()) return
    setPending(true)
    try {
      await onCreate(name.trim(), subject.trim())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal title="Create a class" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="kicker text-muted-foreground">Class name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Grade 10 English"
            className="mt-1 min-h-11 w-full sticker-sm bg-card px-3 font-mono text-sm outline-none"
            autoFocus
          />
        </div>
        <div>
          <label className="kicker text-muted-foreground">Subject <span className="opacity-50">optional</span></label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Literature"
            className="mt-1 min-h-11 w-full sticker-sm bg-card px-3 font-mono text-sm outline-none"
          />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-5 flex gap-2">
        <button
          onClick={submit}
          disabled={!name.trim() || pending}
          className="kicker flex-1 min-h-11 sticker-sm bg-highlight text-highlight-foreground disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create class"}
        </button>
        <button onClick={onClose} className="kicker flex-1 min-h-11 sticker-sm bg-muted">Cancel</button>
      </div>
    </Modal>
  )
}

function AddAssignmentDialog({
  onAdd,
  onClose,
}: {
  onAdd: (data: { title: string; author: string; chapters?: string; dueDate?: string }) => Promise<void>
  onClose: () => void
}) {
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [chapters, setChapters] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    if (!title.trim() || !author.trim()) return
    setPending(true)
    try {
      await onAdd({
        title: title.trim(),
        author: author.trim(),
        chapters: chapters.trim() || undefined,
        dueDate: dueDate || undefined,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal title="Assign a book" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="kicker text-muted-foreground">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. To Kill a Mockingbird"
            className="mt-1 min-h-11 w-full sticker-sm bg-card px-3 font-mono text-sm outline-none"
            autoFocus
          />
        </div>
        <div>
          <label className="kicker text-muted-foreground">Author *</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g. Harper Lee"
            className="mt-1 min-h-11 w-full sticker-sm bg-card px-3 font-mono text-sm outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="kicker text-muted-foreground">Chapters <span className="opacity-50">optional</span></label>
            <input
              type="text"
              value={chapters}
              onChange={(e) => setChapters(e.target.value)}
              placeholder="Ch. 1–5"
              className="mt-1 min-h-11 w-full sticker-sm bg-card px-3 font-mono text-sm outline-none"
            />
          </div>
          <div>
            <label className="kicker text-muted-foreground">Due date <span className="opacity-50">optional</span></label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 min-h-11 w-full sticker-sm bg-card px-3 font-mono text-sm outline-none"
            />
          </div>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-5 flex gap-2">
        <button
          onClick={submit}
          disabled={!title.trim() || !author.trim() || pending}
          className="kicker flex-1 min-h-11 sticker-sm bg-highlight text-highlight-foreground disabled:opacity-50"
        >
          {pending ? "Assigning…" : "Assign book"}
        </button>
        <button onClick={onClose} className="kicker flex-1 min-h-11 sticker-sm bg-muted">Cancel</button>
      </div>
    </Modal>
  )
}

// ── Shared modal wrapper ───────────────────────────────────────────────────

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="sticker w-full max-w-md max-h-[90vh] overflow-y-auto p-8">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-display text-3xl">{title}</h3>
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-sm hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Sub-views ──────────────────────────────────────────────────────────────

function OwnerOverview({
  classData,
  hardestWords,
  copiedCode,
  onCopyCode,
}: {
  classData: ClassData
  hardestWords: HardestWord[]
  copiedCode: boolean
  onCopyCode: (code: string) => void
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Join Code */}
      <div className="sticker p-6">
        <p className="kicker text-muted-foreground mb-3">Share with students</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-sm bg-muted px-4 py-3 font-mono text-2xl tracking-widest">
            {classData.joinCode}
          </code>
          <button
            onClick={() => onCopyCode(classData.joinCode)}
            className="grid size-11 place-items-center sticker-sm border border-border hover:bg-muted"
            title="Copy join code"
          >
            {copiedCode ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {classData.memberCount} member{classData.memberCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Hardest words */}
      <div className="sticker p-6">
        <p className="kicker text-muted-foreground mb-4">Hardest words across the class</p>
        {hardestWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <List className="size-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">
              Appears when at least 2 students have saved the same word.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {hardestWords.slice(0, 5).map((item) => (
              <li key={item.word}>
                <div className="flex justify-between mb-1">
                  <span className="font-display text-2xl">{item.word}</span>
                  <span className="kicker text-sm text-muted-foreground">{item.missedPercentage}% missed</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-highlight transition-all"
                    style={{ width: `${item.missedPercentage}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function MembersView({
  members,
  onRemove,
}: {
  members: ClassMember[]
  onRemove: (id: string) => void
}) {
  return (
    <div className="sticker p-6">
      <p className="kicker text-muted-foreground mb-4">
        {members.length} member{members.length !== 1 ? "s" : ""}
      </p>
      {members.length === 0 ? (
        <div className="py-10 text-center">
          <Users className="mx-auto size-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No members yet — share the join code.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="kicker border-b border-border">
              <tr>
                <th className="pb-3">Name</th>
                <th className="pb-3">Pages read</th>
                <th className="pb-3">Reviewed this week</th>
                <th className="pb-3 sr-only">Remove</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0">
                  <td className="py-3">
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm text-muted-foreground">{m.email}</p>
                  </td>
                  <td className="py-3 font-mono text-sm">{m.pagesRead}</td>
                  <td className="py-3">
                    <span
                      className={`kicker inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                        m.reviewedThisWeek
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span className={`size-1.5 rounded-full ${m.reviewedThisWeek ? "bg-green-500" : "bg-muted-foreground"}`} />
                      {m.reviewedThisWeek ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="py-3">
                    {m.role !== "teacher" && (
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${m.name} from the class?`)) onRemove(m.id)
                        }}
                        className="grid size-8 place-items-center rounded-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AssignmentsView({
  assignments,
  isTeacher,
  onAdd,
  onDelete,
}: {
  assignments: Assignment[]
  isTeacher: boolean
  onAdd?: () => void
  onDelete?: (id: string) => void
}) {
  return (
    <div className="sticker p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="kicker text-muted-foreground">Assigned books</p>
        {isTeacher && onAdd && (
          <button
            onClick={onAdd}
            className="kicker inline-flex items-center gap-1.5 text-sm text-highlight hover:underline underline-offset-2"
          >
            <Plus className="size-3.5" /> Assign a book
          </button>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="py-10 text-center">
          <BookOpen className="mx-auto size-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No books assigned yet.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {assignments.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-4 border-b border-rule pb-5 last:border-0">
              <div>
                <p className="font-display text-2xl">{a.title}</p>
                <p className="text-muted-foreground">
                  {a.author}
                  {a.chapters && ` · ${a.chapters}`}
                  {a.dueDate && ` · due ${new Date(a.dueDate).toLocaleDateString()}`}
                </p>
              </div>
              {isTeacher && onDelete && (
                <button
                  onClick={() => { if (confirm(`Remove "${a.title}"?`)) onDelete(a.id) }}
                  className="grid size-8 shrink-0 place-items-center rounded-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ClassSettings({
  classData,
  onUpdate,
  onDelete,
}: {
  classData: ClassData
  onUpdate: (data: { name?: string; subject?: string; regenerateCode?: boolean }) => Promise<void>
  onDelete: () => void
}) {
  const [name, setName] = useState(classData.name)
  const [subject, setSubject] = useState(classData.subject ?? "")
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  async function handleSave() {
    setSaving(true)
    setError("")
    try {
      await onUpdate({ name, subject })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRegenerateCode() {
    if (!confirm("This invalidates the current join code. Students with the old code won't be able to join. Continue?")) return
    setRegenerating(true)
    try {
      await onUpdate({ regenerateCode: true })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="sticker max-w-lg p-6 space-y-8">
      {/* Name & Subject */}
      <div className="space-y-4">
        <p className="kicker text-muted-foreground">Class details</p>
        <div>
          <label className="kicker text-muted-foreground" htmlFor="cls-name">Name</label>
          <input
            id="cls-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 min-h-11 w-full sticker-sm bg-card px-3 font-mono text-sm outline-none"
          />
        </div>
        <div>
          <label className="kicker text-muted-foreground" htmlFor="cls-subject">Subject <span className="opacity-50">optional</span></label>
          <input
            id="cls-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 min-h-11 w-full sticker-sm bg-card px-3 font-mono text-sm outline-none"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="kicker min-h-11 sticker-sm bg-highlight px-6 text-highlight-foreground disabled:opacity-50"
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save changes"}
        </button>
      </div>

      {/* Regenerate code */}
      <div className="border-t border-border pt-6">
        <p className="kicker text-muted-foreground mb-1">Join code</p>
        <p className="text-sm text-muted-foreground mb-3">
          Creates a new code and invalidates the old one.
        </p>
        <button
          onClick={handleRegenerateCode}
          disabled={regenerating}
          className="kicker min-h-11 sticker-sm bg-muted px-6 disabled:opacity-50"
        >
          {regenerating ? "Regenerating…" : "Regenerate code"}
        </button>
      </div>

      {/* Danger zone */}
      <div className="border-t border-border pt-6">
        <p className="kicker text-destructive mb-1">Danger zone</p>
        <p className="text-sm text-muted-foreground mb-3">
          Permanently deletes the class and removes all members. Cannot be undone.
        </p>
        <button
          onClick={onDelete}
          className="kicker min-h-11 sticker-sm bg-destructive px-6 text-destructive-foreground"
        >
          Delete class
        </button>
      </div>
    </div>
  )
}

function StudentView({ classData, onLeave }: { classData: ClassData; onLeave: () => void }) {
  return (
    <div className="space-y-6">
      <AssignmentsView assignments={classData.assignments} isTeacher={false} />

      <div className="flex items-center gap-3">
        <button
          onClick={onLeave}
          className="kicker inline-flex items-center gap-2 min-h-11 sticker-sm bg-muted px-5 text-sm text-destructive hover:bg-destructive/10"
        >
          <LogOut className="size-4" /> Leave class
        </button>
      </div>
    </div>
  )
}
