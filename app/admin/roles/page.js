"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Plus, Save, ShieldCheck, Trash2, X } from "lucide-react";
import { useAuth } from "@/components/contexts/AuthContext";

const emptyForm = { key: "", name: "", description: "", permissions: [] };

function RoleDialog({ role, groups, onClose, onSave }) {
  const [form, setForm] = useState(role || emptyForm);
  const [saving, setSaving] = useState(false);
  const isNew = !role;

  const togglePermission = (key) => {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(key)
        ? current.permissions.filter((permission) => permission !== key)
        : [...current.permissions, key],
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(form, isNew);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-card)] shadow-[var(--shadow-lg)]" role="dialog" aria-modal="true" aria-labelledby="role-dialog-title">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] p-6">
          <div>
            <h2 id="role-dialog-title" className="text-[var(--text-2xl)] font-semibold">{isNew ? "Create role" : `Edit ${role.name}`}</h2>
            <p className="mt-1 text-sm text-[var(--color-ink-3)]">Permissions are stored in MongoDB and apply on the next session check.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-[var(--radius-md)] p-2 hover:bg-[var(--color-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="space-y-5 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Role key
                <input required pattern="[a-z0-9_]{2,40}" disabled={!isNew} value={form.key} onChange={(event) => setForm({ ...form, key: event.target.value })} placeholder="finance_team" className="mt-1 h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 font-mono text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] disabled:bg-[var(--color-hover)]" />
              </label>
              <label className="text-sm font-medium">
                Display name
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Finance team" className="mt-1 h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]" />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Description
              <textarea value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} placeholder="What can this role do?" className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]" />
            </label>
            <fieldset>
              <legend className="mb-3 text-sm font-semibold">Permissions</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                {groups.map((group) => (
                  <div key={group.key} className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
                    <h3 className="mb-3 text-sm font-semibold">{group.label}</h3>
                    <div className="space-y-2">
                      {group.permissions.map((permission) => (
                        <label key={permission.key} className="flex min-h-11 items-center gap-3 text-sm text-[var(--color-ink-2)]">
                          <input type="checkbox" checked={form.permissions.includes(permission.key)} onChange={() => togglePermission(permission.key)} className="h-4 w-4 accent-[var(--color-primary)]" />
                          {permission.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="flex justify-end gap-3 border-t border-[var(--color-line)] p-6">
            <button type="button" onClick={onClose} className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-sm font-medium hover:bg-[var(--color-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]">
              <Save className="h-4 w-4" aria-hidden="true" /> {saving ? "Saving..." : isNew ? "Create role" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RolesPage() {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [state, setState] = useState({ loading: true, error: "" });
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  const loadRoles = async () => {
    setState({ loading: true, error: "" });
    try {
      const response = await fetch("/api/admin/roles", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || "Unable to load roles.");
      setRoles(data.roles || []);
      setGroups(data.permissionGroups || []);
      setState({ loading: false, error: "" });
    } catch (error) {
      setState({ loading: false, error: error.message });
    }
  };

  useEffect(() => {
    // Role data is an external resource; load it only after the session is known.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!authLoading && user?.role === "admin") void loadRoles();
  }, [authLoading, user]);

  const filteredRoles = useMemo(() => {
    const value = query.trim().toLowerCase();
    return roles.filter((role) => !value || `${role.name} ${role.key} ${role.description}`.toLowerCase().includes(value));
  }, [roles, query]);

  const saveRole = async (form, isNew) => {
    const response = await fetch("/api/admin/roles", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || data.error || "Unable to save role.");
    await loadRoles();
  };

  const removeRole = async (role) => {
    if (role.isSystem) return;
    const response = await fetch("/api/admin/roles", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: role.key }) });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setState((current) => ({ ...current, error: data.message || "Unable to delete role." }));
      return;
    }
    setDeleteCandidate(null);
    await loadRoles();
  };

  if (authLoading || state.loading) return <main className="p-8" aria-busy="true"><p className="text-sm text-[var(--color-ink-3)]">Loading roles...</p></main>;
  if (!user || user.role !== "admin") return <main className="p-8"><h1 className="text-xl font-semibold">Access restricted</h1><p className="mt-2 text-sm text-[var(--color-ink-3)]">Only administrators can manage roles.</p></main>;

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      <Link href="/" className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--color-ink-3)] hover:text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to dashboard</Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3"><ShieldCheck className="h-7 w-7 text-[var(--color-primary)]" aria-hidden="true" /><h1 className="text-[var(--text-display)] font-semibold">Roles & permissions</h1></div>
          <p className="mt-2 text-sm text-[var(--color-ink-3)]">Manage access through a clear permission ledger. {roles.length} roles configured.</p>
        </div>
        <button type="button" onClick={() => setDialog({ role: null })} className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"><Plus className="h-4 w-4" aria-hidden="true" /> New role</button>
      </div>
      <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-card)] p-4">
        <label htmlFor="role-search" className="sr-only">Search roles</label>
        <input id="role-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, key, or description" className="h-10 w-full max-w-md rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]" />
      </div>
      {state.error && <div role="alert" className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-error)] bg-[var(--color-error-bg)] p-3 text-sm text-[var(--color-error-text)]">{state.error}</div>}
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-card)]">
        <table className="w-full min-w-[700px] text-left text-sm">
          <caption className="sr-only">Configured roles and permissions</caption>
          <thead className="border-b border-[var(--color-line)] bg-[var(--color-hover)] text-xs uppercase tracking-wide text-[var(--color-ink-3)]"><tr><th scope="col" className="p-4">Role</th><th scope="col" className="p-4">Description</th><th scope="col" className="p-4">Permissions</th><th scope="col" className="p-4">Users</th><th scope="col" className="p-4 text-right">Actions</th></tr></thead>
          <tbody>
            {filteredRoles.map((role) => <tr key={role.key} className="border-b border-[var(--color-line)] last:border-0"><th scope="row" className="p-4 font-medium"><div>{role.name} {role.isSystem && <span className="ml-2 rounded-full bg-[var(--color-primary-subtle)] px-2 py-1 text-xs text-[var(--color-primary)]">System</span>}</div><code className="text-xs font-normal text-[var(--color-ink-3)]">{role.key}</code></th><td className="max-w-sm p-4 text-[var(--color-ink-2)]">{role.description || "No description"}</td><td className="p-4"><span className="inline-flex items-center gap-1 text-[var(--color-ink-2)]"><Check className="h-4 w-4 text-[var(--color-success)]" aria-hidden="true" /> {role.permissionCount}</span></td><td className="p-4 text-[var(--color-ink-2)]">{role.userCount}</td><td className="p-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => setDialog({ role: { ...role, permissions: role.permissions || [] } })} className="min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-muted)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]">Edit</button><button type="button" disabled={role.isSystem || role.userCount > 0} onClick={() => setDeleteCandidate(role)} aria-label={`Delete ${role.name} role`} className="min-h-11 rounded-[var(--radius-md)] px-3 text-[var(--color-error)] hover:bg-[var(--color-error-bg)] disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div></td></tr>)}
          </tbody>
        </table>
        {!filteredRoles.length && <p className="p-8 text-center text-sm text-[var(--color-ink-3)]">No roles match your search.</p>}
      </div>
      {dialog && <RoleDialog role={dialog.role} groups={groups} onClose={() => setDialog(null)} onSave={saveRole} />}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-card)] p-6 shadow-[var(--shadow-lg)]" role="dialog" aria-modal="true" aria-labelledby="delete-role-title">
            <h2 id="delete-role-title" className="text-lg font-semibold">Delete {deleteCandidate.name}?</h2>
            <p className="mt-2 text-sm text-[var(--color-ink-3)]">This role cannot be restored. Users must be reassigned before deletion.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteCandidate(null)} className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-sm font-medium hover:bg-[var(--color-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]">Keep role</button>
              <button type="button" onClick={() => removeRole(deleteCandidate)} className="min-h-11 rounded-[var(--radius-md)] bg-[var(--color-error)] px-4 text-sm font-semibold text-[var(--color-on-error)] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]">Delete role</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
