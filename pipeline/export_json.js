const fs = require('fs');
const vm = require('vm');
const path = require('path');

function loadJsFile(filePath, varName) {
    const code = fs.readFileSync(filePath, 'utf8');
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    try {
        vm.runInContext(code, sandbox);
        return sandbox.window[varName] || [];
    } catch (e) {
        console.error("Failed to eval " + filePath, e);
        return [];
    }
}

const p1 = loadJsFile('data/paper1.js', 'paper1Questions');
const p2_soc = loadJsFile('data/paper2_social.js', 'paper2SocialQuestions');
const p2_sci = loadJsFile('data/paper2_science.js', 'paper2ScienceQuestions');

console.log(`Evaluated via Node: Paper 1: ${p1.length}, Paper 2 Social: ${p2_soc.length}, Paper 2 Science: ${p2_sci.length}`);

const bundle = {
    papers: [
        {
            paperCode: "paper1",
            title: "OTET Paper 1 (Primary Level)",
            description: "Eligibility mock test for Primary School Teachers (Classes I to V). Includes Child Development & Pedagogy, Odia, English, Mathematics, and Environmental Studies.",
            targetClass: "Classes I to V",
            durationMinutes: 150,
            questions: p1
        },
        {
            paperCode: "paper2-social",
            title: "OTET Paper 2 (Upper Primary - Social Studies)",
            description: "Eligibility mock test for Upper Primary Teachers (Classes VI to VIII) in Social Studies stream. Includes CDP, Languages, and History/Geography/Polity.",
            targetClass: "Classes VI to VIII",
            durationMinutes: 150,
            questions: p2_soc
        },
        {
            paperCode: "paper2-science",
            title: "OTET Paper 2 (Upper Primary - Math & Science)",
            description: "Eligibility mock test for Upper Primary Teachers (Classes VI to VIII) in Mathematics & Science stream.",
            targetClass: "Classes VI to VIII",
            durationMinutes: 150,
            questions: p2_sci
        }
    ]
};

const targetPath = path.join(__dirname, 'backend', 'src', 'main', 'resources', 'seed_data.json');
fs.writeFileSync(targetPath, JSON.stringify(bundle, null, 2), 'utf8');
console.log("Successfully wrote seed_data.json to: " + targetPath);
