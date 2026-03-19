import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ethers } from "ethers";

const CONTRACT_ABI = [
  "function checkEmissions(uint256 co2_level) external",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, co2_level } = body;

    if (!companyId || co2_level === undefined) {
      return NextResponse.json(
        { error: "companyId and co2_level are required" },
        { status: 400 }
      );
    }

    // Find the user by companyId (which is the user's UUID)
    const user = await prisma.user.findUnique({
      where: { id: companyId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Save sensor data to the database
    const sensorData = await prisma.sensorData.create({
      data: {
        co2Level: co2_level,
        userId: user.id,
      },
    });

    // Web3 Logic: If CO2 > 500 and user has a contract address
    let txHash: string | null = null;
    if (co2_level > 500 && user.contractAddress) {
      try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
        const contract = new ethers.Contract(
          user.contractAddress,
          CONTRACT_ABI,
          wallet
        );

        const tx = await contract.checkEmissions(co2_level);
        await tx.wait();
        txHash = tx.hash;

        console.log(
          `[Web3] checkEmissions called for ${user.companyName} | CO2: ${co2_level} | TX: ${txHash}`
        );
      } catch (web3Error) {
        console.error("[Web3] Contract call failed:", web3Error);
        // Don't fail the whole request — sensor data is already saved
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sensor data saved for ${user.companyName}`,
      sensorDataId: sensorData.id,
      co2Level: co2_level,
      web3Triggered: co2_level > 500 && !!user.contractAddress,
      txHash,
    });
  } catch (error) {
    console.error("[API/sensor] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
