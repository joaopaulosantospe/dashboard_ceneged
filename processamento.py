import pandas as pd
import numpy as np
import gc

def horas_para_tempo(horas):
    """Conversão ultra-leve para formato HH:MM"""
    if pd.isna(horas) or np.isinf(horas): return "00:00"
    abs_h = abs(horas)
    h = int(abs_h)
    m = int(round((abs_h - h) * 60))
    if m == 60: h += 1; m = 0
    return f"{h:02d}:{m:02d}"

def preparar_dados(df):
    """
    Motor de Processamento V20: In-place e Memory-Aware.
    Projetado para rodar no limite de 1GB de RAM do Streamlit Cloud.
    """
    
    # 1. Conversão Numérica Pró-Ativa (Evita strings)
    # No Excel, horas costumam vir como fração de dia (0.33 = 8h)
    def to_dec(series):
        if pd.api.types.is_numeric_dtype(series):
            return series * 24.0
        return pd.to_timedelta(series.astype(str), errors='coerce').dt.total_seconds() / 3600

    # Sobreescreve colunas para economizar RAM
    df["h_dec"] = to_dec(df["Horas_Input"])
    df["i_dec"] = to_dec(df["Intervalos_Input"])
    df["Data"] = pd.to_datetime(df["Data"], errors='coerce')

    # Remove colunas brutas que não usaremos mais
    df.drop(columns=["Horas_Input", "Intervalos_Input"], inplace=True, errors='ignore')

    # 2. Agrupamento com Baixo Overhead
    df_final = df.groupby(["Colaborador", "Data"], sort=False, observed=True).agg({
        "h_dec": ["min", "max"],
        "i_dec": "max", # Simplificado: pegamos o maior registro de intervalo do dia
        "Rota": "first",
        "Regional": "first",
        "MRU": "first"
    }).reset_index()

    # Deleta DataFrame original para liberar RAM IMEDIATAMENTE
    del df
    gc.collect()

    # 3. Organização do Dataframe Final
    df_final.columns = ["Colaborador", "Data", "H_min", "H_max", "Intervalo_dec", "Rota", "Regional", "MRU"]

    # 4. Cálculos e Limpeza de Strings (Apenas nos dados resumidos)
    df_final["Colaborador"] = df_final["Colaborador"].astype(str).str.strip()
    df_final["MRU"] = df_final["MRU"].astype(str).str.replace(r"\.0$", "", regex=True).str.split("-").str[0].str.strip().str.zfill(8)
    
    df_final["Horas_Dias_dec"] = (df_final["H_max"] - df_final["H_min"]).clip(lower=0)
    df_final["Horas_Liquidas"] = (df_final["Horas_Dias_dec"] - df_final["Intervalo_dec"]).clip(lower=0)

    # 5. Formatação Visual (Última etapa)
    df_final["Data_Formatada"] = df_final["Data"].dt.strftime("%d/%m/%Y")
    df_final["Hora_inicio"] = df_final["H_min"].apply(horas_para_tempo)
    df_final["Hora_Final"] = df_final["H_max"].apply(horas_para_tempo)
    df_final["Horas_Trabalhadas"] = df_final["Horas_Liquidas"].apply(horas_para_tempo)
    
    # Manter nomes para compatibilidade com o app.py
    df_final["MRU_Completa"] = df_final["MRU"]
    df_final["Intervalo"] = df_final["Intervalo_dec"].apply(horas_para_tempo)
    df_final["Horas_Dias"] = df_final["Horas_Dias_dec"].apply(horas_para_tempo)

    return df_final
