from pydantic import BaseModel # Certifique-se que isso está nos imports
from fastapi import HTTPException # Certifique-se que isso está nos imports

# Modelo de dados que vem do Frontend
class LoginSchema(BaseModel):
    uid: str
    email: str
    nome: str = "Usuário Novo" # Valor padrão se não vier nada

@app.post("/login")
def login_user(dados: LoginSchema):
    try:
        # 1. Tenta buscar o usuário no Firestore pelo UID do Authentication
        doc_ref = db.collection('usuarios').document(dados.uid)
        doc = doc_ref.get()

        if doc.exists:
            # 2. Se já existe, retorna os dados dele (Login Normal)
            usuario = doc.to_dict()
            return {
                "status": "sucesso",
                "mensagem": "Bem-vindo de volta!",
                "usuario": usuario
            }
        else:
            # 3. Se NÃO existe, CRIA AUTOMATICAMENTE (Primeiro Acesso)
            novo_usuario = {
                "uid": dados.uid,
                "email": dados.email,
                "nome": dados.nome,
                "plano": "gratis", # Pode mudar depois para 'pro'
                "criado_em": datetime.now()
            }
            doc_ref.set(novo_usuario)
            
            return {
                "status": "sucesso",
                "mensagem": "Conta criada automaticamente!",
                "usuario": novo_usuario
            }

    except Exception as e:
        print(f"Erro no login: {e}")
        raise HTTPException(status_code=500, detail=str(e))