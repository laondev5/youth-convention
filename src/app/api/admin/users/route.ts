import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import Registration from "@/lib/models/Registration";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const query = search
    ? {
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { surname: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { churchName: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const [registrations, total] = await Promise.all([
    Registration.find(query).sort({ registeredAt: -1 }).skip(skip).limit(limit),
    Registration.countDocuments(query),
  ]);

  return NextResponse.json({ registrations, total, page, limit });
}
