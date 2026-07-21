# 🌌 Axiom Calc

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-B736FF?style=for-the-badge&logo=vite&logoColor=FFD62B)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Nerdamer](https://img.shields.io/badge/Symbolic_Math-Nerdamer-ff69b4?style=for-the-badge)](https://nerdamer.com/)

> **Axiom Calc** is a state-of-the-art, premium AI-powered calculator and symbolic math toolkit. Featuring a high-end Glassmorphic UI, voice command recognition, speech feedback, local math syntax parsing, symbolic equation solving, SVG function graphing, and custom AI provider integrations.

---

## ✨ Features at a Glance

### 🧮 Core Calculator & Scientific Panel
* **Double Layout Engine**: Toggle effortlessly between a standard grid layout and high-fidelity scientific modes (`sin`, `cos`, `tan`, `log`, `ln`, `sqrt`, `π`, `e`, exponentiation, factorials, and quadratic expressions).
* **Angle Units**: Real-time toggling between Degrees (`deg`) and Radians (`rad`) for trigonometric calculations.
* **Full Memory Recall (MR/MC/MS/M+/M-)**: Standard financial and engineering memory registers.

### 🧠 Hybrid AI Solver & Local Symbolic Fallback
* **Local Mathematical Fallback**: Executes high-speed symbolic math locally using `nerdamer` without needing internet or API keys:
  * **Algebra Simplification**: Expand and reduce terms (e.g. `simplify (x+2)*(x-2)`).
  * **Calculus (Integration & Differentiation)**: Differentiate (`diff x^2`) or Integrate (`integrate 3x^2`) expressions with steps.
  * **Quadratic Solver**: Solves quadratic equation systems symbolically (e.g. `solve x^2 - 5x + 6 = 0`).
  * **Percentages & Unit Conversions**: Natural queries like `25% of 480` or `convert 5 miles to km`.
* **Remote OpenAI-Compatible API Support**: Configure any standard OpenAI-compatible API endpoint (such as Gemini, OpenAI, or local Ollama endpoints). Connect your model using custom keys to answer reasoning-heavy natural language math word problems.

### 📈 Interactive Function Graphing & KaTeX Layouts
* **Live SVG Plotter**: Graph algebraic functions of $x$ (like `sin(x)` or `x^2`) on the fly inside a responsive grid preview window.
* **Beautiful Typography**: Uses KaTeX notation to render symbolic, textbook-grade equations cleanly in the user interface.

### 🎙️ Speech Control & Voice Synthesis
* **Speech-to-Text Recognition**: Dictate calculations or AI math queries using the integrated speech button.
* **Text-to-Speech Output**: Enable spoken answers to read results, steps, and mathematical explanations aloud.

### 📊 History Logger & Export Utility
* **Locally Persistent Database**: View, search, pin important calculations, or delete logs stored in your local browser history.
* **Quick Export Options**: Export your calculated history logs directly into **CSV** or **PDF** files with clean grid tables.

### 🛠️ Extra Mathematical & Physical Utilities
* **Base Converter**: Convert integers to Hexadecimal, Binary, and Octal formats in real time.
* **Quick Unit Converter**: Support for meters, kilometers, and miles.
* **Loan / EMI Calculator**: Instantly determine monthly loan repayments.
* **BMI Calculator**: Compute Body Mass Index scores based on metric weight and height.
* **Tip Calculator**: Standard tip percentages and bill splitting metrics.
* **Statistics Engine**: Compute the Mean, Median, Minimum, and Maximum values of comma-separated inputs.

---

## 🎨 Premium Visual Architecture
Axiom Calc is designed with premium dark-aesthetic standards:
* **Glassmorphic Cards**: Frosted translucent layouts (`glass-card`) overlaid with absolute-positioned blurred radial accent gradients.
* **Interactive Elements**: Micro-animations on button clicks, input highlights, and clean transition states.
* **Responsive Layouts**: Designed to adapt perfectly to high-resolution desktop configurations and space-constrained mobile displays.

---

## 🛠️ Technology Stack & Dependencies

* **Frontend**: React (Vite template)
* **Styling**: Tailwind CSS (Vanilla CSS utilities)
* **Symbolic Math Solver**: [Nerdamer](https://nerdamer.com/)
* **Document Export**: [jsPDF](https://github.com/parallax/jsPDF) (for PDF creation)

---

## 🚀 Setup & Execution

### 1. Clone the repository and navigate to the project directory:
```bash
git clone https://github.com/syedasjadabbas/ai-based-calculator.git
cd ai-based-calculator
```

### 2. Install dependencies:
```bash
npm install
```

### 3. Run the development server locally:
```bash
npm run dev
```

### 4. Build for production:
```bash
npm run build
```

---

## ⚙️ AI Integration Configuration

To use the advanced AI reasoning feature:
1. Open the **AI Calculator** configuration panel on the page.
2. Select your provider (`OpenAI compatible` or standard endpoint).
3. Insert your **API Key** and customize the **Endpoint URL** / **Model Name** (e.g., `gpt-4o`, `gemini-2.5-flash`, or local hosting equivalents).
4. Type or speak a word problem into the AI prompt and hit **Ask AI**.

---

*Crafted with 💖 for high-performance calculations.*
