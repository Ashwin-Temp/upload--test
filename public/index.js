const stepForm = document.getElementById('stepForm');
const questionForm = document.getElementById('questionForm');
const questionList = document.getElementById('questionList');
const statusMsg = document.getElementById('statusMsg');

let testData = {
  title: '',
  description: '',
  duration: 0,
  questions: []
};

let currentStep = 0;
let editingIndex = null;

const steps = [
  { label: 'Test Title', key: 'title', type: 'text' },
  { label: 'Description', key: 'description', type: 'text' },
  { label: 'Duration (minutes)', key: 'duration', type: 'number' }
];

function renderStepForm() {
  if (currentStep >= steps.length) {
    stepForm.style.display = 'none';
    questionForm.style.display = 'block';
    return;
  }

  const step = steps[currentStep];
  stepForm.innerHTML = `
    <label>${step.label}</label>
    <input type="${step.type}" id="stepInput" />
    <button onclick="saveStep()">Next</button>
  `;
  document.getElementById('stepInput').focus();
}

function saveToLocalStorage() {
  const dataToSave = {
    testData,
    currentStep
  };
  localStorage.setItem('mockTestData', JSON.stringify(dataToSave));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('mockTestData');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      testData = parsed.testData;
      currentStep = parsed.currentStep;
      return true;
    } catch (e) {
      console.error('Error loading saved data', e);
      return false;
    }
  }
  return false;
}

function clearLocalStorage() {
  localStorage.removeItem('mockTestData');
  statusMsg.textContent = '🗑️ Local storage cleared.';
}

// 🔽 Modified: Save data after each operation
window.saveStep = function () {
  const value = document.getElementById('stepInput').value.trim();
  if (!value) return;
  const step = steps[currentStep];
  testData[step.key] = step.type === 'number' ? parseInt(value) : value;
  currentStep++;
  saveToLocalStorage(); // 🔼 Save to localStorage
  renderStepForm();
};

document.getElementById('nextBtn').onclick = () => {
  const question = document.getElementById('questionText').value.trim();
  const options = [
    document.getElementById('opt1').value,
    document.getElementById('opt2').value,
    document.getElementById('opt3').value,
    document.getElementById('opt4').value
  ];
  const correctIndex = parseInt(document.getElementById('correctOption').value);

  if (!question || options.some(opt => !opt)) return;

  const qData = { question, options, correctIndex };

  if (editingIndex !== null) {
    testData.questions[editingIndex] = qData;
    editingIndex = null;
  } else {
    testData.questions.push(qData);
  }

  clearQuestionForm();
  renderQuestions();

  saveToLocalStorage(); // 🔼 Save to localStorage
  renderQuestions();
};

document.getElementById('stopBtn').onclick = () => {
  clearQuestionForm();
};

function clearQuestionForm() {
  document.getElementById('questionText').value = '';
  document.getElementById('opt1').value = '';
  document.getElementById('opt2').value = '';
  document.getElementById('opt3').value = '';
  document.getElementById('opt4').value = '';
  document.getElementById('correctOption').value = '0';
  editingIndex = null;
  document.getElementById('deleteBtn')?.remove();
}

function renderQuestions() {
  questionList.innerHTML = '';
  testData.questions.forEach((q, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerText = `Q${index + 1}: ${q.question.slice(0, 40)}...`;
    card.onclick = () => loadQuestion(index);
    questionList.appendChild(card);
  });
}

function loadQuestion(index) {
  const q = testData.questions[index];
  document.getElementById('questionText').value = q.question;
  document.getElementById('opt1').value = q.options[0];
  document.getElementById('opt2').value = q.options[1];
  document.getElementById('opt3').value = q.options[2];
  document.getElementById('opt4').value = q.options[3];
  document.getElementById('correctOption').value = q.correctIndex;
  editingIndex = index;

  let existing = document.getElementById('deleteBtn');
  if (existing) existing.remove();

  const btn = document.createElement('button');
  btn.textContent = '🗑 Delete';
  btn.id = 'deleteBtn';
  btn.style.background = 'red';
  btn.style.color = 'white';
  btn.style.marginLeft = '10px';
  btn.onclick = () => {
    testData.questions.splice(index, 1);
    saveToLocalStorage();
    clearQuestionForm();
    renderQuestions();
    statusMsg.textContent = '🗑 Question deleted.';
  };

  const btnContainer = document.querySelector('#questionForm .buttons');
  btnContainer.appendChild(btn);
}

document.getElementById('submitTest').onclick = async () => {
  if (!testData.title || !testData.description || !testData.duration || testData.questions.length === 0) {
    statusMsg.textContent = '❌ Please complete all fields and add at least one question.';
    return;
  }

  statusMsg.textContent = 'Uploading...';

  try {
    const res = await fetch('http://localhost:3000/upload-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    const data = await res.json();
    if (res.ok) {
      clearLocalStorage();
      statusMsg.textContent = `✅ ${data.message}`;
    } else {
      statusMsg.textContent = `❌ ${data.error}`;
    }
  } catch (err) {
    console.error(err);
    statusMsg.textContent = '❌ Error uploading test.';
  }
};

window.addEventListener("DOMContentLoaded", () => {
  const hasSavedData = loadFromLocalStorage();

  if (hasSavedData) {
    statusMsg.textContent = '🔁 Restored your previous work.';

    if (currentStep >= steps.length) {
      stepForm.style.display = 'none';
      questionForm.style.display = 'block';
      renderQuestions();
    } else {
      renderStepForm();
      if (testData[steps[currentStep].key]) {
        document.getElementById('stepInput').value = testData[steps[currentStep].key];
      }
    }
  } else {
    renderStepForm();
  }

  setupEnterNavigation();

  // 🛠️ Safely bind the submit button
  document.getElementById('submitTest').onclick = async () => {
    if (!testData.title || !testData.description || !testData.duration || testData.questions.length === 0) {
      statusMsg.textContent = '❌ Please complete all fields and add at least one question.';
      return;
    }

    statusMsg.textContent = 'Uploading...';

    try {
      const res = await fetch('http://localhost:3000/upload-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });
      const data = await res.json();
      if (res.ok) {
        clearLocalStorage();
        statusMsg.textContent = `✅ ${data.message}`;
      } else {
        statusMsg.textContent = `❌ ${data.error}`;
      }
    } catch (err) {
      console.error(err);
      statusMsg.textContent = '❌ Error uploading test.';
    }
  };
});



function setupEnterNavigation() {
  const stepInput = document.getElementById("stepInput");
  if (stepInput) {
    stepInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveStep();
      }
    });
  }

  const qText = document.getElementById("questionText");
  const opt1 = document.getElementById("opt1");
  const opt2 = document.getElementById("opt2");
  const opt3 = document.getElementById("opt3");
  const opt4 = document.getElementById("opt4");
  const correct = document.getElementById("correctOption");

  qText?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      opt1.focus();
    }
  });

  opt1?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      opt2.focus();
    }
  });

  opt2?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      opt3.focus();
    }
  });

  opt3?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      opt4.focus();
    }
  });

  opt4?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      correct.focus();
    }
  });

  correct?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("nextBtn").click();
    }
  });
}

// Safe override for navigation setup
const originalRenderStep = renderStepForm;
renderStepForm = function () {
  originalRenderStep();
  setupEnterNavigation();
};

window.addEventListener("DOMContentLoaded", () => {
  setupEnterNavigation();
  renderStepForm();
});

// === Bulk Paste Modal ===
const pasteBtn = document.getElementById("pasteBtn");
const modal = document.getElementById("pasteModal");
const bulkInput = document.getElementById("bulkInput");
const processPasteBtn = document.getElementById("processPasteBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

pasteBtn.onclick = () => {
  bulkInput.value = "";
  modal.style.display = "flex";
};

closeModalBtn.onclick = () => {
  modal.style.display = "none";
};


processPasteBtn.onclick = () => {
  const lines = bulkInput.value.trim().split("\n").map(l => l.trim()).filter(Boolean);
  let added = 0;
  let i = 0;

  while (i < lines.length) {
    if (!lines[i].toUpperCase().startsWith("Q:")) {
      i++;
      continue;
    }

    // ✅ Get inline question (if present)
    let questionLines = [];
    const qLine = lines[i].slice(2).trim(); // after "Q:"
    if (qLine) questionLines.push(qLine);
    i++;

    // ✅ Also collect multi-line question if any
    while (
      i < lines.length &&
      !/^Solution:/i.test(lines[i]) &&
      !/^Option\s*1:/i.test(lines[i])
    ) {
      if (lines[i].length > 0) questionLines.push(lines[i]);
      i++;
    }

    if (questionLines.length === 0) {
      console.warn("❌ Skipped block due to missing question after Q:");
      continue;
    }

    // ✅ Skip solution lines (if any)
    if (i < lines.length && /^Solution:/i.test(lines[i])) {
      i++;
      while (i < lines.length && !/^Option\s*1:/i.test(lines[i])) {
        i++;
      }
    }

    // ✅ Extract options
    let options = [];
    for (let j = 0; j < 4 && i < lines.length; j++, i++) {
      const match = lines[i].match(/^Option\s*\d:\s*(.+)/i);
      if (match) options.push(match[1].trim());
    }

    // ✅ Extract correct option
    let correctIndex = -1;
    if (i < lines.length && /^Correct option:/i.test(lines[i])) {
      const correct = lines[i].split(":")[1].trim().toLowerCase();
      if (correct.includes("1")) correctIndex = 0;
      else if (correct.includes("2")) correctIndex = 1;
      else if (correct.includes("3")) correctIndex = 2;
      else if (correct.includes("4")) correctIndex = 3;
      i++;
    }

    const question = questionLines.join(" ").trim();

    if (question && options.length === 4 && correctIndex !== -1) {
      testData.questions.push({ question, options, correctIndex });
      added++;
    } else {
      console.warn("❌ Skipped block due to invalid format:", questionLines);
    }
  }
  saveToLocalStorage(); // 🔼 Save to localStorage

  modal.style.display = "none";
  renderQuestions();
  statusMsg.textContent = `✅ Added ${added} question(s) from paste.`;
};

document.querySelector('.sidebar-buttons').innerHTML += `
  <button id="resetBtn" title="Clear all data">🔄 Reset</button>
`;

document.getElementById('resetBtn').onclick = () => {
  if (confirm('Are you sure you want to reset everything?')) {
    testData = { title: '', description: '', duration: 0, questions: [] };
    currentStep = 0;
    clearQuestionForm();
    clearLocalStorage();
    stepForm.style.display = 'block';
    questionForm.style.display = 'none';
    renderStepForm();
    statusMsg.textContent = '🔄 Form reset.';
  }
};