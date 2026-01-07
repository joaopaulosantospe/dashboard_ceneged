import pandas as pd

def carregar_dados(arquivo):
    """
    Leitor Bruto de Alta Performance.
    Remove qualquer processamento de texto da carga inicial para garantir 
    velocidade máxima em arquivos gigantes.
    """
    indices_fixos = [0, 3, 4, 12, 36, 41, 46]
    nomes_sistema = ["Data", "Rota", "Regional", "MRU", "Horas_Input", "Colaborador", "Intervalos_Input"]
    
    # Leitura direta com motor Calamine (Escrito em Rust)
    try:
        df = pd.read_excel(arquivo, usecols=indices_fixos, engine='calamine')
    except:
        df = pd.read_excel(arquivo, usecols=indices_fixos)
        
    df.columns = nomes_sistema
    return df
