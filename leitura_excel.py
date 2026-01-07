import pandas as pd
import numpy as np

def carregar_dados(arquivo):
    """
    Leitura Estável e Otimizada.
    Foca em compatibilidade total e baixo consumo de memória.
    """
    # Índices: Data(0), Rota(3), Regional(4), MRU(12), Horas_Input(36), Colaborador(41), Intervalos_Input(46)
    indices_originais = [0, 3, 4, 12, 36, 41, 46]
    nomes_colunas = ["Data", "Rota", "Regional", "MRU", "Horas_Input", "Colaborador", "Intervalos_Input"]

    try:
        # Tenta ler apenas as colunas necessárias. 
        # Removi o 'dtype' forçado aqui para evitar erros de índice/mapeamento.
        df = pd.read_excel(arquivo, usecols=indices_originais, engine='calamine')
    except Exception:
        # Fallback caso o motor Calamine não esteja disponível no servidor
        df = pd.read_excel(arquivo, usecols=indices_originais)
    
    # Renomear colunas para o padrão do sistema
    # O Pandas entrega as colunas na ordem em que aparecem na planilha
    df.columns = nomes_colunas
    
    # Otimização de memória pós-leitura (Seguro e estável)
    for col in ["Rota", "Regional", "Colaborador"]:
        df[col] = df[col].astype(str).str.strip().astype('category')
    
    return df
