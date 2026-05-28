# Ollama Code Reviewer

A simple web-based code review tool powered by Ollama with real-time streaming responses.

## Prerequisites

- Node.js (v14+)
- Ollama running locally

## Setup

```bash
# Install Ollama model
ollama pull gemma4

# Start Ollama
ollama serve
```

## Run

```bash
node index.js
```

Open `http://localhost:3000` in your browser.

## Usage

1. Paste your code in the left panel
2. Click "Review Code"
3. Watch the AI review stream in real-time on the right panel