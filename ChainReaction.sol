// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title  CarbonTracker
 * @notice A beginner-friendly smart contract for the ChainReaction Workshop.
 *
 *         HOW IT WORKS
 *         ────────────
 *         Every team deploys their own copy of this contract to Sepolia.
 *         The contract starts with 10,000 carbon credits.
 *         When the IoT sensor detects emissions above 100 ppm, the web
 *         dashboard automatically calls reduceCredits() to deduct a
 *         penalty from the on-chain balance — no human intervention needed.
 *
 *         KEY SOLIDITY CONCEPTS COVERED
 *         ─────────────────────────────
 *         • State variables  – persistent on-chain data (owner, carbonCredits)
 *         • Constructor      – runs once at deployment to set initial values
 *         • Modifiers        – reusable access-control guards (onlyOwner)
 *         • require()        – input validation that reverts on failure
 *         • Events           – on-chain logs the frontend can listen for
 *         • public getter    – Solidity auto-generates a getter for public vars
 */
contract CarbonTracker {

    // ──────────────────────────── STATE VARIABLES ────────────────────────────
    // These are permanently stored on the blockchain; every change costs gas.

    /// The wallet address that deployed this contract.
    /// Used by the onlyOwner modifier to restrict who can reset credits.
    address public owner;

    /// The team's current carbon credit balance.
    /// Starts at 10,000 and decreases each time the sensor triggers a penalty.
    uint256 public carbonCredits;

    // ──────────────────────────── EVENTS ─────────────────────────────────────
    // Events are like "console.log" for the blockchain.  They are recorded in
    // the transaction receipt and can be viewed on Etherscan → Events tab.
    // Our dashboard listens for these to update the UI in real time.

    /// Emitted every time credits are deducted via reduceCredits().
    event CreditsBurned(uint256 penaltyAmount, uint256 remainingCredits);

    /// Emitted when the contract owner resets the balance back to 10,000.
    event CreditsReset(uint256 newBalance);

    // ──────────────────────────── MODIFIERS ──────────────────────────────────
    // A modifier is a reusable guard that wraps a function.  Think of it like
    // middleware in a web server — it runs a check BEFORE the function body.

    /// Restricts the decorated function so only the deployer can call it.
    /// If anyone else tries, the transaction reverts with the error message.
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can call this");
        _; // ← this placeholder is where the actual function body executes
    }

    // ──────────────────────────── CONSTRUCTOR ────────────────────────────────
    // The constructor runs exactly ONCE — when the contract is deployed.  It
    // can never be called again.  We use it to record who deployed the
    // contract and to set the starting credit balance.

    constructor() {
        owner = msg.sender;      // msg.sender = the wallet that deployed this
        carbonCredits = 10000;   // Every team begins with 10,000 credits
    }

    // ──────────────────────────── CORE FUNCTION ─────────────────────────────

    /**
     * @notice Deducts `penalty` credits from the team's balance.
     * @dev    Called automatically by the web dashboard whenever the IoT
     *         sensor pushes an emissions reading above 100 ppm.
     *
     *         Safety rails built in:
     *         1. penalty must be ≥ 1  (no zero-value spam)
     *         2. penalty must be ≤ 500 (caps damage per transaction)
     *         3. Balance floors at 0  (no underflow / negative credits)
     *
     * @param  penalty  The number of credits to burn (1–500).
     */
    function reduceCredits(uint256 penalty) public {
        // Validate inputs — if either require() fails the entire transaction
        // reverts and no gas is consumed beyond the check.
        require(penalty > 0, "Penalty must be greater than zero");
        require(penalty <= 500, "Penalty too high! Max 500 per transaction");

        // Deduct credits, clamping at zero so we never underflow.
        if (carbonCredits >= penalty) {
            carbonCredits -= penalty;
        } else {
            carbonCredits = 0;
        }

        // Broadcast the deduction so the dashboard and Etherscan can see it.
        emit CreditsBurned(penalty, carbonCredits);
    }

    // ──────────────────────────── READ FUNCTION ─────────────────────────────

    /**
     * @notice Returns the team's current carbon credit balance.
     * @dev    This is a `view` function — it reads state but doesn't modify
     *         it, so calling it is FREE (no gas cost).  The dashboard polls
     *         this after every confirmed transaction to sync the UI.
     */
    function getCredits() public view returns (uint256) {
        return carbonCredits;
    }

    // ──────────────────────────── ADMIN FUNCTION ────────────────────────────

    /**
     * @notice Resets the credit balance back to 10,000.
     * @dev    Protected by the onlyOwner modifier — only the wallet that
     *         originally deployed this contract can call it.  Useful during
     *         the workshop to let a team start a fresh demo round.
     */
    function resetCredits() public onlyOwner {
        carbonCredits = 10000;
        emit CreditsReset(carbonCredits);
    }
}