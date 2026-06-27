import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Registration, { HOUSES } from "@/lib/models/Registration";

function assignHouse() {
  return HOUSES[Math.floor(Math.random() * HOUSES.length)];
}

function generateRegistrationId(): string {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const suffix = Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `LFF${year}-${suffix}`;
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
      parentGuardianName,
      parentGuardianPhone,
    } = body;

    const house = assignHouse();

    // Retry once if registrationId collides (extremely unlikely)
    let registrationId = generateRegistrationId();
    let registration;
    try {
      registration = await Registration.create({
        registrationId,
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
        parentGuardianName: parentGuardianName || "",
        parentGuardianPhone: parentGuardianPhone || "",
        house,
        status: "pending",
      });
    } catch (err: unknown) {
      const mongoErr = err as { code?: number };
      if (mongoErr?.code === 11000) {
        registrationId = generateRegistrationId();
        registration = await Registration.create({
          registrationId,
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
          parentGuardianName: parentGuardianName || "",
          parentGuardianPhone: parentGuardianPhone || "",
          house,
          status: "pending",
        });
      } else {
        throw err;
      }
    }

    return NextResponse.json(
      { message: "Registration saved", id: registration._id, registrationId },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
