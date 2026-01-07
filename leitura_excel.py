import pandas as pd

def carregar_dados(arquivo):
    """
    Leitura Robusta e Inteligente.
    Tenta encontrar as colunas por nome primeiro, e usa os índices fixos como fallback.
    Isso evita o erro de 'Colaborador' não encontrado se a estrutura mudar levemente.
    """
    # Mapeamento de nomes possíveis para cada coluna do sistema
    mapeamento_busca = {
        "Data": ["Data Leitura", "Data", "Data_Leitura"],
        "Rota": ["Rota", "Rot", "ROTA"],
        "Regional": ["Regional", "Reg", "REGIONAL"],
        "MRU": ["MRU", "Cod MRU", "MRU_Code"],
        "Horas_Input": ["Horas Trabalhadas", "Horas_Input", "Total Horas"],
        "Colaborador": ["Colaborador", "Nome Colaborador", "Nome", "Leiturista"],
        "Intervalos_Input": ["Intervalos", "Intervalo", "Intervalos_Input", "Soma Intervalos"]
    }
    
    indices_fixos = {
        0: "Data",
        3: "Rota",
        4: "Regional",
        12: "MRU",
        36: "Horas_Input",
        41: "Colaborador",
        46: "Intervalos_Input"
    }

    try:
        # 1. Tentar ler o cabeçalho para busca inteligente
        df_header = pd.read_excel(arquivo, nrows=5, engine='calamine')
    except:
        df_header = pd.read_excel(arquivo, nrows=5)

    colunas_encontradas = {}
    colunas_excel = df_header.columns.tolist()

    # 2. Busca por nome
    for key, aliases in mapeamento_busca.items():
        for alias in aliases:
            if alias in colunas_excel:
                colunas_encontradas[alias] = key
                break
    
    # 3. Se não encontrou as essenciais, usa os índices fixos
    # (Prioridade para Colaborador e Data)
    if "Colaborador" not in colunas_encontradas.values() or len(colunas_encontradas) < 4:
        # Forçar uso dos índices fixos se a busca por nome falhar
        try:
            df = pd.read_excel(arquivo, usecols=list(indices_fixos.keys()), engine='calamine')
        except:
            df = pd.read_excel(arquivo, usecols=list(indices_fixos.keys()))
        
        # Renomear baseada na posição
        # pd.read_excel(usecols=[...]) retorna as colunas na ordem do arquivo
        # Então precisamos mapear os nomes na ordem crescente dos índices
        ordem_indices = sorted(indices_fixos.keys())
        df.columns = [indices_fixos[i] for i in ordem_indices]
    else:
        # Se a busca por nome deu certo, lê apenas as colunas mapeadas
        try:
            df = pd.read_excel(arquivo, usecols=list(colunas_encontradas.keys()), engine='calamine')
        except:
            df = pd.read_excel(arquivo, usecols=list(colunas_encontradas.keys()))
        df = df.rename(columns=colunas_encontradas)

    # Garantir que todas as colunas existem (se faltar alguma, cria vazia para não dar erro)
    for col in ["Data", "Rota", "Regional", "MRU", "Horas_Input", "Colaborador", "Intervalos_Input"]:
        if col not in df.columns:
            df[col] = pd.NA
            
    return df
