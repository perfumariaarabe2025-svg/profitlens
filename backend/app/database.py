import firebase_admin
from firebase_admin import credentials, firestore
import os

# Caminho para a chave que você baixou
CREDENTIAL_PATH = "serviceAccountKey.json"

db = None

def get_db():
    global db
    if db:
        return db

    if os.path.exists(CREDENTIAL_PATH):
        try:
            cred = credentials.Certificate(CREDENTIAL_PATH)
            firebase_admin.initialize_app(cred)
            db = firestore.client()
            print("🔥 Firebase Conectado com Sucesso! (Modo Produção)")
            return db
        except Exception as e:
            print(f"❌ Erro ao conectar Firebase: {e}")
            return None
    else:
        print(f"⚠️ ARQUIVO NÃO ENCONTRADO: {CREDENTIAL_PATH}")
        print("O sistema vai rodar, mas vai dar erro ao tentar salvar.")
        return None

# Inicializa na importação
db = get_db()