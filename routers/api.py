from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from services.sheets import FORM_URL, get_all_data


router = APIRouter(prefix="/api", tags=["API"])


@router.get("/data")
def api_data(
    date: str | None = Query(default=None),
    month: str | None = Query(default=None),
    branch: str | None = Query(default=None),
):
    try:
        data = get_all_data()

        if date:
            data = [row for row in data if row["date_iso"] == date]
        if month:
            data = [row for row in data if row["date_iso"].startswith(month)]
        if branch:
            data = [row for row in data if row["branch"].casefold() == branch.casefold()]

        summary = {
            "general": sum(row["general"] for row in data),
            "recycle": sum(row["recycle"] for row in data),
            "total": sum(row["total"] for row in data),
            "records": len(data),
        }
        branches = sorted({row["branch"] for row in data if row["branch"]})

        return {
            "success": True,
            "count": len(data),
            "summary": summary,
            "branches": branches,
            "form_url": FORM_URL,
            "data": data,
        }
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": str(exc)},
        )
