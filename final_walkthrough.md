# ChainReaction — Full Pipeline Explanation

## The Big Picture (One-Liner)
> A physical IoT sensor detects high CO₂ emissions and **automatically deducts carbon credits on the Ethereum blockchain** — no human intervention needed.

---

## The 4 Layers

### Layer 1: The Edge Device (ESP32 on Wokwi)
**File:** [sketch.ino](file:///c:/Users/ratik/Desktop/chainreaction/sketch.ino) · **Tech:** Arduino C++ on ESP32 · **Platform:** Wokwi Simulator

- A simulated ESP32 microcontroller reads a **potentiometer** (acting as a CO₂ sensor) on analog pin 34.
- It maps the raw 12-bit ADC value (0–4095) to a realistic **50–150 ppm** emissions range.
- A **dead-band filter** (±2 ppm) prevents flooding — the device only pushes to the cloud when the reading *actually changes*.
- On every meaningful change, it sends a `PUT` request to Firebase with `{"emissions": <value>}`.
- An LED blinks briefly on each successful sync for physical feedback.

**Data flow:** `Potentiometer → analogRead() → map(50-150) → HTTP PUT → Firebase`

---

### Layer 2: The Cloud Middleware (Firebase Realtime Database)
**Tech:** Firebase RTDB (Google) · **Protocol:** REST API (from ESP32), WebSocket (to Dashboard)

- Firebase acts as a **low-latency cache** between the hardware and the dashboard.
- The ESP32 writes to path `emissions/<teamName>` (e.g., `emissions/ratpoison`).
- The dashboard subscribes to the same path using Firebase's **real-time WebSocket listener** — instant updates, no polling.
- Firebase also provides a `.info/connected` node that the dashboard uses to show a live/disconnected status indicator.

**Why Firebase and not direct?** Because the ESP32 can't run a WebSocket server, and the browser can't call the ESP32 directly. Firebase bridges this gap with sub-second latency.

**Data flow:** `ESP32 → Firebase RTDB → Dashboard (instant WebSocket push)`

---

### Layer 3: The Web3 Bridge (Dashboard)
**File:** [index.html](file:///c:/Users/ratik/Desktop/chainreaction/index.html) · **Tech:** Vanilla JS, ethers.js v6, Chart.js, Firebase SDK

This is the brain of the pipeline. It does three things simultaneously:

#### a) Real-Time Sensor Display
- Listens to Firebase via `ref.on('value', ...)` for live emissions data.
- Updates the big number display, status badge (Normal/HIGH), emissions log, and the **Chart.js line graph** in real-time.

#### b) Smart Contract Trigger Logic
- When emissions **cross 100 ppm**, the dashboard calculates a penalty:
  ```
  penalty = min(500, max(1, emissions - 100))
  ```
- It then calls `contract.reduceCredits(penalty)` via ethers.js, which pops up MetaMask for the student to sign.
- **Optimistic UI:** Credits visually deduct *instantly* (before the chain confirms), then sync the real on-chain balance after confirmation.
- **25-second cooldown:** Prevents transaction spam if emissions stay high continuously.
- **Zero-credit guard:** Stops sending transactions when credits are already depleted.

#### c) MetaMask & Wallet Management
- Connects to MetaMask via `window.ethereum`.
- Auto-detects the wrong network and prompts switch to **Sepolia**.
- Validates the contract address has actual bytecode deployed (catches the common mistake of deploying to Remix VM).

**Data flow:** `Firebase update → penalty math → ethers.js → MetaMask prompt → Sepolia blockchain`

---

### Layer 4: The Blockchain (Solidity Smart Contract)
**File:** [ChainReaction.sol](file:///c:/Users/ratik/Desktop/chainreaction/ChainReaction.sol) · **Tech:** Solidity ^0.8.19 · **Network:** Sepolia Testnet

The contract is dead simple by design (it's for beginners):

- **State:** `carbonCredits` (uint256, starts at 10,000) + `owner` (the deployer's wallet address)
- **`reduceCredits(penalty)`** — Anyone can call this (the dashboard does). Deducts credits with safety caps (max 500 per tx). Emits `CreditsBurned` event.
- **`resetCredits()`** — Only the contract owner can call this (`onlyOwner` modifier). Resets to 10,000. Emits `CreditsReset` event.
- **`getCredits()`** — Read-only function, returns current balance.
- **Events** — `CreditsBurned` and `CreditsReset` are logged permanently on-chain and visible on Etherscan's "Events" tab.

**Key Solidity concepts taught:**
- State variables, constructors, modifiers (`onlyOwner`), `require()` guards, events, `public` auto-getters

---

## End-to-End Flow (How a Student Experiences It)

```
1. Student slides potentiometer up on Wokwi → emissions = 130 ppm
2. ESP32 pushes {"emissions": 130} to Firebase
3. Dashboard instantly receives 130 via WebSocket
4. Dashboard turns RED → calculates penalty = 130 - 100 = 30
5. MetaMask popup: "Sign transaction to deduct 30 credits?"
6. Student clicks Confirm → tx sent to Sepolia
7. ~15 seconds later: tx confirmed on-chain
8. Credits display: 10000 → 9970
9. Etherscan link appears → student clicks and sees the tx on the public ledger
10. Chart updates with the 130 ppm data point
```

---

## Pipeline Diagram

![ChainReaction Pipeline Diagram](C:/Users/ratik/.gemini/antigravity/brain/460ba2a0-227e-4e28-b638-4cde1f67bd5c/media__1774299460512.png)
