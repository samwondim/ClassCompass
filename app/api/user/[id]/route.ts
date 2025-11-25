
import { PrismaClient, User } from '@/generated/prisma'
import prisma from '@/models/client';
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No data provided for update' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: id },
      data: body,
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: any) {
    console.error('Error updating user:', error);

    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {

  try {

    const { id } = params;

    const deletedUser = await prisma.user.delete({
      where: { user_id: id },
    });

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (error) {

    console.error('Error updating user:', error);

    return NextResponse.json(
      { error: 'Failed to delete user', details: error.message },
      { status: 500 }
    );
  }

}
