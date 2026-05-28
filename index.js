const http = require('http');
const fs = require('fs');
const path = require('path');

// Ollama configuration
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'localhost';
const OLLAMA_PORT = process.env.OLLAMA_PORT || 11434;
const MODEL = 'gemma4';
const PORT = process.env.PORT || 3000;

/**
 * Send a code review request to Ollama API
 * @param {string} code - The code to review
 */
/**
 * Stream code review from Ollama API
 * @param {string} code - The code to review
 * @param {function} onChunk - Callback for each chunk of data
 */
async function streamCodeReview(code, onChunk) {
  const reviewPrompt = `You are an expert code reviewer. Please provide a comprehensive code review for the following code.

Analyze the code and provide feedback on:
1. **Code Quality**: Overall structure, readability, and maintainability
2. **Potential Bugs**: Any logical errors or edge cases not handled
3. **Security Concerns**: Vulnerabilities or security issues
4. **Performance**: Optimization opportunities
5. **Best Practices**: Adherence to language-specific conventions and patterns

Code to review:
\`\`\`
${code}
\`\`\`

Please provide a review in brief paragraphs. If the code is faulty, rewrite it with improvements.

Do not use markdown formatting. Keep it professional and precise, only return at most two paragraphs.`;

  const data = JSON.stringify({
    model: MODEL,
    messages: [{ role: 'user', content: reviewPrompt }],
    stream: true
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
      let buffer = '';

      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';
        
        // Process complete lines
        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.message && parsed.message.content) {
                onChunk(parsed.message.content);
              }
              
              // Check if streaming is done
              if (parsed.done) {
                resolve();
              }
            } catch (error) {
              console.error('Error parsing chunk:', error);
            }
          }
        }
      });

      res.on('end', () => {
        resolve();
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
 * Serve the HTML page
 */
function serveHTML(res) {
  const htmlPath = path.join(__dirname, 'index.html');
  
  fs.readFile(htmlPath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading page');
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
}

/**
 * Handle review request with streaming
 */
async function handleReview(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      const { code } = JSON.parse(body);
      
      if (!code || !code.trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No code provided' }));
        return;
      }
      
      // Set up Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      // Stream chunks to client
      await streamCodeReview(code, (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      });
      
      // Send done event
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Error processing review:', error);
      res.write(`data: ${JSON.stringify({ 
        error: 'Failed to process review. Make sure Ollama is running on http://localhost:11434' 
      })}\n\n`);
      res.end();
    }
  });
}

/**
 * Create HTTP server
 */
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    serveHTML(res);
  } else if (req.method === 'POST' && req.url === '/review') {
    handleReview(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Code Reviewer running at http://localhost:${PORT}`);
  console.log(`Make sure Ollama is running on http://${OLLAMA_HOST}:${OLLAMA_PORT}`);
});
