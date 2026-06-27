import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Registration, { HOUSES } from "@/lib/models/Registration";
import { sendRegistrationConfirmation } from "@/lib/email";

function assignHouse() {
  return HOUSES[Math.floor(Math.random() * HOUSES.length)];
}

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

    const house = assignHouse();

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
      house,
    });

    try {
      await sendRegistrationConfirmation(email, firstName, house);
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
    }

    return NextResponse.json(
      { message: "Registration successful", id: registration._id, house },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
