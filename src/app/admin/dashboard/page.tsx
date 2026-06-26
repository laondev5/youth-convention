"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface DOB { day: number; month: number; year: number }

interface Registration {
  _id: string;
  firstName: string;
  surname: string;
  dob: DOB;
  sex: string;
  churchName: string;
  country: string;
  state: string;
  hobbies: string;
  contactPhone: string;
  email: string;
  education: string;
  healthConditions: string;
  registeredAt: string;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDOB(dob: DOB) {
  return `${dob.day} ${MONTHS[dob.month - 1]} ${dob.year}`;
}

const EDUCATION_OPTIONS = ["Secondary School", "University", "Graduate", "Working"];
const SEX_OPTIONS = ["Male", "Female"];

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Registration | null>(null);
  const [editUser, setEditUser] = useState<Registration | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const LIMIT = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/users?search=${encodeURIComponent(search)}&page=${page}&limit=${LIMIT}`
      );
      if (res.status === 401) { router.push("/admin"); return; }
      const data = await res.json();
      setRegistrations(data.registrations);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [search, page, router]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchUsers();
  }, [status, fetchUsers]);

  const handleExport = (format: "csv" | "excel") => {
    window.open(`/api/admin/export?format=${format}`, "_blank");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/admin/users/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    fetchUsers();
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    await fetch(`/api/admin/users/${editUser._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editUser),
    });
    setSaving(false);
    setEditUser(null);
    fetchUsers();
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-xs text-gray-500">LFF Youth Convention</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {session?.user?.name || "Admin"}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/admin" })}
            className="text-sm text-red-500 hover:text-red-700 font-medium transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Total Registrations</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Male</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              {registrations.filter((r) => r.sex === "Male").length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Female</p>
            <p className="text-3xl font-bold text-pink-600 mt-1">
              {registrations.filter((r) => r.sex === "Female").length}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="search"
            placeholder="Search by name, email, or church…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
          />
          <button
            onClick={() => handleExport("csv")}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition whitespace-nowrap"
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport("excel")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition whitespace-nowrap"
          >
            Export Excel
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["#", "Name", "DOB", "Sex", "Church", "Location", "Email", "Phone", "Education", "Actions"].map(
                    (h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-gray-400">
                      Loading…
                    </td>
                  </tr>
                ) : registrations.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-gray-400">
                      No registrations found
                    </td>
                  </tr>
                ) : (
                  registrations.map((r, i) => (
                    <tr key={r._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-gray-400">{(page - 1) * LIMIT + i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {r.firstName} {r.surname}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDOB(r.dob)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${r.sex === "Male" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"}`}>
                          {r.sex}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.churchName}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.state}, {r.country}</td>
                      <td className="px-4 py-3 text-gray-600">{r.email}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.contactPhone}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full font-medium whitespace-nowrap">
                          {r.education}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedUser(r)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => setEditUser({ ...r })}
                            className="text-xs text-yellow-600 hover:text-yellow-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(r._id)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Page {page} of {totalPages} · {total} total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-purple-400 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-purple-400 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">
                {selectedUser.firstName} {selectedUser.surname}
              </h2>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 text-sm">
              {[
                ["Date of Birth", formatDOB(selectedUser.dob)],
                ["Sex", selectedUser.sex],
                ["Church Name", selectedUser.churchName],
                ["Country", selectedUser.country],
                ["State", selectedUser.state],
                ["Email", selectedUser.email],
                ["Phone", selectedUser.contactPhone],
                ["Education", selectedUser.education],
                ["Hobbies", selectedUser.hobbies || "—"],
                ["Health Conditions", selectedUser.healthConditions || "None"],
                ["Registered", new Date(selectedUser.registeredAt).toLocaleDateString()],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 font-medium">{label}</p>
                  <p className="text-gray-800 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Edit Registration</h2>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              {(["firstName", "surname", "churchName", "contactPhone", "email", "country", "state", "hobbies"] as (keyof Registration)[]).map((field) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                    {field.replace(/([A-Z])/g, " $1")}
                  </label>
                  <input
                    value={editUser[field] as string}
                    onChange={(e) => setEditUser((u) => u ? { ...u, [field]: e.target.value } : u)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-400 outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sex</label>
                <select
                  value={editUser.sex}
                  onChange={(e) => setEditUser((u) => u ? { ...u, sex: e.target.value } : u)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-400 outline-none bg-white"
                >
                  {SEX_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Education</label>
                <select
                  value={editUser.education}
                  onChange={(e) => setEditUser((u) => u ? { ...u, education: e.target.value } : u)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-400 outline-none bg-white"
                >
                  {EDUCATION_OPTIONS.map((e) => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Health Conditions</label>
                <textarea
                  value={editUser.healthConditions}
                  onChange={(e) => setEditUser((u) => u ? { ...u, healthConditions: e.target.value } : u)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-400 outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setEditUser(null)}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium disabled:opacity-60 transition"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Delete Registration</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this registration? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-60 transition"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
