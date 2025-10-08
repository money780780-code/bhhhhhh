import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { google } from "googleapis";
import sqlite3 from "sqlite3";
import bodyParser from "body-parser";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// إعدادات أساسية
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// قاعدة البيانات
const db = new sqlite3.Database(process.env.DB_FILE || "./db.sqlite");
db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS videos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, file TEXT, approved INTEGER DEFAULT 0)"
  );
});

// رفع الملفات مؤقتًا
const upload = multer({ dest: "uploads/" });

// صفحة البداية
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/public/index.html");
});

// رفع فيديو إلى الطابور
app.post("/upload", upload.single("video"), (req, res) => {
  const title = req.body.title || "فيديو بدون عنوان";
  db.run("INSERT INTO videos (title, file) VALUES (?, ?)", [title, req.file.filename]);
  res.json({ message: "تمت إضافة الفيديو إلى الطابور ✅" });
});

// عرض قائمة الفيديوهات
app.get("/videos", (req, res) => {
  db.all("SELECT * FROM videos", (err, rows) => {
    res.json(rows);
  });
});

// الموافقة على الفيديو
app.post("/approve/:id", (req, res) => {
  db.run("UPDATE videos SET approved = 1 WHERE id = ?", [req.params.id]);
  res.json({ message: "تمت الموافقة على الفيديو ✅" });
});

// رفع إلى YouTube (تجريبي)
app.post("/upload-youtube/:id", async (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM videos WHERE id = ?", [id], async (err, video) => {
    if (!video) return res.status(404).json({ message: "الفيديو غير موجود" });

    // مبدئيًا بدون YouTube API، نحاكي عملية الرفع
    setTimeout(() => {
      res.json({ message: `✅ تم رفع الفيديو "${video.title}" إلى YouTube بنجاح!` });
    }, 2000);
  });
});

app.listen(port, () => {
  console.log(`🚀 السيرفر يعمل على المنفذ ${port}`);
});

