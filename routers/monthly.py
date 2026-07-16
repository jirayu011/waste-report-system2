from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter()

templates = Jinja2Templates(directory="templates")


@router.get("/monthly", response_class=HTMLResponse)
async def monthly(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="monthly.html",
        context={
            "title": "รายงานรายเดือน",
            "page": "monthly",
        }
    )
