# GHCC Waste Management

ระบบสรุปรายงานปริมาณขยะประจำวัน 6 หมวดสำหรับ Gourmet House Culinary Care

## Run locally

```bash
pip install -r requirements.txt
uvicorn app:app --reload
```

เปิด `http://127.0.0.1:8000`

## Deploy on Render

- Runtime: `Python 3`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`

ระบบอ่านข้อมูลจาก Google Sheet ที่ตั้งค่าไว้ใน `services/sheets.py` และรองรับ environment variables `SPREADSHEET_ID`, `SHEET_NAME` และ `FORM_URL`
