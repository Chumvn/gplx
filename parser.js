const fs = require('fs');

// Read extracted text
const raw = fs.readFileSync('./extracted.txt', 'utf-8');

// Split by \r (the docx extraction uses \r as line separator within a single huge line)
const allLines = raw.split(/\r/);

// 60 câu điểm liệt (official list)
const diemLietIds = new Set([
    19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 32, 34, 35,
    47, 48, 52, 53, 55, 58, 63, 64, 65, 66, 67, 68, 70, 71,
    72, 73, 74, 85, 86, 87, 88, 89, 90, 91, 92, 93, 97, 98,
    102, 117, 163, 165, 167, 197, 198, 206, 215, 226, 234,
    245, 246, 252, 253, 254, 255, 260
]);

// Chapter definitions
const chapters = [
    { id: 't-khai-niem', name: 'Khái niệm và quy tắc', icon: '🚦', from: 1, to: 180 },
    { id: 't-van-hoa', name: 'Văn hóa giao thông', icon: '🌐', from: 181, to: 205 },
    { id: 't-ky-thuat', name: 'Kỹ thuật lái xe', icon: '🔧', from: 206, to: 263 },
    { id: 't-cau-tao', name: 'Cấu tạo sửa chữa', icon: '⚙️', from: 264, to: 300 },
    { id: 't-bien-bao', name: 'Biển báo đường bộ', icon: '🚧', from: 301, to: 485 },
    { id: 't-tinh-huong', name: 'Sa hình tình huống', icon: '⚠️', from: 486, to: 600 }
];

function getChapter(qNum) {
    for (const ch of chapters) {
        if (qNum >= ch.from && qNum <= ch.to) return ch.id;
    }
    return '';
}

// Skip lines - patterns to ignore
function isSkipLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return true;
    if (trimmed === '/') return true; // image placeholder
    if (/^\d+$/.test(trimmed)) return true; // page numbers
    if (/^\f/.test(line)) return true; // form feed
    if (/^CHƯƠNG\s/i.test(trimmed)) return true;
    if (/^BỘ CÔNG AN/.test(trimmed)) return true;
    if (/^CỤC CẢNH SÁT/.test(trimmed)) return true;
    if (/^600 CÂU/.test(trimmed)) return true;
    if (/^Hà Nội\s*-/.test(trimmed)) return true;
    if (/^BIÊN SOẠN/.test(trimmed)) return true;
    if (/^LỜI NÓI ĐẦU/.test(trimmed)) return true;
    if (/^BAN BIÊN SOẠN/.test(trimmed)) return true;
    if (/^(Trung tướng|Thiếu tướng|Đại tá|Trung tá|Thượng tá|Thiếu tá|Đại uý)/.test(trimmed)) return true;
    if (/^An toàn giao thông là nền tảng/.test(trimmed)) return true;
    if (/^Thực hiện chỉ đạo/.test(trimmed)) return true;
    if (/^Bộ câu hỏi được bố cục/.test(trimmed)) return true;
    if (/^Bộ câu hỏi được biên soạn/.test(trimmed)) return true;
    if (/^Chương\s+[IVX]+\./.test(trimmed)) return true;
    if (/^Ngoài ra,\s*bộ tài liệu/.test(trimmed)) return true;
    if (/^Phần đáp án/.test(trimmed)) return true;
    if (/^Mặc dù đã có/.test(trimmed)) return true;
    if (/^Mọi ý kiến đóng góp/.test(trimmed)) return true;
    if (/^Cục Cảnh sát giao thông, 112/.test(trimmed)) return true;
    if (/^Website:\s*csgt/.test(trimmed)) return true;
    if (/^Số điện thoại:/.test(trimmed)) return true;
    if (/^Xin trân trọng/.test(trimmed)) return true;
    if (/^DÙNG CHO SÁT HẠCH/.test(trimmed)) return true;
    return false;
}

const questions = [];
let currentQ = null;

for (let i = 0; i < allLines.length; i++) {
    let line = allLines[i];

    // Remove form feed characters
    line = line.replace(/\f/g, '');

    const trimmed = line.trim();

    // Skip empty and metadata lines
    if (isSkipLine(line)) {
        // But if line starts with form feed + content, extract the content part
        continue;
    }

    // Check for question start
    const qMatch = trimmed.match(/^Câu\s+(\d+)\.\s*(.*)/);

    if (qMatch) {
        // Save previous question
        if (currentQ && currentQ.options.length > 0) {
            questions.push(currentQ);
        }

        const qNum = parseInt(qMatch[1]);
        const qText = qMatch[2].trim();

        currentQ = {
            id: qNum,
            chapter: getChapter(qNum),
            text: qText,
            options: [],
            correctIndex: -1,
            isDiemLiet: diemLietIds.has(qNum)
        };
    } else if (currentQ && trimmed) {
        // This is an answer option
        // Check if the ORIGINAL line (before trim) starts with space = correct answer
        const isCorrect = line.startsWith(' ') && !line.startsWith('  ') || line.match(/^\s[A-ZĐ]/);

        // Clean the option text
        let optText = trimmed;

        // Skip if this looks like it's a continuation that got merged (e.g. "Câu 192. ..." appearing inside options)
        if (optText.match(/^Câu\s+\d+\.\s/)) continue;

        currentQ.options.push(optText);
        if (isCorrect && currentQ.correctIndex === -1) {
            currentQ.correctIndex = currentQ.options.length - 1;
        }
    }
}

// Push last question
if (currentQ && currentQ.options.length > 0) {
    questions.push(currentQ);
}

console.log(`Total questions parsed: ${questions.length}`);

// Check for missing correct answers
const noAnswer = questions.filter(q => q.correctIndex === -1);
console.log(`Questions without correct answer: ${noAnswer.length}`);
if (noAnswer.length > 0 && noAnswer.length <= 20) {
    noAnswer.forEach(q => {
        console.log(`  Q${q.id}: "${q.text.substring(0, 60)}..." (${q.options.length} options)`);
    });
}

// Distribution check
for (const ch of chapters) {
    const count = questions.filter(q => q.chapter === ch.id).length;
    console.log(`${ch.name}: ${count} questions`);
}

// Điểm liệt check
const dlCount = questions.filter(q => q.isDiemLiet).length;
console.log(`Điểm liệt questions: ${dlCount}`);

// Stats on options count
const optCounts = {};
questions.forEach(q => {
    const n = q.options.length;
    optCounts[n] = (optCounts[n] || 0) + 1;
});
console.log('Options distribution:', optCounts);

// Save
fs.writeFileSync('./questions_parsed.json', JSON.stringify(questions, null, 2), 'utf-8');
console.log('Saved to questions_parsed.json');

// Also show first 3 questions for verification
console.log('\n--- Sample Questions ---');
for (let i = 0; i < 3; i++) {
    const q = questions[i];
    console.log(`Q${q.id}: ${q.text.substring(0, 80)}`);
    q.options.forEach((opt, j) => {
        const marker = j === q.correctIndex ? '✓' : ' ';
        console.log(`  ${marker} [${j}] ${opt.substring(0, 80)}`);
    });
    console.log('');
}
