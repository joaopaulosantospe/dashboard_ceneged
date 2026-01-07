# 📊 Dashboard de Horas Trabalhadas - Master

Bem-vindo ao sistema definitivo de análise de produtividade e horas trabalhadas. Este dashboard foi projetado para oferecer uma experiência visual premium, intuitiva e tecnicamente precisa para a gestão de equipes e rotas.

---

## 🚀 Início Rápido

### Instalação
1. **Instale as dependências**:
   ```bash
   pip install -r requirements.txt
   ```

### Execução
```bash
python -m streamlit run app.py
```
O dashboard abrirá automaticamente em: **http://localhost:8501**

---

## ✨ Características Principais

### 🎨 Design Profissional e Elegante
- **Interface Premium**: Uso de gradientes modernos, sombras dinâmicas e animações suaves.
- **Tipografia**: Fontes modernas (Inter/Outfit) para máxima legibilidade.
- **Layout Responsivo**: Otimizado para diferentes resoluções e dispositivos.
- **Ocultação de UI Streamlit**: Interface limpa, sem menus de desenvolvedor ou botões de deploy.

### 🔍 Filtros Avançados (Tempo Real)
- **Período**: Seleção precisa por intervalo de datas.
- **Colaborador**: Filtro dinâmico por nome.
- **Múltipla Escolha**: Filtros de **Rota**, **Regional** e **MRU** com suporte a seleção múltipla.
- **Perfil de Produtividade**: Filtre dados por faixas de horas líquidas (Ex: > 12h, < 8h).

### 📈 Gráficos Interativos (Plotly)
- **Visão Geral**: Gauge de eficiência (meta 8h), histograma de distribuição e ranking Top 10 MRUs.
- **Produtividade**: Análise por colaborador (barras e pizza), rota e regional.
- **Temporal**: Gráficos de evolução diária e Heatmap de frequência semanal.

### 💾 Exportação Inteligente
- **Excel (.xlsx)**: Arquivos formatados com cores, tipos de dados corretos (Data/Hora) e largura de colunas automática.
- **CSV**: Pronto para importação em sistemas brasileiros (UTF-8 com BOM).

---

## 🛠️ Detalhes Técnicos e Correções

### 📋 Requisitos do Arquivo Excel
O sistema lê automaticamente as seguintes colunas do seu arquivo:
- **Coluna A**: Data
- **Coluna D**: Rota
- **Coluna E**: Regional
- **Coluna M**: Código MRU (Preserva zeros à esquerda, ex: `01131103`)
- **Coluna N**: Nome Descritivo da MRU
- **Coluna AP**: Colaborador
- **Coluna AI/AJ**: Hora de Início e Fim (Para verificação de jornada)
- **Coluna AK**: Total de Horas do Dia
- **Coluna AU**: Intervalos (Cálculo automático das 3 maiores pausas)

### 🎯 Cálculo de Horas Líquidas
O sistema aplica automaticamente a regra de negócio:
`Horas Líquidas = Total do Dia - Soma dos 3 Maiores Intervalos`

### ✅ Melhorias Implementadas (V2.0)
- **Correção de MRU**: Agora exibido como `Código - Nome` para facilitar a identificação.
- **Precisão Temporal**: Preservação exata dos formatos de hora `HH:MM:SS` em todas as telas e exportações.
- ** PERFORMANCE**: Uso de cache inteligente para processamento ultrarápido de grandes volumes de dados.

---

## 📁 Estrutura do Projeto
- `app.py`: Interface e lógica do Dashboard (Streamlit).
- `leitura_excel.py`: Motor de importação e saneamento de dados.
- `processamento.py`: Cálculos estatísticos e formatação horária.
- `requirements.txt`: Lista de bibliotecas necessárias.

---

## 📄 Notas de Uso
- **Navegador**: Recomendado o uso do Google Chrome ou Edge.
- **Exportação**: Os dados exportados sempre respeitam os filtros ativos na tela.
- **Suporte**: Verifique se o arquivo Excel segue a estrutura de colunas mencionada acima.

---

**Desenvolvido para CENEGED | 2026**
