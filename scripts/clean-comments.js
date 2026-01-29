const fs = require('fs');
const path = require('path');

// Configuration
const TARGET_DIR = path.join(__dirname, '../src'); // Adjust if script is in /scripts
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.css'];

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });

    return arrayOfFiles;
}

function isCode(text) {
    // Remove the comment marker
    const content = text.replace(/^\s*\/\//, '').trim();

    // Empty comment? Remove it.
    if (!content) return false;

    // Heuristics for "Is this code?"

    // 1. Starts with keyword
    if (/^(const|let|var|import|export|function|class|return|if|for|while|switch|case|break|continue|throw|try|catch|finally|async|await|module\.exports|require)\b/.test(content)) return true;

    // 2. Ends with code syntax
    if (/[\{\}\(\)\[\];]$/.test(content)) return true;

    // 3. Contains assignment or operators
    if (/(=|=>|\+=|-=|\*=|\/=|\+\+|--|===|!==|&&|\|\|)/.test(content)) return true;

    // 4. Looks like HTML/JSX
    if (/^<.+>$/.test(content)) return true;

    return false;
}

function processFile(filePath) {
    if (!EXTENSIONS.includes(path.extname(filePath))) return;

    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const newLines = [];
    let insideBlockComment = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const trimmed = line.trim();

        // Handle Block Comments /* ... */
        if (insideBlockComment) {
            if (trimmed.includes('*/')) {
                insideBlockComment = false;
                // If there's code after */, keep it (rare case like: /* comment */ const x = 1)
                const parts = line.split('*/');
                if (parts[1] && parts[1].trim()) {
                    newLines.push(parts[1]); // Keep the part after comment
                }
            }
            continue; // Skip this line
        }

        if (trimmed.startsWith('/*')) {
            if (!trimmed.includes('*/')) {
                insideBlockComment = true;
            }
            // Check if it's one line block comment /* ... */
            // We assume block comments are NOTES, unless specific instruction (which we don't have).
            // So we remove them.
            // But we must check if there is code BEFORE the /*
            const startIdx = line.indexOf('/*');
            const preComment = line.substring(0, startIdx);
            if (preComment.trim()) {
                // If there is code before, keep the code part.
                // But simplified: usually block comments are on their own lines or JSDoc.
                newLines.push(preComment);
            }

            if (trimmed.includes('*/')) {
                // Ends on same line
                const endIdx = line.indexOf('*/');
                const postComment = line.substring(endIdx + 2);
                if (postComment.trim()) {
                    newLines.push(postComment);
                }
            }

            continue;
        }

        // Handle Single Line Comments //
        if (trimmed.startsWith('//')) {
            // Check if it's "Code Comment"
            if (isCode(trimmed)) {
                newLines.push(line); // Keep it
            } else {
                // It's a Note Comment -> Remove
                // console.log(`Removing note: ${trimmed}`);
            }
            continue;
        }

        // Handle Trailing Comments (const x = 1; // comment)
        if (line.includes('//')) {
            // Be careful not to match http:// or "string //"
            // Simple approach: split by // and strictly check if the second part is just text
            // But checking if it's inside a string is hard without a parser.
            // We'll perform a naive check: if // is preceded by a colon (url) or quote, ignore.

            const idx = line.indexOf('//');
            // Check for URL http://
            if (idx > 0 && line[idx - 1] === ':') {
                newLines.push(line);
                continue;
            }

            // Assume it's a trailing comment
            const codePart = line.substring(0, idx);
            // const commentPart = line.substring(idx);

            // We keep the code part. The comment part is stripped unconditionally because trailing code-comments are weird (// const x=1; // const y=2; ?)
            // Usually trailing comments are notes.
            if (codePart.trim()) {
                newLines.push(codePart.trimEnd());
            } else {
                // It was just a comment line (handled above by startsWith, but safe fallback)
            }
            continue;
        }

        newLines.push(line);
    }

    const newContent = newLines.join('\n');
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Cleaned: ${filePath}`);
    }
}

// Main
console.log(`Scanning ${TARGET_DIR}...`);
const files = getAllFiles(TARGET_DIR);
console.log(`Found ${files.length} files.`);
files.forEach(processFile);
console.log("Done.");
