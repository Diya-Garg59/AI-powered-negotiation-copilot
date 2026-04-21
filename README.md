# 🚀 AI Negotiation Copilot

### Smarter Salary Decisions with AI

---

## 📌 Overview

AI Negotiation Copilot is an end-to-end **AI-powered career intelligence platform** that helps users:

* Simulate real-world salary negotiations
* Analyze offer letters
* Compare salary with market benchmarks
* Generate negotiation strategies and responses

👉 The goal is to help users move from **confusion → clarity → confident action** during job negotiations.

---

## 🎯 Problem Statement

Many students and professionals:

* Don’t know how to negotiate salary
* Accept offers without proper analysis
* Lack confidence and market awareness

This project solves that by providing **data-driven AI assistance** for better decision-making.

---

## 🧠 Key Features

### 💬 AI Negotiation Simulation

Simulates a real-time conversation between **Candidate and HR** using AI.
Helps users understand how negotiation flows in real scenarios.

---

### 📊 Strategy Analyzer

Analyzes negotiation performance:

* Strategy used
* Concession pattern
* Final outcome

Provides a **clear summary and improvement suggestions**.

---

### ✍️ AI Response Generator

Generates ready-to-use negotiation responses in different tones:

* Formal
* Confident
* Assertive

---

### 📄 Offer Letter Analyzer

Upload a PDF offer letter and get:

* Salary breakdown
* Key terms (notice period, probation, etc.)
* Red flags
* Positive points
* Final verdict

---

### 📈 Salary Benchmark Intelligence

Compare your salary with market data based on:

* Role
* Experience
* Location

Outputs:

* Market range
* Average salary
* Your position (below / fair / above)
* Suggested negotiation range

---

## 🧠 System Flow

```text
User Input
   ↓
AI Simulation
   ↓
Analysis & Insights
   ↓
Benchmark Comparison
   ↓
Decision Support
   ↓
Negotiation Action
```

---

## 🛠 Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Vite

### Backend

* Node.js
* Express.js

### Database

* MongoDB

### AI Integration

* LLM-based APIs (OpenAI / Grok / OpenRouter)
* Multi-agent negotiation simulation logic

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ai-negotiation-copilot.git
cd ai-negotiation-copilot
```

---

### 2. Install dependencies

#### Server

```bash
cd server
npm install
```

#### Client

```bash
cd client
npm install
```

---

### 3. Setup Environment Variables

Create a `.env` file inside the `server` folder and add:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4o-mini
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

### 4. Run the project

#### Start backend

```bash
cd server
npm run dev
```

#### Start frontend

```bash
cd client
npm run dev
```

---

## 🔐 Security Note

* `.env` files are ignored using `.gitignore`
* API keys and secrets are NOT stored in the repository
* Use `.env.example` for reference

---


## 💡 Future Improvements

* Real-time market data integration
* Advanced negotiation analytics
* Multi-user collaboration
* Enterprise integrations

---

## 📚 Key Learnings

* Building AI systems is about solving real problems, not adding complexity
* UX plays a crucial role in perceived intelligence
* Decision support systems require clarity, not just automation


---

## ⭐ Show Your Support

If you found this project useful, consider giving it a ⭐ on GitHub!
