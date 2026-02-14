from fastapi import APIRouter, HTTPException
from app.schemas import LeadSchema
from app.database import db
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

# --- MODELO DE ATUALIZAÇÃO (PATCH) ---
class LeadUpdate(BaseModel):
    status: str
    valor_venda: Optional[float] = 0.0
    data_agendamento: Optional[str] = None  # Novo campo: Data do agendamento (ISO String)

@router.post("/track")
async def receive_lead(lead: LeadSchema):
    if not db: raise HTTPException(status_code=500, detail="Sem DB")
    try:
        # O lead.dict() pega tudo que definimos no Schema (inclusive o nome)
        lead_data = lead.dict()
        
        # Converte a data para string para não dar erro no Firestore
        if lead_data['timestamp']:
            lead_data['timestamp'] = lead_data['timestamp'].isoformat()
            lead_data['data_legivel'] = lead.timestamp.strftime("%d/%m %H:%M")
        
        # Salva no Firestore
        db.collection("leads").document(lead.id_unico).set(lead_data)
        
        print(f"✅ Lead salvo com nome: {lead_data.get('nome')}")
        return {"status": "success", "nome_recebido": lead_data.get('nome')}
    except Exception as e:
        print(f"❌ Erro ao salvar lead: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/leads")
async def get_leads():
    if not db: return []
    try:
        leads_ref = db.collection("leads").stream()
        lista = [doc.to_dict() for doc in leads_ref]
        # Ordena: Agendados próximos primeiro, depois por data de criação
        return sorted(lista, key=lambda x: x.get('timestamp', ''), reverse=True)
    except Exception as e:
        return []

@router.put("/leads/{lead_id}")
async def update_lead(lead_id: str, update: LeadUpdate):
    if not db: raise HTTPException(status_code=500, detail="Sem DB")
    try:
        doc_ref = db.collection("leads").document(lead_id)
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Lead não encontrado")
            
        # Prepara dados para atualizar
        update_data = {
            "status": update.status,
            "valor_venda": update.valor_venda
        }
        
        # Só salva a data se ela foi enviada
        if update.data_agendamento:
            update_data["data_agendamento"] = update.data_agendamento

        doc_ref.update(update_data)
        return {"status": "updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))