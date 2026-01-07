import pandas as pd
import numpy as np

def carregar_dados(arquivo):
    """
    Leitura Ultra-Lean para prevenir erros de memória (OOM).
    Otimiza dtypes e limita o processamento inicial.
    """
    # Mapeamento de índices originais (A, D, E, M, AK, AP, AU)
    # 0: Data, 3: Rota, 4: Regional, 12: MRU, 36: Horas_Input, 41: Colaborador, 46: Intervalos_Input
    cols_indices = [0, 3, 4, 12, 36, 41, 46]
    
    # Nomes padrão para garantir consistência
    nomes_sistema = ["Data", "Rota", "Regional", "MRU", "Horas_Input", "Colaborador", "Intervalos_Input"]

    try:
        # Tenta ler com Calamine (mais rápido e econômico em memória)
        # Lemos apenas as colunas necessárias e já forçamos tipos básicos
        df = pd.read_excel(
            arquivo, 
            usecols=cols_indices, 
            engine='calamine',
            dtype={3: 'category', 4: 'category', 41: 'category'} # Rota, Regional, Colab como Categorias economiza MUITA RAM
        )
    except Exception:
        # Fallback para o motor padrão se calamine falhar
        df = pd.read_excel(arquivo, usecols=cols_indices)
    
    # Renomear colunas pela posição para evitar erro de 'Colaborador'
    # Importante: pd.read_excel(usecols=[...]) retorna as colunas na ordem em que aparecem no Excel
    # Mas aqui usamos os índices, então a ordem no DF será a ordem dos índices sorteados.
    df.columns = nomes_sistema
    
    return df
