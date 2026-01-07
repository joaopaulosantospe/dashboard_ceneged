import pandas as pd

def carregar_dados(arquivo):
    # Definir as colunas necessárias para otimizar a leitura
    # 0:Data, 3:Rota, 4:Regional, 12:MRU, 13:Nome_MRU, 36:Hora_Evento, 41:Colaborador, 46:Intervalo
    cols_to_use = [0, 3, 4, 12, 13, 36, 41, 46]
    
    # O motor 'calamine' é muito mais rápido que o padrão para arquivos grandes
    try:
        df = pd.read_excel(arquivo, engine='calamine', usecols=cols_to_use)
    except:
        # Fallback caso calamine falhe por algum motivo de versão
        df = pd.read_excel(arquivo, usecols=cols_to_use)
    
    # Renomear colunas PELA POSIÇÃO atual no DataFrame filtrado
    # As posições mudam pois agora só temos 8 colunas
    df.columns = [
        "Data", "Rota", "Regional", "MRU", 
        "Nome_MRU", "Hora_Evento", "Colaborador", "Intervalo"
    ]
    
    # Garantir que MRU seja string e mantenha zeros à esquerda
    if 'MRU' in df.columns:
        # Converter para string e remover '.0' caso exista (decimais do excel)
        # Em seguida, remover sufixos como '-1', '- 1', etc, pegando apenas a primeira parte
        df['MRU'] = df['MRU'].astype(str).str.replace('.0', '', regex=False)
        df['MRU'] = df['MRU'].str.split('-').str[0].str.strip().str.zfill(8)
    
    return df
