import pandas as pd
import numpy as np
import duckdb
import os
import hashlib

def get_file_hash(arquivo):
    """Gera um hash único baseado no conteúdo do arquivo para o cache"""
    try:
        # Pega os primeiros e últimos 8kb para velocidade
        arquivo.seek(0)
        prefix = arquivo.read(8192)
        arquivo.seek(0, os.SEEK_END)
        suffix = arquivo.read(8192)
        arquivo.seek(0)
        return hashlib.md5(prefix + suffix).hexdigest()
    except:
        return None

def carregar_dados(arquivo):
    """
    Carregamento com CACHE PARQUET:
    1. Verifica se já existe uma versão processada (Parquet) do arquivo.
    2. Se existir, carrega em < 0.1s.
    3. Se não, processa via DuckDB/Calamine e salva o Parquet para a próxima vez.
    """
    # Criar pasta de cache se não existir
    cache_dir = ".cache_parquet"
    if not os.path.exists(cache_dir):
        os.makedirs(cache_dir)

    file_hash = get_file_hash(arquivo)
    parquet_path = os.path.join(cache_dir, f"{file_hash}.parquet") if file_hash else None

    # TENTATIVA 1: Carregar do Cache Parquet (Instantâneo)
    if parquet_path and os.path.exists(parquet_path):
        try:
            return pd.read_parquet(parquet_path)
        except:
            pass # Se o cache estiver corrompido, segue para o carregamento normal

    # TENTATIVA 2: Carregamento Normal (DuckDB ou Excel)
    indices_fixos = [0, 3, 4, 12, 36, 41, 46]
    nomes_sistema = [
        "Data", "Rota", "Regional", "MRU", 
        "Horas_Input", "Colaborador", "Intervalos_Input"
    ]
    
    nome_arquivo = getattr(arquivo, 'name', '').lower()
    
    if nome_arquivo.endswith('.csv'):
        try:
            temp_path = f"temp_{os.getpid()}.csv"
            with open(temp_path, "wb") as f:
                f.write(arquivo.getbuffer())
            
            con = duckdb.connect(database=':memory:')
            query = f"""
                SELECT 
                    column{indices_fixos[0]} as Data,
                    column{indices_fixos[1]} as Rota,
                    column{indices_fixos[2]} as Regional,
                    column{indices_fixos[3]} as MRU,
                    column{indices_fixos[4]} as Horas_Input,
                    column{indices_fixos[5]} as Colaborador,
                    column{indices_fixos[6]} as Intervalos_Input
                FROM read_csv_auto('{temp_path}', header=True)
            """
            df = con.execute(query).df()
            try: os.remove(temp_path)
            except: pass
        except:
            arquivo.seek(0)
            df = pd.read_csv(arquivo, usecols=indices_fixos, sep=None, engine='python', encoding='utf-8-sig')
            df.columns = nomes_sistema
    else:
        try:
            df = pd.read_excel(arquivo, usecols=indices_fixos, header=0, engine='calamine')
        except:
            try:
                df = pd.read_excel(arquivo, usecols=indices_fixos, header=0, engine='openpyxl')
            except:
                df = pd.read_excel(arquivo, header=0)
                df = df.iloc[:, [i for i in indices_fixos if i < len(df.columns)]]

        if len(df.columns) == len(nomes_sistema):
            df.columns = nomes_sistema
        else:
            novos_nomes = {col: nomes_sistema[i] for i, col in enumerate(df.columns) if i < len(nomes_sistema)}
            df.rename(columns=novos_nomes, inplace=True)

    # Limpezas básicas
    df["Colaborador"] = df["Colaborador"].fillna("Não Identificado").astype(str).str.strip()
    if "MRU" in df.columns:
        df["MRU"] = df["MRU"].astype(str).str.replace(r"\.0$", "", regex=True)
        df["MRU"] = df["MRU"].str.split("-").str[0].str.strip().str.zfill(8)

    # SALVAR NO CACHE PARA A PRÓXIMA VEZ
    if parquet_path:
        try:
            df.to_parquet(parquet_path, compression='snappy')
        except:
            pass

    return df
