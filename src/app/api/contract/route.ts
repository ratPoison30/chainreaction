import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { contractAddress } = await req.json();

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { contractAddress },
    });

    return NextResponse.json({
      success: true,
      contractAddress: updatedUser.contractAddress,
    });
  } catch (error) {
    console.error("[API/contract] Error:", error);
    return NextResponse.json(
      { error: "Failed to update contract address" },
      { status: 500 }
    );
  }
}
