# ⛓️ ChainReaction: Securing Real-World Data on the Blockchain

Welcome to the **ChainReaction Workshop** repository! This project provides a complete, 4-layer architecture demonstrating how physical IoT data (simulated edge hardware) can automatically trigger financial penalties on a blockchain smart contract.

---

## 🎓 Participant Guide (Workshop Flow)

Welcome to the workshop! Follow these step-by-step instructions to get your IoT & Web3 pipeline running.

### Step 1: Install MetaMask
1. Go to [MetaMask.io](https://metamask.io/) and install the browser extension for Chrome, Firefox, Brave, or Edge.
2. Follow the setup instructions to create a new wallet. **Save your secret recovery phrase securely.**
3. Open MetaMask, click the network dropdown at the top left, toggle "Show test networks", and select **Sepolia**.

### Step 2: Get Sepolia Test ETH
To deploy a contract and pay for gas fees, you need Testnet ETH.
1. Go to a Sepolia Faucet (e.g., [Alchemy Sepolia Faucet](https://sepoliafaucet.com/) or [Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/)).
2. Copy your MetaMask wallet address (starts with `0x...`) and paste it into the faucet to receive test ETH.
3. Wait a minute or two until you see the ETH arrive in your MetaMask balance.

### Step 3: Deploy the Smart Contract
1. Head to [Remix IDE](https://remix.ethereum.org/).
2. Under the "contracts" folder, create a new file named `CarbonTracker.sol`.
3. Paste in the provided Solidity code for the workshop (`ChainReaction.sol`).
4. Go to the "Solidity Compiler" tab on the left (the 'S' icon) and click **Compile CarbonTracker.sol**.
5. Go to the "Deploy & Run Transactions" tab (Ethereum logo with arrow).
6. Change the Environment dropdown from "Remix VM" to **Injected Provider - MetaMask**. MetaMask will pop up; approve the connection.
7. Click **Deploy**. MetaMask will ask you to confirm and pay gas fees. Click Confirm.
8. Once deployed, find your contract under "Deployed Contracts" (bottom left) and **copy the Contract Address**.

### Step 4: Run the IoT Edge Device
1. Open the Wokwi Simulator link provided by the workshop organizer.
2. In the `sketch.ino` file, change `String teamName = "yourteamname";` to a unique team identifier.
3. Click the Play button ("Start Simulation"). As you slide the potentiometer, you should see emissions data printing to the serial monitor in real-time.

### Step 5: Connect to the Web3 Dashboard
1. Open the Dashboard link provided by the organizer (or run it locally by opening `index.html`).
2. Click **Connect MetaMask** (ensure you are on the Sepolia network).
3. Paste your deployed **Contract Address** from Step 3 and your **Wokwi Device ID** (team name) from Step 4.
4. Click **Initialize Dashboard**.

### Step 6: Trigger the Reaction & Verify
1. Go back to the Wokwi tab and slide the potentiometer above the 100 ppm limit.
2. Switch to the Dashboard tab. It will instantly turn red, and MetaMask will pop up asking you to sign a transaction to deduct your carbon credits as a penalty!
3. Click **Confirm** in MetaMask.
4. Once the transaction processes, click the transaction hash link in the dashboard to view it on [Sepolia Etherscan](https://sepolia.etherscan.io/). You can see the blockchain permanently recording your physical penalty transaction on the public ledger!

---

## 🛠️ Organizer Setup Guide

If you are running the workshop, follow these steps *before* the students arrive to set up the infrastructure.

### 1. Set up Firebase (Realtime Database)
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Create a **Realtime Database** (Test Mode is fine for a workshop).
3. Set the database rules to allow public read/write:
```json
{
  "rules": {
    ".read": "true",
    ".write": "true"
  }
}
```
4. Copy your Database URL (e.g., `https://your-project-default-rtdb.firebaseio.com/`).
5. Open `index.html` and update `firebaseConfig.databaseURL` to your new URL.
6. Open `sketch.ino` (IoT code) and update `firebaseUrl` to match.

### 2. Prepare the Wokwi ESP32 Project
1. Create a free account on [Wokwi](https://wokwi.com/) and create a new ESP32 WiFi project.
2. Add a Slide Potentiometer (wired to pin `34`) and an LED (wired to pin `2`).
3. Paste the code from `sketch.ino` into the Wokwi sketch editor.
4. Save the Wokwi project and get the **public share link** to distribute to students.

### 3. Deploy the Dashboard
You can deploy the Vanilla HTML dashboard via **GitHub Pages**:
1. Fork this repository.
2. Go to Repository Settings -> Pages, and select deploy from the `main` branch.
3. Share the resulting link with students.

*(Alternatively, you can run the provided Next.js application by compiling the `src/` directory with `npm install` and `npm run dev`).*

---

## 🏗️ Technical Pipeline / Architecture Overview

This project is broken down into 4 synchronized layers:

1. **The Edge Layer (Hardware Simulation):** An ESP32 microcontroller with a simulated CO₂ sensor (potentiometer), running on Wokwi's simulator environment.
2. **The Cloud Middleware (Firebase):** A Firebase Realtime Database that acts as a low-latency cache. The ESP32 pushes data here continuously via REST API (`PUT` requests).
3. **The Web3 Bridge (Dashboard):** A javascript dashboard powered by `ethers.js v6`. It listens to Firebase for real-time sensor updates. When emissions cross `100 ppm`, it mathematically calculates a penalty metric and triggers a smart contract write operation.
4. **The Blockchain Layer (Smart Contract):** A concise Solidity contract (`ChainReaction.sol`) deployed to the logic-layer of the Sepolia Ethereum Testnet. It natively manages and safeguards the "Carbon Credits", subtracting credits automatically when penalized by the web dashboard bridge.

## 🔒 Safety & Rate Limits built into the code
- **Firmware Dead-band Filter:** The ESP32 only pushes data to Firebase when the hardware reading changes by more than ±2.
- **Transaction Throttling:** The dashboard integrates an explicit 5-second automatic denounce lock to prevent MetaMask prompt spam if the hardware sensor stays high indiscriminately.
- **Penalty Caps:** Penalties are logically capped both on the frontend (`max 500`) and the smart contract (`require(penalty <= 500)`) to protect against accidental credit wipes and execution reverts.
