"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Uganda", "Tanzania",
  "United Kingdom", "United States", "Canada", "Australia", "Other",
];

const EDUCATION_OPTIONS = [
  "Secondary School",
  "University",
  "Graduate",
  "Working",
] as const;

const SEX_OPTIONS = ["Male", "Female"] as const;

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 60 }, (_, i) => currentYear - i);

interface FormData {
  firstName: string;
  surname: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  sex: string;
  churchName: string;
  country: string;
  state: string;
  hobbies: string;
  contactPhone: string;
  email: string;
  education: string;
  healthConditions: string;
}

const initialForm: FormData = {
  firstName: "",
  surname: "",
  dobDay: "",
  dobMonth: "",
  dobYear: "",
  sex: "",
  churchName: "",
  country: "",
  state: "",
  hobbies: "",
  contactPhone: "",
  email: "",
  education: "",
  healthConditions: "",
};

export default function RegistrationPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          surname: form.surname,
          dob: {
            day: Number(form.dobDay),
            month: Number(form.dobMonth),
            year: Number(form.dobYear),
          },
          sex: form.sex,
          churchName: form.churchName,
          country: form.country,
          state: form.state,
          hobbies: form.hobbies,
          contactPhone: form.contactPhone,
          email: form.email,
          education: form.education,
          healthConditions: form.healthConditions || "None",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push("/success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const selectClass = inputClass + " bg-white";

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
            <span className="text-white text-2xl font-bold">✝</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">LFF Youth Convention</h1>
          <p className="text-gray-500 mt-2">Complete the form below to register</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                placeholder="John"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Surname <span className="text-red-500">*</span>
              </label>
              <input
                name="surname"
                value={form.surname}
                onChange={handleChange}
                required
                placeholder="Doe"
                className={inputClass}
              />
            </div>
          </div>

          {/* DOB */}
          <div>
            <label className={labelClass}>
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <select name="dobDay" value={form.dobDay} onChange={handleChange} required className={selectClass}>
                <option value="">Day</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select name="dobMonth" value={form.dobMonth} onChange={handleChange} required className={selectClass}>
                <option value="">Month</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <select name="dobYear" value={form.dobYear} onChange={handleChange} required className={selectClass}>
                <option value="">Year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sex */}
          <div>
            <label className={labelClass}>
              Sex <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-6">
              {SEX_OPTIONS.map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sex"
                    value={s}
                    checked={form.sex === s}
                    onChange={handleChange}
                    required
                    className="accent-purple-600 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{s}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Church Name */}
          <div>
            <label className={labelClass}>
              Church Name <span className="text-red-500">*</span>
            </label>
            <input
              name="churchName"
              value={form.churchName}
              onChange={handleChange}
              required
              placeholder="Enter your church name"
              className={inputClass}
            />
          </div>

          {/* Church Location */}
          <div>
            <label className={labelClass}>
              Church Location <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select name="country" value={form.country} onChange={handleChange} required className={selectClass}>
                <option value="">Select Country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                required
                placeholder="State / Province"
                className={inputClass}
              />
            </div>
          </div>

          {/* Hobbies */}
          <div>
            <label className={labelClass}>Hobbies</label>
            <input
              name="hobbies"
              value={form.hobbies}
              onChange={handleChange}
              placeholder="e.g. Reading, Football, Music"
              className={inputClass}
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                required
                type="tel"
                placeholder="+234 800 000 0000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Email <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                type="email"
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>
          </div>

          {/* Education */}
          <div>
            <label className={labelClass}>
              Education Level <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {EDUCATION_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className={`flex items-center justify-center text-center border rounded-lg px-3 py-2.5 cursor-pointer text-sm transition ${
                    form.education === opt
                      ? "border-purple-500 bg-purple-50 text-purple-700 font-medium"
                      : "border-gray-200 text-gray-600 hover:border-purple-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="education"
                    value={opt}
                    checked={form.education === opt}
                    onChange={handleChange}
                    required
                    className="sr-only"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {/* Health */}
          <div>
            <label className={labelClass}>Any Health Conditions?</label>
            <textarea
              name="healthConditions"
              value={form.healthConditions}
              onChange={handleChange}
              rows={3}
              placeholder='Leave blank if you have no health conditions'
              className={inputClass + " resize-none"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition text-sm"
          >
            {loading ? "Submitting…" : "Register Now"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Admin?{" "}
          <a href="/admin" className="text-purple-600 hover:underline">
            Login here
          </a>
        </p>
      </div>
    </main>
  );
}
