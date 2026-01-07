import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
from leitura_excel import carregar_dados
from processamento import preparar_dados, horas_para_tempo
import io

# ==================== CONFIGURAÇÃO DA PÁGINA ====================
st.set_page_config(
    page_title="Dashboard de Horas Trabalhadas",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ==================== ESTILOS CUSTOMIZADOS ====================
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;700;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }
    
    .header-container {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 3rem 1rem;
        border-radius: 20px;
        margin-bottom: 3rem;
        box-shadow: 0 15px 35px rgba(118, 75, 162, 0.2);
        text-align: center;
    }
    
    .main-title {
        font-family: 'Outfit', sans-serif;
        font-size: 3.5rem !important;
        font-weight: 800 !important;
        color: white !important;
        margin: 0 !important;
    }
    
    .subtitle {
        color: rgba(255, 255, 255, 0.9) !important;
        font-size: 1.25rem !important;
    }
    
    .section-header {
        font-size: 1.5rem;
        font-weight: 600;
        margin-top: 2rem;
        margin-bottom: 1rem;
        color: #2c3e50;
    }

    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    .stAppDeployButton {display: none;}
</style>
""", unsafe_allow_html=True)

# ==================== CABEÇALHO ====================
st.markdown("""
    <div class="header-container">
        <h1 class="main-title">📊 Dashboard de Horas Trabalhadas</h1>
        <p class="subtitle">Análise profissional e detalhada de produtividade</p>
    </div>
""", unsafe_allow_html=True)

# ==================== SIDEBAR ====================
with st.sidebar:
    st.markdown("### 📂 Upload de Dados")
    arquivo = st.file_uploader(
        "Selecione o arquivo Excel",
        type=["xlsx"],
        help="Faça upload do arquivo de horas trabalhadas"
    )
    
    if arquivo:
        st.success("✅ Arquivo pronto para análise!")

# ==================== MOTOR DE DADOS (CACHE) ====================
@st.cache_data(show_spinner=False)
def carregar_dados_v19(arquivo_buffer):
    """Versão V19: Máxima Estabilidade e Memória Controlada"""
    try:
        df_raw = carregar_dados(arquivo_buffer)
        df_proc = preparar_dados(df_raw)
        return df_proc
    except Exception as e:
        return f"ERRO_PROCESSAMENTO: {str(e)}"

# ==================== FLUXO PRINCIPAL ====================
if arquivo:
    placeholder_loading = st.empty()
    with placeholder_loading.container():
        st.markdown('''
            <div style="padding: 2rem; border-radius: 15px; background: rgba(118, 75, 162, 0.05); border: 1px solid rgba(118, 75, 162, 0.1); margin-bottom: 2rem;">
                <h3 style="color: #764ba2; margin: 0;">🚀 Processando Dados...</h3>
                <p style="color: #666;">Otimizando tabelas para grandes volumes.</p>
            </div>
        ''', unsafe_allow_html=True)

    df = carregar_dados_v19(arquivo)
    placeholder_loading.empty()

    if isinstance(df, str) and df.startswith("ERRO"):
        st.error(f"❌ Falha crítica no processamento: {df}")
        st.stop()

    # --- FILTROS ---
    with st.sidebar:
        st.markdown("---")
        st.markdown("### 🔍 Filtros")
        
        data_min = df["Data"].min().date()
        data_max = df["Data"].max().date()
        
        col_d1, col_d2 = st.columns(2)
        with col_d1: data_inicio = st.date_input("De", value=data_min)
        with col_d2: data_fim = st.date_input("Até", value=data_max)
        
        rotas = ["Todas"] + sorted(df["Rota"].unique().tolist())
        rota_sel = st.multiselect("Rotas", rotas, default=["Todas"])
        
        # Filtro dinâmico de colaborador baseado na rota
        df_temp = df if "Todas" in rota_sel else df[df["Rota"].isin(rota_sel)]
        colabs = ["Todos"] + sorted(df_temp["Colaborador"].unique().tolist())
        colab_sel = st.selectbox("Colaborador", colabs)

        mrus = ["Todas"] + sorted(df_temp["MRU"].unique().tolist())
        mru_sel = st.multiselect("MRUs", mrus, default=["Todas"])

        if st.button("🔄 Limpar Tudo", use_container_width=True):
            st.rerun()

    # --- APLICAR FILTROS ---
    mask = (df["Data"].dt.date >= data_inicio) & (df["Data"].dt.date <= data_fim)
    if colab_sel != "Todos": mask &= (df["Colaborador"] == colab_sel)
    if "Todas" not in rota_sel: mask &= (df["Rota"].isin(rota_sel))
    if "Todas" not in mru_sel: mask &= (df["MRU"].isin(mru_sel))
    
    df_filtrado = df[mask].copy()

    # --- MÉTRICAS ---
    st.markdown('<div class="section-header">📊 Resumo de Performance</div>', unsafe_allow_html=True)
    c1, c2, c3, c4 = st.columns(4)
    with c1: st.metric("👤 Média Colaborador", horas_para_tempo(df_filtrado.groupby('Colaborador')['Horas_Liquidas'].mean().mean()))
    with c2: st.metric("🗺️ Média Rota", horas_para_tempo(df_filtrado.groupby('Rota')['Horas_Liquidas'].mean().mean()))
    with c3: st.metric("🏢 Média Regional", horas_para_tempo(df_filtrado.groupby('Regional')['Horas_Liquidas'].mean().mean()))
    with c4: st.metric("📍 Média MRU", horas_para_tempo(df_filtrado.groupby('MRU')['Horas_Liquidas'].mean().mean()))

    # --- GRÁFICOS ---
    tab1, tab2, tab3 = st.tabs(["🚀 Visão Geral", "👥 Colaboradores", "📅 Tabela Detalhada"])
    
    with tab1:
        col_g1, col_g2 = st.columns(2)
        with col_g1:
            # Distribuição
            mru_medias = df_filtrado.groupby("MRU")["Horas_Liquidas"].mean().reset_index()
            fig_dist = px.histogram(mru_medias, x="Horas_Liquidas", nbins=20, title="Distribuição de Horas por MRU", color_discrete_sequence=['#764ba2'])
            st.plotly_chart(fig_dist, use_container_width=True)
        
        with col_g2:
            # Gauge Eficiência
            perc = (mru_medias["Horas_Liquidas"] >= 8).mean() * 100
            fig_gauge = go.Figure(go.Indicator(
                mode="gauge+number", value=perc,
                title={'text': "Efetividade (>= 8h)"},
                gauge={'axis': {'range': [0, 100]}, 'bar': {'color': "#764ba2"}}
            ))
            st.plotly_chart(fig_gauge, use_container_width=True)

    with tab2:
        colab_rank = df_filtrado.groupby("Colaborador")["Horas_Liquidas"].mean().sort_values(ascending=False).reset_index()
        fig_rank = px.bar(colab_rank, x="Colaborador", y="Horas_Liquidas", title="Ranking de Jornada Média", color="Horas_Liquidas", color_continuous_scale="Sunsetdark")
        st.plotly_chart(fig_rank, use_container_width=True)

    with tab3:
        st.dataframe(df_filtrado[["Data_Formatada", "Colaborador", "Rota", "MRU", "Horas_Trabalhadas"]], use_container_width=True, hide_index=True)
        
        csv = df_filtrado.to_csv(index=False).encode('utf-8')
        st.download_button("📥 Baixar Dados (CSV)", data=csv, file_name="relatorio_horas.csv", mime="text/csv")

else:
    # --- TELA INICIAL ---
    st.markdown("---")
    st.info("👋 Bem-vindo! Para começar, suba o arquivo Excel na barra lateral esquerda.")
    st.markdown("""
        1. Localize o arquivo de horas.
        2. Aguarde a análise automática.
        3. Utilize os filtros para detalhar sua visão.
    """)