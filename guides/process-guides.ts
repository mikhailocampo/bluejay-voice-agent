import * as fs from "fs";
import * as path from "path";

interface GuideEntry {
  text: string;
  metadata: {
    "og:site_name"?: string;
    [key: string]: unknown;
  };
}

/**
 * Remove all markdown links from text, keeping only the display text.
 * Handles:
 * - Image markdown: ![alt](url) → removed entirely
 * - Link markdown: [text](url) → text
 * - Nested patterns: [![](img.png) Text](url) → Text
 */
function cleanMarkdownLinks(text: string): string {
  let result = text;

  // First pass: Remove nested image-links like [![](url) Text](url)
  // These have format: [![...](...)...](...)
  // We want to extract any text between the inner ](url) and outer ](url)
  result = result.replace(
    /\[\s*!\[[^\]]*\]\([^)]*\)\s*([^\]]*)\]\([^)]*\)/g,
    "$1"
  );

  // Second pass: Remove standalone image markdown ![alt](url)
  result = result.replace(/!\[[^\]]*\]\([^)]*\)/g, "");

  // Third pass: Remove remaining link markdown [text](url) → text
  result = result.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");

  // Clean up excessive whitespace (multiple spaces, but preserve newlines)
  result = result.replace(/[ \t]+/g, " ");

  // Clean up multiple consecutive newlines (more than 2)
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

/**
 * Sanitize site name for use as filename
 */
function sanitizeSiteName(siteName: string): string {
  return siteName
    .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to hyphens
    .toLowerCase();
}

/**
 * Process all JSON files in the guides directory
 */
async function processGuides() {
  const guidesDir = path.dirname(new URL(import.meta.url).pathname);

  // Find all JSON files in guides directory
  const files = fs.readdirSync(guidesDir).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.log("No JSON files found in guides directory");
    return;
  }

  console.log(`Found ${files.length} JSON file(s) to process\n`);

  // Track site name occurrences for duplicate handling
  const siteNameCounts: Map<string, number> = new Map();

  let totalGuides = 0;
  let filesWritten = 0;

  for (const file of files) {
    const filePath = path.join(guidesDir, file);
    console.log(`Processing: ${file}`);

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const guides: GuideEntry[] = JSON.parse(content);

      if (!Array.isArray(guides)) {
        console.log(`  Skipping: Not an array`);
        continue;
      }

      for (const guide of guides) {
        totalGuides++;

        // Get site name from metadata
        const siteName = guide.metadata?.["og:site_name"] || "Unknown";
        const sanitizedName = sanitizeSiteName(siteName);

        // Track occurrences for duplicate naming
        const count = siteNameCounts.get(sanitizedName) || 0;
        siteNameCounts.set(sanitizedName, count + 1);

        // Generate filename with index for duplicates
        const outputFilename =
          count === 0 ? `${sanitizedName}.md` : `${sanitizedName}-${count}.md`;

        // Clean the markdown content
        const cleanedText = cleanMarkdownLinks(guide.text);

        // Write output file
        const outputPath = path.join(guidesDir, outputFilename);
        fs.writeFileSync(outputPath, cleanedText, "utf-8");

        console.log(`  → ${outputFilename} (from ${siteName})`);
        filesWritten++;
      }
    } catch (err) {
      console.error(`  Error processing ${file}:`, err);
    }
  }

  console.log(`\nDone! Processed ${totalGuides} guides, wrote ${filesWritten} markdown files.`);
}

// Run the processor
processGuides();

