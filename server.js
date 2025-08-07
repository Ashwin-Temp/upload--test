// service.js
const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const bodyParser = require("body-parser");
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Existing route for mock tests
app.post("/upload-test", async (req, res) => {
  const { title, description, duration, questions } = req.body;
  if (!title || !description || !duration || !Array.isArray(questions)) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    await db.collection("mock_tests").add({
      title,
      description,
      duration: parseInt(duration),
      questions,
    });
    res.json({ message: "Test uploaded successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to upload test." });
  }
});


// NEW route for uploading notifications
app.post("/upload-notification", async (req, res) => {
  const { title, subject, date, description } = req.body;

  if (!title || !subject || !date || !description) {
    return res.status(400).json({ error: "Please fill all fields" });
  }

  try {
    await db.collection("notification").add({
      title,
      subject,
      date,
      description,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ message: "Notification uploaded successfully!" });
  } catch (error) {
    console.error("Error uploading notification:", error);
    res.status(500).json({ error: "Server error while uploading notification." });
  }
});




// NEW route for practice questions
app.post("/upload-practice", async (req, res) => {
  const { topic, subtopic, questions } = req.body;

  if (!topic || !subtopic || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    const topicRef = db.collection("practice_questions").doc(topic);
    const subtopicRef = topicRef.collection(subtopic);

    // Get existing number of documents (e.g., questions1, questions2...)
    const existingDocsSnap = await subtopicRef.get();
    const existingCount = existingDocsSnap.size;

    // Split questions into chunks of 20
    const chunks = [];
    for (let i = 0; i < questions.length; i += 20) {
      chunks.push(questions.slice(i, i + 20));
    }

    // Upload each chunk as "questions{n+1}"
    const batch = db.batch();
    chunks.forEach((chunk, index) => {
      const docId = `questions${existingCount + index + 1}`;
      const docRef = subtopicRef.doc(docId);
      batch.set(docRef, {
        questions: chunk,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    res.json({
      message: `Uploaded ${questions.length} questions in ${chunks.length} document(s)!`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload practice questions." });
  }
});



const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));


