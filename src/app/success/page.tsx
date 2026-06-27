import Link from "next/link";

const HOUSE_STYLES: Record<string, { bg: string; border: string; text: string; emoji: string }> = {
  FIRE:  { bg: "bg-red-50",   border: "border-red-400",   text: "text-red-700",   emoji: "🔥" },
  WATER: { bg: "bg-blue-50",  border: "border-blue-400",  text: "text-blue-700",  emoji: "💧" },
  WIND:  { bg: "bg-green-50", border: "border-green-400", text: "text-green-700", emoji: "🌬️" },
  ICE:   { bg: "bg-sky-50",   border: "border-sky-400",   text: "text-sky-700",   emoji: "❄️" },
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ house?: string }>;
}) {
  const { house } = await searchParams;
  const houseKey = house?.toUpperCase() ?? "";
  const houseStyle = HOUSE_STYLES[houseKey];

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Registration Successful!
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Thank you for registering for the LFF Youth Convention. A confirmation
            email has been sent to your inbox.
          </p>

          {houseStyle && (
            <div className={`rounded-xl p-5 mb-6 border-2 ${houseStyle.bg} ${houseStyle.border}`}>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
                Your House Assignment
              </p>
              <p className="text-4xl mb-1">{houseStyle.emoji}</p>
              <p className={`text-2xl font-black tracking-widest ${houseStyle.text}`}>
                HOUSE {houseKey}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                This has also been included in your confirmation email.
              </p>
            </div>
          )}

          <div className="bg-purple-50 rounded-xl p-4 mb-6">
            <p className="text-purple-700 text-sm font-medium">
              God bless you and see you at the convention!
            </p>
          </div>

          <Link
            href="/"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
