import pandas as pd
import numpy as np

def horas_para_tempo(horas, incluir_segundos=False):
    """Converte horas decimais para formato de tempo otimizado"""
    if pd.isna(horas): return "00:00"
    h = int(abs(horas))
    m = int((abs(horas) - h) * 60)
    return f"{h:02d}:{m:02d}"

def preparar_dados(df):
    """
    Motor de processamento V16: Velocidade Exponencial.
    O segredo é realizar a limpeza de textos (strings) apenas nos dados já reduzidos.
    """
    # 1. Conversão Temporal Vetorizada (Matemática pura, sem strings onde possível)
    df["h_dec"] = pd.to_timedelta(df["Horas_Input"].astype(str), errors='coerce').dt.total_seconds() / 3600
    df["i_dec"] = pd.to_timedelta(df["Intervalos_Input"].astype(str), errors='coerce').dt.total_seconds() / 3600
    df["Data"] = pd.to_datetime(df["Data"], errors='coerce')

    # 2. Agrupamento Instantâneo
    # Aqui reduzimos, por exemplo, de 100.000 linhas para apenas 500 ou 1.000 (um por dia/colaborador)
    df_final = df.groupby(["Colaborador", "Data"], sort=False).agg({
        "h_dec": ["min", "max"],
        "i_dec": lambda x: x.nlargest(3).sum(),
        "Rota": "first",
        "Regional": "first",
        "MRU": "first"
    }).reset_index()

    # Nivelar as colunas
    df_final.columns = ["Colaborador", "Data", "H_min", "H_max", "Intervalo_dec", "Rota", "Regional", "MRU"]

    # 3. LIMPEZA DE TEXTO (Aqui é onde ganhamos a performance)
    # Processar 500 strings é infinitamente mais rápido que processar 100.000
    df_final["Colaborador"] = df_final["Colaborador"].fillna("Não Identificado").astype(str).str.strip()
    df_final["MRU"] = df_final["MRU"].astype(str).str.replace(r"\.0$", "", regex=True).str.split("-").str[0].str.strip().str.zfill(8)

    # 4. Cálculos Matemáticos Finais
    df_final["Horas_Dias_dec"] = df_final["H_max"] - df_final["H_min"]
    df_final["Horas_Liquidas"] = (df_final["Horas_Dias_dec"] - df_final["Intervalo_dec"]).clip(lower=0)
    df_final["MRU_Completa"] = df_final["MRU"]

    # 5. Formatação para exibição (Apenas dados finais)
    df_final["Data_Formatada"] = df_final["Data"].dt.strftime("%d/%m/%Y")
    df_final["Hora_inicio"] = df_final["H_min"].apply(horas_para_tempo)
    df_final["Hora_Final"] = df_final["H_max"].apply(horas_para_tempo)
    df_final["Horas_Dias"] = df_final["Horas_Dias_dec"].apply(horas_para_tempo)
    df_final["Intervalo"] = df_final["Intervalo_dec"].apply(horas_para_tempo)
    df_final["Horas_Trabalhadas"] = df_final["Horas_Liquidas"].apply(horas_para_tempo)

    return df_final
