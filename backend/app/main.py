from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import tracker

app = FastAPI(title="ProfitLens API", version="1.0 MVP")

# Permite que qualquer site (LPs dos médicos) mande dados para cá
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Libera para todos (Vercel, Localhost, Landing Pages)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclui as rotas
app.include_router(tracker.router)

@app.get("/")
def health_check():
    return {"status": "online", "system": "ProfitLens ROI Master"}