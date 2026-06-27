"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface DOB { day: number; month: number; year: number }
type House = "FIRE" | "WATER" | "WIND" | "ICE";
type Status = "pending" | "paid";

const HOUSE_STYLES: Record<House, { badge: string; card: string; text: string }> = {
  FIRE:  { badge: "bg-red-100 text-red-700",   card: "border-red-200 bg-red-50",   text: "text-red-600" },
  WATER: { badge: "bg-blue-100 text-blue-700",  card: "border-blue-200 bg-blue-50",  text: "text-blue-600" },
  WIND:  { badge: "bg-green-100 text-green-700",card: "border-green-200 bg-green-50",text: "text-green-600" },
  ICE:   { badge: "bg-sky-100 text-sky-700",    card: "border-sky-200 bg-sky-50",    text: "text-sky-600" },
};

const HOUSE_EMOJIS: Record<House, string> = {
  FIRE: "🔥", WATER: "💧", WIND: "🌬️", ICE: "❄️",
};

interface Registration {
  _id: string;
  registrationId: string;
  firstName: string;
  surname: string;
  dob: DOB;
  sex: string;
  house: House;
  status: Status;
  churchName: string;
  country: string;
  state: string;
  hobbies: string;
  contactPhone: string;
  email: string;
  education: string;
  healthConditions: string;
  parentGuardianName: string;
  parentGuardianPhone: string;
  registeredAt: string;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function formatDOB(dob: DOB) { return `${dob.day} ${MONTHS[dob.month - 1]} ${dob.year}`; }

const EDUCATION_OPTIONS = ["Secondary School", "University", "Graduate", "Working"];
const SEX_OPTIONS = ["Male", "Female"];
const HOUSES: House[] = ["FIRE", "WATER", "WIND", "ICE"];

export function DashboardClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [allStats, setAllStats] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"overview" | "registrations">("overview");

  const [selectedUser, setSelectedUser] = useState<Registration | null>(null);
  const [editUser, setEditUser] = useState<Registration | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [markPaidId, setMarkPaidId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  const LIMIT = 15;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search, page: String(page), limit: String(LIMIT),
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      });
      const [res, statsRes] = await Promise.all([
        fetch(`/api/admin/users?${params}`),
        fetch(`/api/admin/users?limit=9999`),
      ]);
      if (res.status === 401) { router.push("/admin"); return; }
      const data = await res.json();
      const statsData = await statsRes.json();
      setRegistrations(data.registrations);
      setTotal(data.total);
      setAllStats(statsData.registrations);
    } finally {
      setLoading(false);
    }
  }, [search, page, statusFilter, router]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchUsers();
  }, [status, fetchUsers]);

  const handleExport = (format: "csv" | "excel") => window.open(`/api/admin/export?format=${format}`, "_blank");

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/admin/users/${deleteId}`, { method: "DELETE" });
    setDeleting(false); setDeleteId(null); fetchUsers();
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    await fetch(`/api/admin/users/${editUser._id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editUser),
    });
    setSaving(false); setEditUser(null); fetchUsers();
  };

  const handleMarkPaid = async () => {
    if (!markPaidId) return;
    setMarkingPaid(true);
    await fetch(`/api/admin/users/${markPaidId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    setMarkingPaid(false); setMarkPaidId(null); fetchUsers();
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
      </div>
    );
  }

  // Derived stats from allStats
  const totalAll = allStats.length;
  const paidCount = allStats.filter((r) => r.status === "paid").length;
  const pendingCount = allStats.filter((r) => r.status === "pending").length;
  const maleCount = allStats.filter((r) => r.sex === "Male").length;
  const femaleCount = allStats.filter((r) => r.sex === "Female").length;
  const houseCounts = HOUSES.reduce((acc, h) => ({ ...acc, [h]: allStats.filter((r) => r.house === h).length }), {} as Record<House, number>);

  const recentRegistrations = [...allStats]
    .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
    .slice(0, 5);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-100">
          <Image src="/logo.png" alt="LFF Logo" width={80} height={80} className="object-contain mb-2" style={{ width: 80, height: "auto" }} />
          <p className="text-xs text-gray-500 font-medium">Youth Convention Admin</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveView("overview")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              activeView === "overview"
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Overview
          </button>
          <button
            onClick={() => setActiveView("registrations")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              activeView === "registrations"
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Registrations
            <span className="ml-auto bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">{totalAll}</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-700 text-xs font-bold">A</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{session?.user?.name || "Admin"}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin" })}
            className="w-full flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium transition px-2 py-1.5 rounded-lg hover:bg-red-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {activeView === "overview" ? "Dashboard Overview" : "All Registrations"}
            </h1>
            <p className="text-xs text-gray-400">LFF Youth Convention 2026</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleExport("csv")} className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition font-medium">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              CSV
            </button>
            <button onClick={() => handleExport("excel")} className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg transition font-medium">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Excel
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* ── OVERVIEW ── */}
          {activeView === "overview" && (
            <div className="space-y-8">
              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { label: "Total Registered", value: totalAll, icon: "👥", color: "bg-purple-600", light: "bg-purple-50 text-purple-700" },
                  { label: "Paid", value: paidCount, icon: "✅", color: "bg-green-600", light: "bg-green-50 text-green-700" },
                  { label: "Pending Payment", value: pendingCount, icon: "⏳", color: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700" },
                  { label: "Conversion Rate", value: totalAll > 0 ? `${Math.round((paidCount / totalAll) * 100)}%` : "0%", icon: "📊", color: "bg-indigo-600", light: "bg-indigo-50 text-indigo-700" },
                ].map((card) => (
                  <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-6 flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${card.color} shadow-sm`}>
                      {card.icon}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                      <p className="text-3xl font-black text-gray-900 mt-0.5">{card.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gender + House row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gender breakdown */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Gender Breakdown</h3>
                  <div className="flex gap-6 mb-4">
                    <div className="flex-1 bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-4xl font-black text-blue-600">{maleCount}</p>
                      <p className="text-sm text-blue-700 font-medium mt-1">Male</p>
                    </div>
                    <div className="flex-1 bg-pink-50 rounded-xl p-4 text-center">
                      <p className="text-4xl font-black text-pink-600">{femaleCount}</p>
                      <p className="text-sm text-pink-700 font-medium mt-1">Female</p>
                    </div>
                  </div>
                  {totalAll > 0 && (
                    <div className="h-3 rounded-full overflow-hidden bg-gray-100 flex">
                      <div className="bg-blue-500 transition-all" style={{ width: `${(maleCount / totalAll) * 100}%` }} />
                      <div className="bg-pink-500 transition-all" style={{ width: `${(femaleCount / totalAll) * 100}%` }} />
                    </div>
                  )}
                </div>

                {/* House breakdown */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">House Distribution</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {HOUSES.map((h) => (
                      <div key={h} className={`rounded-xl p-4 border ${HOUSE_STYLES[h].card} flex items-center gap-3`}>
                        <span className="text-2xl">{HOUSE_EMOJIS[h]}</span>
                        <div>
                          <p className={`text-2xl font-black ${HOUSE_STYLES[h].text}`}>{houseCounts[h]}</p>
                          <p className={`text-xs font-bold ${HOUSE_STYLES[h].text}`}>House {h}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent registrations */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">Recent Registrations</h3>
                  <button onClick={() => setActiveView("registrations")} className="text-xs text-purple-600 hover:underline font-medium">View all →</button>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Reg ID","Name","House","Status","Registered"].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentRegistrations.map((r) => (
                      <tr key={r._id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-mono text-xs text-purple-700 font-bold">{r.registrationId}</td>
                        <td className="px-6 py-3 font-medium text-gray-900">{r.firstName} {r.surname}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${HOUSE_STYLES[r.house].badge}`}>
                            {HOUSE_EMOJIS[r.house]} {r.house}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${r.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {r.status === "paid" ? "✓ Paid" : "⏳ Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-400">{new Date(r.registeredAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── REGISTRATIONS TABLE ── */}
          {activeView === "registrations" && (
            <div className="space-y-5">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="search"
                    placeholder="Search by name, email, ID or church…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as "all" | Status); setPage(1); }}
                  className="rounded-xl border border-gray-300 bg-white text-gray-900 px-4 py-2.5 text-sm focus:border-purple-500 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="paid">✓ Paid</option>
                </select>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {["#","Reg ID","Status","Name","Sex","House","Church","Email","Phone","Education","Actions"].map((h) => (
                          <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading ? (
                        <tr><td colSpan={11} className="text-center py-16">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
                        </td></tr>
                      ) : registrations.length === 0 ? (
                        <tr><td colSpan={11} className="text-center py-16 text-gray-400">No registrations found</td></tr>
                      ) : (
                        registrations.map((r, i) => (
                          <tr key={r._id} className="hover:bg-gray-50 transition">
                            <td className="px-5 py-4 text-gray-400 text-xs">{(page - 1) * LIMIT + i + 1}</td>
                            <td className="px-5 py-4 font-mono text-xs font-bold text-purple-700 whitespace-nowrap">{r.registrationId}</td>
                            <td className="px-5 py-4">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${r.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                {r.status === "paid" ? "✓ Paid" : "⏳ Pending"}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">{r.firstName} {r.surname}</td>
                            <td className="px-5 py-4">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${r.sex === "Male" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}>{r.sex}</span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${HOUSE_STYLES[r.house].badge}`}>
                                {HOUSE_EMOJIS[r.house]} {r.house}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-gray-600 text-xs whitespace-nowrap">{r.churchName}</td>
                            <td className="px-5 py-4 text-gray-600 text-xs">{r.email}</td>
                            <td className="px-5 py-4 text-gray-600 text-xs whitespace-nowrap">{r.contactPhone}</td>
                            <td className="px-5 py-4 text-xs">
                              <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">{r.education}</span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-1.5">
                                <button onClick={() => setSelectedUser(r)} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                  View
                                </button>
                                <button onClick={() => setEditUser({ ...r })} className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                  Edit
                                </button>
                                {r.status === "pending" && (
                                  <button onClick={() => setMarkPaidId(r._id)} className="text-xs text-green-600 hover:text-green-800 font-medium flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                    Mark Paid
                                  </button>
                                )}
                                <button onClick={() => setDeleteId(r._id)} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
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

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-500">Page {page} of {totalPages} · {total} total</p>
                    <div className="flex gap-2">
                      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-xs px-3.5 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-purple-400 bg-white transition">← Prev</button>
                      <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-xs px-3.5 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-purple-400 bg-white transition">Next →</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── MODALS ── */}

      {/* View */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">{selectedUser.firstName} {selectedUser.surname}</h2>
                <p className="text-xs font-mono text-purple-600 mt-0.5">{selectedUser.registrationId}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none mt-1">×</button>
            </div>
            <div className="p-6">
              <div className="flex gap-3 mb-5">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedUser.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {selectedUser.status === "paid" ? "✓ Paid" : "⏳ Pending"}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${HOUSE_STYLES[selectedUser.house].badge}`}>
                  {HOUSE_EMOJIS[selectedUser.house]} House {selectedUser.house}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {([
                  ["Date of Birth", formatDOB(selectedUser.dob)],
                  ["Sex", selectedUser.sex],
                  ["Church", selectedUser.churchName],
                  ["Country", selectedUser.country],
                  ["State", selectedUser.state],
                  ["Email", selectedUser.email],
                  ["Phone", selectedUser.contactPhone],
                  ["Education", selectedUser.education],
                  ["Hobbies", selectedUser.hobbies || "—"],
                  ["Health Conditions", selectedUser.healthConditions || "None"],
                  ["Parent/Guardian", selectedUser.parentGuardianName || "—"],
                  ["Guardian Phone", selectedUser.parentGuardianPhone || "—"],
                  ["Registered", new Date(selectedUser.registeredAt).toLocaleDateString()],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                    <p className="text-gray-800 mt-0.5 text-sm break-all">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Edit Registration</h2>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              {(["firstName","surname","churchName","contactPhone","email","country","state","hobbies","parentGuardianName","parentGuardianPhone"] as (keyof Registration)[]).map((field) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    {field.replace(/([A-Z])/g, " $1")}
                  </label>
                  <input
                    value={editUser[field] as string}
                    onChange={(e) => setEditUser((u) => u ? { ...u, [field]: e.target.value } : u)}
                    className="w-full rounded-xl border border-gray-200 bg-white text-gray-900 px-4 py-2.5 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Sex</label>
                <select value={editUser.sex} onChange={(e) => setEditUser((u) => u ? { ...u, sex: e.target.value } : u)} className="w-full rounded-xl border border-gray-200 bg-white text-gray-900 px-4 py-2.5 text-sm focus:border-purple-400 outline-none">
                  {SEX_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Education</label>
                <select value={editUser.education} onChange={(e) => setEditUser((u) => u ? { ...u, education: e.target.value } : u)} className="w-full rounded-xl border border-gray-200 bg-white text-gray-900 px-4 py-2.5 text-sm focus:border-purple-400 outline-none">
                  {EDUCATION_OPTIONS.map((e) => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Health Conditions</label>
                <textarea value={editUser.healthConditions} onChange={(e) => setEditUser((u) => u ? { ...u, healthConditions: e.target.value } : u)} rows={3} className="w-full rounded-xl border border-gray-200 bg-white text-gray-900 px-4 py-2.5 text-sm focus:border-purple-400 outline-none resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditUser(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold disabled:opacity-60 transition">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Paid */}
      {markPaidId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-5">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Confirm Payment</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will mark the registration as <strong className="text-green-700">Paid</strong> and send a confirmation email with their Registration ID and house assignment.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setMarkPaidId(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleMarkPaid} disabled={markingPaid} className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-60 transition">
                {markingPaid ? "Updating…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-5">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Delete Registration</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone. The record will be permanently removed.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60 transition">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
