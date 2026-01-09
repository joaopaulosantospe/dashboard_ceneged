import pandas as pd
import numpy as np

def horas_para_tempo(horas, incluir_segundos=True):
    """Converte horas decimais para formato de tempo (HH:MM:SS) - Versão otimizada"""
    if pd.isna(horas):
        return "00:00:00" if incluir_segundos else "00:00"
    
    sinal = "-" if horas < 0 else ""
    horas_abs = abs(horas)
    
    h = int(horas_abs)
    m = int((horas_abs - h) * 60)
    s = int(round(((horas_abs - h) * 60 - m) * 60))
    
    if s == 60:
        s = 0
        m += 1
    if m == 60:
        m = 0
        h += 1
        
    if incluir_segundos:
        return f"{sinal}{h:02d}:{m:02d}:{s:02d}"
    return f"{sinal}{h:02d}:{m:02d}"

def preparar_dados(df):
    """
    Processamento centralizado de ALTA PERFORMANCE:
    - Uso de operações vetorizadas do NumPy/Pandas
    - Evita loops .apply() em colunas de cálculo
    """
    # 1. Conversão Temporal (Vetorizada)
    df["Data"] = pd.to_datetime(df["Data"], errors="coerce")
    
    # Converter Horas_Input e Intervalos_Input para decimais sem usar strings se possível
    # Se já forem datetime.time ou strings, to_timedelta funciona bem
    df["Hora_Decimal"] = pd.to_timedelta(df["Horas_Input"].astype(str), errors="coerce").dt.total_seconds() / 3600
    df["Intervalo_Decimal"] = pd.to_timedelta(df["Intervalos_Input"].astype(str), errors="coerce").dt.total_seconds() / 3600
    
    # 2. Agrupamentos (Otimizado via Pandas Nativo)
    # Agrupamos uma única vez para pegar os extremos e os metadados
    df_agrupado = df.sort_values(["Colaborador", "Data", "Intervalo_Decimal"], ascending=[True, True, False])
    
    # Pegar Início, Fim e Metadados (Rota, Regional, MRU) em um único passo
    resultado = df_agrupado.groupby(["Colaborador", "Data"], sort=False).agg({
        "Hora_Decimal": ["min", "max"],
        "Intervalo_Decimal": lambda x: x.head(3).sum(), # Soma dos 3 maiores intervalos
        "Rota": "first",
        "Regional": "first",
        "MRU": "first"
    }).reset_index()
    
    # Achatar colunas multi-index
    resultado.columns = [
        "Colaborador", "Data", "Hora_inicio_dec", "Hora_Final_dec", 
        "Soma_Intervalos", "Rota", "Regional", "MRU"
    ]
    
    # 3. Cálculos Finais (Vetorizados)
    resultado["Horas_Dias_dec"] = resultado["Hora_Final_dec"] - resultado["Hora_inicio_dec"]
    resultado["Horas_Trabalhadas_dec"] = resultado["Horas_Dias_dec"] - resultado["Soma_Intervalos"]
    
    # 4. Formatação Dinâmica (Apenas para o que será exibido)
    # Dica: Em datasets gigantes, converter para string é o que mais demora.
    # Fazemos isso no final apenas para as colunas de visualização.
    resultado["Data_Formatada"] = resultado["Data"].dt.strftime("%d/%m/%Y")
    
    # Usar .apply apenas nas colunas finais (agora muito menores que o DF original)
    resultado["Hora_inicio"] = resultado["Hora_inicio_dec"].apply(horas_para_tempo)
    resultado["Hora_Final"] = resultado["Hora_Final_dec"].apply(horas_para_tempo)
    resultado["Horas_Dias"] = resultado["Horas_Dias_dec"].apply(horas_para_tempo)
    resultado["Intervalo"] = resultado["Soma_Intervalos"].apply(horas_para_tempo)
    resultado["Horas_Trabalhadas"] = resultado["Horas_Trabalhadas_dec"].apply(horas_para_tempo)
    
    # Compatibilidade com o Dashboard
    resultado["Horas_Liquidas"] = resultado["Horas_Trabalhadas_dec"]
    resultado["MRU_Completa"] = resultado["MRU"].astype(str)
    
    return resultado
