# SmartSplit: The Real-Time Bill Splitter. 

The Fastest, Fairest Way to Settle Up!

SmartSplit is a collaborative, real-time web application designed to eliminate the awkwardness and mathematical burden of splitting group bills. Just "snap" the receipt, and everyone can claim their items instantly, with proportional taxes and tips calculated automatically.

### ✨ Key Features

⚡ Real-Time Synchronization: Friends join the same bill and see item claims update instantly

📸 OCR Simulation: Input a full itemized receipt structure (simulated) for item-by-item selection.

⚖️ Proportional Tax & Tip: Tax and tip are automatically calculated and distributed based on the percentage of the subtotal each person claimed.

🤝 Collaborative Claiming: Multiple users can tap the same shared item (e.g., an appetizer) and the cost is evenly divided among the claimants.

🎂 Birthday Mode: A special feature that zeroes out one participant's share and evenly distributes their total across all remaining participants.

✅ Fully Responsive UI: Designed to look great on mobile phones (where bills are usually split).

<br>

### 💡 Usage and Bill Splitting Logic

1. **Item Claiming**

- Users tap an item to claim it.

- The system tracks the user ID against the item's claimedBy map.

- If an item is shared, multiple users can claim it, and the item's cost is divided by the total number of claims.

<br>

2. **Proportional Cost Calculation**

- The final share for a user (U) is calculated based on their proportion of the total item subtotal:

$$\text{Item Share}_{\text{U}} = \sum (\text{Price of claimed item} / \text{Total claims for that item})$$

$$\text{Total Claimed Value} = \sum (\text{Item Share}_{\text{all users}})$$

$$\text{Ratio}_{\text{U}} = \text{Item Share}_{\text{U}} / \text{Total Claimed Value}$$

$$\text{Total Bill}_{\text{U}} = \text{Item Share}_{\text{U}} + (\text{Tax} \times \text{Ratio}_{\text{U}}) + (\text{Tip} \times \text{Ratio}_{\text{U}})$$

<br>

3. **Birthday Mode Logic**

- When Birthday Mode is enabled for a specific user (B), calculate user B's total bill using the standard proportional logic.

- Set user B's final payment to $0.

- Divide $\text{Total Bill}_{\text{B}}$ evenly among all other participants (P).

- Add the resulting split amount to each participant P's $\text{Total Bill}_{\text{P}}$.

