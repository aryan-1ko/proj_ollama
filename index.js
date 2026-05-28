const http = require('http');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Ollama configuration
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'localhost';
const OLLAMA_PORT = process.env.OLLAMA_PORT || 11434;
const MODEL = 'gemma4';

// Store conversation history for follow-up questions
const conversationHistory = [];

/**
 * Send a code review request to Ollama API
 * @param {string} code - The code to review
 * @param {string} language - Programming language (optional)
 */
function requestCodeReview(code, language = 'unknown') {
  const reviewPrompt = `You are an expert code reviewer. Please provide a comprehensive code review for the following ${language} code.

Analyze the code and provide feedback on:
1. **Code Quality**: Overall structure, readability, and maintainability
2. **Potential Bugs**: Any logical errors or edge cases not handled
3. **Security Concerns**: Vulnerabilities or security issues
4. **Performance**: Optimization opportunities
5. **Best Practices**: Adherence to language-specific conventions and patterns

Code to review:
\`\`\`${language}
${code}
\`\`\`

Please provide a detailed, structured review.`;

  conversationHistory.push({ role: 'user', content: reviewPrompt });

  const data = JSON.stringify({
    model: MODEL,
    messages: conversationHistory
  });

  const options = {
    hostname: OLLAMA_HOST,
    port: OLLAMA_PORT,
    path: '/api/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          // Parse NDJSON response (Ollama returns newline-delimited JSON)
          const lines = responseData.trim().split('\n');
          const responses = lines.map(line => JSON.parse(line));
          
          // Extract the message content from responses
          const fullMessage = responses
            .filter(r => r.message && r.message.content)
            .map(r => r.message.content)
            .join('');
          
          // Add assistant response to history
          conversationHistory.push({ role: 'assistant', content: fullMessage });
          
          resolve(fullMessage);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Save review to file
 * @param {string} review - The review content
 * @param {string} code - The original code
 */
function saveReview(review, code) {
  const reviewsDir = path.join(__dirname, 'reviews');
  
  // Create reviews directory if it doesn't exist
  if (!fs.existsSync(reviewsDir)) {
    fs.mkdirSync(reviewsDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `review-${timestamp}.md`;
  const filepath = path.join(reviewsDir, filename);

  const content = `# Code Review - ${new Date().toLocaleString()}

## Original Code
\`\`\`
${code}
\`\`\`

## Review
${review}
`;

  fs.writeFileSync(filepath, content);
  return filepath;
}

/**
 * Main CLI application
 */
async function main() {
  console.log('🔍 Ollama Code Reviewer');
  console.log('═'.repeat(50));
  console.log('Paste your code below. When finished, type "REVIEW" on a new line.');
  console.log('You can also specify the language by typing "REVIEW <language>"');
  console.log('Type "QUIT" to exit.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  let codeLines = [];
  let isCollectingCode = true;
  let currentReview = '';
  let currentCode = '';

  rl.prompt();

  rl.on('line', async (line) => {
    const trimmedLine = line.trim();

    // Check for quit command
    if (trimmedLine.toUpperCase() === 'QUIT') {
      console.log('\n👋 Goodbye!');
      rl.close();
      process.exit(0);
    }

    // Check if user wants to review the code
    if (trimmedLine.toUpperCase().startsWith('REVIEW')) {
      if (codeLines.length === 0) {
        console.log('\n❌ No code to review. Please paste some code first.\n');
        rl.prompt();
        return;
      }

      // Extract language if specified
      const parts = trimmedLine.split(' ');
      const language = parts.length > 1 ? parts[1] : 'unknown';

      const code = codeLines.join('\n');
      currentCode = code;
      codeLines = [];

      console.log('\n⏳ Analyzing code...\n');

      try {
        const review = await requestCodeReview(code, language);
        currentReview = review;
        
        console.log('📊 Code Review Results:');
        console.log('═'.repeat(50));
        console.log(review);
        console.log('═'.repeat(50));
        console.log('\nOptions:');
        console.log('  [S] Save review to file');
        console.log('  [N] New review');
        console.log('  [F] Follow-up question');
        console.log('  [Q] Quit');
        console.log('\nEnter your choice (S/N/F/Q):');
        
        isCollectingCode = false;
      } catch (error) {
        console.error('\n❌ Error communicating with Ollama:', error.message);
        console.error('Make sure Ollama is running on http://localhost:11434');
        console.error('You can start it with: ollama serve\n');
        codeLines = [];
      }
      
      rl.prompt();
      return;
    }

    // Handle post-review options
    if (!isCollectingCode) {
      const choice = trimmedLine.toUpperCase();
      
      if (choice === 'S') {
        try {
          const filepath = saveReview(currentReview, currentCode);
          console.log(`\n✅ Review saved to: ${filepath}\n`);
        } catch (error) {
          console.error(`\n❌ Error saving review: ${error.message}\n`);
        }
        console.log('Paste new code to review, or type QUIT to exit.\n');
        isCollectingCode = true;
        rl.prompt();
        return;
      } else if (choice === 'N') {
        console.log('\nPaste new code to review, or type QUIT to exit.\n');
        isCollectingCode = true;
        currentReview = '';
        currentCode = '';
        conversationHistory.length = 0; // Clear history for new review
        rl.prompt();
        return;
      } else if (choice === 'F') {
        console.log('\nAsk your follow-up question:\n');
        rl.once('line', async (question) => {
          if (question.trim()) {
            console.log('\n⏳ Processing...\n');
            try {
              conversationHistory.push({ role: 'user', content: question });
              
              const data = JSON.stringify({
                model: MODEL,
                messages: conversationHistory
              });

              const options = {
                hostname: OLLAMA_HOST,
                port: OLLAMA_PORT,
                path: '/api/chat',
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Content-Length': data.length
                }
              };

              const response = await new Promise((resolve, reject) => {
                const req = http.request(options, (res) => {
                  let responseData = '';
                  res.on('data', (chunk) => { responseData += chunk; });
                  res.on('end', () => {
                    try {
                      const lines = responseData.trim().split('\n');
                      const responses = lines.map(line => JSON.parse(line));
                      const fullMessage = responses
                        .filter(r => r.message && r.message.content)
                        .map(r => r.message.content)
                        .join('');
                      conversationHistory.push({ role: 'assistant', content: fullMessage });
                      resolve(fullMessage);
                    } catch (error) {
                      reject(error);
                    }
                  });
                });
                req.on('error', reject);
                req.write(data);
                req.end();
              });

              console.log('💬 Response:');
              console.log('═'.repeat(50));
              console.log(response);
              console.log('═'.repeat(50));
              console.log('\nOptions: [S]ave, [N]ew review, [F]ollow-up, [Q]uit\n');
            } catch (error) {
              console.error('\n❌ Error:', error.message, '\n');
            }
          }
          rl.prompt();
        });
        return;
      } else if (choice === 'Q') {
        console.log('\n👋 Goodbye!');
        rl.close();
        process.exit(0);
      } else {
        console.log('\n❌ Invalid option. Please choose S, N, F, or Q.\n');
        rl.prompt();
        return;
      }
    }

    // Collect code lines
    codeLines.push(line);
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\n👋 Goodbye!');
    process.exit(0);
  });
}

// Start the application
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
