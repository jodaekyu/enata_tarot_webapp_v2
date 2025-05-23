
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(express.json());

// OpenAI 설정 (환경변수에서 API 키)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Google Sheets 설정 (환경변수에서 JSON 문자열 파싱)
const auth = new google.auth.GoogleAuth({
  keyFile: '/etc/secrets/tarot-sheets-key.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});const sheets = google.sheets({ version: 'v4', auth });

const spreadsheetId = '1AiV6Ns7AjvzJ0-XAzXNnT0j4U9a_dCnmTY1dOpdHYNw';
const sheetRange = '시트1!A1';

app.post('/generate', async (req, res) => {
  const { question, card } = req.body;
  if (!question || !card) {
    return res.status(400).json({ error: '질문과 카드가 필요합니다.' });
  }

  try {
    const prompt = `질문: ${question}\n카드: ${card}\n이 카드와 질문에 대한 간결하고 위트 있는 타로 조언을 해줘. 맞춤법도 정확하게.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
    });

    const answer = completion.choices[0].message.content;

    const now = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetRange,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[now, question, card, answer]],
      },
    });

    res.json({ result: answer });
  } catch (error) {
    console.error('오류 발생:', error.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
