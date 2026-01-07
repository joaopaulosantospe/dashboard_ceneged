# 📊 Dashboard de Horas Trabalhadas - Versão Profissional

Dashboard interativo e elegante para análise de horas trabalhadas, desenvolvido com Streamlit e Plotly.

## ✨ Características Principais

### 🎨 Design Profissional e Elegante
- Interface moderna com gradientes e animações suaves
- Tema responsivo com cores harmoniosas (roxo/azul)
- Tipografia profissional usando Google Fonts (Inter)
- Cards com efeitos hover e sombras dinâmicas
- Layout otimizado para diferentes tamanhos de tela

### 🔍 Filtros Avançados
- **Período**: Selecione intervalo de datas específico
- **Colaborador**: Filtre por colaborador individual ou todos
- **Rota**: Seleção múltipla de rotas
- **Regional**: Seleção múltipla de regionais
- **MRU**: Seleção múltipla de MRUs
- Botão para limpar todos os filtros rapidamente

### 📈 Gráficos Interativos Profissionais
Todos os gráficos são criados com Plotly para máxima interatividade:

#### Visão Geral
- **Gauge Chart**: Percentual de MRUs com média ≥ 8h
- **Histograma**: Distribuição de horas líquidas
- **Top 10 MRUs**: Ranking das MRUs com maior média

#### Por Colaborador
- **Gráfico de Barras**: Média de horas por colaborador
- **Gráfico de Pizza**: Distribuição total de horas

#### Por Rota/Regional
- **Gráficos de Barras**: Médias por rota e regional
- Linha de referência da meta (8h)

#### Evolução Temporal
- **Gráfico de Linha**: Evolução da média ao longo do tempo
- **Heatmap**: Média de horas por dia da semana e semana do ano

### 💾 Exportação com Formatação Correta

#### Excel (.xlsx)
- **Datas**: Formato dd/mm/yyyy
- **Horas**: Formato [h]:mm:ss (mesmo formato da planilha original)
- **Cabeçalhos**: Formatados com cores e negrito
- **Colunas**: Larguras ajustadas automaticamente
- **Nome do arquivo**: Inclui timestamp (horas_trabalhadas_YYYYMMDD_HHMMSS.xlsx)

#### CSV (.csv)
- Separador: ponto e vírgula (;)
- Encoding: UTF-8 com BOM
- Formato compatível com Excel brasileiro

### 📊 Métricas e Estatísticas

#### Métricas Principais (com Delta)
- Média por Colaborador
- Média por Rota
- Média por Regional
- Média por MRU

#### Estatísticas Adicionais
- Total de registros filtrados
- Número de colaboradores únicos
- Período analisado
- Total de horas líquidas
- Média geral
- Desvio da meta (8h)
- Valores máximo e mínimo
- Amplitude

## 🚀 Como Usar

### Instalação

1. **Clone ou baixe o projeto**

2. **Instale as dependências**:
```bash
pip install -r requirements.txt
```

### Execução

```bash
python -m streamlit run app.py
```

O dashboard abrirá automaticamente no navegador em `http://localhost:8501`

### Uso do Dashboard

1. **Upload do Arquivo**:
   - Clique em "Browse files" na barra lateral
   - Selecione seu arquivo Excel (.xlsx)
   - Aguarde o processamento automático

2. **Aplicar Filtros**:
   - Use os filtros na barra lateral para refinar a análise
   - Os gráficos e métricas são atualizados automaticamente
   - Clique em "🔄 Limpar Filtros" para resetar

3. **Explorar Visualizações**:
   - Navegue pelas abas: Visão Geral, Por Colaborador, Por Rota/Regional, Evolução Temporal
   - Passe o mouse sobre os gráficos para ver detalhes
   - Use os controles do Plotly (zoom, pan, download)

4. **Exportar Dados**:
   - Role até a seção "Exportar Dados"
   - Escolha entre Excel (formatado) ou CSV
   - O arquivo será baixado automaticamente

## 📁 Estrutura do Projeto

```
dashboard_horas/
├── app.py                  # Dashboard principal (Streamlit)
├── leitura_excel.py        # Módulo de leitura do Excel
├── processamento.py        # Processamento e formatação de dados
├── requirements.txt        # Dependências do projeto
├── README.md              # Este arquivo
└── Media_Horas.xlsx       # Arquivo de exemplo (dados)
```

## 🛠️ Tecnologias Utilizadas

- **Python 3.x**
- **Streamlit**: Framework para dashboards interativos
- **Pandas**: Manipulação e análise de dados
- **Plotly**: Gráficos interativos profissionais
- **OpenPyXL**: Leitura de arquivos Excel
- **XlsxWriter**: Escrita de arquivos Excel com formatação

## 📋 Requisitos do Arquivo Excel

O arquivo Excel deve conter as seguintes colunas (nas posições especificadas):

- **Coluna A**: Data
- **Coluna D**: Rota
- **Coluna E**: Regional
- **Coluna M**: MRU
- **Coluna AP**: Colaborador
- **Coluna AK**: Horas do Dia
- **Coluna AU**: Intervalo

## 🎯 Funcionalidades Especiais

### Cálculo de Horas Líquidas
O sistema calcula automaticamente as horas líquidas seguindo a regra:
```
Horas Líquidas = Horas do Dia - Soma dos 3 Maiores Intervalos
```

### Formatação Inteligente
- **Datas**: Convertidas e formatadas como dd/mm/yyyy
- **Horas**: Convertidas de formato Excel para HH:MM:SS
- **Números**: Arredondados para 2 casas decimais quando necessário

### Responsividade
- Layout adaptável para diferentes resoluções
- Gráficos redimensionáveis
- Tabelas com scroll horizontal quando necessário

## 🎨 Paleta de Cores

- **Primária**: Gradiente roxo-azul (#667eea → #764ba2)
- **Secundária**: Tons de cinza (#2c3e50, #6c757d)
- **Sucesso**: Verde (#e8f5e9)
- **Aviso**: Laranja (#fff3e0)
- **Erro**: Vermelho (#ffebee)

## 📝 Notas Importantes

1. **Formato de Exportação**: O Excel exportado mantém o mesmo formato de data/hora da planilha original
2. **Performance**: Para arquivos muito grandes (>100k linhas), o carregamento pode levar alguns segundos
3. **Navegadores**: Recomendado usar Chrome, Firefox ou Edge para melhor experiência
4. **Filtros**: Todos os filtros são aplicados em tempo real e afetam todas as visualizações

## 🔄 Atualizações Implementadas

### Versão 2.0 (Atual)
- ✅ Design completamente reformulado com gradientes e animações
- ✅ Filtros avançados com seleção múltipla
- ✅ Gráficos profissionais com Plotly
- ✅ Exportação com formatação correta de data/hora
- ✅ Métricas com indicadores de delta
- ✅ Heatmap de produtividade semanal
- ✅ Estatísticas detalhadas
- ✅ Layout responsivo e moderno
- ✅ Documentação completa

## 💡 Dicas de Uso

1. **Análise Rápida**: Use a aba "Visão Geral" para ter um panorama geral
2. **Análise Detalhada**: Navegue pelas outras abas para insights específicos
3. **Comparações**: Use os filtros para comparar períodos, colaboradores ou regiões
4. **Exportação**: Sempre exporte com os filtros aplicados para relatórios específicos
5. **Performance**: Limpe os filtros regularmente para análises mais amplas

## 🆘 Suporte

Para problemas ou dúvidas:
1. Verifique se todas as dependências estão instaladas
2. Confirme que o arquivo Excel está no formato correto
3. Verifique os logs no terminal para mensagens de erro

## 📄 Licença

Este projeto é de uso interno e educacional.

---

**Desenvolvido com ❤️ usando Streamlit e Plotly**
