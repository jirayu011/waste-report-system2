import csv
import io
import os
import re
from datetime import datetime
from pathlib import Path

import gspread
import requests
from google.oauth2.service_account import Credentials
from urllib.parse import quote


SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
SPREADSHEET_ID = os.getenv(
    "SPREADSHEET_ID",
    "1OTFT6WaLkU4sOXdb4bCTrzPmjErPnHSP2HiH7ejC6z8",
)
SHEET_NAME = os.getenv("SHEET_NAME", "การตอบแบบฟอร์ม 1")
FORM_URL = os.getenv(
    "FORM_URL",
    "https://docs.google.com/forms/d/1uLLBqKbqgTLa7tsu_OYfnpQipEO8ZrsSK-HxEDyLb9Q/viewform",
)
BASE_DIR = Path(__file__).resolve().parent.parent
CREDENTIALS_FILE = Path(
    os.getenv("GOOGLE_CREDENTIALS_FILE", BASE_DIR / "data" / "credentials.json")
)


def get_client():
    credentials = Credentials.from_service_account_file(
        CREDENTIALS_FILE,
        scopes=SCOPES,
    )
    return gspread.authorize(credentials)


def get_sheet():
    spreadsheet = get_client().open_by_key(SPREADSHEET_ID)
    try:
        return spreadsheet.worksheet(SHEET_NAME)
    except gspread.WorksheetNotFound:
        # Google Forms may keep the Thai default tab name while the table itself
        # is named Form_Responses. Falling back keeps the report usable if renamed.
        for candidate in ("Form_Responses", "การตอบแบบฟอร์ม 1"):
            try:
                return spreadsheet.worksheet(candidate)
            except gspread.WorksheetNotFound:
                continue
        return spreadsheet.sheet1


def _public_records():
    sheet = quote(SHEET_NAME, safe="")
    url = (
        f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/gviz/tq"
        f"?tqx=out:csv&sheet={sheet}"
    )
    response = requests.get(url, timeout=20)
    response.raise_for_status()
    response.encoding = "utf-8"
    return list(csv.DictReader(io.StringIO(response.text)))


def _get_records():
    # A public Google Sheet does not require a service-account key. Use the key
    # when supplied, otherwise read the CSV view exposed by the shared sheet.
    if CREDENTIALS_FILE.is_file() and CREDENTIALS_FILE.stat().st_size > 2:
        try:
            return get_sheet().get_all_records(default_blank="")
        except (ValueError, gspread.GSpreadException):
            pass
    return _public_records()


def _clean_header(value):
    return " ".join(str(value or "").strip().split())


def _number(value):
    text = str(value or "").strip().replace(",", "")
    match = re.search(r"-?\d+(?:\.\d+)?", text)
    return float(match.group()) if match else 0.0


def _date_iso(value):
    text = str(value or "").strip()
    for pattern in ("%d/%m/%Y", "%Y-%m-%d", "%d/%m/%y"):
        try:
            return datetime.strptime(text, pattern).date().isoformat()
        except ValueError:
            pass
    return ""


def _timestamp_iso(value):
    text = str(value or "").strip()
    for pattern in (
        "%d/%m/%Y, %H:%M:%S",
        "%d/%m/%Y %H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
    ):
        try:
            return datetime.strptime(text, pattern).isoformat()
        except ValueError:
            pass
    return ""


def _pick(row, *names):
    normalized = {_clean_header(key): value for key, value in row.items()}
    for name in names:
        if name in normalized:
            return normalized[name]
    return ""


def normalize_row(row, index):
    timestamp = _pick(row, "ประทับเวลา", "Timestamp")
    report_date = _pick(row, "วันที่", "Date")
    branch = _pick(
        row,
        "Gourmet House Culinary Care – (GHCC)",
        "Gourmet House Culinary Care - (GHCC)",
    )
    general = _number(_pick(row, "ขยะทั่วไป"))
    recycle = _number(_pick(row, "ขยะรีไซเคิล"))

    return {
        "id": index,
        "timestamp": str(timestamp or "").strip(),
        "timestamp_iso": _timestamp_iso(timestamp),
        "date": str(report_date or "").strip(),
        "date_iso": _date_iso(report_date),
        "branch": str(branch or "").strip(),
        "general": general,
        "recycle": recycle,
        "total": general + recycle,
        "recorder": str(_pick(row, "ผู้บันทึกขยะ", "ผู้บันทึกขยะ ") or "").strip(),
    }


def get_all_data():
    rows = _get_records()
    return [normalize_row(row, index) for index, row in enumerate(rows, start=1)]
