// prisma/seed.mjs
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("🌱 Seeding Annotation Studio...");

  // ─── 1. Text Classification ───────────────────────────────────────────────
  const textClassProject = await prisma.project.upsert({
    where: { id: "proj_text_class" },
    update: {},
    create: {
      id: "proj_text_class",
      name: "Sentiment Analysis",
      description: "Classify customer reviews by sentiment",
      type: "text_classification",
      config: {
        labels: [
          { value: "positive", color: "#22c55e", hotkey: "1" },
          { value: "negative", color: "#ef4444", hotkey: "2" },
          { value: "neutral",  color: "#f59e0b", hotkey: "3" },
          { value: "mixed",    color: "#8b5cf6", hotkey: "4" },
        ],
        allow_multiple: false,
        instructions: "Select the overall sentiment of the review.",
      },
    },
  });

  const textClassTasks = [
    "The product arrived on time and works perfectly. Highly recommend!",
    "Terrible experience. The item broke after two days of use.",
    "It's okay. Nothing special but gets the job done.",
    "I love the design but the battery life could be better.",
    "Worst purchase I've ever made. Complete waste of money.",
    "Pretty good for the price. Would consider buying again.",
  ];

  for (let i = 0; i < textClassTasks.length; i++) {
    await prisma.task.upsert({
      where: { id: `task_tc_${i}` },
      update: {},
      create: {
        id: `task_tc_${i}`,
        projectId: textClassProject.id,
        order: i,
        data: { text: textClassTasks[i] },
      },
    });
  }

  // ─── 2. NER / Span Labeling ───────────────────────────────────────────────
  const nerProject = await prisma.project.upsert({
    where: { id: "proj_ner" },
    update: {},
    create: {
      id: "proj_ner",
      name: "Named Entity Recognition",
      description: "Label entities in news articles",
      type: "ner",
      config: {
        labels: [
          { value: "PERSON",   color: "#3b82f6", hotkey: "1" },
          { value: "ORG",      color: "#f59e0b", hotkey: "2" },
          { value: "LOCATION", color: "#22c55e", hotkey: "3" },
          { value: "DATE",     color: "#ec4899", hotkey: "4" },
          { value: "PRODUCT",  color: "#8b5cf6", hotkey: "5" },
        ],
        instructions: "Select text and choose an entity label.",
      },
    },
  });

  const nerTasks = [
    "Elon Musk announced that Tesla will open a new factory in Austin, Texas in March 2025.",
    "Apple released the iPhone 16 in September 2024, with Tim Cook presenting the keynote in Cupertino.",
    "The United Nations held an emergency meeting in New York to discuss the conflict in Gaza.",
    "Amazon reported record profits in Q4 2024, driven by AWS growth, said CEO Andy Jassy.",
  ];

  for (let i = 0; i < nerTasks.length; i++) {
    await prisma.task.upsert({
      where: { id: `task_ner_${i}` },
      update: {},
      create: {
        id: `task_ner_${i}`,
        projectId: nerProject.id,
        order: i,
        data: { text: nerTasks[i] },
      },
    });
  }

  // ─── 3. Image Classification ──────────────────────────────────────────────
  const imgClassProject = await prisma.project.upsert({
    where: { id: "proj_img_class" },
    update: {},
    create: {
      id: "proj_img_class",
      name: "Image Scene Classification",
      description: "Classify the scene type in each image",
      type: "image_classification",
      config: {
        labels: [
          { value: "indoor",   color: "#3b82f6", hotkey: "1" },
          { value: "outdoor",  color: "#22c55e", hotkey: "2" },
          { value: "urban",    color: "#f59e0b", hotkey: "3" },
          { value: "nature",   color: "#84cc16", hotkey: "4" },
          { value: "abstract", color: "#ec4899", hotkey: "5" },
        ],
        allow_multiple: true,
        instructions: "Select all scene categories that apply.",
      },
    },
  });

  const imgClassTasks = [
    { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", caption: "Mountain landscape" },
    { url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800", caption: "City at night" },
    { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800", caption: "Restaurant interior" },
    { url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800", caption: "Forest path" },
  ];

  for (let i = 0; i < imgClassTasks.length; i++) {
    await prisma.task.upsert({
      where: { id: `task_ic_${i}` },
      update: {},
      create: {
        id: `task_ic_${i}`,
        projectId: imgClassProject.id,
        order: i,
        data: { imageUrl: imgClassTasks[i].url, caption: imgClassTasks[i].caption },
      },
    });
  }

  // ─── 4. Bounding Box ──────────────────────────────────────────────────────
  const bboxProject = await prisma.project.upsert({
    where: { id: "proj_bbox" },
    update: {},
    create: {
      id: "proj_bbox",
      name: "Object Detection",
      description: "Draw bounding boxes around objects",
      type: "bounding_box",
      config: {
        labels: [
          { value: "car",    color: "#ef4444", hotkey: "1" },
          { value: "person", color: "#3b82f6", hotkey: "2" },
          { value: "tree",   color: "#22c55e", hotkey: "3" },
          { value: "building", color: "#f59e0b", hotkey: "4" },
        ],
        instructions: "Draw bounding boxes around each object and assign a label.",
      },
    },
  });

  const bboxTasks = [
    { url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800", caption: "Street scene" },
    { url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800", caption: "City intersection" },
    { url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800", caption: "Shopping mall" },
  ];

  for (let i = 0; i < bboxTasks.length; i++) {
    await prisma.task.upsert({
      where: { id: `task_bb_${i}` },
      update: {},
      create: {
        id: `task_bb_${i}`,
        projectId: bboxProject.id,
        order: i,
        data: { imageUrl: bboxTasks[i].url, caption: bboxTasks[i].caption },
      },
    });
  }

  // ─── 5. Audio Transcription ───────────────────────────────────────────────
  const audioProject = await prisma.project.upsert({
    where: { id: "proj_audio" },
    update: {},
    create: {
      id: "proj_audio",
      name: "Audio Transcription",
      description: "Transcribe spoken audio clips",
      type: "audio_transcription",
      config: {
        instructions: "Listen to the audio and type what you hear. Mark unclear sections with [unclear].",
        show_timestamps: false,
        languages: ["English", "Arabic", "Other"],
      },
    },
  });

  const audioTasks = [
    {
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      duration: 30,
      description: "News broadcast clip #1",
    },
    {
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      duration: 25,
      description: "Interview excerpt #2",
    },
  ];

  for (let i = 0; i < audioTasks.length; i++) {
    await prisma.task.upsert({
      where: { id: `task_au_${i}` },
      update: {},
      create: {
        id: `task_au_${i}`,
        projectId: audioProject.id,
        order: i,
        data: audioTasks[i],
      },
    });
  }

  // ─── 6. Q&A Review ────────────────────────────────────────────────────────
  const qaProject = await prisma.project.upsert({
    where: { id: "proj_qa" },
    update: {},
    create: {
      id: "proj_qa",
      name: "Q&A Review",
      description: "Review AI-generated answers for accuracy",
      type: "qa_review",
      config: {
        rating_labels: [
          { value: "correct",   color: "#22c55e", hotkey: "1" },
          { value: "partial",   color: "#f59e0b", hotkey: "2" },
          { value: "incorrect", color: "#ef4444", hotkey: "3" },
          { value: "irrelevant",color: "#8b5cf6", hotkey: "4" },
        ],
        require_correction: false,
        instructions: "Rate the AI answer and optionally provide a corrected version.",
      },
    },
  });

  const qaTasks = [
    {
      question: "What is the capital of France?",
      ai_answer: "The capital of France is Paris, which is also the largest city in the country.",
      context: "General knowledge",
    },
    {
      question: "What causes rainbows?",
      ai_answer: "Rainbows are caused by refraction of sunlight through water droplets.",
      context: "Physics",
    },
    {
      question: "Who wrote Hamlet?",
      ai_answer: "Hamlet was written by William Shakespeare around 1600-1601.",
      context: "Literature",
    },
  ];

  for (let i = 0; i < qaTasks.length; i++) {
    await prisma.task.upsert({
      where: { id: `task_qa_${i}` },
      update: {},
      create: {
        id: `task_qa_${i}`,
        projectId: qaProject.id,
        order: i,
        data: qaTasks[i],
      },
    });
  }

  // ─── 7. Free-form Notes ───────────────────────────────────────────────────
  const freeformProject = await prisma.project.upsert({
    where: { id: "proj_freeform" },
    update: {},
    create: {
      id: "proj_freeform",
      name: "Content Review Notes",
      description: "Free-form review and notes on documents",
      type: "freeform",
      config: {
        instructions: "Review the content and add your notes, concerns, or suggestions.",
        min_length: 20,
        tags: ["bug", "improvement", "good", "unclear", "duplicate"],
      },
    },
  });

  const freeformTasks = [
    {
      title: "Product Description: Smart Watch Pro",
      content:
        "The Smart Watch Pro features a 1.4 inch AMOLED display, heart rate monitoring, GPS tracking, and 7-day battery life. Available in black, silver, and rose gold. Water resistant up to 50 meters.",
    },
    {
      title: "FAQ: Return Policy",
      content:
        "Q: Can I return a product? A: Yes, within 30 days of purchase with original receipt. Items must be unused and in original packaging. Digital downloads are non-refundable.",
    },
    {
      title: "Blog Post: Future of AI",
      content:
        "Artificial intelligence is rapidly evolving. In the next decade, we expect AI to transform healthcare, transportation, and education. However, ethical considerations must guide development.",
    },
  ];

  for (let i = 0; i < freeformTasks.length; i++) {
    await prisma.task.upsert({
      where: { id: `task_ff_${i}` },
      update: {},
      create: {
        id: `task_ff_${i}`,
        projectId: freeformProject.id,
        order: i,
        data: freeformTasks[i],
      },
    });
  }



  // ─── Users and role examples ──────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@fabric.local" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@fabric.local",
      name: "Admin",
      password: hashPassword("admin123"),
      role: "ADMIN",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@fabric.local" },
    update: { role: "MANAGER" },
    create: {
      email: "manager@fabric.local",
      name: "Manager",
      password: hashPassword("manager123"),
      role: "MANAGER",
    },
  });

  const annotator = await prisma.user.upsert({
    where: { email: "annotator@fabric.local" },
    update: { role: "ANNOTATOR" },
    create: {
      email: "annotator@fabric.local",
      name: "Annotator",
      password: hashPassword("annotator123"),
      role: "ANNOTATOR",
    },
  });

  for (const projectId of ["proj_text_class", "proj_ner", "proj_img_class"]) {
    await prisma.projectAssignment.upsert({
      where: { projectId_userId: { projectId, userId: annotator.id } },
      update: {},
      create: { projectId, userId: annotator.id },
    });
  }

  console.log("✅ Seed complete!");
  console.log(`   Projects created: 7`);
  console.log(`   Tasks created: ${textClassTasks.length + nerTasks.length + imgClassTasks.length + bboxTasks.length + audioTasks.length + qaTasks.length + freeformTasks.length}`);
  console.log("   Default users: admin@fabric.local / admin123, manager@fabric.local / manager123, annotator@fabric.local / annotator123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
