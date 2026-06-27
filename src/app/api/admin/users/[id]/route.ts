import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import Registration from "@/lib/models/Registration";
import { sendPaymentConfirmation } from "@/lib/email";
import type { House } from "@/lib/models/Registration";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  await connectDB();
  const { id } = await params;
  const registration = await Registration.findById(id);
  if (!registration) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(registration);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  await connectDB();
  const { id } = await params;
  const body = await req.json();

  const prevDoc = await Registration.findById(id);
  if (!prevDoc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await Registration.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Send confirmation email when status changes to paid
  if (body.status === "paid" && prevDoc.status !== "paid") {
    try {
      await sendPaymentConfirmation(
        updated.email,
        updated.firstName,
        updated.house as House,
        updated.registrationId
      );
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  await connectDB();
  const { id } = await params;
  const deleted = await Registration.findByIdAndDelete(id);

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "Deleted successfully" });
}
