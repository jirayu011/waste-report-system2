from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from services.sheets import FORM_URL, get_all_data


router = APIRouter(prefix="/api", tags=["API"])
CATEGORY_KEYS = ("general", "recycle", "infectious", "document", "toxic", "other")


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

        summary = {key: sum(row[key] for row in data) for key in CATEGORY_KEYS}
        summary.update(
            total=sum(row["total"] for row in data),
            records=len(data),
        )

        return {
            "success": True,
            "count": len(data),
            "summary": summary,
            "branches": sorted({row["branch"] for row in data if row["branch"]}),
            "form_url": FORM_URL,
            "data": data,
        }
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": str(exc)},
        )
