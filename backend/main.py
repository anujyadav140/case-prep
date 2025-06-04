from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import chat, cases


app = FastAPI(title="Case Interviews API")

# Allow all origins during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(cases.router, prefix="/cases", tags=["cases"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])

