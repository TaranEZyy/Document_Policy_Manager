const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const libre = require('libreoffice-convert');
const versionInfo = require('./version.json');
const app = express();
const port = 5000;

app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const originalName = file.originalname;
    let finalName = originalName;
    let counter = 1;

    while (fs.existsSync(path.join(uploadDir, finalName))) {
      const nameWithoutExt = path.parse(originalName).name;
      const ext = path.extname(originalName);
      finalName = `${nameWithoutExt}(${counter})${ext}`;
      counter++;
    }

    cb(null, finalName);
  },
});

const upload = multer({ storage });

app.get('/api/version', (req, res) => {
  res.json(versionInfo);
});

app.post('/api/v1/upload', upload.array('files'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files uploaded.');
  }

  const uploadedFiles = [];

  for (const file of req.files) {
    const ext = path.extname(file.originalname).toLowerCase();
    const filePath = path.join(uploadDir, file.filename);

    if (ext === '.docx') {
      const pdfFilename = file.filename.replace(/\.docx$/, '.pdf');
      const pdfPath = path.join(uploadDir, pdfFilename);
      const docxBuffer = fs.readFileSync(filePath);

      try {
        const pdfBuffer = await new Promise((resolve, reject) => {
          libre.convert(docxBuffer, '.pdf', undefined, (err, done) => {
            if (err) reject(err);
            else resolve(done);
          });
        });

        fs.writeFileSync(pdfPath, pdfBuffer);

        // Only include the generated PDF in the response
        uploadedFiles.push({
          originalname: file.originalname.replace(/\.docx$/, '.pdf'),
          filename: pdfFilename,
          url: `http://localhost:${port}/uploads/${pdfFilename}`,
        });
      } catch (err) {
        console.error('Error converting DOCX:', err);
        return res.status(500).send('Error converting DOCX to PDF');
      }
    } else if (ext === '.pdf') {
      uploadedFiles.push({
        originalname: file.originalname,
        filename: file.filename,
        url: `http://localhost:${port}/uploads/${file.filename}`,
      });
    } else {
      // Skip unsupported files
      fs.unlinkSync(filePath);
    }
  }

  res.status(200).json({
    message: 'Files uploaded and processed successfully',
    files: uploadedFiles,
  });
});

app.get('/api/v1/documents', (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir);
    const pdfFiles = files.filter((file) => path.extname(file).toLowerCase() === '.pdf');

    const fileList = pdfFiles.map(file => ({
      filename: file,
      url: `http://localhost:${port}/uploads/${file}`,
    }));

    res.json(fileList);
  } catch (err) {
    console.error('Error reading uploads:', err);
    res.status(500).send('Unable to read uploaded documents.');
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
