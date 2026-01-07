import pandas as pd
import numpy as np

def carregar_dados(arquivo):
    """
    Carregamento ALTA PERFORMANCE:
    - Se for CSV: Usa pd.read_csv (muito rápido)
    - Se for Excel: Usa Calamine Engine (Ultra Fast)
    Baseado em posições fixas (índices): A(0), D(3), E(4), M(12), AK(36), AP(41), AU(46)
    """
    indices_fixos = [0, 3, 4, 12, 36, 41, 46]
    nomes_sistema = [
        "Data", "Rota", "Regional", "MRU", 
        "Horas_Input", "Colaborador", "Intervalos_Input"
    ]
    
    # Verificar se é CSV pela extensão do nome do arquivo (Streamlit buffer tem .name)
    nome_arquivo = getattr(arquivo, 'name', '').lower()
    
    if nome_arquivo.endswith('.csv'):
        try:
            # Tentar ler CSV com ponto e vírgula (comum no Brasil) primeiro
            df = pd.read_csv(arquivo, usecols=indices_fixos, sep=None, engine='python', encoding='utf-8-sig')
        except Exception:
            # Fallback para qualquer erro de leitura
            arquivo.seek(0)
            df = pd.read_csv(arquivo, usecols=indices_fixos, sep=',', encoding='utf-8-sig')
    else:
        # Priority: Calamine Engine (Ultra Fast Excel)
        try:
            df = pd.read_excel(arquivo, usecols=indices_fixos, header=0, engine='calamine')
        except Exception:
            try:
                df = pd.read_excel(arquivo, usecols=indices_fixos, header=0, engine='openpyxl')
            except Exception:
                df = pd.read_excel(arquivo, header=0)
                df = df.iloc[:, [i for i in indices_fixos if i < len(df.columns)]]

    # Renomeação forçada para garantir consistência
    if len(df.columns) == len(nomes_sistema):
        df.columns = nomes_sistema
    else:
        novos_nomes = {}
        for i, col in enumerate(df.columns):
            if i < len(nomes_sistema):
                novos_nomes[col] = nomes_sistema[i]
        df.rename(columns=novos_nomes, inplace=True)

    # Garantias e Limpezas
    df["Colaborador"] = df["Colaborador"].fillna("Não Identificado").astype(str).str.strip()
    
    if "MRU" in df.columns:
        df["MRU"] = df["MRU"].astype(str).str.replace(r"\.0$", "", regex=True)
        # Limpeza para remover sufixo -1 e preencher com zeros à esquerda
        df["MRU"] = df["MRU"].str.split("-").str[0].str.strip().str.zfill(8)

    return df
