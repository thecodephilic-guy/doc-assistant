const uploadDocumentHandler = (req, res) => {
    try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a file" });
    }
    console.log(req.file.originalname);
    
    res.status(200).json({
    success: true,
    data: {
      document: {
        id: "doc_123",
        name: req.file.originalname,
        size: 1234567,
        uploadedAt: "2026-02-11T05:48:46Z",
        pageCount: 32,
        status: "ready",
      },
    },
  });
    
  } catch {
    res.status(500).json({ error: 'File upload failed' });
  }
}

module.exports = {
    uploadDocumentHandler,
}