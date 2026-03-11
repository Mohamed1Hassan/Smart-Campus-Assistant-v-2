
const fs = require('fs');
const targetFile = 'D:\\Projects\\Smart Campus Assistant\\src\\views\\ProfessorAttendance.tsx';

try {
    const data = JSON.parse(fs.readFileSync('lint_results.json', 'utf8'));
    const fileResult = data.find(r => r.filePath === targetFile);
    
    if (fileResult) {
        console.log(`Warnings for ${targetFile}:`);
        fileResult.messages.filter(m => m.severity === 1).forEach(m => {
            console.log(`${m.line}:${m.column} - ${m.ruleId}: ${m.message}`);
        });
    } else {
        console.log('File not found in results');
    }
} catch (error) {
    console.error(`Error: ${error.message}`);
}
