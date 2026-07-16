from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter()

templates = Jinja2Templates(directory="templates")


@router.get("/daily", response_class=HTMLResponse)
async def daily(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="daily.html",
        context={
            "title": "รายงานรายวัน",
            "page": "daily",
        }
    )
