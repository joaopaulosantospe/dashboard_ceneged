import pandas as pd
import numpy as np
import gc

def carregar_dados(arquivo):
    """
    Leitura Ultra-Otimizada para Memória.
    Descarta dados inúteis no milissegundo em que são lidos.
    """
    # Índices estritos para economizar RAM
    indices = [0, 3, 4, 12, 36, 41, 46]
    nomes = ["Data", "Rota", "Regional", "MRU", "Horas_Input", "Colaborador", "Intervalos_Input"]

    try:
        # Lê apenas o necessário
        df = pd.read_excel(
            arquivo, 
            usecols=indices, 
            engine='calamine'
        )
    except:
        df = pd.read_excel(arquivo, usecols=indices)
    
    # Renomeia imediatamente
    df.columns = nomes
    
    # Converte para categorias (economiza até 90% de RAM em colunas repetitivas)
    for col in ["Rota", "Regional", "Colaborador"]:
        df[col] = df[col].astype(str).str.strip().astype('category')
    
    # Limpeza agressiva
    gc.collect()
    
    return df
