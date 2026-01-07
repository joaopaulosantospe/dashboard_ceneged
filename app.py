import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
from leitura_excel import carregar_dados
from processamento import preparar_dados
import io
import locale

# Tentar configurar o locale para Português Brasil
try:
    locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')
except:
    try:
        locale.setlocale(locale.LC_ALL, 'Portuguese_Brazil.1252')
    except:
        pass

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
    /* Importar fontes modernas */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;700;800&display=swap');
    
    /* Aplicar fonte em todo o app */
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }
    
    /* Container do Cabeçalho - Estilo Premium */
    .header-container {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 3rem 1rem;
        border-radius: 20px;
        margin-bottom: 3rem;
        box-shadow: 0 15px 35px rgba(118, 75, 162, 0.2);
        position: relative;
        overflow: hidden;
        animation: fadeIn 1s ease-out;
    }
    
    .header-container::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
        animation: rotate_bg 20s linear infinite;
    }

    @keyframes rotate_bg {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .main-title {
        font-family: 'Outfit', sans-serif;
        font-size: 3.5rem !important;
        font-weight: 800 !important;
        color: white !important;
        text-align: center;
        margin: 0 !important;
        letter-spacing: -1.5px;
        text-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .subtitle {
        font-family: 'Inter', sans-serif;
        text-align: center;
        color: rgba(255, 255, 255, 0.9) !important;
        font-size: 1.25rem !important;
        margin-top: 0.5rem !important;
        font-weight: 300 !important;
        letter-spacing: 0.5px;
        margin-bottom: 0 !important;
    }
    
    /* Cards de métricas */
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1.5rem;
        border-radius: 15px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        color: white;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .metric-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 24px rgba(0,0,0,0.15);
    }
    
    /* Estilo dos filtros */
    .stSelectbox, .stMultiSelect, .stDateInput {
        border-radius: 10px;
    }
    
    /* Botões */
    .stButton > button {
        border-radius: 10px;
        font-weight: 600;
        padding: 0.5rem 2rem;
        transition: all 0.3s ease;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
    }
    
    /* Tabelas */
    .dataframe {
        border-radius: 10px;
        overflow: hidden;
    }
    
    /* Sidebar */
    .css-1d391kg {
        background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
    }
    
    /* Esconder o menu, o footer, o botão de Deploy e o toolbar do Streamlit */
    #MainMenu {visibility: hidden; display: none !important;}
    footer {visibility: hidden; display: none !important;}
    .stAppDeployButton {display: none !important;}
    header {visibility: hidden; display: none !important;}
    [data-testid="stToolbar"] {visibility: hidden; display: none !important;}
    [data-testid="stStatusWidget"] {display: none !important;}
    .embeddedAppMeta {display: none !important;}
    .viewerBadge_container__16S6W {display: none !important;}
    .styles_viewerBadge__3777_ {display: none !important;}
    [data-testid="stHeader"] {display: none !important;}
    
    /* Seções */
    .section-header {
        font-size: 1.5rem;
        font-weight: 600;
        margin-top: 2rem;
        margin-bottom: 1rem;
        color: #2c3e50;
    }
</style>
""", unsafe_allow_html=True)

# ==================== TÍTULO ====================
st.markdown("""
    <div class="header-container">
        <h1 class="main-title">📊 Dashboard de Horas Trabalhadas</h1>
        <p class="subtitle">Análise profissional e detalhada de produtividade</p>
    </div>
""", unsafe_allow_html=True)

# ==================== SIDEBAR - UPLOAD E FILTROS ====================
with st.sidebar:
    st.markdown("### 📂 Upload de Dados")
    arquivo = st.file_uploader(
        "Selecione o arquivo Excel ou CSV",
        type=["xlsx", "csv"],
        help="Faça upload do arquivo de horas trabalhadas (.xlsx ou .csv)"
    )
    
    if arquivo:
        st.success("✅ Arquivo carregado com sucesso!")

# ==================== FUNÇÕES COM CACHE ====================
@st.cache_data(show_spinner=False)
def carregar_e_processar_dados(arquivo_buffer):
    """Função cacheada para leitura e processamento ultrarápido"""
    with st.spinner('🚀 Otimizando e preparando dados...'):
        df_raw = carregar_dados(arquivo_buffer)
        df_proc = preparar_dados(df_raw)
        return df_proc

# ==================== PROCESSAMENTO DE DADOS ====================
if arquivo:
    try:
        # Carregar e processar dados com cache de alta performance
        df = carregar_e_processar_dados(arquivo)
        
        # Garantir limpeza da MRU (Camada extra de segurança caso o cache seja antigo)
        if "MRU" in df.columns:
            df["MRU"] = df["MRU"].astype(str).str.split('-').str[0].str.strip().str.zfill(8)
    except Exception as e:
        st.error(f"❌ Erro ao processar o arquivo: {e}")
        st.stop()
    
    # ==================== FILTROS NA SIDEBAR ====================
    with st.sidebar:
        st.markdown("---")
        st.markdown("### 🔍 Filtros")
        
        # Filtro de Data
        st.markdown("#### 📅 Período")
        col_data1, col_data2 = st.columns(2)
        
        data_min = df["Data"].min().date()
        data_max = df["Data"].max().date()
        
        with col_data1:
            data_inicio = st.date_input(
                "De",
                value=data_min,
                min_value=data_min,
                max_value=data_max
            )
        
        with col_data2:
            data_fim = st.date_input(
                "Até",
                value=data_max,
                min_value=data_min,
                max_value=data_max
            )
        
        # Filtro de Rota (Movido para cima para filtrar colaborador)
        st.markdown("#### 🗺️ Rota")
        rotas = ["Todas"] + sorted(df["Rota"].dropna().unique().tolist())
        rota_selecionada = st.multiselect(
            "Selecione as rotas",
            rotas,
            default=["Todas"],
            label_visibility="collapsed"
        )
        
        # Filtro de Regional
        st.markdown("#### 🏢 Regional")
        regionais = ["Todas"] + sorted(df["Regional"].dropna().unique().tolist())
        regional_selecionada = st.multiselect(
            "Selecione as regionais",
            regionais,
            default=["Todas"],
            label_visibility="collapsed"
        )

        # Filtro de Colaborador (Dinâmico)
        st.markdown("#### 👤 Colaborador")
        # Filtrar lista de colaboradores baseada na rota se não for "Todas"
        if "Todas" not in rota_selecionada:
            df_lista_colab = df[df["Rota"].isin(rota_selecionada)]
        else:
            df_lista_colab = df
            
        colaboradores = ["Todos"] + sorted(df_lista_colab["Colaborador"].dropna().unique().tolist())
        colaborador_selecionado = st.selectbox(
            "Selecione o colaborador",
            colaboradores,
            label_visibility="collapsed"
        )
        
        # Filtro de MRU
        st.markdown("#### 📍 MRU")
        if "Todas" not in rota_selecionada:
            df_lista_mru = df[df["Rota"].isin(rota_selecionada)]
        else:
            df_lista_mru = df
        mrus = ["Todas"] + sorted(df_lista_mru["MRU"].dropna().unique().tolist())
        mru_selecionada = st.multiselect(
            "Selecione as MRUs",
            mrus,
            default=["Todas"],
            label_visibility="collapsed"
        )
        
        # Filtro de Perfil de Produtividade
        st.markdown("---")
        st.markdown("#### 🎯 Perfil de Produtividade")
        bins = [0, 8, 9, 10, 11, 12, 100]
        labels_faixas = ['Até 08:00:00', 'Até 09:00:00', 'Até 10:00:00', 'Até 11:00:00', 'Até 12:00:00', 'Acima de 12:00:00']
        
        perfis_disponiveis = ["Todos"] + labels_faixas
        perfil_selecionado = st.selectbox("Filtrar por Faixa de Horas:", perfis_disponiveis)
        
        # Botão para limpar filtros
        st.markdown("---")
        if st.button("🔄 Limpar Filtros", use_container_width=True):
            st.rerun()
    
    # ==================== APLICAR FILTROS ====================
    # Criar máscara inicial (True para todos os registros)
    mask = (df["Data"].dt.date >= data_inicio) & (df["Data"].dt.date <= data_fim)
    
    # Aplicar filtros sequencialmente
    if colaborador_selecionado != "Todos":
        mask &= (df["Colaborador"] == colaborador_selecionado)
    
    if "Todas" not in rota_selecionada:
        mask &= (df["Rota"].isin(rota_selecionada))
        
    if "Todas" not in regional_selecionada:
        mask &= (df["Regional"].isin(regional_selecionada))
        
    if "Todas" not in mru_selecionada:
        mask &= (df["MRU"].isin(mru_selecionada))
    
    # Criar o DataFrame filtrado
    df_filtrado = df[mask].copy()
    
    # Aplicar o filtro de Perfil se não for "Todos"
    if perfil_selecionado != "Todos":
        df_filtrado['_temp_perfil'] = pd.cut(df_filtrado['Horas_Liquidas'], bins=bins, labels=labels_faixas)
        df_filtrado = df_filtrado[df_filtrado['_temp_perfil'] == perfil_selecionado]

    # ==================== MÉTRICAS PRINCIPAIS ====================
    st.markdown("---")
    st.markdown('<div class="section-header">📊 Métricas Gerais</div>', unsafe_allow_html=True)
    
    col1, col2, col3, col4 = st.columns(4)
    from processamento import horas_para_tempo
    
    with col1:
        media_colaborador = df_filtrado.groupby('Colaborador')['Horas_Liquidas'].mean().mean()
        st.metric(label="👤 Média por Colaborador", value=horas_para_tempo(media_colaborador))
    
    with col2:
        media_rota = df_filtrado.groupby('Rota')['Horas_Liquidas'].mean().mean()
        st.metric(label="🗺️ Média por Rota", value=horas_para_tempo(media_rota))
    
    with col3:
        media_regional = df_filtrado.groupby('Regional')['Horas_Liquidas'].mean().mean()
        st.metric(label="🏢 Média por Regional", value=horas_para_tempo(media_regional))
    
    with col4:
        media_mru = df_filtrado.groupby('MRU')['Horas_Liquidas'].mean().mean()
        st.metric(label="📍 Média por MRU", value=horas_para_tempo(media_mru))
    
    # ==================== GRÁFICOS PROFISSIONAIS ====================
    st.markdown("---")
    st.markdown('<div class="section-header">📈 Análises Visuais</div>', unsafe_allow_html=True)
    
    if df_filtrado.empty:
        st.warning("⚠️ Nenhum dado encontrado para os filtros selecionados. Tente ajustar o período ou os seletores na barra lateral.")
        st.stop()

    tab1, tab2, tab3, tab4 = st.tabs(["📊 Visão Geral", "👥 Por Colaborador", "🗺️ Por Rota/Regional", "📅 Evolução Temporal"])
    
    with tab1:
        # --- DISTRIBUIÇÃO DE CONCLUSÃO ---
        st.markdown("#### ⏱️ Distribuição de Conclusão por MRU")
        
        mru_medias = df_filtrado.groupby(["MRU", "MRU_Completa"])["Horas_Liquidas"].mean().reset_index()
        mru_medias['Faixa'] = pd.cut(mru_medias['Horas_Liquidas'], bins=bins, labels=labels_faixas)
        
        faixas_counts = mru_medias['Faixa'].value_counts().reindex(labels_faixas).reset_index()
        faixas_counts.columns = ['Faixa', 'Quantidade']
        faixas_counts['Percentual'] = (faixas_counts['Quantidade'] / faixas_counts['Quantidade'].sum() * 100).fillna(0)
        
        faixas_counts = faixas_counts[faixas_counts['Quantidade'] > 0]
        
        if not faixas_counts.empty:
            fig_faixas = px.bar(
                faixas_counts,
                y='Faixa',
                x='Quantidade',
                orientation='h',
                text=faixas_counts.apply(lambda x: f"{int(x['Quantidade'])} ({x['Percentual']:.1f}%)", axis=1),
                color='Quantidade',
                color_continuous_scale='Sunsetdark',
                labels={'Quantidade': 'Total de MRUs', 'Faixa': 'Faixa de Horas'}
            )
            
            fig_faixas.update_traces(
                textposition='inside',
                hovertemplate="<b>Faixa:</b> %{y}<br><b>Quantidade:</b> %{x}<extra></extra>"
            )
            fig_faixas.update_layout(height=400, showlegend=False, coloraxis_showscale=False, margin=dict(l=20, r=20, t=10, b=20))
            st.plotly_chart(fig_faixas, use_container_width=True)
        else:
            st.info("ℹ️ Não há dados suficientes para mostrar a distribuição de faixas horárias.")
        
        # Centralizar o gauge removendo o histograma
        col_esp1, col_center, col_esp2 = st.columns([1, 2, 1])
        
        with col_center:
            percentual_acima_8 = (mru_medias["Horas_Liquidas"] >= 8).mean() * 100
            fig_gauge = go.Figure(go.Indicator(
                mode="gauge+number",
                value=percentual_acima_8,
                title={'text': "Eficiência: MRUs ≥ 08:00:00", 'font': {'size': 20, 'color': '#2c3e50'}},
                gauge={
                    'bar': {'color': "#ff4b2b"},
                    'axis': {'range': [0, 100], 'ticksuffix': '%'},
                    'steps': [
                        {'range': [0, 80], 'color': "#f8f9fa"},
                        {'range': [80, 100], 'color': "#d1fae5"}
                    ]
                }
            ))
            fig_gauge.update_layout(height=350, margin=dict(l=30, r=30, t=50, b=20))
            st.plotly_chart(fig_gauge, use_container_width=True)

        # --- TOP 10 MRUS - REVISADO (A-Z E > 8H) ---
        st.markdown("#### 🏆 Top 10 MRUs Acima da Meta (Ordem Alfabética)")
        mru_top_data = mru_medias[mru_medias['Horas_Liquidas'] > 8].copy()
        
        if not mru_top_data.empty:
            mru_top_data = mru_top_data.sort_values("MRU_Completa", ascending=True).head(10)
            mru_top_data['Tempo_HHMMSS'] = mru_top_data['Horas_Liquidas'].apply(horas_para_tempo)
            
            # Garantir que MRU seja tratada como string/categoria para evitar problemas de escala numérica
            mru_top_data['MRU_Label'] = mru_top_data['MRU'].astype(str)
            
            fig_top_mru = px.bar(
                mru_top_data,
                x="MRU_Label",
                y="Horas_Liquidas",
                text="Tempo_HHMMSS",
                color="Horas_Liquidas",
                color_continuous_scale="Sunsetdark",
                labels={"Horas_Liquidas": "Horas Líquidas", "MRU_Label": "MRU"}
            )
            
            fig_top_mru.update_traces(
                textposition='outside',
                cliponaxis=False,
                hovertemplate="<b>MRU:</b> %{x}<br><b>Horas Trabalhadas:</b> %{text}<extra></extra>"
            )
            
            # Forçar o eixo X como categoria para as barras ficarem juntas e organizadas
            max_y = mru_top_data['Horas_Liquidas'].max() * 1.2
            fig_top_mru.update_layout(
                height=450, 
                coloraxis_showscale=False, 
                xaxis_title="MRU", 
                yaxis_title="Horas Líquidas",
                xaxis_type='category',
                yaxis=dict(range=[0, max_y]),
                margin=dict(t=50)
            )
            st.plotly_chart(fig_top_mru, use_container_width=True)
        else:
            st.warning("Nenhuma MRU acima de 08:00:00 encontrada para os filtros atuais.")
    
    with tab2:
        # POR COLABORADOR (HH:MM:SS)
        colab_medias = df_filtrado.groupby("Colaborador")["Horas_Liquidas"].mean().reset_index()
        colab_medias['Tempo_Formatado'] = colab_medias['Horas_Liquidas'].apply(horas_para_tempo)
        
        fig_colab = px.bar(
            colab_medias.sort_values("Horas_Liquidas", ascending=False),
            x="Colaborador", y="Horas_Liquidas",
            text="Tempo_Formatado",
            title="Média de Horas por Colaborador",
            labels={"Horas_Liquidas": "Média de Horas Líquidas", "Colaborador": "Colaborador"},
            color="Horas_Liquidas", 
            color_continuous_scale="Viridis" # Cor vibrante
        )
        fig_colab.update_traces(
            textposition='outside',
            cliponaxis=False,
            hovertemplate="<b>Colaborador:</b> %{x}<br><b>Horas Trabalhadas:</b> %{text}<extra></extra>"
        )
        fig_colab.add_hline(y=8, line_dash="dash", line_color="black", annotation_text="Meta 08:00:00")
        max_y_colab = max(8.5, colab_medias['Horas_Liquidas'].max() * 1.3) # Ajuste para o texto não sobrepor a meta
        fig_colab.update_layout(
            height=450, 
            coloraxis_showscale=False,
            yaxis=dict(range=[0, max_y_colab]),
            margin=dict(t=60)
        )
        st.plotly_chart(fig_colab, use_container_width=True)
        
        # Total de horas por colaborador (Pie Chart) - AUMENTADO
        colab_totais = df_filtrado.groupby("Colaborador")["Horas_Liquidas"].sum().sort_values(ascending=False).reset_index()
        colab_totais['Tempo_Total'] = colab_totais['Horas_Liquidas'].apply(horas_para_tempo)
        
        fig_total_colab = px.pie(
            colab_totais,
            values="Horas_Liquidas",
            names="Colaborador",
            custom_data=['Tempo_Total'],
            title="Distribuição Total de Horas por Colaborador",
            color_discrete_sequence=px.colors.sequential.Sunsetdark
        )
        fig_total_colab.update_traces(
            textposition='inside', 
            textinfo='percent+label',
            hovertemplate="<b>Colaborador:</b> %{label}<br><b>Horas Trabalhadas:</b> %{customdata[0]}<extra></extra>"
        )
        fig_total_colab.update_layout(height=650, margin=dict(l=50, r=50, t=100, b=50))
        st.plotly_chart(fig_total_colab, use_container_width=True)
    
    with tab3:
        # POR ROTA E REGIONAL (HH:MM:SS)
        c1, c2 = st.columns(2)
        
        with c1:
            rota_medias = df_filtrado.groupby("Rota")["Horas_Liquidas"].mean().reset_index()
            rota_medias['Tempo_Formatado'] = rota_medias['Horas_Liquidas'].apply(horas_para_tempo)
            fig_rota = px.bar(
                rota_medias, x="Rota", y="Horas_Liquidas", 
                text="Tempo_Formatado", title="Média de Horas por Rota",
                labels={"Horas_Liquidas": "Média Horas", "Rota": "Rota"},
                color="Horas_Liquidas", 
                color_continuous_scale="Sunsetdark"
            )
            fig_rota.update_traces(
                textposition='outside',
                cliponaxis=False,
                hovertemplate="<b>Rota:</b> %{x}<br><b>Horas Trabalhadas:</b> %{text}<extra></extra>"
            )
            max_y_rota = rota_medias['Horas_Liquidas'].max() * 1.2
            fig_rota.update_layout(
                height=450, showlegend=False, 
                coloraxis_showscale=False, xaxis_tickangle=-45,
                yaxis=dict(range=[0, max_y_rota]),
                margin=dict(t=50)
            )
            st.plotly_chart(fig_rota, use_container_width=True)
            
        with c2:
            reg_medias = df_filtrado.groupby("Regional")["Horas_Liquidas"].mean().reset_index()
            reg_medias['Tempo_Formatado'] = reg_medias['Horas_Liquidas'].apply(horas_para_tempo)
            fig_reg = px.bar(
                reg_medias, x="Regional", y="Horas_Liquidas", 
                text="Tempo_Formatado", title="Média de Horas por Regional",
                labels={"Horas_Liquidas": "Média Horas", "Regional": "Regional"},
                color="Horas_Liquidas", 
                color_continuous_scale="Sunsetdark"
            )
            fig_reg.update_traces(
                textposition='outside',
                cliponaxis=False,
                hovertemplate="<b>Regional:</b> %{x}<br><b>Horas Trabalhadas:</b> %{text}<extra></extra>"
            )
            max_y_reg = reg_medias['Horas_Liquidas'].max() * 1.2
            fig_reg.update_layout(
                height=450, showlegend=False, 
                coloraxis_showscale=False, xaxis_tickangle=-45,
                yaxis=dict(range=[0, max_y_reg]),
                margin=dict(t=50)
            )
            st.plotly_chart(fig_reg, use_container_width=True)

    with tab4:
        # EVOLUÇÃO TEMPORAL (HH:MM:SS)
        tempo_evolucao = df_filtrado.groupby("Data")["Horas_Liquidas"].mean().reset_index()
        tempo_evolucao['Tempo_Formatado'] = tempo_evolucao['Horas_Liquidas'].apply(horas_para_tempo)
        
        fig_evolucao = px.line(
            tempo_evolucao, x="Data", y="Horas_Liquidas", 
            title="Evolução da Média de Horas Líquidas ao Longo do Tempo",
            labels={"Horas_Liquidas": "Média Horas", "Data": "Data"},
            markers=True
        )
        fig_evolucao.add_hline(y=8, line_dash="dash", line_color="red", annotation_text="Meta 08:00:00")
        fig_evolucao.update_traces(
            line_color='#ff4b2b', line_width=3, 
            mode="lines+markers", 
            hovertemplate="<b>Data:</b> %{x}<br><b>Horas Trabalhadas:</b> %{customdata}<extra></extra>", 
            customdata=tempo_evolucao['Tempo_Formatado']
        )
        fig_evolucao.update_layout(
            height=450,
            xaxis=dict(
                tickformat="%d/%m/%Y",  # Formato brasileiro numérico para evitar inglês
                title="Data"
            )
        )
        st.plotly_chart(fig_evolucao, use_container_width=True)
        
        # Heatmap (Tradução e Formatação HH:MM:SS)
        df_filtrado['DiaSemana'] = df_filtrado['Data'].dt.day_name()
        df_filtrado['Semana'] = df_filtrado['Data'].dt.isocalendar().week
        
        heatmap_counts = df_filtrado.groupby(['DiaSemana', 'Semana'])['Horas_Liquidas'].mean().unstack().fillna(0)
        dias_ordem = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        dias_pt = {
            'Monday': 'Segunda', 'Tuesday': 'Terça', 'Wednesday': 'Quarta', 
            'Thursday': 'Quinta', 'Friday': 'Sexta', 'Saturday': 'Sábado', 'Sunday': 'Domingo'
        }
        heatmap_counts = heatmap_counts.reindex(dias_ordem).rename(index=dias_pt)
        
        # Criar matriz de strings formatadas para o hover
        hover_text = heatmap_counts.applymap(horas_para_tempo)
        
        fig_heatmap = px.imshow(
            heatmap_counts,
            labels=dict(x="", y="", color="Média Horas"),
            x=heatmap_counts.columns,
            y=heatmap_counts.index,
            aspect="auto",
            color_continuous_scale="Sunsetdark",
            title="Frequência de Trabalho por Dia e Semana"
        )
        
        fig_heatmap.update_traces(
            hovertemplate="<b>Dia da Semana:</b> %{y}<br><b>Média Horas:</b> %{customdata}<extra></extra>",
            customdata=hover_text
        )
        
        fig_heatmap.update_layout(
            xaxis=dict(showticklabels=False), # Remover Semana do Ano do eixo
            coloraxis_showscale=False
        )
        st.plotly_chart(fig_heatmap, use_container_width=True)
    
    # ==================== TABELA DE DADOS DETALHADA ====================
    st.markdown("---")
    st.markdown('<div class="section-header">📄 Tabela de Dados Registrados</div>', unsafe_allow_html=True)
    
    df_exibicao = df_filtrado[[
        "Data_Formatada", "Colaborador", "Rota", "Regional", "MRU",
        "Hora_inicio", "Hora_Final", "Horas_Dias", "Intervalo", "Horas_Trabalhadas"
    ]].copy()
    
    df_exibicao.columns = [
        "Data", "Colaborador", "Rota", "Regional", "MRU",
        "Hora Início", "Hora Final", "Total Bruto", "Intervalo", "Horas Líquidas"
    ]
    
    st.dataframe(df_exibicao, use_container_width=True, hide_index=True)
    
    # ==================== BOTÕES DE EXPORTAÇÃO ====================
    col_exp1, col_exp2 = st.columns(2)
    
    with col_exp1:
        # Exportar Excel Estilizado (Movido para Coluna 1)
        import io
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df_export = df_filtrado[[
                "Data", "Colaborador", "Rota", "Regional", "MRU",
                "Hora_inicio", "Hora_Final", "Horas_Dias", "Intervalo", "Horas_Trabalhadas"
            ]].copy()
            df_export.columns = ["Data", "Colaborador", "Rota", "Regional", "MRU", "Hora Início", "Hora Final", "Total Bruto", "Intervalo", "Horas Líquidas"]
            df_export.to_excel(writer, index=False, sheet_name='Dashboard')
            
            workbook  = writer.book
            worksheet = writer.sheets['Dashboard']
            header_format = workbook.add_format({'bold': True, 'bg_color': '#764ba2', 'font_color': 'white', 'border': 1})
            date_format = workbook.add_format({'num_format': 'dd/mm/yyyy'})
            time_format = workbook.add_format({'num_format': 'hh:mm:ss'})
            text_format = workbook.add_format({'num_format': '@'}) # Formato de texto para preservar zeros à esquerda
            
            for col_num, value in enumerate(df_export.columns.values):
                worksheet.write(0, col_num, value, header_format)
            
            worksheet.set_column('A:A', 12, date_format)
            worksheet.set_column('B:D', 25)
            worksheet.set_column('E:E', 15, text_format) # MRU como texto
            worksheet.set_column('F:J', 15, time_format)
            
        st.download_button(
            label="📥 Baixar Excel",
            data=output.getvalue(),
            file_name=f"horas_trabalhadas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            use_container_width=True
        )

    with col_exp2:
        # Exportar CSV (Mantido apenas um botão na Coluna 2)
        csv = df_exibicao.to_csv(index=False, sep=';', encoding='utf-8-sig').encode('utf-8-sig')
        st.download_button(
            label="📥 Baixar CSV", 
            data=csv, 
            file_name=f"horas_trabalhadas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv", 
            mime="text/csv", 
            use_container_width=True
        )
    
    # ==================== ESTATÍSTICAS ADICIONAIS ====================
    st.markdown("---")
    st.markdown('<div class="section-header">📊 Estatísticas Adicionais</div>', unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.info(f"""
        **📈 Total de Registros:** {len(df_filtrado)}  
        **👥 Colaboradores Únicos:** {df_filtrado['Colaborador'].nunique()}  
        **📅 Período:** {data_inicio.strftime('%d/%m/%Y')} a {data_fim.strftime('%d/%m/%Y')}
        """)
    
    with col2:
        total_horas = df_filtrado['Horas_Liquidas'].sum()
        media_geral = df_filtrado['Horas_Liquidas'].mean()
        st.success(f"""
        **⏱️ Total de Horas Líquidas:** {horas_para_tempo(total_horas)}  
        **📊 Média Geral:** {horas_para_tempo(media_geral)}  
        **🎯 Desvio da Meta (08h):** {horas_para_tempo(media_geral - 8)}
        """)
    
    with col3:
        max_horas = df_filtrado['Horas_Liquidas'].max()
        min_horas = df_filtrado['Horas_Liquidas'].min()
        st.warning(f"""
        **🔝 Maior Jornada:** {horas_para_tempo(max_horas)}  
        **🔻 Menor Jornada:** {horas_para_tempo(min_horas)}  
        **📏 Amplitude:** {horas_para_tempo(max_horas - min_horas)}
        """)

else:
    # ==================== TELA INICIAL ====================
    st.markdown("---")
    
    col1, col2, col3 = st.columns([0.5, 5, 0.5])
    
    with col2:
        st.markdown('''
<div style="background-color: #e1f5fe; padding: 20px; border-radius: 10px; border-left: 5px solid #03a9f4;">
<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
<h3 style="margin: 0; color: #01579b;">👋 Bem-vindo ao Dashboard de Horas Trabalhadas!</h3>
</div>
<br>
<p style="color: #0277bd; margin-bottom: 10px;">Para começar, faça o upload do arquivo Excel na barra lateral.</p>
<b style="color: #01579b;">Recursos disponíveis:</b>
<ul style="color: #0277bd; margin-top: 5px;">
<li>📊 Visualizações interativas e profissionais</li>
<li>🔍 Filtros avançados por período, colaborador, rota, regional e MRU</li>
<li>📈 Gráficos dinâmicos com Plotly</li>
<li>💾 Exportação formatada para Excel e CSV</li>
<li>📱 Layout responsivo e elegante</li>
<li>🎨 Design moderno com gradientes e animações</li>
</ul>
<b style="color: #01579b;">Instruções:</b>
<ol style="color: #0277bd; margin-top: 5px;">
<li>Clique em "Browse files" na barra lateral</li>
<li>Selecione seu arquivo Excel (.xlsx)</li>
<li>Aguarde o processamento</li>
<li>Explore os dados com os filtros e gráficos!</li>
</ol>
</div>
''', unsafe_allow_html=True)