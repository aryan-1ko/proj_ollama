# Ollama Code Reviewer

A CLI-based code review tool powered by Ollama's gemma4 model. Paste your code, get comprehensive AI-powered reviews covering quality, bugs, security, performance, and best practices.

## Prerequisites

- **Node.js** (v14.0.0 or higher)
- **Ollama** running locally at `http://localhost:11434`
- **gemma4 model** installed in Ollama

### Install Ollama and Model

```bash
# Install Ollama (if not already installed)
# Visit: https://ollama.ai

# Pull the gemma4 model
ollama pull gemma4

# Start Ollama service
ollama serve
```

## Installation

```bash
cd ~/Desktop/proj_ollama
npm install
```

## Usage

### Start the Code Reviewer

```bash
npm start
# or
node index.js
```

### How to Use

1. **Paste Your Code**: Copy and paste your code snippet into the terminal
2. **Trigger Review**: Type `REVIEW` on a new line (optionally specify language: `REVIEW javascript`)
3. **Get Results**: Receive comprehensive code review
4. **Choose Action**:
   - `S` - Save review to file
   - `N` - Start new review
   - `F` - Ask follow-up question
   - `Q` - Quit application

### Example Session

```
🔍 Ollama Code Reviewer
══════════════════════════════════════════════════
Paste your code below. When finished, type "REVIEW" on a new line.
You can also specify the language by typing "REVIEW <language>"
Type "QUIT" to exit.

> function add(a, b) {
>   return a + b;
> }
> REVIEW javascript

⏳ Analyzing code...

📊 Code Review Results:
══════════════════════════════════════════════════
**Code Quality**: ⭐⭐⭐⭐
The function is simple and readable...

**Potential Bugs**: ✅
No type checking - could cause issues with non-numeric inputs...

**Security Concerns**: ✅
No security issues for this simple function...

**Performance**: ⭐⭐⭐⭐⭐
Optimal performance for this operation...

**Best Practices**: ⭐⭐⭐
Consider adding JSDoc comments and TypeScript types...
══════════════════════════════════════════════════

Options:
  [S] Save review to file
  [N] New review
  [F] Follow-up question
  [Q] Quit

Enter your choice (S/N/F/Q):
```

## Features

✅ **Multi-line Code Input** - Paste code of any length
✅ **Language Support** - Specify programming language for context-aware reviews
✅ **Comprehensive Analysis** - Covers quality, bugs, security, performance, best practices
✅ **Save Reviews** - Export reviews to markdown files in `reviews/` directory
✅ **Follow-up Questions** - Ask clarifying questions about the review
✅ **Conversation History** - Maintains context for follow-up discussions

## Review Categories

The tool analyzes your code across five key areas:

1. **Code Quality** - Structure, readability, maintainability
2. **Potential Bugs** - Logic errors, edge cases, error handling
3. **Security Concerns** - Vulnerabilities, injection risks, data validation
4. **Performance** - Optimization opportunities, algorithmic efficiency
5. **Best Practices** - Language conventions, design patterns, standards

## Supported Languages

While the tool works with any programming language, specifying the language provides better context:

- JavaScript/TypeScript
- Python
- Java
- C/C++
- Go
- Rust
- PHP
- Ruby
- And more...

Example: `REVIEW python` or `REVIEW typescript`

## Saved Reviews

Reviews are saved in the `reviews/` directory with timestamps:
- Format: `review-YYYY-MM-DDTHH-MM-SS.md`
- Contains original code and full review
- Easy to reference and share

## Troubleshooting

### "Error communicating with Ollama"

**Problem**: Cannot connect to Ollama service

**Solutions**:
1. Ensure Ollama is running: `ollama serve`
2. Verify Ollama is accessible: `curl http://localhost:11434/api/tags`
3. Check if port 11434 is available

### "Model not found"

**Problem**: gemma4 model not installed

**Solution**:
```bash
ollama pull gemma4
```

### Slow Response Times

**Problem**: Reviews take a long time

**Solutions**:
- Ensure your system meets Ollama's requirements
- Try smaller code snippets
- Check system resources (CPU/RAM usage)

## Configuration

You can customize the Ollama connection via environment variables:

```bash
# Custom Ollama host
export OLLAMA_HOST=192.168.1.100

# Custom Ollama port
export OLLAMA_PORT=11434

# Then run
npm start
```

## Tips for Best Results

1. **Be Specific**: Mention the language when reviewing
2. **Context Matters**: Include relevant imports/dependencies
3. **Focused Reviews**: Review smaller, focused code segments
4. **Follow-up**: Use the follow-up feature to dive deeper
5. **Save Important Reviews**: Use the save feature for future reference

## Project Structure

```
proj_ollama/
├── index.js          # Main CLI application
├── package.json      # Project configuration
├── README.md         # This file
├── .gitignore        # Git ignore rules
└── reviews/          # Saved reviews (created automatically)
```

## Contributing

This is a personal project, but suggestions are welcome! Feel free to fork and modify for your needs.

## License

MIT License - Feel free to use and modify as needed.

## Author

Created by aryan-1ko

## Acknowledgments

- Powered by [Ollama](https://ollama.ai)
- Uses gemma4 model for code analysis
