import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Registration from "@/lib/models/Registration";
import { sendRegistrationConfirmation } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      firstName,
      surname,
      dob,
      sex,
      churchName,
      country,
      state,
      hobbies,
      contactPhone,
      email,
      education,
      healthConditions,
    } = body;

    const registration = await Registration.create({
      firstName,
      surname,
      dob,
      sex,
      churchName,
      country,
      state,
      hobbies: hobbies || "",
      contactPhone,
      email,
      education,
      healthConditions: healthConditions || "None",
    });

    // Send confirmation email (don't fail the request if email errors)
    try {
      await sendRegistrationConfirmation(email, firstName);
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
    }

    return NextResponse.json(
      { message: "Registration successful", id: registration._id },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
