import { initializeDb, importNote, closeDb } from "./notesDb.js";

const TARGET_COUNT = 3000;
const USER_ID = 1; // Admin user
const START_DATE = new Date("2020-01-01").getTime();
const END_DATE = Date.now();

// Helper to generate random date between start and end
function getRandomDate() {
  const timestamp = START_DATE + Math.random() * (END_DATE - START_DATE);
  return new Date(timestamp).toISOString();
}

// Helper to generate random integer
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Large text content generator
const LOREM_PARAGRAPHS = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
    "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.",
    "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.",
    "Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus."
];

function generateLargeContent() {
    // Generate between 5 and 20 paragraphs to make it "relatively large"
    const paragraphCount = getRandomInt(5, 20);
    let content = "";
    for (let i = 0; i < paragraphCount; i++) {
        const paraIndex = getRandomInt(0, LOREM_PARAGRAPHS.length - 1);
        content += LOREM_PARAGRAPHS[paraIndex] + "\n\n";
    }
    // Add some markdown features occasionally
    if (Math.random() > 0.5) {
        content += "## Random Code Block\n```javascript\nconsole.log('Hello World');\n```\n\n";
    }
    return content;
}

function generateRandomTitle(index) {
    const adjectives = ["Important", "Draft", "Meeting", "Project", "Idea", "Archive", "Personal", "Work", "Random", "Quick"];
    const nouns = ["Notes", "Plan", "Review", "Thoughts", "List", "Specs", "Design", "Log", "Update", "Summary"];
    
    const adj = adjectives[getRandomInt(0, adjectives.length - 1)];
    const noun = nouns[getRandomInt(0, nouns.length - 1)];
    
    return `${adj} ${noun} #${index} - ${new Date().getTime().toString().slice(-4)}`;
}

async function run() {
    console.log(`Initializing DB...`);
    initializeDb();
    
    console.log(`Starting population of ${TARGET_COUNT} notes for User ID ${USER_ID}...`);
    
    const startTime = Date.now();
    
    // Use transaction for speed? importNote does not expose transaction, 
    // but better-sqlite3 is fast synchronously.
    // If it's too slow, we can wrap in transaction, but importNote calls getNote which is select.
    // Let's just run loop.
    
    for (let i = 0; i < TARGET_COUNT; i++) {
        const createdAt = getRandomDate();
        const note = {
            title: generateRandomTitle(i),
            content: generateLargeContent(),
            createdAt: createdAt,
            updatedAt: createdAt, // assume not updated since creation
            favorite: Math.random() > 0.9 // 10% favorites
        };
        
        try {
            importNote(USER_ID, note);
        } catch (e) {
            console.error(`Failed to insert note ${i}:`, e);
        }
        
        if ((i + 1) % 100 === 0) {
            process.stdout.write(`\rInserted ${i + 1}/${TARGET_COUNT} notes...`);
        }
    }
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`\nDone! Inserted ${TARGET_COUNT} notes in ${duration.toFixed(2)}s.`);
    
    closeDb();
}

run().catch(console.error);
