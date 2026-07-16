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

app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)

app.include_router(dashboard_router)
app.include_router(daily_router)
app.include_router(monthly_router)
app.include_router(api_router)