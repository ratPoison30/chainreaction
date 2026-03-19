// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CarbonTracker
 * @dev A simple smart contract for the ChainReaction Workshop.
 *      It holds a team's digital carbon credits and deducts them 
 *      automatically when the physical IoT sensor detects high emissions.
 */
contract CarbonTracker {
    
    // This variable permanently stores the team's credits on the blockchain
    uint256 public carbonCredits;

    // This event acts like a "console.log" for the blockchain, 
    // helping our frontend dashboard listen for changes instantly.
    event CreditsBurned(uint256 penaltyAmount, uint256 remainingCredits);

    // The constructor runs exactly ONCE when the team deploys the contract
    constructor() {
        carbonCredits = 10000; // Give every team 10,000 starting credits
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

    // Bonus function for the workshop: Allows teams to reset their credits to test again
    function resetCredits() public {
        carbonCredits = 10000;
    }
}