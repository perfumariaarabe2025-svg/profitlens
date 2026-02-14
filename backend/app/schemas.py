from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

# --- Modelo de Dados do Lead ---
class LeadSchema(BaseModel):
    id_unico: str
    user_id: str
    
    # DADOS DO PACIENTE (Aqui estava o segredo)
    nome: Optional[str] = "Paciente não identificado"
    telefone_lead: Optional[str] = "Não informado"
    tipo_tratamento: Optional[str] = "Consulta Geral"
    
    # RASTREAMENTO (UTMs)
    utm_source: Optional[str] = "direto"
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    
    # ESTADO DO LEAD
    status: Literal['Novo', 'Agendado', 'Vendido', 'Perdido'] = 'Novo'
    valor_venda: float = 0.0
    
    # DATA E HORA
    timestamp: Optional[datetime] = Field(default_factory=datetime.now)