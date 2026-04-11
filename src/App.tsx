import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Settings2, 
  CreditCard, 
  School, 
  User, 
  Calendar, 
  Trash2, 
  Plus, 
  Scissors, 
  CheckCircle2, 
  Download,
  Info,
  LayoutDashboard,
  Layers,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


// --- Pix Helpers ---
function crc16(data: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;
  for (let i = 0; i < data.length; i++) {
    crc ^= (data.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function generatePixPayload(key: string, name: string, city: string = 'SAO PAULO'): string {
  const cleanKey = key.replace(/\D/g, '');
  const cleanName = name.substring(0, 25).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z ]/g, "");
  const cleanCity = city.substring(0, 15).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z ]/g, "");

  const formatIdentifier = '000201';
  const gui = 'br.gov.bcb.pix';
  const guiField = `00${gui.length.toString().padStart(2, '0')}${gui}`;
  const keyField = `01${cleanKey.length.toString().padStart(2, '0')}${cleanKey}`;
  const merchantAccountInfo = `26${(guiField.length + keyField.length).toString().padStart(2, '0')}${guiField}${keyField}`;
  const merchantCategoryCode = '52040000';
  const transactionCurrency = '5303986';
  const countryCode = '5802BR';
  const merchantNameField = `59${cleanName.length.toString().padStart(2, '0')}${cleanName}`;
  const merchantCityField = `60${cleanCity.length.toString().padStart(2, '0')}${cleanCity}`;
  const additionalDataField = '62070503***';
  
  const payloadWithoutCRC = `${formatIdentifier}${merchantAccountInfo}${merchantCategoryCode}${transactionCurrency}${countryCode}${merchantNameField}${merchantCityField}${additionalDataField}6304`;
  return `${payloadWithoutCRC}${crc16(payloadWithoutCRC)}`;
}

// --- Types ---
interface SchoolData {
  name: string;
  subtitle: string;
  address: string;
  cnpj: string;
  logoUrl: string | null;
}

interface InstallmentConfig {
  studentName: string;
  responsavelName: string;
  value: string;
  startMonth: number; // 0-11
  startYear: number;
  totalInstallments: number;
  dueDay: string;
}

interface BatchCoverItem {
  id: string;
  studentName: string;
  responsavelName: string;
  year: number;
}

// --- Constants ---
const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// --- Components ---

const Via = ({ school, studentName, responsavelName, value, monthName, year, installmentNum, totalInstallments, dueDay, isCanhoto }: any) => (
  <div className={`flex-1 p-2 flex flex-col h-full ${isCanhoto ? 'pr-3 border-r-2 border-dashed border-gray-300' : 'pl-3'}`}>
    <div className="border border-gray-400 rounded-xl p-4 h-full flex flex-col justify-between bg-white relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gray-50 -mr-8 -mt-8 rotate-45 z-0" />
      
      <div className="flex items-start justify-between mb-3 z-10">
        <div className="flex items-center gap-3">
          {school.logoUrl && (
            <img src={school.logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
          )}
          <div>
            <h2 className="font-black text-[13px] uppercase leading-tight text-gray-900">{school.name || 'Nome da Instituição'}</h2>
            <p className="text-[9px] text-gray-500 font-medium uppercase tracking-tight">{school.subtitle || 'Educação de Qualidade'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[8px] text-gray-400 uppercase font-bold tracking-widest mb-1">
            {isCanhoto ? 'Via da Escola' : 'Via do Aluno'}
          </span>
          <div className="bg-gray-950 text-white px-2 py-0.5 rounded text-[10px] font-bold">
            {installmentNum.toString().padStart(2, '0')}/{totalInstallments.toString().padStart(2, '0')}
          </div>
        </div>
      </div>
      
      <div className="space-y-2.5 text-[11px] text-gray-800 flex-1 flex flex-col justify-center z-10">
        <div className="flex items-end gap-2">
          <span className="whitespace-nowrap font-bold text-gray-500 uppercase text-[9px]">Aluno(a):</span>
          <span className="flex-1 border-b border-gray-300 font-bold text-gray-900 text-[12px] pb-0.5 min-h-[18px]">
            {studentName}
          </span>
        </div>

        <div className="flex items-end gap-2">
          <span className="whitespace-nowrap font-bold text-gray-500 uppercase text-[9px]">Grupo/ano:</span>
          <span className="flex-1 border-b border-gray-300 font-bold text-gray-900 text-[12px] pb-0.5 min-h-[18px]">
            {responsavelName}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-bold text-gray-500 uppercase text-[8px]">Valor R$:</span>
            <span className="border-b border-gray-300 font-black text-gray-900 text-[13px] pb-0.5 min-h-[20px]">
              {value ? `R$ ${value}` : ''}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-gray-500 uppercase text-[8px]">Referência:</span>
            <span className="border-b border-gray-300 font-bold text-gray-900 text-[12px] pb-0.5 min-h-[20px]">
              {monthName} / {year}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-gray-500 uppercase text-[8px]">Vencimento:</span>
            <span className="border-b border-gray-300 font-black text-red-600 text-[13px] pb-0.5 min-h-[20px]">
              {dueDay} / {installmentNum.toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between mt-2 pt-2 border-t border-gray-100">
          <div className="flex flex-col gap-1">
             <span className="font-bold text-gray-500 uppercase text-[8px]">Pagamento:</span>
             <div className="text-gray-300 tracking-tighter text-[10px]">____/____/____</div>
          </div>
          <div className="flex flex-col items-end w-1/2 gap-1">
            <div className="border-b border-gray-400 w-full mb-1"></div>
            <span className="font-bold text-gray-400 uppercase text-[8px]">Assinatura Autorizada</span>
          </div>
        </div>
      </div>

      {school.address && (
        <div className="mt-2 text-[7px] text-gray-400 text-center italic border-t border-gray-50 pt-1">
          {school.address} {school.cnpj ? `| CNPJ: ${school.cnpj}` : ''}
        </div>
      )}
    </div>
  </div>
);

const CoverSheet = ({ school, studentName, responsavelName, year }: any) => {
  const pixPayload = generatePixPayload('71988628791', school.name || 'INSTITUICAO');

  return (
    <div className="flex w-full h-full items-center justify-between p-4 print:p-0">
      <div className="border-2 border-brand-900 rounded-2xl w-full h-full flex flex-row items-center p-3 md:p-5 relative overflow-hidden bg-white gap-4 shadow-inner">
        <div className="absolute top-0 left-0 w-2 h-full bg-brand-600"></div>
        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-brand-50 rounded-full opacity-50"></div>
        
        {/* Left: Logo & Title */}
        <div className="flex flex-col items-center justify-center gap-1.5 w-[35%] z-10 border-r border-gray-100 pr-4">
          {school.logoUrl ? (
            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-50">
               <img src={school.logoUrl} alt="Logo" className="h-10 md:h-12 object-contain" />
            </div>
          ) : (
            <div className="h-12 w-12 bg-brand-50 border border-brand-200 border-dashed flex items-center justify-center rounded-2xl text-brand-400 text-xs shrink-0">
              <School className="w-6 h-6" />
            </div>
          )}
          <div className="text-center">
            <h1 className="text-sm md:text-base font-black text-brand-900 uppercase tracking-tight leading-tight">{school.name || 'NOME DA ESCOLA'}</h1>
            <h2 className="text-[7px] text-gray-500 uppercase tracking-[0.1em] font-semibold">{school.subtitle || 'Educação e Transformação'}</h2>
          </div>
        </div>
        
        {/* Middle: Info */}
        <div className="flex-1 space-y-2 z-10 py-1">
          <div className="flex flex-col">
            <span className="text-[7px] font-bold text-brand-600 uppercase tracking-widest leading-none mb-0.5">Carnê de Pagamento</span>
            <span className="text-sm font-black text-gray-900 leading-none">ANO LETIVO {year}</span>
          </div>
          
          <div className="grid grid-cols-1 gap-1.5 pt-1">
            <div className="flex flex-col border-l border-brand-200 pl-2">
              <span className="text-[7px] font-bold text-gray-400 uppercase leading-none mb-0.5">Aluno(a)</span>
              <span className="font-bold text-gray-900 text-[11px] uppercase truncate">{studentName || '__________________'}</span>
            </div>
            
            <div className="flex flex-col border-l border-brand-200 pl-2">
              <span className="text-[7px] font-bold text-gray-400 uppercase leading-none mb-0.5">Grupo/ano</span>
              <span className="font-bold text-gray-900 text-[11px] uppercase truncate">{responsavelName || '__________________'}</span>
            </div>
          </div>
  
          <div className="pt-1.5 flex items-center justify-between border-t border-gray-50 mt-1">
            <div className="text-[7px] text-gray-400 w-full leading-tight truncate">
              {school.address} {school.cnpj ? `| CNPJ: ${school.cnpj}` : ''}
            </div>
          </div>
        </div>

        {/* Right: Pix Payment */}
        <div className="w-[25%] flex flex-col items-center justify-center gap-1.5 p-2 bg-brand-50 rounded-2xl border border-brand-100 z-10">
          <span className="text-[6px] font-black text-brand-900 uppercase tracking-tighter text-center leading-tight">
            Pagamentos em PIX<br/>até dia 10 pague com desconto
          </span>
          <div className="bg-white p-1 rounded-lg shadow-sm border border-brand-200">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pixPayload)}`} 
              alt="Pix QR Code" 
              className="w-12 h-12"
            />
          </div>
          <span className="text-[5px] font-bold text-gray-400 uppercase tracking-widest">Copia e Cola</span>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'config' | 'school'>('config');
  const [school, setSchool] = useState<SchoolData>(() => {
    const saved = localStorage.getItem('school_data');
    return saved ? JSON.parse(saved) : {
      name: '',
      subtitle: '',
      address: '',
      cnpj: '',
      logoUrl: null
    };
  });

  const [config, setConfig] = useState<InstallmentConfig>(() => {
    const saved = localStorage.getItem('carnê_config');
    const now = new Date();
    return saved ? JSON.parse(saved) : {
      studentName: '',
      responsavelName: '',
      value: '',
      startMonth: 0,
      startYear: now.getFullYear(),
      totalInstallments: 12,
      dueDay: '10'
    };
  });

  const [isPrinting, setIsPrinting] = useState(false);
  const [includeCover, setIncludeCover] = useState(false);
  const [isBatchPrinting, setIsBatchPrinting] = useState(false);
  const [batchCovers, setBatchCovers] = useState<BatchCoverItem[]>(() => {
    const saved = localStorage.getItem('batch_covers');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('school_data', JSON.stringify(school));
  }, [school]);

  useEffect(() => {
    localStorage.setItem('carnê_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('batch_covers', JSON.stringify(batchCovers));
  }, [batchCovers]);

  // --- Handlers ---
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Imagem muito grande! Máximo 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSchool(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getInstallments = () => {
    const installments = [];
    for (let i = 0; i < config.totalInstallments; i++) {
       const monthIdx = (config.startMonth + i) % 12;
       const yearOffset = Math.floor((config.startMonth + i) / 12);
       installments.push({
         monthName: months[monthIdx],
         year: config.startYear + yearOffset,
         num: i + 1
       });
    }
    return installments;
  };

  const handlePrint = () => {
    window.print();
  };

  const resetAll = () => {
    if (confirm("Deseja limpar todos os dados do carnê e da escola?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const addToBatch = () => {
    if (!config.studentName) {
      alert("Por favor, preencha o nome do aluno.");
      return;
    }
    const newItem: BatchCoverItem = {
      id: Date.now().toString(),
      studentName: config.studentName,
      responsavelName: config.responsavelName,
      year: config.startYear
    };
    setBatchCovers(prev => [...prev, newItem]);
    alert("Capa adicionada à fila com sucesso!");
  };

  const removeFromBatch = (id: string) => {
    setBatchCovers(prev => prev.filter(item => item.id !== id));
  };

  const clearBatch = () => {
    if (confirm("Deseja limpar toda a fila de capas?")) {
      setBatchCovers([]);
    }
  };

  const handlePrintBatch = () => {
    if (batchCovers.length === 0) {
      alert("A fila de capas está vazia.");
      return;
    }
    setIsBatchPrinting(true);
    setTimeout(() => {
      window.print();
      setIsBatchPrinting(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-brand-50 font-sans print:bg-white print:p-0 selection:bg-brand-100">
      
      {/* Header / Nav - Hidden when printing */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 print-hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-200">
               <CreditCard className="text-white w-6 h-6" />
            </div>
            <div>
              <span className="font-black text-gray-900 text-lg leading-none block uppercase">Carnê Pro</span>
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Premium Edition</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrintBatch}
              className="bg-white text-brand-600 border border-brand-200 px-4 py-2.5 rounded-xl hover:bg-brand-50 active:scale-95 transition-all flex items-center gap-2 font-bold text-sm"
            >
              <Layers className="w-4 h-4" />
              Capas em Lote ({batchCovers.length})
            </button>
            <button 
              onClick={handlePrint}
              className="bg-brand-600 text-white px-6 py-2.5 rounded-xl hover:bg-brand-700 active:scale-95 transition-all flex items-center gap-2 font-bold shadow-xl shadow-brand-100 text-sm"
            >
              <Printer className="w-4 h-4" />
              Imprimir Carnê
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto pt-24 pb-12 px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 print:p-0 print:pt-0">
        
        {/* Left Column: Editor */}
        <div className="lg:col-span-5 space-y-8 print-hidden">
          
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100">
              <button 
                onClick={() => setActiveTab('config')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${activeTab === 'config' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/30' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Settings2 className="w-4 h-4" />
                Dados do Carnê
              </button>
              <button 
                onClick={() => setActiveTab('school')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${activeTab === 'school' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/30' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <School className="w-4 h-4" />
                Instituição
              </button>
            </div>

            <div className="p-6 md:p-8">
              <AnimatePresence mode="wait">
                {activeTab === 'config' ? (
                  <motion.div 
                    key="config"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5 flex items-center gap-1.5 ml-1">
                          <User className="w-3 h-3" /> Aluno(a)
                        </label>
                        <input 
                          type="text" 
                          placeholder="Nome completo do aluno"
                          value={config.studentName}
                          onChange={e => setConfig({...config, studentName: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5 flex items-center gap-1.5 ml-1">
                          <User className="w-3 h-3" /> Grupo/ano
                        </label>
                        <input 
                          type="text" 
                          placeholder="Grupo ou ano (ex: 1º Ano A)"
                          value={config.responsavelName}
                          onChange={e => setConfig({...config, responsavelName: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5 flex items-center gap-1.5 ml-1">
                          <CreditCard className="w-3 h-3" /> Valor Mensal
                        </label>
                        <input 
                          type="text" 
                          placeholder="000,00"
                          value={config.value}
                          onChange={e => setConfig({...config, value: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5 flex items-center gap-1.5 ml-1">
                          <Calendar className="w-3 h-3" /> Dia Vcto
                        </label>
                        <input 
                          type="text" 
                          placeholder="10"
                          value={config.dueDay}
                          onChange={e => setConfig({...config, dueDay: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-bold"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-50 grid grid-cols-2 gap-4">
                       <div>
                        <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5 ml-1">Início (Mês)</label>
                        <select 
                          value={config.startMonth}
                          onChange={e => setConfig({...config, startMonth: parseInt(e.target.value)})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                        >
                          {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5 ml-1">Parcelas</label>
                        <input 
                          type="number" 
                          min="1"
                          max="48"
                          value={config.totalInstallments}
                          onChange={e => setConfig({...config, totalInstallments: parseInt(e.target.value) || 0})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 gap-4">
                      <div className="flex gap-4">
                        <button 
                          onClick={resetAll}
                          className="text-[10px] font-black uppercase text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Limpar
                        </button>
                        <button 
                          onClick={addToBatch}
                          className="text-[10px] font-black uppercase text-brand-600 hover:text-brand-800 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Fila de Capas
                        </button>
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium italic">Auto-save ativo</div>
                    </div>

                    {batchCovers.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             <Layers className="w-3 h-3" /> Fila de Capas ({batchCovers.length})
                          </h4>
                          <button onClick={clearBatch} className="text-[9px] font-bold text-red-400 hover:text-red-600">Limpar Fila</button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {batchCovers.map(item => (
                            <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100 group">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-gray-900 truncate max-w-[180px]">{item.studentName}</span>
                                <span className="text-[9px] text-gray-500">{item.responsavelName}</span>
                              </div>
                              <button onClick={() => removeFromBatch(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="school"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5 ml-1">Nome da Instituição</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Escola Primeiras Descobertas"
                        value={school.name}
                        onChange={e => setSchool({...school, name: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5 ml-1">Subtítulo / Slogan</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Educação Infantil ao 5º ano"
                        value={school.subtitle}
                        onChange={e => setSchool({...school, subtitle: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5 ml-1">Endereço / Contato</label>
                      <textarea 
                        rows={2}
                        placeholder="Endereço completo, telefone ou email"
                        value={school.address}
                        onChange={e => setSchool({...school, address: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-brand-500 font-medium text-sm"
                      />
                    </div>
                    
                    <div className="pt-4 border-t border-gray-50">
                       <label className="text-[11px] font-black text-gray-400 uppercase mb-3 ml-1 block">Logotipo</label>
                       <div className="flex items-center gap-4">
                         {school.logoUrl ? (
                           <div className="relative group">
                              <div className="w-20 h-20 bg-white border border-gray-100 shadow-sm rounded-2xl p-2 flex items-center justify-center overflow-hidden">
                                <img src={school.logoUrl} alt="Preview" className="max-h-full object-contain" />
                              </div>
                              <button 
                                onClick={() => setSchool({...school, logoUrl: null})}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                           </div>
                         ) : (
                           <label className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors text-gray-400">
                             <Plus className="w-5 h-5 mb-1" />
                             <span className="text-[8px] font-black uppercase">Upload</span>
                             <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                           </label>
                         )}
                         <div className="text-[10px] text-gray-400 max-w-[150px]">
                           Recomendamos logotipos com fundo transparente (PNG) e até 2MB.
                         </div>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-brand-900 rounded-3xl p-6 text-white shadow-2xl shadow-brand-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-16 -mt-16 rounded-full" />
            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-2.5 rounded-xl">
                 <Info className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm mb-2">Instruções de Impressão</h4>
                <ul className="text-[11px] text-brand-100 space-y-2 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="bg-white/20 w-4 h-4 rounded-full flex items-center justify-center text-[8px] mt-0.5">1</span>
                    Use papel <strong>A4</strong> em orientação <strong>Paisagem</strong> (Horizontal).
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-white/20 w-4 h-4 rounded-full flex items-center justify-center text-[8px] mt-0.5">2</span>
                    Ajuste as margens para <strong>Mínimas</strong> ou <strong>Nulas</strong>.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-white/20 w-4 h-4 rounded-full flex items-center justify-center text-[8px] mt-0.5">3</span>
                    Habilite a opção <strong>"Gráficos de segundo plano"</strong> se as cores não aparecerem.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-7 print:col-span-12 print:p-0">
          <div className="flex items-center justify-between mb-4 print-hidden">
            <h3 className="font-black text-gray-400 uppercase text-xs tracking-widest flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" /> Live Preview
            </h3>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={includeCover} 
                  onChange={e => setIncludeCover(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-[10px] font-bold text-gray-500 group-hover:text-brand-600 transition-colors uppercase tracking-widest">Incluir Capa</span>
              </label>
              <span className="bg-brand-100 text-brand-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight">A4 Landscape Match</span>
            </div>
          </div>

          {/* This wrapper scales the large A4 content to fit the screen visually */}
          <div className="relative group lg:sticky lg:top-24">
            <div className="w-full bg-white rounded-[2rem] shadow-2xl shadow-gray-200 overflow-hidden border border-gray-100 print:shadow-none print:m-0 print:border-0 print:rounded-none">
              <div className="overflow-auto max-h-[80vh] lg:max-h-[calc(100vh-10rem)] p-4 md:p-8 bg-gray-200/50 print:p-0 print:bg-white print:max-h-none print:overflow-visible">
                
                {/* Real A4 Size Container */}
                <div className="mx-auto w-full print:w-full space-y-0.5 bg-white shadow-sm print:shadow-none">
                  
                  {isBatchPrinting ? (
                    /* Batch Printing View */
                    <div className="grid grid-cols-1 gap-0.5 w-full">
                      {batchCovers.map((item, idx) => (
                        <div key={item.id} className={`h-[52mm] w-full border-b border-gray-100 box-border flex items-center justify-center ${ (idx + 1) % 4 === 0 ? 'print-break-after-page' : '' }`}>
                          <CoverSheet 
                            school={school} 
                            studentName={item.studentName} 
                            responsavelName={item.responsavelName} 
                            year={item.year} 
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Normal Carnê View */
                    <>
                      {/* Capa */}
                      {includeCover && (
                        <div className="h-[52mm] w-full border-b-2 border-brand-100 box-border print-break-after-page bg-white flex items-center justify-center">
                          <CoverSheet 
                            school={school} 
                            studentName={config.studentName} 
                            responsavelName={config.responsavelName} 
                            year={config.startYear} 
                          />
                        </div>
                      )}
                      
                      {/* Parcelas */}
                      {getInstallments().map((inst, index) => (
                        <div key={index} className="h-[48mm] w-full border-b border-gray-200 box-border print-break-inside-avoid bg-white flex relative group/item">
                          <Via 
                            school={school}
                            studentName={config.studentName} 
                            responsavelName={config.responsavelName} 
                            value={config.value} 
                            monthName={inst.monthName} 
                            year={inst.year}
                            installmentNum={inst.num}
                            totalInstallments={config.totalInstallments}
                            dueDay={config.dueDay}
                            isCanhoto={true} 
                          />
                          
                          <div className="relative flex flex-col justify-center items-center w-0 z-10 print-hidden">
                             <div className="border-l border-brand-500/20 h-full absolute"></div>
                             <div className="bg-brand-50 p-1 rounded-full absolute -ml-[9px] text-brand-300">
                               <Scissors className="w-2 h-2" />
                             </div>
                          </div>

                          <Via 
                            school={school}
                            studentName={config.studentName} 
                            responsavelName={config.responsavelName} 
                            value={config.value} 
                            monthName={inst.monthName} 
                            year={inst.year}
                            installmentNum={inst.num}
                            totalInstallments={config.totalInstallments}
                            dueDay={config.dueDay}
                            isCanhoto={false} 
                          />
                          
                          {/* Interaction overlay in preview only */}
                          <div className="absolute inset-0 bg-brand-500/0 hover:bg-brand-500/5 transition-colors cursor-default z-0 pointer-events-none print:hidden" />
                        </div>
                      ))}
                    </>
                  )}
                </div>

              </div>
              
              <div className="absolute top-4 right-4 print-hidden opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/80 backdrop-blur text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400" /> Vista de Impressão Ativa
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding - Hidden when printing */}
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-gray-200 print-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 grayscale opacity-40">
             <CreditCard className="w-5 h-5" />
             <span className="font-bold text-sm tracking-tighter">CARNÊ PRO</span>
          </div>
          <div className="text-[10px] text-gray-400 font-medium">
            © {new Date().getFullYear()} Desenvolvido para Instituições de Ensino. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-4">
             <button className="text-gray-400 hover:text-brand-600 transition-colors">
               <Download className="w-5 h-5" />
             </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

