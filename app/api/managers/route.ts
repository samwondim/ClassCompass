
import prisma from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { first_name, last_name, phone_number, tg_username, section_id } =
      await request.json();

    // Basic required field validation
    if (!first_name || !phone_number || !section_id) {
      return NextResponse.json(
        { error: "First name, phone number, and section are required" },
        { status: 400 }
      );
    }

    if (!tg_username) {
      return NextResponse.json(
        { error: "Telegram Username is required" },
        { status: 400 }
      );
    }

    // Sanitization
    const sanitizedFirstName = first_name.trim();
    const sanitizedLastName = last_name ? last_name.trim() : null;
    const sanitizedtgUsername = tg_username.trim();
    const sanitizedPhone = phone_number.trim().replace(/\s/g, "");

    if (sanitizedFirstName.length < 2 || sanitizedFirstName.length > 100) {
      return NextResponse.json(
        { error: "First name must be between 2 and 100 characters" },
        { status: 400 }
      );
    }

    // Prevent duplicate manager by telegram username
    const existingManager = await prisma.managerSection.findFirst({
      where: {
        manager: {
          tg_username: sanitizedtgUsername,
        },
      },
      include: {
        manager: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            tg_username: true,
          },
        },
        section: {
          select: {
            section_id: true,
            section_name: true,
          },
        },
      },
    });

    if (existingManager) {
      const m = existingManager.manager;
      return NextResponse.json(
        {
          error: `Manager ${m.first_name} ${m.last_name ?? ""} already exists.`,
        },
        { status: 409 }
      );
    }

    // Validate section existence
    const section = await prisma.section.findUnique({
      where: { section_id },
    });

    if (!section) {
      return NextResponse.json(
        { error: "Invalid section ID" },
        { status: 400 }
      );
    }

    // Create manager and link to a section
    const manager = await prisma.managerSection.create({
      data: {
        manager: {
          create: {
            first_name: sanitizedFirstName,
            last_name: sanitizedLastName,
            phone_number: sanitizedPhone,
            tg_username: sanitizedtgUsername,
            user_role: "MANAGER",
          },
        },
        section: {
          connect: { section_id: section_id },
        },
      },
    });

    return NextResponse.json({ manager }, { status: 201 });
  } catch (error) {
    console.error("Create manager error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
