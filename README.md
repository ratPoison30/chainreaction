# ⛓️ ChainReaction: Securing Real-World Data on the Blockchain

Welcome to the **ChainReaction Workshop** repository! This project provides a complete, 4-layer architecture demonstrating how physical IoT data (simulated edge hardware) can automatically trigger financial penalties on a blockchain smart contract.

You can use this repository to run a 2-hour beginner-friendly Web3 + IoT engineering workshop.

---

## 🏗️ Architecture Overview

The system is broken down into 4 layers:

1. **The Edge Layer (Hardware Simulation):** An ESP32 microcontroller with a simulated CO₂ sensor (potentiometer), running on the [Wokwi browser simulator](https://wokwi.com/).
2. **The Cloud Middleware (Firebase):** A Firebase Realtime Database that acts as a low-latency cache. The ESP32 pushes data here every 200ms.
3. **The Web3 Bridge (Dashboard):** A vanilla HTML/JS dashboard hosted on GitHub pages. It listens to Firebase instantly and communicates via MetaMask.
4. **The Blockchain Layer (Smart Contract):** A Solidity contract deployed to the Sepolia Ethereum Testnet that manages the team's "Carbon Credits."

When emissions cross `100 ppm`, the Web3 Bridge automatically intercepts the data and prompts the user's MetaMask to invoke the penalty function on the blockchain.

---

## 🛠️ Organizer Setup Guide

If you are organizing the workshop, follow these steps *before* the students arrive:

### 1. Set up Firebase
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Under "Build", select **Realtime Database** and create a database (Test Mode is fine).
3. Set the database rules to allow public read/write for the duration of the workshop:
```json
{
  "rules": {
    ".read": "true",
    ".write": "true"
  }
}
```
4. Copy your Database URL (e.g., `https://your-project-default-rtdb.firebaseio.com/`).
5. Open `index.html` and update the `firebaseConfig.databaseURL` on line 757.
6. Open `firmware.ino` and update the `firebaseUrl` variable to match your new URL.

### 2. Prepare the Wokwi ESP32 Project
1. Create a free account on [Wokwi](https://wokwi.com/).
2. Create a new ESP32 WiFi project.
3. Add a Slide Potentiometer and an LED to the breadboard.
4. Wire the Potentiometer to pin `34` and the LED to pin `2`.
5. Paste the code from `firmware.ino` into the `sketch.ino` file on Wokwi.
6. Save the Wokwi project and get the public share link. You will give this link to your students.

### 3. Deploy the Dashboard
The easiest way to share the dashboard (`index.html`) is via GitHub Pages.
1. Fork or upload this repository to your GitHub account.
2. Go to Repository Settings -> Pages, and select deploy from the `main` branch.
3. Share the resulting link (e.g., `https://yourusername.github.io/chainreaction`) with your students.

---

## 🎓 Workshop Flow (For Students)

During the workshop, students will do the following:

1. **Deploy the Smart Contract**
   - Head to [Remix IDE](https://remix.ethereum.org/).
   - Create a file `CarbonTracker.sol` and paste in the provided Solidity code.
   - Compile and deploy to the **Sepolia Testnet** using their MetaMask wallet.
   - Copy the deployed **Contract Address**.

2. **Run the Edge Device**
   - Open the Wokwi link provided by the organizer.
   - Change `String teamName = "ratpoison";` to their unique team ID.
   - Click "Start Simulation". As they slide the potentiometer, they should see emissions data printing to the serial monitor.

3. **Bridge the Gap**
   - Open the `index.html` dashboard.
   - Connect MetaMask (ensure it is on the Sepolia network).
   - Paste in their deployed **Contract Address** and their **Device ID** (the team name from step 2).
   - Click **Initialize Contract**.

4. **Trigger the Reaction**
   - On the Wokwi tab, slide the potentiometer above 100 ppm.
   - Instantly, the dashboard will turn red and MetaMask will pop up, asking the student to sign a transaction to deduct their credits!

---

## 🔒 Safety & Rate Limits
- **Firmware Dead-band Filter:** The ESP32 only pushes data to Firebase when the reading changes by more than ±2. This prevents blowing through Firebase's free tier quotas.
- **Transaction Throttling:** The dashboard will only trigger one MetaMask popup at a time. It waits for the transaction to confirm on-chain (12-24 seconds) before assessing if another penalty needs to be applied, preventing popup spam.
- **Penalty Caps:** The smart contract prevents penalties larger than 500 per transaction to protect against accidental balance wipes.
