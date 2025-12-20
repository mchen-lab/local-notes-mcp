import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDir = join(__dirname, '../../templates');

export const WELCOME_NOTE_CONTENT = readFileSync(
  join(templatesDir, 'welcome.md'), 
  'utf-8'
);

export const ADMIN_GUIDE_CONTENT = readFileSync(
  join(templatesDir, 'admin_guide.md'), 
  'utf-8'
);

// Load template once at startup
const MCP_SETUP_GUIDE_TEMPLATE = readFileSync(
  join(templatesDir, 'mcp_setup_guide.md'), 
  'utf-8'
);

// Function to generate personalized MCP setup guide with user's API key
export function getMcpSetupGuideContent(apiKey, baseUrl = 'http://localhost:5678') {
  return MCP_SETUP_GUIDE_TEMPLATE
    .replace(/\{\{API_KEY\}\}/g, apiKey)
    .replace(/\{\{BASE_URL\}\}/g, baseUrl);
}
