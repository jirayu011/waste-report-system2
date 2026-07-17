from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from routers.dashboard import router as dashboard_router
from routers.daily import router as daily_router
from routers.monthly import router as monthly_router
from routers.api import router as api_router
app = FastAPI(
    title="Waste Report System",
    version="1.0.0"
)


@app.middleware("http")
async def prevent_stale_static_assets(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/static/"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)

app.include_router(dashboard_router)
app.include_router(daily_router)
app.include_router(monthly_router)
app.include_router(api_router)
