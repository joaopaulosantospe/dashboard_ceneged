import pandas as pd
from datetime import time

def converter_para_horas(valor):
    """Converte valores de tempo para horas decimais"""
    if pd.isna(valor):
        return 0

    if isinstance(valor, time):
        return valor.hour + valor.minute / 60 + valor.second / 3600

    try:
        td = pd.to_timedelta(str(valor))
        return td.total_seconds() / 3600
    except:
        return 0


def horas_para_tempo(horas):
    """Converte horas decimais de volta para formato de tempo (HH:MM:SS)"""
    if pd.isna(horas):
        return "00:00:00"
    
    sinal = "-" if horas < 0 else ""
    horas_abs = abs(horas)
    
    horas_int = int(horas_abs)
    minutos = int((horas_abs - horas_int) * 60)
    segundos = int(((horas_abs - horas_int) * 60 - minutos) * 60)
    
    return f"{sinal}{horas_int:02d}:{minutos:02d}:{segundos:02d}"


def formatar_hora_time(valor):
    """Formata valores de time para string HH:MM:SS"""
    if pd.isna(valor):
        return "00:00:00"
    
    if isinstance(valor, time):
        return valor.strftime("%H:%M:%S")
    
    try:
        # Tentar converter para timedelta e depois para string
        td = pd.to_timedelta(str(valor))
        total_seconds = int(td.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    except:
        return str(valor)


def preparar_dados(df):
    """Prepara e processa os dados do DataFrame com alta performance"""
    # 1. Converter data e horas usando vetores (muito mais rápido que .apply)
    df["Data"] = pd.to_datetime(df["Data"], errors="coerce")
    
    # Função vetorizada para converter tempo/string para horas decimais
    def converter_vetorizado(series):
        # Converte para timedelta (Pd.to_timedelta é otimizado)
        td = pd.to_timedelta(series.astype(str), errors='coerce')
        return td.dt.total_seconds() / 3600

    df["Hora_Decimal"] = converter_vetorizado(df["Hora_Evento"])
    df["Intervalo_Decimal"] = converter_vetorizado(df["Intervalo"])
    
    # 2. Agrupamento eficiente para Início e Fim
    agrupado = df.groupby(["Colaborador", "Data"], sort=False)
    
    tempos = agrupado["Hora_Decimal"].agg([
        ("Hora_Inicio", "min"),
        ("Hora_Final", "max")
    ]).reset_index()
    
    # 3. Cálculo de intervalos otimizado
    # Em vez de nlargest(3) por grupo (lento), ordenamos e pegamos os 3 primeiros
    # Isso é drasticamente mais rápido em DataFrames grandes
    df_sorted = df.sort_values(["Colaborador", "Data", "Intervalo_Decimal"], ascending=[True, True, False])
    intervalos = df_sorted.groupby(["Colaborador", "Data"], sort=False)["Intervalo_Decimal"].head(3).groupby(["Colaborador", "Data"], sort=False).sum().reset_index(name="Intervalo_3_Maiores")
    
    # 4. Metadados (Rota, Regional, MRU) - pegamos o primeiro registro de cada dia de forma eficiente
    metadados = df.groupby(["Colaborador", "Data"], sort=False).first().reset_index()[[
        "Colaborador", "Data", "Rota", "Regional", "MRU", "Nome_MRU"
    ]]
    
    # Mesclar tudo no DataFrame final
    df_final = metadados.merge(tempos, on=["Colaborador", "Data"], how="left")
    df_final = df_final.merge(intervalos, on=["Colaborador", "Data"], how="left")
    
    # 4. Cálculos de Horas
    # Horas Brutas do Dia (Fim - Início)
    df_final["Horas_Dia"] = df_final["Hora_Final"] - df_final["Hora_Inicio"]
    
    # Horas Líquidas (Brutas - Intervalos)
    df_final["Horas_Liquidas"] = df_final["Horas_Dia"] - df_final["Intervalo_3_Maiores"]
    
    # Adicionar colunas formatadas para exibição
    df_final["Data_Formatada"] = df_final["Data"].dt.strftime("%d/%m/%Y")
    
    # Formatação de Tempo HH:MM:SS
    df_final["Hora_Inicio_Formatada"] = df_final["Hora_Inicio"].apply(horas_para_tempo)
    df_final["Hora_Final_Formatada"] = df_final["Hora_Final"].apply(horas_para_tempo)
    df_final["Horas_Dia_Formatada"] = df_final["Horas_Dia"].apply(horas_para_tempo)
    df_final["Intervalo_Formatado"] = df_final["Intervalo_3_Maiores"].apply(horas_para_tempo)
    df_final["Horas_Liquidas_Formatada"] = df_final["Horas_Liquidas"].apply(horas_para_tempo)
    
    # Criar coluna MRU_Completa para exibição (código + nome)
    if 'Nome_MRU' in df_final.columns:
        df_final["MRU_Completa"] = df_final["MRU"].astype(str) + " - " + df_final["Nome_MRU"].astype(str)
    else:
        df_final["MRU_Completa"] = df_final["MRU"].astype(str)
    
    return df_final
