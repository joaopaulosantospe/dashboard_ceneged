import pandas as pd
import numpy as np

def horas_para_tempo(horas, incluir_segundos=False):
    """Converte horas decimais para formato HH:MM de forma protegida"""
    try:
        if pd.isna(horas) or np.isinf(horas): return "00:00"
        h = int(abs(horas))
        m = int(round((abs(horas) - h) * 60))
        if m == 60: # Ajuste de arredondamento
            h += 1
            m = 0
        return f"{h:02d}:{m:02d}"
    except:
        return "00:00"

def preparar_dados(df):
    """
    Motor V18: Arquitetura de Memória Otimizada.
    Focado em evitar explosões de consumo de RAM no Streamlit Cloud.
    """
    
    # 1. Conversão Temporal Inteligente (Evita strings pesadas)
    def converter_eficiente(series):
        # Se já for numérico (comum no Excel), multiplica por 24 (dia -> horas)
        if pd.api.types.is_numeric_dtype(series):
            return series * 24.0
        # Se for string ou objeto, usa timedelta (mais lento mas seguro)
        return pd.to_timedelta(series.astype(str), errors='coerce').dt.total_seconds() / 3600

    df["h_dec"] = converter_eficiente(df["Horas_Input"])
    df["i_dec"] = converter_eficiente(df["Intervalos_Input"])
    df["Data"] = pd.to_datetime(df["Data"], errors='coerce')

    # 2. Agrupamento (Libera memória logo após)
    df_final = df.groupby(["Colaborador", "Data"], sort=False, observed=True).agg({
        "h_dec": ["min", "max"],
        "i_dec": lambda x: x.nlargest(3).sum(),
        "Rota": "first",
        "Regional": "first",
        "MRU": "first"
    }).reset_index()

    # Nivelar colunas
    df_final.columns = ["Colaborador", "Data", "H_min", "H_max", "Intervalo_dec", "Rota", "Regional", "MRU"]

    # 3. Limpeza de Metadados (Apenas nos dados reduzidos)
    df_final["Colaborador"] = df_final["Colaborador"].astype(str).str.strip()
    # Otimização da MRU
    df_final["MRU"] = df_final["MRU"].astype(str).str.replace(r"\.0$", "", regex=True).str.split("-").str[0].str.strip().str.zfill(8)

    # 4. Cálculos Matemáticos
    df_final["Horas_Dias_dec"] = df_final["H_max"] - df_final["H_min"]
    df_final["Horas_Liquidas"] = (df_final["Horas_Dias_dec"] - df_final["Intervalo_dec"]).clip(lower=0)
    
    # 5. Formatação (Consumo mínimo de recursos)
    df_final["Data_Formatada"] = df_final["Data"].dt.strftime("%d/%m/%Y")
    df_final["Hora_inicio"] = df_final["H_min"].apply(horas_para_tempo)
    df_final["Hora_Final"] = df_final["H_max"].apply(horas_para_tempo)
    df_final["Horas_Dias"] = df_final["Horas_Dias_dec"].apply(horas_para_tempo)
    df_final["Intervalo"] = df_final["Intervalo_dec"].apply(horas_para_tempo)
    df_final["Horas_Trabalhadas"] = df_final["Horas_Liquidas"].apply(horas_para_tempo)
    
    # Coluna extra para manter compatibilidade com gráficos
    df_final["MRU_Completa"] = df_final["MRU"]

    return df_final
