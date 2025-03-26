const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../uploads');
const documentsDir = path.join(uploadsDir, 'documents');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}

// Create documents directory if it doesn't exist
if (!fs.existsSync(documentsDir)) {
    fs.mkdirSync(documentsDir, { recursive: true });
    console.log('Created documents directory');
}

// Create .gitkeep file to ensure empty directories are tracked
const gitkeepPath = path.join(documentsDir, '.gitkeep');
if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '');
    console.log('Created .gitkeep file');
}

console.log('Upload directories setup completed'); 