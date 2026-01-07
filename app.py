import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
from leitura_excel import carregar_dados
from processamento import preparar_dados, horas_para_tempo
import gc

# ==================== CONFIGURAÇÃO DA PÁGINA ====================
st.set_page_config(page_title="Dashboard Horas V20", page_icon="📊", layout="wide")

st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&display=swap');
    
    html, body, [class*="css"] { font-family: 'Inter', sans-serif; }
    
    .header-container {
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        padding: 2.5rem;
        border-radius: 15px;
        margin-bottom: 2rem;
        text-align: center;
        color: white;
    }
    
    .main-title { font-family: 'Outfit', sans-serif; font-size: 3rem !important; margin: 0; }
    
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    .stAppDeployButton {display: none;}
</style>
""", unsafe_allow_html=True)

# ==================== CABEÇALHO ====================
st.markdown("""
    <div class="header-container">
        <h1 class="main-title">📊 Dashboard de Horas Trabalhadas</h1>
        <p style="opacity: 0.8;">Versão V20 - Alta Performance & Estabilidade</p>
    </div>
""", unsafe_allow_html=True)

# ==================== SIDEBAR ====================
with st.sidebar:
    st.markdown("### 📂 Gestão de Dados")
    arquivo = st.file_uploader("Suba seu Excel (.xlsx)", type=["xlsx"])
    
    if arquivo:
        st.success("✅ Arquivo detectado.")

# ==================== CARREGAMENTO (SEM CACHE GLOBAL PARA ECONOMIZAR RAM) ====================
if arquivo:
    # Carregamento local para não saturar a RAM do servidor com cache
    placeholder = st.empty()
    with placeholder.container():
        st.info("⚙️ Processando seu arquivo... (Otimizando memória)")
    
    try:
        # Carregamos e processamos
        df_raw = carregar_dados(arquivo)
        df = preparar_dados(df_raw)
        
        # Limpeza manual pós-processamento
        del df_raw
        gc.collect()
        
        placeholder.empty()

        # --- FILTROS ---
        with st.sidebar:
            st.markdown("---")
            st.markdown("### 🔍 Filtros Ativos")
            
            # Período
            d_min, d_max = df["Data"].min().date(), df["Data"].max().date()
            col_d1, col_d2 = st.columns(2)
            with col_d1: data_i = st.date_input("Início", value=d_min)
            with col_d2: data_f = st.date_input("Fim", value=d_max)
            
            # Filtros dinâmicos
            rotas = ["Todas"] + sorted(df["Rota"].unique().tolist())
            rota_sel = st.multiselect("Filtrar Rota", rotas, default=["Todas"])
            
            # Colaboradores (dependente da rota)
            df_view = df if "Todas" in rota_sel else df[df["Rota"].isin(rota_sel)]
            colabs = ["Todos"] + sorted(df_view["Colaborador"].unique().tolist())
            colab_sel = st.selectbox("Filtrar Colaborador", colabs)

        # --- APLICAÇÃO DOS FILTROS ---
        mask = (df["Data"].dt.date >= data_i) & (df["Data"].dt.date <= data_f)
        if colab_sel != "Todos": mask &= (df["Colaborador"] == colab_sel)
        if "Todas" not in rota_sel: mask &= (df["Rota"].isin(rota_sel))
        
        df_f = df[mask].copy()

        # --- CONTEÚDO ---
        c1, c2, c3 = st.columns(3)
        with c1: st.metric("Média Geral de Horas", horas_para_tempo(df_f["Horas_Liquidas"].mean()))
        with c2: st.metric("Total de Colaboradores", df_f["Colaborador"].nunique())
        with c3: st.metric("Total de Registros", len(df_f))

        st.markdown("---")
        
        tab1, tab2 = st.tabs(["� Gráficos", "� Tabela de Dados"])
        
        with tab1:
            # Gráfico de Ranking
            colab_avg = df_f.groupby("Colaborador")["Horas_Liquidas"].mean().sort_values(ascending=False).reset_index().head(20)
            fig = px.bar(colab_avg, x="Colaborador", y="Horas_Liquidas", 
                         title="Top 20 Colaboradores - Média de Horas",
                         color="Horas_Liquidas", color_continuous_scale="Blues")
            st.plotly_chart(fig, use_container_width=True)
            
            # Gauge de Eficiência
            perc = (df_f["Horas_Liquidas"] >= 8).mean() * 100
            fig_g = go.Figure(go.Indicator(
                mode="gauge+number", value=perc,
                title={'text': "% de Jornadas >= 08:00"},
                gauge={'axis': {'range': [0, 100]}, 'bar': {'color': "#1e3c72"}}
            ))
            st.plotly_chart(fig_g, use_container_width=True)

        with tab2:
            st.dataframe(df_f[["Data_Formatada", "Colaborador", "Rota", "MRU", "Horas_Trabalhadas"]], hide_index=True, use_container_width=True)
            
            # Botão de Download CSV
            csv = df_f.to_csv(index=False).encode('utf-8')
            st.download_button("📥 Exportar Resultados (CSV)", data=csv, file_name="relatorio_horas.csv")

    except Exception as e:
        st.error(f"❌ Erro ao processar arquivo: {str(e)}")
        st.info("Dica: Verifique se o arquivo Excel está no formato correto e se não está corrompido.")

else:
    # Tela de espera
    st.markdown("---")
    st.warning("👈 Por favor, carregue um arquivo Excel na barra lateral para ver as análises.")
    
    st.image("https://img.freepik.com/free-vector/dashboard-interface-concept-illustration_114360-3162.jpg", width=400)