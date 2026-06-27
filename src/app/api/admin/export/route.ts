import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import Registration, { IRegistration } from "@/lib/models/Registration";
import * as XLSX from "xlsx";

function flattenRecord(r: IRegistration) {
  return {
    "First Name": r.firstName,
    Surname: r.surname,
    DOB: `${r.dob.day}/${r.dob.month}/${r.dob.year}`,
    Sex: r.sex,
    House: r.house,
    "Church Name": r.churchName,
    Country: r.country,
    State: r.state,
    Hobbies: r.hobbies,
    "Contact Phone": r.contactPhone,
    Email: r.email,
    Education: r.education,
    "Health Conditions": r.healthConditions,
    "Registered At": new Date(r.registeredAt).toLocaleString(),
  };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const registrations = await Registration.find().sort({ registeredAt: -1 });
  const rows = registrations.map(flattenRecord);

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "csv";

  if (format === "excel") {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registrations");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="lff-youth-registrations.xlsx"',
      },
    });
  }

  // CSV
  if (rows.length === 0) {
    return new NextResponse("No data", {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition":
          'attachment; filename="lff-youth-registrations.csv"',
      },
    });
  }

  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => `"${String((r as Record<string, string>)[h]).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];
  const csv = csvRows.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition":
        'attachment; filename="lff-youth-registrations.csv"',
    },
  });
}
