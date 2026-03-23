// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CarbonTracker
 * @dev A simple smart contract for the ChainReaction Workshop.
 *      It holds a team's digital carbon credits and deducts them 
 *      automatically when the physical IoT sensor detects high emissions.
 *
 *      Access Control: Only the deployer (owner) can reset credits.
 */
contract CarbonTracker {
    
    // The wallet that deployed this contract — only they can reset credits
    address public owner;

    // This variable permanently stores the team's credits on the blockchain
    uint256 public carbonCredits;

    // This event acts like a "console.log" for the blockchain, 
    // helping our frontend dashboard listen for changes instantly.
    event CreditsBurned(uint256 penaltyAmount, uint256 remainingCredits);

    // Emitted when the owner resets credits back to the starting amount
    event CreditsReset(uint256 newBalance);

    // A modifier is a reusable guard — it checks a condition before
    // allowing the function to execute. Think of it like middleware!
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can call this");
        _;
    }

    // The constructor runs exactly ONCE when the team deploys the contract
    constructor() {
        owner = msg.sender;          // Save who deployed this contract
        carbonCredits = 10000;       // Give every team 10,000 starting credits
    }

    // Your dashboard calls this function automatically when Wokwi emissions > 100
    function reduceCredits(uint256 penalty) public {
        
        // Safety checks (Sanity rules)
        require(penalty > 0, "Penalty must be greater than zero");
        require(penalty <= 500, "Penalty too high! Max 500 per transaction");

        // Deduct credits, making sure we don't go below zero
        if (carbonCredits >= penalty) {
            carbonCredits -= penalty;
        } else {
            carbonCredits = 0; // If they run out, balance stays at zero
        }
        
        // Broadcast the update to the network so the dashboard updates
        emit CreditsBurned(penalty, carbonCredits);
    }

    // A simple read function for your dashboard to fetch the current balance
    function getCredits() public view returns (uint256) {
        return carbonCredits;
    }

    // Only the team that deployed the contract can reset credits (Access Control!)
    function resetCredits() public onlyOwner {
        carbonCredits = 10000;
        emit CreditsReset(carbonCredits);
    }
}