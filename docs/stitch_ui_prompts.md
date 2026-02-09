# Stitch/v0 UI 生成提示词指南 (VibeCheck Stable-Gift)

本文档包含了一套用于生成前端 UI 的详细提示词（Prompts）。你可以将这些提示词直接复制到 v0.dev、Stitch 或其他 AI UI 生成工具中，快速构建现代化的 DApp 界面。

## 🎨 设计风格定义 (Design System)

**核心风格**: Modern Web3, Clean, Responsive, Glassmorphism elements.
**配色方案**:
-   主色调: Sui Blue/Cyan (海洋蓝/青色)
-   背景: 深色模式 (Dark/Slate/Zinc) 或 渐变浅色
-   交互: Tailwind CSS, Shadcn UI 组件风格

---

## 🤖 提示词集合 (Prompts)

### 1. 全局布局与主页 (Landing Page & Layout)

**Prompt:**
> Build a modern, responsive landing page for a Web3 Red Envelope application called "VibeCheck Stable-Gift".
>
> **Layout Requirements:**
> *   **Header:** A clean navigation bar with the logo "VibeCheck" on the left and a "Connect Wallet" button (Sui Wallet style) on the right.
> *   **Hero Section:** A centered hero section with a catchy title "Send Crypto Gifts with Style". Subtitle: "The easiest way to send programmable stablecoin gifts on Sui Network."
> *   **Action Cards:** Two prominent glassmorphism cards side-by-side:
>     1.  "Send a Gift": Icon of a red envelope or gift box. Button: "Create New".
>     2.  "Claim a Gift": Icon of an open hand or QR code. Button: "Claim Now".
> *   **Footer:** Minimal footer with links to Docs and GitHub.
>
> **Style:** Use Tailwind CSS. Background should be a subtle dark gradient (slate-900 to slate-800) with cyan glow effects. Use rounded-xl for cards and buttons. Typography should be sans-serif (Inter or similar).

### 2. 创建红包表单 (Create Envelope Component)

**Prompt:**
> Create a "Create Red Envelope" form component for a DeFi dApp.
>
> **Functional Requirements:**
> 1.  **Token Select:** A dropdown to select currency (SUI, USDC, USDT). Default to SUI.
> 2.  **Total Amount:** Numeric input field with a label "Total Amount".
> 3.  **Quantity:** Numeric input field for "Number of Envelopes" (Count).
> 4.  **Distribution Mode:** A toggle switch or segmented control to choose between:
>     *   "Random Luck" (Amounts vary randomly)
>     *   "Equal Split" (Everyone gets the same amount)
> 5.  **Summary:** A small dynamic summary box showing "You are sending [Amount] [Token] to [Count] people."
> 6.  **Action Button:** A large, full-width gradient button labeled "Mint & Send".
>
> **UI Style:** The form should be inside a centered card container with a slight border and shadow. Use validation states (red outline for errors). Add a "Settings" accordion for advanced options like "Expiration".

### 3. 领取与开奖视图 (Claim & Reveal View)

**Prompt:**
> Design a highly interactive "Claim Red Envelope" visualization.
>
> **States:**
> 1.  **Input State:** A clean input field asking for "Enter Gift ID" with a "Check" button.
> 2.  **Ready State:** A 3D-style closed Red Envelope illustration in the center. Text: "You found a gift from [Sender Address]!". Below it, a "Task Verification" checklist (e.g., "Follow Twitter ✅", "Join Discord ⏳"). A big "Open" button that is disabled until tasks are checked.
> 3.  **Success State (The Reveal):** An animation frame showing the envelope opening. A large number displays the claimed amount (e.g., "3.42 SUI"). A "Claim to Wallet" button appears below.
>
> **Vibe:** Festive but tech-forward. Use gold and red accents on top of the dark UI theme.

### 4. 仪表盘与历史记录 (Dashboard & History)

**Prompt:**
> Create a user dashboard table for managing sent and received crypto gifts.
>
> **Features:**
> *   **Tabs:** "Sent Gifts" and "Received Gifts".
> *   **Table Columns:**
>     *   ID (Truncated hash)
>     *   Date
>     *   Type (Random/Equal)
>     *   Progress (e.g., "3/5 Claimed") - Use a progress bar.
>     *   Total Amount
>     *   Status (Active/Finished/Expired) - Use colored badges (Green for Active, Gray for Finished).
>     *   Action (Button: "Withdraw Remaining" for Sent tab).
>
> **Style:** Clean data table with row hover effects. Mobile responsive (stack columns on small screens). Empty state illustration if no data exists.

---

## 💡 组合提示词 (Master Prompt)

如果你想一次性生成整个应用的框架，可以使用以下长提示词：

**Master Prompt:**
> Create a complete single-page application dashboard for a Sui Network Red Envelope dApp using React, Tailwind CSS, and Lucide React icons.
>
> Supported views (manageable via state):
> 1.  **Home**: Hero section with "Create" and "Claim" main actions.
> 2.  **Create**: A form to configure Coin type, Amount, Count, and Mode (Random/Equal).
> 3.  **Claim**: A view to input an ID and simulate opening an envelope with a reveal animation.
> 4.  **Dashboard**: A table listing history of transactions.
>
> **Design Specs**: Dark mode aesthetics (slate-950 background). Use blue/cyan primary colors. The UI should be polished, using cards for layout segregation. Include a mock "Connect Wallet" button in the top right. Ensure the interface feels like a professional DeFi product.
