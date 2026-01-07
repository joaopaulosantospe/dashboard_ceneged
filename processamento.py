import pandas as pd
from datetime import time

def horas_para_tempo(horas, incluir_segundos=True):
    """Converte horas decimais para formato de tempo (HH:MM:SS ou HH:MM)"""
    if pd.isna(horas):
        return "00:00:00" if incluir_segundos else "00:00"
    
    sinal = "-" if horas < 0 else ""
    horas_abs = abs(horas)
    
    h = int(horas_abs)
    m = int((horas_abs - h) * 60)
    
    if incluir_segundos:
        s = int(((horas_abs - h) * 60 - m) * 60)
        return f"{sinal}{h:02d}:{m:02d}:{s:02d}"
    
    return f"{sinal}{h:02d}:{m:02d}"

def preparar_dados(df):
    """
    Processamento centralizado com nomes de colunas limpos:
    Hora_inicio, Hora_Final, Horas_Dias, Intervalo, Horas_Trabalhadas
    """
    # 1. Conversão Temporal
    df["Data"] = pd.to_datetime(df["Data"], errors="coerce")
    
    def converter_vetorizado(series):
        td = pd.to_timedelta(series.astype(str), errors="coerce")
        return td.dt.total_seconds() / 3600

    df["Hora_Decimal"] = converter_vetorizado(df["Horas_Input"])
    df["Intervalo_Decimal"] = converter_vetorizado(df["Intervalos_Input"])
    
    # 2. Agrupamentos
    agrupado = df.groupby(["Colaborador", "Data"], sort=False)
    
    tempos = agrupado["Hora_Decimal"].agg([
        ("Hora_inicio_dec", "min"),
        ("Hora_Final_dec", "max")
    ]).reset_index()
    
    # 3. Top 3 Intervalos
    df_sorted = df.sort_values(["Colaborador", "Data", "Intervalo_Decimal"], ascending=[True, True, False])
    intervalos_top = df_sorted.groupby(["Colaborador", "Data"], sort=False)["Intervalo_Decimal"].head(3)
    soma_intervalos = intervalos_top.groupby([df_sorted["Colaborador"], df_sorted["Data"]], sort=False).sum().reset_index(name="Soma_Intervalos")
    
    # 4. Metadados
    metadados = df.groupby(["Colaborador", "Data"], sort=False).first().reset_index()[[
        "Colaborador", "Data", "Rota", "Regional", "MRU"
    ]]
    
    # 5. Mesclagem e Cálculos Finais
    df_final = metadados.merge(tempos, on=["Colaborador", "Data"], how="left")
    df_final = df_final.merge(soma_intervalos, on=["Colaborador", "Data"], how="left")
    
    # Horas Brutas (Duração do dia)
    df_final["Horas_Dias_dec"] = df_final["Hora_Final_dec"] - df_final["Hora_inicio_dec"]
    # Horas Líquidas (Trabalhadas)
    df_final["Horas_Trabalhadas_dec"] = df_final["Horas_Dias_dec"] - df_final["Soma_Intervalos"]
    
    # 6. Formatação Final (Sem o nome "Formatada")
    df_final["Data_Formatada"] = df_final["Data"].dt.strftime("%d/%m/%Y")
    
    # Colunas de saída solicitadas
    df_final["Hora_inicio"] = df_final["Hora_inicio_dec"].apply(lambda x: horas_para_tempo(x))
    df_final["Hora_Final"] = df_final["Hora_Final_dec"].apply(lambda x: horas_para_tempo(x))
    df_final["Horas_Dias"] = df_final["Horas_Dias_dec"].apply(lambda x: horas_para_tempo(x))
    df_final["Intervalo"] = df_final["Soma_Intervalos"].apply(lambda x: horas_para_tempo(x))
    df_final["Horas_Trabalhadas"] = df_final["Horas_Trabalhadas_dec"].apply(lambda x: horas_para_tempo(x))
    
    # Mantendo valores decimais para cálculos e gráficos (App vai usar estes)
    df_final["Horas_Liquidas"] = df_final["Horas_Trabalhadas_dec"] 
    df_final["MRU_Completa"] = df_final["MRU"].astype(str)
    
    return df_final
