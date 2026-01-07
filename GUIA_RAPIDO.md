# 🚀 GUIA RÁPIDO DE USO

## ⚡ Início Rápido

### 1️⃣ Executar o Dashboard
```bash
python -m streamlit run app.py
```

O dashboard abrirá automaticamente em: **http://localhost:8501**

---

## 📂 Upload de Arquivo

1. Na **barra lateral esquerda**, clique em **"Browse files"**
2. Selecione seu arquivo Excel (`.xlsx`)
3. Aguarde o processamento (alguns segundos)
4. ✅ Verá a mensagem "Arquivo carregado com sucesso!"

---

## 🔍 Usando os Filtros

### 📅 Filtro de Período
- **De**: Data inicial do período
- **Até**: Data final do período
- Os dados serão filtrados automaticamente

### 👤 Filtro de Colaborador
- Selecione um colaborador específico
- Ou deixe em "Todos" para ver todos

### 🗺️ Filtros Múltiplos (Rota, Regional, MRU)
- Clique no campo para abrir a lista
- Marque/desmarque as opções desejadas
- Pode selecionar múltiplas opções
- "Todas" mostra todos os dados

### 🔄 Limpar Filtros
- Clique no botão **"🔄 Limpar Filtros"** na barra lateral
- Todos os filtros voltam ao padrão

---

## 📊 Explorando as Visualizações

### Aba 1: 📊 Visão Geral
**O que você vê:**
- **Gauge (Velocímetro)**: % de MRUs com média ≥ 8h
- **Histograma**: Distribuição de horas trabalhadas
- **Top 10 MRUs**: Ranking das MRUs com maior média

**Como usar:**
- Passe o mouse sobre os gráficos para ver detalhes
- Use os controles do Plotly (zoom, pan)
- Clique nos ícones no canto superior direito para salvar imagens

### Aba 2: 👥 Por Colaborador
**O que você vê:**
- **Gráfico de Barras**: Média de horas por colaborador
- **Gráfico de Pizza**: Distribuição total de horas

**Como usar:**
- Compare colaboradores visualmente
- Identifique quem está acima/abaixo da meta (linha vermelha em 8h)
- Veja a proporção de horas de cada um

### Aba 3: 🗺️ Por Rota/Regional
**O que você vê:**
- **Média por Rota**: Comparação entre rotas
- **Média por Regional**: Comparação entre regionais

**Como usar:**
- Identifique rotas/regionais com melhor desempenho
- Compare com a meta de 8h
- Use para planejamento e otimização

### Aba 4: 📅 Evolução Temporal
**O que você vê:**
- **Gráfico de Linha**: Evolução da média ao longo do tempo
- **Heatmap**: Padrão semanal de horas trabalhadas

**Como usar:**
- Identifique tendências ao longo do tempo
- Veja padrões por dia da semana
- Detecte anomalias ou períodos críticos

---

## 📋 Tabela de Dados Detalhados

**Localização**: Abaixo dos gráficos

**Colunas:**
- Data (dd/mm/yyyy)
- Colaborador
- Rota
- Regional
- MRU
- Horas do Dia (HH:MM:SS)
- Intervalo - 3 Maiores (HH:MM:SS)
- Horas Líquidas (HH:MM:SS)

**Recursos:**
- Scroll horizontal/vertical
- Ordenação por coluna (clique no cabeçalho)
- Busca integrada

---

## 💾 Exportando Dados

### 📥 Baixar Excel
1. Role até a seção **"💾 Exportar Dados"**
2. Clique em **"📥 Baixar Excel"**
3. O arquivo será baixado com:
   - ✅ Datas formatadas (dd/mm/yyyy)
   - ✅ Horas formatadas ([h]:mm:ss)
   - ✅ Cabeçalho estilizado (roxo com texto branco)
   - ✅ Colunas com largura ajustada
   - ✅ Nome: `horas_trabalhadas_YYYYMMDD_HHMMSS.xlsx`

### 📥 Baixar CSV
1. Clique em **"📥 Baixar CSV"**
2. O arquivo será baixado com:
   - ✅ Separador: ponto e vírgula (;)
   - ✅ Encoding: UTF-8 com BOM
   - ✅ Compatível com Excel brasileiro
   - ✅ Nome: `horas_trabalhadas_YYYYMMDD_HHMMSS.csv`

**💡 Dica**: Os dados exportados respeitam os filtros aplicados!

---

## 📊 Entendendo as Métricas

### Métricas Principais (Cards no topo)

#### 👤 Média por Colaborador
- Média de horas líquidas de todos os colaboradores
- **Delta**: Diferença em relação à meta de 8h
  - ↑ Verde: Acima da meta
  - ↓ Vermelho: Abaixo da meta

#### 🗺️ Média por Rota
- Média de horas líquidas de todas as rotas
- Mesmo sistema de delta

#### 🏢 Média por Regional
- Média de horas líquidas de todas as regionais
- Mesmo sistema de delta

#### 📍 Média por MRU
- Média de horas líquidas de todas as MRUs
- Mesmo sistema de delta

### Estatísticas Adicionais (Cards no final)

#### 📈 Card Azul - Informações Gerais
- **Total de Registros**: Quantidade de linhas após filtros
- **Colaboradores Únicos**: Quantos colaboradores diferentes
- **Período**: Intervalo de datas analisado

#### 📊 Card Verde - Totalizadores
- **Total de Horas Líquidas**: Soma de todas as horas
- **Média Geral**: Média de todas as horas líquidas
- **Desvio da Meta**: Quanto está acima/abaixo de 8h

#### 🔝 Card Laranja - Extremos
- **Máximo**: Maior valor de horas líquidas
- **Mínimo**: Menor valor de horas líquidas
- **Amplitude**: Diferença entre máximo e mínimo

---

## 🎯 Casos de Uso Práticos

### 📌 Caso 1: Análise Mensal de um Colaborador
1. Selecione o período (ex: 01/12/2024 a 31/12/2024)
2. Escolha o colaborador no filtro
3. Vá para a aba "Evolução Temporal"
4. Analise a linha de tendência
5. Exporte para Excel se necessário

### 📌 Caso 2: Comparar Regionais
1. Deixe todos os filtros em "Todos/Todas"
2. Vá para a aba "Por Rota/Regional"
3. Compare as barras do gráfico de regionais
4. Identifique as com melhor desempenho

### 📌 Caso 3: Identificar MRUs Problemáticas
1. Vá para a aba "Visão Geral"
2. Observe o gauge: se estiver abaixo de 80%, há problema
3. Role até o gráfico "Top 10 MRUs"
4. Veja quais MRUs estão abaixo de 8h
5. Aplique filtro de MRU específica para investigar

### 📌 Caso 4: Relatório Executivo
1. Aplique os filtros desejados (período, regional, etc.)
2. Tire screenshots dos gráficos principais
3. Exporte os dados para Excel
4. Use as estatísticas adicionais para o resumo

---

## 🎨 Recursos Interativos dos Gráficos

### 🖱️ Controles do Mouse
- **Hover**: Passe o mouse para ver valores exatos
- **Click**: Clique em legendas para mostrar/ocultar séries
- **Drag**: Arraste para fazer zoom em área específica
- **Double-click**: Clique duas vezes para resetar zoom

### 🔧 Barra de Ferramentas (canto superior direito)
- **📷 Camera**: Baixar gráfico como PNG
- **🔍 Zoom**: Ferramentas de zoom
- **↔️ Pan**: Mover o gráfico
- **🏠 Home**: Resetar visualização
- **⚙️ Autoscale**: Ajustar escala automaticamente

---

## ⚠️ Dicas Importantes

### ✅ Fazer
- ✅ Aplicar filtros para análises específicas
- ✅ Explorar todas as abas
- ✅ Usar os gráficos interativos
- ✅ Exportar com filtros aplicados
- ✅ Verificar as estatísticas adicionais

### ❌ Evitar
- ❌ Não fechar o terminal enquanto usa o dashboard
- ❌ Não fazer upload de arquivos muito grandes (>1GB)
- ❌ Não usar navegadores antigos (IE)
- ❌ Não esquecer de aplicar os filtros antes de exportar

---

## 🐛 Solução de Problemas

### Problema: Dashboard não abre
**Solução**: 
```bash
# Verifique se o Streamlit está instalado
pip install streamlit

# Execute novamente
python -m streamlit run app.py
```

### Problema: Erro ao carregar arquivo
**Solução**:
- Verifique se o arquivo é .xlsx
- Confirme que as colunas estão nas posições corretas
- Tente com outro arquivo para testar

### Problema: Gráficos não aparecem
**Solução**:
```bash
# Reinstale o Plotly
pip install --upgrade plotly

# Limpe o cache do Streamlit
python -m streamlit cache clear
```

### Problema: Exportação não funciona
**Solução**:
```bash
# Instale/atualize as dependências
pip install --upgrade xlsxwriter openpyxl
```

---

## 🎓 Atalhos de Teclado

- **Ctrl + R**: Recarregar o dashboard
- **Ctrl + Shift + R**: Limpar cache e recarregar
- **F11**: Tela cheia (navegador)
- **Ctrl + F**: Buscar na tabela

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique o terminal para mensagens de erro
2. Consulte o arquivo `README.md`
3. Revise o arquivo `MELHORIAS.md` para entender as funcionalidades

---

## 🎉 Aproveite!

Explore todas as funcionalidades e descubra insights valiosos nos seus dados!

**Dashboard rodando em**: http://localhost:8501

---

*Última atualização: Janeiro 2026*
