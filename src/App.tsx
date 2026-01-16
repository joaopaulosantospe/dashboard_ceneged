import React, { useState, useMemo, useEffect } from 'react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import pptxgen from "pptxgenjs";
import {
    BarChart3,
    Users,
    Map as MapIcon,
    Clock,
    Download,
    Upload,
    RefreshCw,
    LayoutDashboard,
    TrendingUp,
    Table as TableIcon,
    X,
    ChevronDown,
    Search,
    Filter,
    Check,
    Database,
    FileText,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';
import {
    BarChart,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Bar,
    LabelList,
    LineChart,
    Line,
    ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isWithinInterval, startOfDay, endOfDay, isValid } from 'date-fns';
import * as XLSX from 'xlsx';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { processData, ProcessedRow, decimalToTime } from './utils/dataProcessor';
import { get, set, del } from 'idb-keyval';

/** 
 * Utility for Tailwind classes 
 */
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ==================== COMPONENTS ====================

const ComboBox = ({ label, options, selected, onChange, multi = false, icon: Icon }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filteredOptions = (options || []).filter((opt: any) =>
        opt && String(opt).toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (option: string) => {
        if (multi) {
            let newSelected = [...selected];
            if (option === 'Todas' || option === 'Todos') {
                newSelected = [option];
            } else {
                if (newSelected.includes(option)) {
                    newSelected = newSelected.filter(item => item !== option);
                } else {
                    newSelected = newSelected.filter(item => item !== 'Todas' && item !== 'Todos');
                    newSelected.push(option);
                }
                if (newSelected.length === 0) newSelected = [options[0] === 'Todas' ? 'Todas' : 'Todos'];
            }
            onChange(newSelected);
        } else {
            onChange(option);
            setIsOpen(false);
        }
    };

    const getDisplayText = () => {
        if (multi) {
            if (selected.includes('Todas') || selected.includes('Todos')) return 'Todas';
            if (selected.length === 1) return selected[0];
            return `${selected.length} selecionados`;
        }
        return selected;
    };

    return (
        <div className="space-y-1">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full text-left p-3 rounded-xl transition-all flex justify-between items-center group",
                    isOpen ? "bg-brand-purple/20 border-brand-purple/50" : "bg-white/5 border-transparent hover:bg-white/10"
                )}
            >
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg transition-colors", isOpen ? "bg-brand-purple text-white" : "bg-white/10 text-gray-400 group-hover:text-white")}>
                        <Icon size={16} />
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{label}</span>
                        <span className="text-xs font-medium text-white truncate max-w-[140px]">{getDisplayText()}</span>
                    </div>
                </div>
                <ChevronDown size={14} className={cn("text-gray-500 transition-transform duration-300", isOpen && "rotate-180 text-brand-purple")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-2 bg-black/20 rounded-xl border border-white/5 mt-1">
                            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/5 text-xs mb-2">
                                <Search size={12} className="text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full outline-none bg-transparent placeholder-gray-500 text-white"
                                    autoFocus
                                />
                            </div>
                            <div className="max-h-[200px] overflow-y-auto p-1 custom-scrollbar space-y-1">
                                {(multi ? ['Todas', ...filteredOptions.filter((o: string) => o !== 'Todas')] : ['Todos', ...filteredOptions.filter((o: string) => o !== 'Todos')]).map((opt: string) => {
                                    const isSelected = multi ? selected.includes(opt) : selected === opt;
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => handleSelect(opt)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors",
                                                isSelected ? "bg-brand-purple text-white font-medium" : "hover:bg-white/10 text-gray-400"
                                            )}
                                        >
                                            <span className="truncate">{opt}</span>
                                            {isSelected && <Check size={12} />}
                                        </button>
                                    );
                                })}
                                {filteredOptions.length === 0 && (
                                    <p className="text-center text-xs text-gray-500 py-4">Nenhum resultado</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MetricCard = ({ title, value, icon: Icon, delay = 0, color = 'bg-brand-purple' }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={cn(
            "p-6 rounded-2xl shadow-lg text-white group hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden",
            color.includes('gradient') ? color : `bg-gradient-to-br ${color}`
        )}
    >
        {/* Camada de Textura mais visível */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 z-0"></div>

        {/* Esferas de Luz Ultra-Visíveis e Rápidas */}
        <motion.div
            animate={{
                x: [-50, 150, -50],
                y: [-20, 80, -20],
                scale: [1, 1.8, 1],
                opacity: [0.3, 0.7, 0.3]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-64 h-64 bg-white/40 rounded-full blur-xl pointer-events-none z-0"
        />
        <motion.div
            animate={{
                x: [50, -150, 50],
                y: [20, -80, 20],
                scale: [1, 2, 1],
                opacity: [0.2, 0.6, 0.2]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/30 rounded-full blur-xl pointer-events-none z-0"
        />

        {/* Conteúdo do Card */}
        <div className="relative flex justify-between items-start z-10">
            <div>
                <p className="text-white/80 text-sm font-medium mb-1 uppercase tracking-wider">{title}</p>
                <h3 className="text-3xl font-bold font-outfit">{value}</h3>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm group-hover:rotate-12 transition-transform">
                <Icon size={24} />
            </div>
        </div>
    </motion.div>
);

const LoadingOverlay = () => (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
        <div className="relative">
            <div className="w-24 h-24 border-4 border-white/10 border-t-brand-purple rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="text-white animate-spin ring-offset-current" size={32} />
            </div>
        </div>
        <h3 className="mt-8 text-2xl font-bold text-white font-outfit animate-pulse tracking-tight">Analisando Arquivos...</h3>
        <p className="text-white/40 mt-2 text-sm font-medium uppercase tracking-widest">Aguarde um instante</p>
    </div>
);

const SuccessModal = ({ stats, onClose }: { stats: any, onClose: () => void }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center bg-brand-dark/90 backdrop-blur-lg p-4"
    >
        <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-purple to-amber-500"></div>

            <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <CheckCircle2 className="text-emerald-500" size={40} />
                </div>

                <h2 className="text-3xl font-black text-brand-dark mb-2 font-outfit">Processamento Concluído!</h2>
                <p className="text-gray-500 mb-8 font-medium">Os dados foram importados com sucesso.</p>

                <div className="grid grid-cols-1 gap-4 w-full mb-8">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center group hover:border-brand-purple/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <FileText size={18} className="text-brand-purple" />
                            </div>
                            <span className="text-gray-600 font-bold text-sm">Linhas lidas</span>
                        </div>
                        <span className="text-brand-dark font-black text-lg">{stats.totalOriginal.toLocaleString()}</span>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center group hover:border-emerald-500/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <Check size={18} className="text-emerald-500" />
                            </div>
                            <span className="text-gray-600 font-bold text-sm">Linhas válidas</span>
                        </div>
                        <span className="text-brand-dark font-black text-lg">{stats.totalValid.toLocaleString()}</span>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center group hover:border-amber-500/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <Database size={18} className="text-amber-500" />
                            </div>
                            <span className="text-gray-600 font-bold text-sm">Registros Dashboard</span>
                        </div>
                        <span className="text-brand-dark font-black text-lg">{stats.mergedCount.toLocaleString()}</span>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-4 bg-brand-purple text-white rounded-2xl font-black text-lg hover:bg-brand-purple/90 transition-all shadow-xl shadow-brand-purple/20 active:scale-95"
                >
                    Acessar Dashboard
                </button>
            </div>
        </motion.div>
    </motion.div>
);

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-dark/90 backdrop-blur-lg p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>

                    <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <AlertTriangle className="text-rose-500" size={40} />
                        </div>

                        <h2 className="text-3xl font-black text-brand-dark mb-2 font-outfit">{title}</h2>
                        <p className="text-gray-500 mb-8 font-medium">{message}</p>

                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={onConfirm}
                                className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-lg hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 active:scale-95"
                            >
                                Sim, apagar tudo
                            </button>
                            <button
                                onClick={onCancel}
                                className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all active:scale-95"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

const TabButton = ({ active, onClick, children, icon: Icon }: any) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 whitespace-nowrap text-sm",
            active
                ? "bg-brand-purple text-white shadow-md shadow-brand-purple/30"
                : "bg-white text-gray-500 hover:bg-gray-100 hover:text-brand-purple"
        )}
    >
        <Icon size={18} />
        {children}
    </button>
);

// ==================== MAIN APP ====================

export default function App() {
    const [data, setData] = useState<ProcessedRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('geral');

    // States para Filtros
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [selectedRotas, setSelectedRotas] = useState<string[]>(['Todas']);
    const [selectedRegionais, setSelectedRegionais] = useState<string[]>(['Todas']);
    const [selectedColaborador, setSelectedColaborador] = useState('Todos');
    const [selectedMRUs, setSelectedMRUs] = useState<string[]>(['Todas']);
    const [selectedLotes, setSelectedLotes] = useState<string[]>(['Todas']);
    const [selectedPerfil, setSelectedPerfil] = useState('Todos');
    const [tableSearch, setTableSearch] = useState('');
    const [tableLimit, setTableLimit] = useState(50);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [uploadStats, setUploadStats] = useState<any>(null);

    // Carregar dados persistidos ao iniciar
    useEffect(() => {
        const loadPersistedData = async () => {
            setLoading(true);
            try {
                const persisted = await get('dashboard_data');
                if (persisted && Array.isArray(persisted)) {
                    // Converter datas de volta para objetos Date (IndexedDB armazena como Date ou string dependendo da versão)
                    const restored = persisted.map(item => {
                        const dt = new Date(item.data);
                        // Se a data carregada parece ter sido "shiftada" para UTC (meia-noite UTC), 
                        // nós a forçamos de volta para a meia-noite local.
                        const isMidnightUTC = dt.getUTCHours() === 0 && dt.getUTCMinutes() === 0;
                        const restoredDate = isMidnightUTC
                            ? new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())
                            : dt;

                        return {
                            ...item,
                            data: restoredDate
                        };
                    });
                    setData(restored);

                    // Reaplicar datas automáticas
                    const dates = restored.map(d => d.data.getTime());
                    setStartDate(format(new Date(Math.min(...dates)), 'yyyy-MM-dd'));
                    setEndDate(format(new Date(Math.max(...dates)), 'yyyy-MM-dd'));
                }
            } catch (err) {
                console.warn("Erro ao carrergar cache persistente:", err);
            } finally {
                setLoading(false);
            }
        };
        loadPersistedData();
    }, []);

    // Lógica de Upload Multiplo
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setLoading(true);
        try {
            const filesArray = Array.from(files);
            const results = await Promise.all(
                filesArray.map(file => processData(file))
            );

            // Mesclar todos os resultados em um único array
            const mergedData = results.map(r => r.data).flat();
            const totalOriginal = results.reduce((acc, r) => acc + (r.stats?.originalLines || 0), 0);
            const totalValid = results.reduce((acc, r) => acc + (r.stats?.validLines || 0), 0);

            // Ordenar por data para garantir consistência
            mergedData.sort((a, b) => a.data.getTime() - b.data.getTime() || a.colaborador.localeCompare(b.colaborador));

            // Salvar no IndexedDB
            await set('dashboard_data', mergedData);
            setData(mergedData);

            if (totalOriginal > 0) {
                setUploadStats({
                    totalOriginal,
                    totalValid,
                    mergedCount: mergedData.length
                });
                setShowSuccessModal(true);
            }

            // Auto-set dates based on data
            if (mergedData.length > 0) {
                const dates = mergedData.map(d => d.data.getTime());
                setStartDate(format(new Date(Math.min(...dates)), 'yyyy-MM-dd'));
                setEndDate(format(new Date(Math.max(...dates)), 'yyyy-MM-dd'));
            }
        } catch (err) {
            console.error(err);
            alert("Erro ao processar um ou mais arquivos. Verifique se o formato CSV está correto.");
        } finally {
            setLoading(false);
            // Limpar o input para permitir carregar os mesmos arquivos novamente se necessário
            if (event.target) event.target.value = '';
        }
    };

    // Listas Dinâmicas para Filtros
    // Listas Dinâmicas para Filtros (Cascata)
    const filterOptions = useMemo(() => {
        // Opções Mestre (Sempre todas as regionais disponíveis no arquivo)
        const regionais = [...new Set(data.map(d => d.regional))].sort();

        // 1. Contexto filtrado pela Regional para as Rotas
        let contextForRotas = data;
        if (!selectedRegionais.includes('Todas')) {
            contextForRotas = data.filter(d => selectedRegionais.includes(d.regional));
        }
        const rotas = [...new Set(contextForRotas.map(d => d.rota))].sort();

        // 2. Contexto filtrado por Regional + Rota para Colaboradores e MRUs
        let contextForOthers = contextForRotas;
        if (!selectedRotas.includes('Todas')) {
            contextForOthers = contextForRotas.filter(d => selectedRotas.includes(d.rota));
        }

        const colaboradores = [...new Set(contextForOthers.map(d => d.colaborador))].filter(Boolean).sort();
        const mrus = [...new Set(contextForOthers.map(d => d.mru))].filter(Boolean).sort();
        const lotes = [...new Set(contextForOthers.map(d => d.lote))].filter(Boolean).sort();

        return {
            rotas: rotas.filter(Boolean),
            regionais: regionais.filter(Boolean),
            colaboradores,
            mrus,
            lotes
        };
    }, [data, selectedRotas, selectedRegionais]);

    // Aplicação dos Filtros
    const filteredData = useMemo(() => {
        return data.filter(row => {
            // Data
            if (startDate && endDate) {
                if (!isWithinInterval(row.data, {
                    start: startOfDay(new Date(startDate + 'T00:00:00')),
                    end: endOfDay(new Date(endDate + 'T23:59:59'))
                })) return false;
            }

            // Rota
            if (!selectedRotas.includes('Todas') && !selectedRotas.includes(row.rota)) return false;

            // Regional
            if (!selectedRegionais.includes('Todas') && !selectedRegionais.includes(row.regional)) return false;

            // Colaborador
            if (selectedColaborador !== 'Todos' && row.colaborador !== selectedColaborador) return false;

            // MRU
            if (!selectedMRUs.includes('Todas') && !selectedMRUs.includes(row.mru)) return false;

            // Lote
            if (!selectedLotes.includes('Todas') && !selectedLotes.includes(row.lote)) return false;

            // Perfil (Faixa de Horais) - Usando Floor para tolerar excesso de minutos/segundos
            const hFloor = Math.floor(row.horas_liquidas_dec);
            if (selectedPerfil !== 'Todos') {
                if (selectedPerfil === 'Até 08:00:00' && hFloor > 8) return false;
                if (selectedPerfil === 'Até 09:00:00' && hFloor !== 9) return false;
                if (selectedPerfil === 'Até 10:00:00' && hFloor !== 10) return false;
                if (selectedPerfil === 'Até 11:00:00' && hFloor !== 11) return false;
                if (selectedPerfil === 'Até 12:00:00' && hFloor !== 12) return false;
                if (selectedPerfil === 'Acima de 12:00:00' && hFloor <= 12) return false;
            }

            return true;
        });
    }, [data, startDate, endDate, selectedRotas, selectedRegionais, selectedColaborador, selectedMRUs, selectedPerfil]);

    // Filtro específico para a tabela (Pesquisa Local)
    const tableDataFiltered = useMemo(() => {
        if (!tableSearch) return filteredData;
        const term = tableSearch.toLowerCase().trim();
        return filteredData.filter(row =>
            row.colaborador.toLowerCase().includes(term) ||
            row.mru.toLowerCase().includes(term) ||
            row.rota.toLowerCase().includes(term) ||
            row.regional.toLowerCase().includes(term) ||
            row.data_formatada.includes(term) ||
            row.hora_inicio.includes(term) ||
            row.hora_final.includes(term)
        );
    }, [filteredData, tableSearch]);

    // Métricas
    const stats = useMemo(() => {
        if (filteredData.length === 0) return { colab: "00:00:00", rota: "00:00:00", reg: "00:00:00", mru: "00:00:00" };

        // 1. Média Colaborador (Continua individual)
        const calculateColabAvg = () => {
            const grouped = new Map<string, number[]>();
            filteredData.forEach(d => {
                const groupValue = d.colaborador;
                if (!grouped.has(groupValue)) grouped.set(groupValue, []);
                grouped.get(groupValue)!.push(d.horas_liquidas_dec);
            });
            const groupAverages = Array.from(grouped.values()).map(vals =>
                vals.reduce((a, b) => a + b, 0) / vals.length
            );
            return groupAverages.reduce((a, b) => a + b, 0) / groupAverages.length;
        };

        // 2. Agrupamento Mestre por MRU + Data para as outras médias
        const mruTotalsMap = new Map<string, { valor: number, rota: string, regional: string }>();
        filteredData.forEach(d => {
            const key = `${d.mru}-${d.data_formatada}`;
            if (!mruTotalsMap.has(key)) {
                mruTotalsMap.set(key, { valor: d.horas_liquidas_dec, rota: d.rota, regional: d.regional });
            } else {
                mruTotalsMap.get(key)!.valor += d.horas_liquidas_dec;
            }
        });
        const mruData = Array.from(mruTotalsMap.values());

        const calculateMruBasedAvg = (key: 'rota' | 'regional') => {
            const grouped = new Map<string, number[]>();
            mruData.forEach(d => {
                const groupValue = d[key];
                if (!grouped.has(groupValue)) grouped.set(groupValue, []);
                grouped.get(groupValue)!.push(d.valor);
            });
            const groupAverages = Array.from(grouped.values()).map(vals =>
                vals.reduce((a, b) => a + b, 0) / vals.length
            );
            return groupAverages.reduce((a, b) => a + b, 0) / groupAverages.length;
        };

        const topLevelMruAvg = mruData.reduce((a, b) => a + b.valor, 0) / mruData.length;

        return {
            colab: decimalToTime(calculateColabAvg()),
            rota: decimalToTime(calculateMruBasedAvg('rota')),
            reg: decimalToTime(calculateMruBasedAvg('regional')),
            mru: decimalToTime(topLevelMruAvg)
        };
    }, [filteredData]);

    const chartsData = useMemo(() => {
        if (filteredData.length === 0) return {
            faixas: [], meta: [], colaboradores: [],
            mrus: [], rotas: [], regionais: [], evolucao: [], frequencia: [], agreste: [], sertao: [],
            lotes: { totais: [], media: [] }
        };

        // Pre-agrupar por MRU + Data para quase tudo (Evita duplicidade de MRUs compartilhadas)
        const mruGroupedMap = new Map<string, { valor: number, mru: string, rota: string, regional: string, data: Date, lote: string }>();
        filteredData.forEach(d => {
            const key = `${d.mru}-${d.data_formatada}`;
            if (!mruGroupedMap.has(key)) {
                mruGroupedMap.set(key, {
                    valor: d.horas_liquidas_dec,
                    mru: d.mru,
                    rota: d.rota,
                    regional: d.regional,
                    data: d.data,
                    lote: d.lote
                });
            } else {
                mruGroupedMap.get(key)!.valor += d.horas_liquidas_dec;
            }
        });
        const groupedByMru = Array.from(mruGroupedMap.values());
        const totalOverallMru = groupedByMru.length;

        // 1. Faixas (Usando dados agrupados por MRU)
        const faixasLabels = ['Até 08:00:00', 'Até 09:00:00', 'Até 10:00:00', 'Até 11:00:00', 'Até 12:00:00', 'Acima de 12:00:00'];
        const faixasColors = ['#667eea', '#764ba2', '#9f7aea', '#b794f4', '#d6bcfa', '#e9d8fd'];

        const faixasData = faixasLabels.map((f, i) => {
            const count = groupedByMru.filter(d => {
                const h = Math.floor(d.valor);
                if (f === 'Até 08:00:00') return h <= 8;
                if (f === 'Até 09:00:00') return h === 9;
                if (f === 'Até 10:00:00') return h === 10;
                if (f === 'Até 11:00:00') return h === 11;
                if (f === 'Até 12:00:00') return h === 12;
                return h > 12;
            }).length;
            const percent = totalOverallMru > 0 ? ((count / totalOverallMru) * 100).toFixed(1) : 0;
            return {
                name: f,
                total: count,
                label: `${count} (${percent}%)`,
                fill: faixasColors[i]
            };
        });

        // 2. Meta (Usando dados agrupados por MRU)
        const ok = groupedByMru.filter(d => d.valor >= 8).length;
        const fail = groupedByMru.length - ok;
        const metaData = [
            { name: 'Dentro da Meta', value: ok, color: '#10b981' },
            { name: 'Abaixo da Meta', value: fail, color: '#ef4444' }
        ];

        // 3. Colaboradores (Mantém individual)
        const colabMap = new Map<string, number[]>();
        filteredData.forEach(d => {
            if (!colabMap.has(d.colaborador)) colabMap.set(d.colaborador, []);
            colabMap.get(d.colaborador)!.push(d.horas_liquidas_dec);
        });
        const colaboradoresData = Array.from(colabMap.entries()).map((entry) => {
            const [name, vals] = entry;
            return {
                name,
                avg: vals.reduce((a, b) => a + b, 0) / vals.length,
                time: decimalToTime(vals.reduce((a, b) => a + b, 0) / vals.length)
            };
        }).sort((a, b) => b.avg - a.avg);

        // 4. Top 10 MRU - High to Low
        const topMRUs = groupedByMru
            .map(d => ({
                name: d.mru,
                valor: d.valor,
                time: decimalToTime(d.valor)
            }))
            .filter(d => d.valor >= 8)
            .sort((a, b) => b.valor - a.valor)
            .slice(0, 10);

        // 5. Por Rota e Regional (Usando MRU Grouped)
        const groupStatsByMru = (key: 'rota' | 'regional') => {
            const map = new Map<string, number[]>();
            groupedByMru.forEach(d => {
                const val = d[key];
                if (!map.has(val)) map.set(val, []);
                map.get(val)!.push(d.valor);
            });
            return Array.from(map.entries()).map(([name, vals]) => {
                const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                return { name, avg, time: decimalToTime(avg) };
            }).sort((a, b) => b.avg - a.avg);
        };

        const rotasData = groupStatsByMru('rota');
        const regionaisData = groupStatsByMru('regional');

        // 6. Evolução Diária (Usando MRU Grouped)
        const evolucaoMap = new Map<number, number[]>();
        groupedByMru.forEach(d => {
            const time = startOfDay(d.data).getTime();
            if (!evolucaoMap.has(time)) evolucaoMap.set(time, []);
            evolucaoMap.get(time)!.push(d.valor);
        });

        const evolucaoData = Array.from(evolucaoMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([time, vals]) => {
                const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                return {
                    date: format(new Date(time), 'dd/MM'),
                    avg: avg,
                    time: decimalToTime(avg)
                };
            });

        // 7. Frequência Semanal (Usando MRU Grouped)
        const weekMap = new Map<number, number[]>();
        groupedByMru.forEach(d => {
            const day = d.data.getDay();
            if (!weekMap.has(day)) weekMap.set(day, []);
            weekMap.get(day)!.push(d.valor);
        });

        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const orderedDays = [1, 2, 3, 4, 5, 6, 0];

        const frequenciaData = orderedDays.map(dayIndex => {
            const vals = weekMap.get(dayIndex) || [];
            const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            return {
                name: days[dayIndex],
                avg: avg,
                time: decimalToTime(avg)
            };
        });

        // 8. Regiões Específicas (Agreste e Sertão)
        const getGroupedDataByRegionsMru = (regionNames: string[]) => {
            const map = new Map<string, number[]>();
            groupedByMru.forEach(d => {
                const reg = String(d.regional).toUpperCase().trim();
                const key = d.rota;
                if (regionNames.some(n => reg.includes(n))) {
                    if (!map.has(key)) map.set(key, []);
                    map.get(key)!.push(d.valor);
                }
            });
            return Array.from(map.entries()).map(([name, vals]) => {
                const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                return { name, avg, time: decimalToTime(avg) };
            }).sort((a, b) => b.avg - a.avg);
        };

        const agresteData = getGroupedDataByRegionsMru(['GARANHUNS', 'CARUARU']);
        const sertaoData = getGroupedDataByRegionsMru(['SERRA TALHADA', 'PETROLINA', 'ARCOVERDE', 'SALGUEIRO']);

        return {
            faixas: faixasData,
            meta: metaData,
            colaboradores: colaboradoresData,
            mrus: topMRUs,
            rotas: rotasData,
            regionais: regionaisData,
            evolucao: evolucaoData,
            frequencia: frequenciaData,
            agreste: agresteData,
            sertao: sertaoData,
            lotes: (() => {
                const loteTotalMap = new Map<string, number>();
                const loteUnder7Map = new Map<string, number>();

                // Inicializar com 01-18
                for (let i = 1; i <= 18; i++) {
                    const lKey = String(i).padStart(2, '0');
                    loteTotalMap.set(lKey, 0);
                    loteUnder7Map.set(lKey, 0);
                }

                // 1. Total de Horas por Lote
                groupedByMru.forEach(d => {
                    const l = String(d.lote || "").trim();
                    if (loteTotalMap.has(l)) {
                        loteTotalMap.set(l, loteTotalMap.get(l)! + d.valor);
                    }
                });

                // 2. Colaboradores com média < 07:00:00 por Lote
                // Primeiro agrupamos por Lote -> Colaborador -> Média
                const loteColabMap = new Map<string, Map<string, number[]>>();
                filteredData.forEach(d => {
                    const l = String(d.lote || "").trim();
                    if (!loteColabMap.has(l)) loteColabMap.set(l, new Map());
                    const colabs = loteColabMap.get(l)!;
                    if (!colabs.has(d.colaborador)) colabs.set(d.colaborador, []);
                    colabs.get(d.colaborador)!.push(d.horas_liquidas_dec);
                });

                const loteAvgMap = new Map<string, { sum: number, count: number }>();
                for (let i = 1; i <= 18; i++) {
                    loteAvgMap.set(String(i).padStart(2, '0'), { sum: 0, count: 0 });
                }

                groupedByMru.forEach(d => {
                    const l = String(d.lote || "").trim();
                    if (loteAvgMap.has(l)) {
                        const current = loteAvgMap.get(l)!;
                        loteAvgMap.set(l, { sum: current.sum + d.valor, count: current.count + 1 });
                    }
                });

                return {
                    totais: Array.from(loteTotalMap.entries()).map(([name, total]) => ({
                        name: `Lote ${name}`,
                        total: total,
                        time: decimalToTime(total)
                    })),
                    media: Array.from(loteAvgMap.entries()).map(([name, data]) => {
                        const avg = data.count > 0 ? data.sum / data.count : 0;
                        return {
                            name: `Lote ${name}`,
                            avg: avg,
                            time: decimalToTime(avg)
                        };
                    })
                };
            })()
        };
    }, [filteredData]);


    // Exportar para Excel em Segundo Plano (Background Worker)
    const exportToExcel = async () => {
        if (filteredData.length === 0) {
            alert("Não há dados para exportar com os filtros atuais.");
            return;
        }

        setLoading(true);

        try {
            const dataToExport = filteredData.map(row => ({
                'Data': row.data_formatada,
                'Colaborador': row.colaborador,
                'Rota': row.rota,
                'Regional': row.regional,
                'MRU': row.mru,
                'Registros': row.registros,
                'Hora Início': row.hora_inicio,
                'Hora Final': row.hora_final,
                'Total Bruto': row.total_bruto,
                'Intervalo': row.intervalo,
                'Horas Líquidas': row.horas_liquidas
            }));

            const fileName = `horas_trabalhadas_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

            // Criar o Worker de Exportação
            const worker = new Worker(new URL('./utils/exportWorker.ts', import.meta.url), {
                type: 'module'
            });

            worker.postMessage({ data: dataToExport, fileName });

            worker.onmessage = (e) => {
                const { success, blob, error } = e.data;
                if (success) {
                    // Criar link temporário para download
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } else {
                    alert("Erro ao exportar: " + error);
                }
                setLoading(false);
                worker.terminate();
            };

            worker.onerror = () => {
                alert("Erro ao processar exportação em segundo plano.");
                setLoading(false);
                worker.terminate();
            };

        } catch (error) {
            console.error("Erro na exportação:", error);
            alert("Ocorreu um erro ao preparar a exportação.");
            setLoading(false);
        }
    };

    // Exportar Relatório de MRU Agrupado
    const exportMruRelatorio = async () => {
        if (filteredData.length === 0) {
            alert("Não há dados para exportar com os filtros atuais.");
            return;
        }

        setLoading(true);

        try {
            // Agrupar por MRU (Consolidar todos os registros da mesma MRU, independente de data ou colaborador)
            const mruMap = new Map<string, {
                rota: string,
                regional: string,
                mru: string,
                registros: number,
                horas_liquidas_dec: number
            }>();

            filteredData.forEach(d => {
                const key = d.mru;
                if (!mruMap.has(key)) {
                    mruMap.set(key, {
                        rota: d.rota,
                        regional: d.regional,
                        mru: d.mru,
                        registros: d.registros,
                        horas_liquidas_dec: d.horas_liquidas_dec
                    });
                } else {
                    const existing = mruMap.get(key)!;
                    existing.registros += d.registros;
                    existing.horas_liquidas_dec += d.horas_liquidas_dec;
                }
            });

            // Ordenar por MRU
            const sortedData = Array.from(mruMap.values()).sort((a, b) => a.mru.localeCompare(b.mru));

            const dataToExport = sortedData.map(row => ({
                'ROTA': row.rota,
                'REGIONAL': row.regional,
                'MRU': row.mru,
                'REG.': row.registros,
                'HORA TRAB.': decimalToTime(row.horas_liquidas_dec)
            }));

            const fileName = `relatorio_mru_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

            const worker = new Worker(new URL('./utils/exportWorker.ts', import.meta.url), {
                type: 'module'
            });

            worker.postMessage({ data: dataToExport, fileName });

            worker.onmessage = (e) => {
                const { success, blob, error } = e.data;
                if (success) {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } else {
                    alert("Erro ao exportar: " + error);
                }
                setLoading(false);
                worker.terminate();
            };

            worker.onerror = () => {
                alert("Erro ao processar exportação em segundo plano.");
                setLoading(false);
                worker.terminate();
            };

        } catch (error) {
            console.error("Erro na exportação MRU:", error);
            alert("Ocorreu um erro ao preparar a exportação.");
            setLoading(false);
        }
    };

    const generateReport = async (type: 'pdf' | 'pptx') => {
        setLoading(true);
        try {
            // IDs dos gráficos na área de captura oculta
            const chartIds = [
                { id: 'capture-faixas', title: 'Distribuição de Horas por Faixa' },
                { id: 'capture-meta', title: 'Eficiência de Meta (8hs+)' },
                { id: 'capture-topmru', title: 'Top 10 MRUs Acima da Meta' },
                { id: 'capture-lote-total', title: 'Total de Horas Líquidas por Lote' },
                { id: 'capture-lote-media', title: 'Média de Horas por Lote' },
                { id: 'capture-rotas-agreste', title: 'Média de Horas por Rota (Agreste)' },
                { id: 'capture-rotas-sertao', title: 'Média de Horas por Rota (Sertão)' },
                { id: 'capture-regionais', title: 'Média de Horas por Regional' },
                { id: 'capture-colaboradores', title: 'Média por Colaborador' },
                { id: 'capture-evolucao', title: 'Evolução da Média de Horas' },
                { id: 'capture-frequencia', title: 'Frequência de Trabalho (Dia/Semana)' }
            ];

            const capturedImages = [];

            // AVISO: Só captura o que estiver Visível no DOM (aba ativa)
            for (const chart of chartIds) {
                const element = document.getElementById(chart.id);
                if (element) {
                    const canvas = await html2canvas(element, {
                        scale: 2,
                        backgroundColor: '#ffffff',
                        logging: false,
                        useCORS: true
                    });
                    capturedImages.push({
                        img: canvas.toDataURL('image/png'),
                        title: chart.title
                    });
                }
            }

            if (capturedImages.length === 0) {
                alert('Nenhum gráfico visível encontrado para exportar. Por favor, navegue pelas abas (Visão Geral e Análise por Lote) para que os gráficos fiquem visíveis ao sistema de captura.');
                setLoading(false);
                return;
            }

            if (type === 'pdf') {
                const pdf = new jsPDF('l', 'mm', 'a4');
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();

                capturedImages.forEach((item, index) => {
                    if (index > 0) pdf.addPage('a4', 'l');

                    // Cabeçalho Profissional
                    pdf.setFillColor(102, 126, 234); // Brand Purple
                    pdf.rect(0, 0, pageWidth, 25, 'F');
                    pdf.setTextColor(255, 255, 255);
                    pdf.setFontSize(16);
                    pdf.text(`RELATÓRIO DE PERFORMANCE - CENEGED`, 15, 12);
                    pdf.setFontSize(12);
                    pdf.text(item.title, 15, 19);

                    pdf.setTextColor(255, 255, 255);
                    pdf.setFontSize(9);
                    pdf.text(`Data: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - 50, 15);

                    // Imagem do Gráfico
                    // Ajustar proporcionalmente para ocupar melhor a página A4 Paisagem
                    pdf.addImage(item.img, 'PNG', 10, 30, pageWidth - 20, pageHeight - 50);

                    // Rodapé removido conforme solicitação
                    pdf.setTextColor(150, 150, 150);
                    pdf.setFontSize(8);
                    pdf.text(`Página ${index + 1} de ${capturedImages.length}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
                });

                pdf.save(`Relatorio_Performance_CENEGED_${format(new Date(), 'ddMMyyyy_HHmm')}.pdf`);
            } else {
                const pptx = new pptxgen();

                // Slide de Título
                const titleSlide = pptx.addSlide();
                titleSlide.background = { color: 'FFFFFF' };

                // Banner lateral ou superior para PPTX
                titleSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.5, fill: { color: '667EEA' } });

                titleSlide.addText("RELATÓRIO ANALÍTICO DE PERFORMANCE", {
                    x: 0, y: 0.5, w: '100%', align: 'center', fontSize: 24, fontFace: 'Arial', bold: true, color: 'FFFFFF'
                });

                titleSlide.addText("CENEGED - BI DASHBOARD", {
                    x: 0.5, y: 3.5, w: '90%', align: 'center', fontSize: 32, fontFace: 'Arial', bold: true, color: '363636'
                });

                titleSlide.addText(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, {
                    x: 0, y: 4.5, w: '100%', align: 'center', fontSize: 14, color: '666666'
                });

                capturedImages.forEach(item => {
                    const slide = pptx.addSlide();

                    // Título do Slide
                    slide.addText(item.title, {
                        x: 0.5, y: 0.3, w: '90%', fontSize: 20, color: '667EEA', bold: true
                    });

                    // Linha decorativa
                    slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.7, w: 9.0, h: 0, line: { color: 'E2E8F0', width: 1 } });

                    // Imagem do Gráfico Centralizada e Ampliada
                    slide.addImage({
                        data: item.img, x: 0.2, y: 0.8, w: 9.6, h: 4.5
                    });

                    // Rodapé removido conforme solicitação
                });

                pptx.writeFile({ fileName: `Apresentacao_CENEGED_${format(new Date(), 'ddMMyyyy')}.pptx` });
            }
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            alert('Houve um problema ao gerar o relatório. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#f8f9fc]">
            {/* Loading Overlay */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <LoadingOverlay />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ==================== SIDEBAR ==================== */}
            <aside className="w-80 bg-[#1e1b4b] text-white border-r border-[#312e81] overflow-y-auto hidden lg:flex flex-col sticky top-0 h-screen shadow-2xl z-50">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="bg-brand-purple p-2 rounded-xl shadow-lg shadow-brand-purple/50">
                            <BarChart3 size={24} className="text-white" />
                        </div>
                        <h1 className="font-outfit font-bold text-2xl tracking-tight">Dashboard</h1>
                    </div>

                    <div className="space-y-8">
                        {/* Upload Section */}
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".csv"
                                multiple
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="flex flex-col items-center justify-center p-8 border border-dashed border-white/10 bg-white/5 rounded-2xl cursor-pointer hover:bg-brand-purple/10 hover:border-brand-purple/50 transition-all group-hover:shadow-lg group-hover:shadow-brand-purple/20"
                            >
                                <div className="bg-white/10 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                    <Upload className={cn("text-gray-300", loading && "animate-spin text-brand-purple")} size={20} />
                                </div>
                                <span className="text-xs text-gray-300 font-medium group-hover:text-white transition-colors">Carregar Arquivo(s)</span>
                                <span className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-tighter">Suporta múltiplos .CSV</span>
                            </label>
                        </div>

                        {/* Filters Section */}
                        <div className="space-y-4">
                            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                <Filter size={12} /> Filtros Avançados
                            </h2>

                            {/* Filtro de Data */}
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-3 flex items-center gap-2">
                                    <Clock size={12} /> Período
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className="w-full text-xs p-2 rounded-lg bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:ring-1 focus:ring-brand-purple outline-none"
                                    />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className="w-full text-xs p-2 rounded-lg bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:ring-1 focus:ring-brand-purple outline-none"
                                    />
                                </div>
                            </div>

                            <ComboBox
                                label="Regional"
                                icon={RefreshCw}
                                options={filterOptions.regionais}
                                selected={selectedRegionais}
                                onChange={setSelectedRegionais}
                                multi={true}
                            />

                            <ComboBox
                                label="Rota"
                                icon={MapIcon}
                                options={filterOptions.rotas}
                                selected={selectedRotas}
                                onChange={setSelectedRotas}
                                multi={true}
                            />

                            <ComboBox
                                label="Colaborador"
                                icon={Users}
                                options={filterOptions.colaboradores}
                                selected={selectedColaborador}
                                onChange={setSelectedColaborador}
                                multi={false}
                            />

                            <ComboBox
                                label="MRU"
                                icon={Clock}
                                options={filterOptions.mrus}
                                selected={selectedMRUs}
                                onChange={setSelectedMRUs}
                                multi={true}
                            />

                            <ComboBox
                                label="Lote"
                                icon={Database}
                                options={filterOptions.lotes}
                                selected={selectedLotes}
                                onChange={setSelectedLotes}
                                multi={true}
                            />

                            <ComboBox
                                label="Perfil de Produtividade"
                                icon={TrendingUp}
                                options={['Até 08:00:00', 'Até 09:00:00', 'Até 10:00:00', 'Até 11:00:00', 'Até 12:00:00', 'Acima de 12:00:00']}
                                selected={selectedPerfil}
                                onChange={setSelectedPerfil}
                                multi={false}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 mt-auto border-t border-white/5 space-y-3">
                    <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1 mb-1">
                        <Download size={12} /> Relatórios
                    </h2>

                    <button
                        onClick={() => generateReport('pdf')}
                        className="w-full py-3 text-xs font-bold text-white bg-white/5 hover:bg-white/10 transition-all rounded-xl border border-white/10 flex items-center justify-center gap-2 group"
                    >
                        <FileText size={14} className="text-blue-400" /> Exportar PDF
                    </button>

                    <button
                        onClick={() => generateReport('pptx')}
                        className="w-full py-3 text-xs font-bold text-white bg-white/5 hover:bg-white/10 transition-all rounded-xl border border-white/10 flex items-center justify-center gap-2 group"
                    >
                        <div className="w-4 h-4 bg-orange-500 rounded-sm flex items-center justify-center text-[10px] font-black text-white">P</div>
                        Exportar PowerPoint
                    </button>

                    <div className="pt-2"></div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 text-xs font-bold text-white bg-white/5 hover:bg-brand-purple hover:shadow-lg hover:shadow-brand-purple/20 transition-all rounded-xl flex items-center justify-center gap-2 group"
                    >
                        <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> Limpar Filtros
                    </button>

                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full py-3 mt-3 text-[10px] font-bold text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-all rounded-xl border border-red-500/20 flex items-center justify-center gap-2"
                    >
                        <X size={12} /> Apagar Todos os Dados
                    </button>
                    <p className="text-center text-[10px] text-gray-600 mt-4">v1.2.0 • Ceneged</p>
                </div>
            </aside>

            {/* ==================== CONTENT ==================== */}
            <main className="flex-1 p-8 overflow-y-auto">
                {/* Header Premium Animated Compact */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative overflow-hidden rounded-[1.5rem] mb-8 shadow-xl group h-48 flex items-center justify-center shrink-0"
                >
                    {/* Animated Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#2563eb] bg-[length:400%_400%] animate-gradient-xy"></div>

                    {/* Animated Particles/Overlay */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-pulse"></div>

                    {/* Floating Shapes */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                        className="absolute -top-24 -right-24 w-64 h-64 border-4 border-white/10 rounded-[3rem]"
                    ></motion.div>
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                        className="absolute -bottom-24 -left-24 w-64 h-64 border-4 border-white/10 rounded-full"
                    ></motion.div>

                    <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 w-full">
                        <div className="flex items-center gap-4 mb-2">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                className="bg-white/20 backdrop-blur-md p-2.5 rounded-xl shadow-lg border border-white/20"
                            >
                                <BarChart3 className="w-6 h-6 text-white" />
                            </motion.div>

                            <motion.h1
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-3xl font-black font-outfit tracking-tight text-white drop-shadow-lg"
                            >
                                Relatório de Horas
                            </motion.h1>
                        </div>


                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "60px" }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full mb-3"
                        ></motion.div>

                        <motion.p
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-blue-100 text-sm font-medium tracking-wide max-w-xl leading-relaxed"
                        >
                            Painel de controle analítico para gestão de produtividade e performance.
                        </motion.p>
                    </div>
                </motion.div>

                {!data.length ? (
                    <div className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-[2rem] border border-dashed border-gray-300 p-20 text-center">
                        <div className="bg-brand-purple/10 p-6 rounded-full mb-6">
                            <Upload className="text-brand-purple animate-bounce" size={48} />
                        </div>
                        <h2 className="text-2xl font-bold font-outfit mb-2">Aguardando dados...</h2>
                        <p className="text-gray-500 max-w-sm mb-2">Faça o upload do seu arquivo de horas na barra lateral para começar a análise.</p>
                        <div className="bg-brand-purple/5 px-4 py-2 rounded-full border border-brand-purple/10">
                            <p className="text-brand-purple text-[10px] font-bold uppercase tracking-widest">⚠️ Suporte exclusivo para formato .CSV</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Metrics Grid */}
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <MetricCard title="👤 Média Colaborador" value={stats.colab} icon={Users} delay={0.1} color="from-[#667eea] to-[#764ba2]" />
                            <MetricCard title="🗺️ Média Rota" value={stats.rota} icon={MapIcon} delay={0.2} color="from-[#10b981] to-[#059669]" />
                            <MetricCard title="🏢 Média Regional" value={stats.reg} icon={RefreshCw} delay={0.3} color="from-[#ec4899] to-[#db2777]" />
                            <MetricCard title="📍 Média MRU" value={stats.mru} icon={Clock} delay={0.4} color="from-[#f59e0b] to-[#d97706]" />
                        </div>

                        {/* Tabs */}
                        <div className="space-y-6">
                            <div className="flex border-b border-gray-200 overflow-x-auto pb-4 gap-2 no-scrollbar">
                                <TabButton active={activeTab === 'geral'} icon={LayoutDashboard} onClick={() => setActiveTab('geral')}>Visão Geral</TabButton>
                                <TabButton active={activeTab === 'lotes'} icon={Database} onClick={() => setActiveTab('lotes')}>Análise por Lote</TabButton>
                                <TabButton active={activeTab === 'colaborador'} icon={Users} onClick={() => setActiveTab('colaborador')}>Por Colaborador</TabButton>
                                <TabButton active={activeTab === 'rotas'} icon={MapIcon} onClick={() => setActiveTab('rotas')}>Rotas/Regionais</TabButton>
                                <TabButton active={activeTab === 'tempo'} icon={TrendingUp} onClick={() => setActiveTab('tempo')}>Evolução</TabButton>
                                <TabButton active={activeTab === 'tabela'} icon={TableIcon} onClick={() => setActiveTab('tabela')}>Tabela de Dados</TabButton>
                            </div>

                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 min-h-[500px]">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'geral' && (
                                        <motion.div
                                            key="geral"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-12"
                                        >
                                            <div>
                                                <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                                                    <Clock className="text-brand-purple" /> Distribuição de Horas por Faixa
                                                </h3>
                                                <div id="report-faixas" className="h-[400px] w-full bg-white p-4 rounded-xl">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={chartsData.faixas} layout="vertical" margin={{ top: 5, right: 100, left: 20, bottom: 5 }}>
                                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                                            <XAxis type="number" hide />
                                                            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                                                            <Tooltip cursor={{ fill: '#f8f9fa' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                            <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={24}>
                                                                <LabelList dataKey="label" position="right" style={{ fontSize: '11px', fill: '#64748b' }} />
                                                                {chartsData.faixas.map((entry: any, index: number) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t">
                                                <div className="text-center">
                                                    <h3 className="text-lg font-bold mb-6 text-gray-700 flex items-center justify-center gap-2">
                                                        <TrendingUp className="text-green-500" /> Eficiência de Meta (≥ 8hs)
                                                    </h3>
                                                    <div id="report-meta" className="flex flex-col items-center bg-white p-4 rounded-xl">
                                                        <PieChart width={350} height={350}>
                                                            <Pie
                                                                data={chartsData.meta}
                                                                cx="50%" cy="50%" innerRadius={90} outerRadius={120} paddingAngle={5} dataKey="value" stroke="none"
                                                            >
                                                                {chartsData.meta.map((entry: any, index: number) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.name === 'Dentro da Meta' ? '#10b981' : '#ef4444'} />
                                                                ))}
                                                                <LabelList
                                                                    dataKey="value"
                                                                    position="outside"
                                                                    offset={20}
                                                                    stroke="none"
                                                                    fill="#64748b"
                                                                    fontSize={12}
                                                                    formatter={(val: number) => `${((val / (chartsData.meta.reduce((a: any, b: any) => a + b.value, 0)) * 100).toFixed(0))}%`}
                                                                />
                                                            </Pie>
                                                            <Tooltip
                                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'white' }}
                                                                itemStyle={{ color: '#374151', fontWeight: 600 }}
                                                            />
                                                        </PieChart>
                                                        <div className="flex gap-6 mt-[-40px]">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                                                <span className="text-sm font-medium text-gray-600">Dentro da Meta</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                                                                <span className="text-sm font-medium text-gray-600">Abaixo da Meta</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="text-lg font-bold mb-6 text-gray-700 flex items-center justify-center gap-2">
                                                        <BarChart3 className="text-purple-500" /> Top 10 MRUs Acima da Meta de 08hs
                                                    </h3>
                                                    <div id="report-topmru" className="h-[350px] w-full bg-white p-4 rounded-xl">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={chartsData.mrus} layout="vertical" margin={{ top: 5, right: 80, left: 40, bottom: 5 }}>
                                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                                                <XAxis type="number" hide />
                                                                <YAxis
                                                                    dataKey="name"
                                                                    type="category"
                                                                    width={80}
                                                                    tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                                                                    axisLine={false}
                                                                    tickLine={false}
                                                                />
                                                                <Tooltip
                                                                    cursor={{ fill: '#f8f9fa' }}
                                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                    formatter={(value: number) => [decimalToTime(value), 'Horas']}
                                                                />
                                                                <Bar dataKey="valor" radius={[0, 6, 6, 0]} barSize={24}>
                                                                    <LabelList dataKey="time" position="right" style={{ fontSize: '11px', fill: '#64748b', fontWeight: 500 }} />
                                                                    {chartsData.mrus.map((entry: any, index: number) => (
                                                                        <Cell key={`cell-${index}`} fill={['#667eea', '#764ba2', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#db2777', '#d97706', '#059669'][index % 10]} />
                                                                    ))}
                                                                </Bar>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'lotes' && (
                                        <motion.div key="lotes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                                            <div>
                                                <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-brand-purple uppercase tracking-tight">
                                                    <BarChart3 /> Total de Horas Líquidas por Lote
                                                </h3>
                                                <div id="report-lote-total" className="h-[400px] w-full bg-white p-4 rounded-xl">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={(chartsData as any).lotes.totais} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                            <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
                                                            <YAxis tick={{ fontSize: 11 }} />
                                                            <Tooltip
                                                                cursor={{ fill: '#f8f9fa' }}
                                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                formatter={((val: number) => [decimalToTime(val), 'Total Horas']) as any}
                                                            />
                                                            <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={35}>
                                                                <LabelList dataKey="time" position="top" style={{ fontSize: '10px', fill: '#475569', fontWeight: 700 }} />
                                                                {((chartsData as any).lotes.totais || []).map((entry: any, index: number) => (
                                                                    <Cell key={`cell-${index}`} fill={['#667eea', '#764ba2', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'][index % 8]} />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            <div className="pt-12 border-t">
                                                <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-indigo-500 uppercase tracking-tight">
                                                    <Clock /> Média de Horas por Lote
                                                </h3>
                                                <div id="report-lote-media" className="h-[400px] w-full bg-white p-4 rounded-xl">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={(chartsData as any).lotes.media} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                            <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
                                                            <YAxis tick={{ fontSize: 11 }} />
                                                            <Tooltip
                                                                cursor={{ fill: '#f8f9fa' }}
                                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                            />
                                                            <Bar name="Média de Horas" dataKey="avg" radius={[6, 6, 0, 0]} barSize={35}>
                                                                <LabelList dataKey="time" position="top" style={{ fontSize: '11px', fill: '#64748b', fontWeight: 700 }} />
                                                                {(chartsData.lotes.media || []).map((_, index) => (
                                                                    <Cell key={`cell-${index}`} fill={['#667eea', '#764ba2', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#6366f1', '#f43f5e'][index % 10]} />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-4 italic text-center">
                                                    * Este gráfico mostra a média de horas produtivas para cada lote.
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'rotas' && (
                                        <motion.div key="rotas" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4">
                                                {/* GRÁFICO: ROTAS DO AGRESTE */}
                                                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 mb-0">
                                                    <h3 className="text-lg font-bold mb-3 text-emerald-500 border-l-4 border-emerald-500 pl-3 uppercase tracking-tight">Média de Horas por Rota - Região Agreste</h3>
                                                    <div id="report-rotas-agreste" className="h-[350px] bg-white p-2 rounded-xl">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={chartsData.agreste} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} interval={0} tick={{ fontSize: 9, fontWeight: 600 }} />
                                                                <YAxis tick={{ fontSize: 11 }} />
                                                                <Tooltip
                                                                    cursor={{ fill: '#f8f9fa' }}
                                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                    formatter={(val: number) => [decimalToTime(val), 'Média Horas']}
                                                                />
                                                                <Bar dataKey="avg" radius={[6, 6, 0, 0]} barSize={30}>
                                                                    <LabelList dataKey="time" position="top" style={{ fontSize: '9px', fill: '#475569', fontWeight: 700 }} />
                                                                    {chartsData.agreste.map((_, index) => (
                                                                        <Cell key={`cell-${index}`} fill={['#10b981', '#059669', '#047857', '#34d399', '#065f46', '#22c55e', '#16a34a', '#15803d', '#14532d', '#4ade80'][index % 10]} />
                                                                    ))}
                                                                </Bar>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>

                                                {/* GRÁFICO: ROTAS DO SERTÃO */}
                                                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 mb-0">
                                                    <h3 className="text-lg font-bold mb-3 text-amber-500 border-l-4 border-amber-500 pl-3 uppercase tracking-tight">Média de Horas por Rota - Região Sertão</h3>
                                                    <div id="report-rotas-sertao" className="h-[350px] bg-white p-2 rounded-xl">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={chartsData.sertao} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} interval={0} tick={{ fontSize: 9, fontWeight: 600 }} />
                                                                <YAxis tick={{ fontSize: 11 }} />
                                                                <Tooltip
                                                                    cursor={{ fill: '#f8f9fa' }}
                                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                    formatter={(val: number) => [decimalToTime(val), 'Média Horas']}
                                                                />
                                                                <Bar dataKey="avg" radius={[6, 6, 0, 0]} barSize={30}>
                                                                    <LabelList dataKey="time" position="top" style={{ fontSize: '9px', fill: '#475569', fontWeight: 700 }} />
                                                                    {chartsData.sertao.map((_, index) => (
                                                                        <Cell key={`cell-${index}`} fill={['#f59e0b', '#d97706', '#b45309', '#fcc137', '#fbbf24', '#78350f', '#f59e0b', '#fb923c', '#ea580c', '#c2410c'][index % 10]} />
                                                                    ))}
                                                                </Bar>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>

                                                {/* REGIONAIS (ABAIXO) */}
                                                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                                    <h3 className="text-lg font-bold mb-3 text-pink-500 border-l-4 border-pink-500 pl-3 uppercase tracking-tight">Média de Horas por Regional</h3>
                                                    <div id="report-regionais" className="h-[300px] bg-white p-2 rounded-xl">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={chartsData.regionais} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} tick={{ fontSize: 9, fontWeight: 600 }} />
                                                                <YAxis tick={{ fontSize: 11 }} />
                                                                <Tooltip
                                                                    cursor={{ fill: '#f8f9fa' }}
                                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                    formatter={(val: number) => [decimalToTime(val), 'Média Horas']}
                                                                />
                                                                <Bar dataKey="avg" radius={[6, 6, 0, 0]} barSize={45}>
                                                                    <LabelList dataKey="time" position="top" style={{ fontSize: '10px', fill: '#475569', fontWeight: 700 }} />
                                                                    {chartsData.regionais.map((_, index) => (
                                                                        <Cell key={`cell-${index}`} fill={['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#6366f1', '#f43f5e'][index % 10]} />
                                                                    ))}
                                                                </Bar>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'colaborador' && (
                                        <motion.div key="colab" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-brand-purple uppercase tracking-tight">
                                                    <Users size={20} /> Média por Colaborador
                                                </h3>
                                                <div id="report-colaboradores" className="h-[600px] bg-white p-4 rounded-xl">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={chartsData.colaboradores} margin={{ top: 20, right: 30, left: 20, bottom: 120 }}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                            <XAxis
                                                                dataKey="name"
                                                                angle={-45}
                                                                textAnchor="end"
                                                                height={120}
                                                                interval={0}
                                                                tick={{ fontSize: 10, fill: '#475569', fontWeight: 500 }}
                                                            />
                                                            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                                                            <Tooltip
                                                                cursor={{ fill: '#f8f9fa' }}
                                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                formatter={(val: number) => [decimalToTime(val), 'Média Horas']}
                                                            />
                                                            <Bar dataKey="avg" radius={[8, 8, 0, 0]} barSize={filteredData.length > 50 ? 15 : 30}>
                                                                <LabelList dataKey="time" position="top" style={{ fontSize: '10px', fill: '#64748b', fontWeight: 600 }} />
                                                                {chartsData.colaboradores.map((_, index) => (
                                                                    <Cell
                                                                        key={`cell-${index}`}
                                                                        fill={['#667eea', '#764ba2', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'][index % 8]}
                                                                    />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'tempo' && (
                                        <motion.div key="tempo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-12">
                                                <div>
                                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-brand-purple">
                                                        <TrendingUp /> Evolução da Média de Horas Líquidas ao Longo do Tempo
                                                    </h3>
                                                    <div id="report-evolucao" className="h-[400px] bg-white p-4 rounded-xl">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <LineChart data={chartsData.evolucao} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                                                <YAxis tick={{ fontSize: 12 }} domain={[0, 'auto']} />
                                                                <Tooltip
                                                                    cursor={{ stroke: '#8b5cf6', strokeWidth: 2 }}
                                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                    formatter={(val: number) => [decimalToTime(val), 'Média Horas']}
                                                                />
                                                                <ReferenceLine y={8} stroke="red" strokeDasharray="3 3" label={{ position: 'top', value: 'Meta 08:00:00', fill: 'red', fontSize: 12 }} />
                                                                <Line
                                                                    type="monotone"
                                                                    dataKey="avg"
                                                                    stroke="#8b5cf6"
                                                                    strokeWidth={4}
                                                                    dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                                                                    activeDot={{ r: 8 }}
                                                                >
                                                                    <LabelList dataKey="time" position="top" offset={10} style={{ fontSize: '11px', fill: '#64748b' }} />
                                                                </Line>
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-700">
                                                        <Clock /> Frequência de Trabalho por Dia e Semana
                                                    </h3>
                                                    <div id="report-frequencia" className="h-[400px] bg-white p-4 rounded-xl">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={chartsData.frequencia} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                                                <XAxis type="number" hide />
                                                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                                                <Tooltip
                                                                    cursor={{ fill: '#f8f9fa' }}
                                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                    formatter={(val: number) => [decimalToTime(val), 'Média Horas']}
                                                                />
                                                                <Bar dataKey="avg" radius={[0, 6, 6, 0]} barSize={40}>
                                                                    <LabelList dataKey="time" position="right" style={{ fontSize: '11px', fill: '#64748b' }} />
                                                                    {chartsData.frequencia.map((_, index) => (
                                                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#764ba2' : '#f59e0b'} />
                                                                    ))}
                                                                </Bar>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'tabela' && (
                                        <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                                <div>
                                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                                        <Database size={20} className="text-brand-purple" />
                                                        Registros Detalhados
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                                                        Total filtrado: {tableDataFiltered.length.toLocaleString()} registros
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                                                    <div className="relative flex-1 md:w-64">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                        <input
                                                            type="text"
                                                            placeholder="Pesquisar registro..."
                                                            value={tableSearch}
                                                            onChange={(e) => {
                                                                setTableSearch(e.target.value);
                                                                setTableLimit(50); // Reset limit on search
                                                            }}
                                                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple outline-none transition-all"
                                                        />
                                                    </div>
                                                    <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition-shadow hover:shadow-lg">
                                                        <Download size={16} /> Exportar Excel
                                                    </button>
                                                    <button onClick={exportMruRelatorio} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-shadow hover:shadow-lg">
                                                        <FileText size={16} /> Relatório MRU
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm transition-all bg-white">
                                                <table className="w-full text-left">
                                                    <thead className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                                        <tr>
                                                            <th className="px-4 py-4 whitespace-nowrap w-[120px]">Data</th>
                                                            <th className="px-4 py-4 whitespace-nowrap min-w-[250px]">Colaborador</th>
                                                            <th className="px-4 py-4 whitespace-nowrap min-w-[150px]">Rota</th>
                                                            <th className="px-4 py-4 whitespace-nowrap min-w-[150px]">Regional</th>
                                                            <th className="px-4 py-4 whitespace-nowrap w-[100px]">MRU</th>
                                                            <th className="px-4 py-4 whitespace-nowrap w-[80px]">Lote</th>
                                                            <th className="px-4 py-4 whitespace-nowrap w-[80px]">Reg.</th>
                                                            <th className="px-4 py-4 whitespace-nowrap w-[110px]">Início (L)</th>
                                                            <th className="px-4 py-4 whitespace-nowrap w-[110px]">Fim (L)</th>
                                                            <th className="px-4 py-4 whitespace-nowrap w-[110px]">Bruto</th>
                                                            <th className="px-4 py-4 whitespace-nowrap w-[110px]">Intervalo</th>
                                                            <th className="px-4 py-4 whitespace-nowrap w-[140px]">Líquido</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {tableDataFiltered.slice(0, tableLimit).map((row, idx) => (
                                                            <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                                                                <td className="px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-600">{row.data_formatada}</td>
                                                                <td className="px-4 py-3 text-sm whitespace-nowrap font-semibold text-gray-700">{row.colaborador}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{row.rota}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{row.regional}</td>
                                                                <td className="px-4 py-3 text-sm font-mono text-brand-purple whitespace-nowrap font-bold">{row.mru}</td>
                                                                <td className="px-4 py-3 text-sm font-bold text-gray-500 whitespace-nowrap">{row.lote}</td>
                                                                <td className="px-4 py-3 text-sm font-bold text-gray-700 whitespace-nowrap">
                                                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px]">{row.registros}</span>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600">{row.hora_inicio}</td>
                                                                <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600">{row.hora_final}</td>
                                                                <td className="px-4 py-3 text-sm whitespace-nowrap font-mono text-gray-500">{row.total_bruto}</td>
                                                                <td className="px-4 py-3 text-sm whitespace-nowrap font-mono text-gray-500">{row.intervalo}</td>
                                                                <td className="px-4 py-3 text-sm whitespace-nowrap">
                                                                    <span className={cn(
                                                                        "px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider",
                                                                        row.horas_liquidas_dec >= 8 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                                                    )}>
                                                                        {row.horas_liquidas}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>

                                                {tableDataFiltered.length === 0 && (
                                                    <div className="py-20 text-center">
                                                        <Search className="mx-auto text-gray-200 mb-4" size={48} />
                                                        <p className="text-gray-400 font-medium">Nenhum registro encontrado.</p>
                                                    </div>
                                                )}

                                                {tableDataFiltered.length > tableLimit && (
                                                    <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-center">
                                                        <button
                                                            onClick={() => setTableLimit(prev => prev + 100)}
                                                            className="px-8 py-3 bg-white text-brand-purple rounded-xl font-bold text-sm hover:bg-brand-purple hover:text-white transition-all border border-brand-purple/20 shadow-sm"
                                                        >
                                                            Carregar mais 100 registros (Total: {tableDataFiltered.length})
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                )
                }

                <AnimatePresence>
                    {showSuccessModal && uploadStats && (
                        <SuccessModal
                            stats={uploadStats}
                            onClose={() => setShowSuccessModal(false)}
                        />
                    )}
                </AnimatePresence>

                <ConfirmModal
                    isOpen={showDeleteModal}
                    title="Apagar Dados?"
                    message="Isso removerá todos os registros importados permanentemente. Esta ação não pode ser desfeita."
                    onConfirm={async () => {
                        await del('dashboard_data');
                        window.location.reload();
                    }}
                    onCancel={() => setShowDeleteModal(false)}
                />

                {/* AREA DE CAPTURA OCULTA PARA RELATÓRIOS (Sempre no DOM) */}
                <div style={{ position: 'fixed', left: '-10000px', top: '0', width: '1600px', backgroundColor: 'white' }}>
                    <div id="capture-faixas" style={{ padding: '60px', background: 'white', width: '1600px' }}>
                        <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '30px', color: '#334155' }}>Distribuição de Horas por Faixa</h3>
                        <div style={{ height: '600px', width: '1400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartsData.faixas} layout="vertical" margin={{ top: 5, right: 100, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 14, fontWeight: 500 }} axisLine={false} tickLine={false} />
                                    <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={30}>
                                        <LabelList dataKey="label" position="right" style={{ fontSize: '14px', fill: '#64748b' }} />
                                        {chartsData.faixas.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div id="capture-meta" style={{ padding: '60px', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '1600px' }}>
                        <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '30px', color: '#334155' }}>Eficiência de Meta (8hs+)</h3>
                        <PieChart width={600} height={400}>
                            <Pie data={chartsData.meta} cx="50%" cy="50%" innerRadius={100} outerRadius={150} paddingAngle={5} dataKey="value" stroke="none">
                                {chartsData.meta.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.name === 'Dentro da Meta' ? '#10b981' : '#ef4444'} />
                                ))}
                                <LabelList dataKey="value" position="outside" offset={20} fill="#64748b" fontSize={16} formatter={(val: number) => `${((val / (chartsData.meta.reduce((a: any, b: any) => a + b.value, 0)) * 100).toFixed(0))}%`} />
                            </Pie>
                        </PieChart>
                    </div>

                    <div id="capture-topmru" style={{ padding: '60px', background: 'white', width: '1600px' }}>
                        <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '30px', color: '#334155' }}>Top 10 MRUs Acima da Meta</h3>
                        <div style={{ height: '600px', width: '1400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartsData.mrus} layout="vertical" margin={{ top: 5, right: 100, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 14, fontWeight: 500 }} axisLine={false} tickLine={false} />
                                    <Bar dataKey="valor" radius={[0, 6, 6, 0]} barSize={30}>
                                        <LabelList dataKey="time" position="right" style={{ fontSize: '14px', fill: '#64748b' }} />
                                        {chartsData.mrus.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={['#667eea', '#764ba2', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#db2777', '#d97706', '#059669'][index % 10]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div id="capture-lote-total" style={{ padding: '60px', background: 'white', width: '2000px' }}>
                        <h3 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '40px', color: '#1e293b', textAlign: 'center' }}>Total de Horas Líquidas por Lote</h3>
                        <div style={{ height: '700px', width: '1900px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={(chartsData as any)?.lotes?.totais || []} margin={{ top: 50, right: 30, left: 30, bottom: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 14, fontWeight: 800, fill: '#334155' }} interval={0} angle={-45} textAnchor="end" height={100} />
                                    <YAxis tick={{ fontSize: 14 }} />
                                    <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={50}>
                                        <LabelList dataKey="time" position="top" style={{ fontSize: '12px', fill: '#475569', fontWeight: 700 }} />
                                        {((chartsData as any).lotes.totais || []).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={['#667eea', '#764ba2', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'][index % 8]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div id="capture-lote-media" style={{ padding: '60px', background: 'white', width: '2000px' }}>
                        <h3 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '40px', color: '#1e293b', textAlign: 'center' }}>Média de Horas por Lote</h3>
                        <div style={{ height: '700px', width: '1900px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={(chartsData as any)?.lotes?.media || []} margin={{ top: 50, right: 30, left: 30, bottom: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 14, fontWeight: 800, fill: '#334155' }} interval={0} angle={-45} textAnchor="end" height={100} />
                                    <YAxis tick={{ fontSize: 14 }} />
                                    <Bar name="Média de Horas" dataKey="avg" radius={[6, 6, 0, 0]} barSize={50}>
                                        <LabelList dataKey="time" position="top" style={{ fontSize: '14px', fill: '#64748b', fontWeight: 700 }} />
                                        {(chartsData.lotes.media || []).map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={['#667eea', '#764ba2', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#6366f1', '#f43f5e'][index % 10]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div id="capture-rotas-agreste" style={{ padding: '60px', background: 'white', width: '1600px' }}>
                        <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '30px', color: '#334155' }}>Médias por Rota - Região Agreste</h3>
                        <div style={{ height: '600px', width: '1500px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartsData.agreste} margin={{ top: 40, right: 20, left: 10, bottom: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={100} tick={{ fontSize: 11, fontWeight: 700 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Bar dataKey="avg" radius={[6, 6, 0, 0]} barSize={25}>
                                        <LabelList dataKey="time" position="top" style={{ fontSize: '10px', fill: '#475569', fontWeight: 700 }} />
                                        {chartsData.agreste.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={['#10b981', '#059669', '#047857', '#34d399', '#065f46', '#22c55e', '#16a34a', '#15803d', '#14532d', '#4ade80'][index % 10]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div id="capture-rotas-sertao" style={{ padding: '60px', background: 'white', width: '1600px' }}>
                        <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '30px', color: '#334155' }}>Médias por Rota - Região Sertão</h3>
                        <div style={{ height: '600px', width: '1500px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartsData.sertao} margin={{ top: 40, right: 20, left: 10, bottom: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={100} tick={{ fontSize: 11, fontWeight: 700 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Bar dataKey="avg" radius={[6, 6, 0, 0]} barSize={25}>
                                        <LabelList dataKey="time" position="top" style={{ fontSize: '10px', fill: '#475569', fontWeight: 700 }} />
                                        {chartsData.sertao.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={['#f59e0b', '#d97706', '#b45309', '#fcc137', '#fbbf24', '#78350f', '#f59e0b', '#fb923c', '#ea580c', '#c2410c'][index % 10]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div id="capture-regionais" style={{ padding: '60px', background: 'white', width: '1600px' }}>
                        <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '30px', color: '#334155' }}>Média de Horas por Regional</h3>
                        <div style={{ height: '600px', width: '1400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartsData.regionais} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 14, fontWeight: 700 }} interval={0} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Bar dataKey="avg" radius={[6, 6, 0, 0]} barSize={60}>
                                        <LabelList dataKey="time" position="top" style={{ fontSize: '12px', fill: '#475569', fontWeight: 700 }} />
                                        {chartsData.regionais.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#6366f1', '#f43f5e'][index % 10]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div id="capture-colaboradores" style={{ padding: '80px', background: 'white', width: '1800px' }}>
                        <h3 style={{ fontSize: '42px', fontWeight: 'bold', marginBottom: '50px', color: '#1e293b', textAlign: 'center' }}>Média de Horas por Colaborador</h3>
                        <div style={{ height: '1000px', width: '1700px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartsData.colaboradores} margin={{ top: 80, right: 40, left: 40, bottom: 250 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={250} interval={0} tick={{ fontSize: 22, fontWeight: 700, fill: '#1e293b' }} />
                                    <YAxis tick={{ fontSize: 20 }} />
                                    <Bar dataKey="avg" radius={[12, 12, 0, 0]} barSize={60}>
                                        <LabelList dataKey="time" position="top" offset={20} style={{ fontSize: '20px', fill: '#1e293b', fontWeight: 800 }} />
                                        {chartsData.colaboradores.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={['#667eea', '#764ba2', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'][index % 8]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div id="capture-evolucao" style={{ padding: '40px', background: 'white' }}>
                        <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Evolução da Média de Horas</h3>
                        <div style={{ height: '500px', width: '1100px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartsData.evolucao} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 14 }} />
                                    <YAxis tick={{ fontSize: 14 }} />
                                    <ReferenceLine y={8} stroke="red" strokeDasharray="3 3" label={{ position: 'top', value: 'Meta 08:00:00', fill: 'red' }} />
                                    <Line type="monotone" dataKey="avg" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 6, fill: '#8b5cf6' }}>
                                        <LabelList dataKey="time" position="top" offset={15} style={{ fontSize: '12px', fill: '#64748b' }} />
                                    </Line>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div id="capture-frequencia" style={{ padding: '40px', background: 'white' }}>
                        <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Frequência de Trabalho (Dia/Semana)</h3>
                        <div style={{ height: '500px', width: '1100px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartsData.frequencia} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 14 }} />
                                    <Bar dataKey="avg" radius={[0, 6, 6, 0]} barSize={40}>
                                        <LabelList dataKey="time" position="right" style={{ fontSize: '14px', fill: '#64748b' }} />
                                        {chartsData.frequencia.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#764ba2' : '#f59e0b'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
}
