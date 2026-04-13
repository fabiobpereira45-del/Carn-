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

const SCHOOL_CLASSES = [
  "G2", "G3", "G3 - Matutino", "G4", "G5", "G5 - Matutino", "1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano"
];

const INITIAL_STUDENTS: Student[] = [
  { id: "s1", name: "CECÍLIA SANTANA SANTOS", class: "G3 - Matutino" },
  { id: "s2", name: "ZOE SANTANA GONÇALVES", class: "G3 - Matutino" },
  { id: "s3", name: "THAEL BRENO SANTOS SILVA", class: "G4" },
  { id: "s4", name: "AGATHA SOFIA DE MORAES GUNDIM", class: "G4" },
  { id: "s5", name: "LORENA DA SILVA DE JESUS", class: "G5 - Matutino" },
  { id: "s6", name: "APOLO DE JESUS DOS SANTOS RIOS", class: "G5 - Matutino" },
  { id: "s7", name: "BERNARDO MUNIZ BARRETO PEREIRA", class: "G5 - Matutino" },
  { id: "s8", name: "MIGUEL BARRETO DE JESUS", class: "G5 - Matutino" },
  { id: "s9", name: "RODRIGO SODRÉ DOS SANTOS", class: "G5 - Matutino" },
  { id: "s10", name: "KENNEDY LUIZ DE JESUS SANTOS", class: "1º Ano" },
  { id: "s11", name: "ELISA MENEZES ANDRADE", class: "1º Ano" },
  { id: "s12", name: "SOPHIA LUIZ DE JESUS SANTOS", class: "1º Ano" },
  { id: "s13", name: "ELOÁH CARVALHO DOS SANTOS DE JESUS", class: "1º Ano" },
  { id: "s14", name: "JOSÉ NETO DE JESUS LOPES", class: "1º Ano" },
  { id: "s15", name: "ÍCARO FARIAS BRITO", class: "1º Ano" },
  { id: "s16", name: "MARIA LUIZA ROCHA SOUZA", class: "1º Ano" },
  { id: "s17", name: "TARCIELE SANTANA DA SILVA", class: "1º Ano" },
  { id: "s18", name: "THEO SANTOS SILVA", class: "2º Ano" },
  { id: "s19", name: "RUAN GABRIEL FARIAS DANTAS", class: "2º Ano" },
  { id: "s20", name: "ALICE BARRETO CONCEIÇÃO DOS SANTOS", class: "2º Ano" },
  { id: "s21", name: "TYLER QUADROS LIMA", class: "2º Ano" },
  { id: "s22", name: "RYAN VICTOR SANTOS MOURA", class: "2º Ano" },
  { id: "s23", name: "SOPHIA RAFELLY FERREIRA DE BARROS", class: "2º Ano" },
  { id: "s24", name: "ARTHUR BENJAMIM PASCOAL ALMEIDA", class: "2º Ano" },
  { id: "s25", name: "HELOÍSA FAGUNDES DE SANTANA", class: "4º Ano" },
  { id: "s26", name: "CECÍLIA M. SOUZA GUERREIRO", class: "4º Ano" },
  { id: "s27", name: "LAÍS RODRIGUES DAMASCENO", class: "4º Ano" },
  { id: "s28", name: "HANNA LUIZ DOS SANTOS PEREIRA", class: "4º Ano" },
  { id: "s29", name: "PEDRO HENRIQUE ANDRADE DE MELO", class: "4º Ano" },
  { id: "s30", name: "RAVI DOS SANTOS SOARES", class: "4º Ano" },
  { id: "s31", name: "PEDRO DAMASCENO COSTA", class: "4º Ano" },
  { id: "s32", name: "NICOLLE DE OLIVEIRA FREITAS", class: "5º Ano" },
  { id: "s33", name: "GUILHERME DOS SANTOS SILVA", class: "5º Ano" },
  { id: "s34", name: "MARIA ESTHER DA SILVA SANTOS", class: "5º Ano" },
  { id: "s35", name: "KAUÊ BARRETO REIS", class: "5º Ano" },
  { id: "s36", name: "HADASSA NEVES PINHO SILVA", class: "5º Ano" },
  { id: "s37", name: "BRUNO BENTO SANTOS BRASILEIRO", class: "5º Ano" },
  { id: "s38", name: "GABRIEL VICTOR PAIXÃO FAGUNDES VIEIRA", class: "5º Ano" },
  { id: "s39", name: "LEVI ROCHA LINS", class: "5º Ano" },
  { id: "s40", name: "RENAN RUAS PINTO DOS SANTOS", class: "5º Ano" },
  { id: "s41", name: "EVELLIN VITÓRIA DE ALMEIDA XAVIER", class: "5º Ano" },
  { id: "s42", name: "KEIZZY KEIRA SILVA DE JESUS", class: "5º Ano" },
  { id: "s43", name: "AGATHE SOPHIA SOUZA DOS SANTOS", class: "5º Ano" },
  { id: "s44", name: "DAVI OLIVEIRA DOS SANTOS", class: "5º Ano" },
  { id: "s45", name: "THAÍS IVANILDE TAVARES DOS SANTOS", class: "5º Ano" },
  { id: "s46", name: "ANTHONY SANTOS SOUZA", class: "5º Ano" }
];

interface Student {
  id: string;
  name: string;
  class: string;
}

// --- Components ---

const Via = ({ school, studentName, responsavelName, value, monthName, year, installmentNum, totalInstallments, dueDay, isCanhoto }: any) => (
  <div className={`p-1 flex flex-row h-full w-full ${isCanhoto ? 'w-[50mm] border-r-2 border-dashed border-gray-300 pr-1' : 'flex-1 pl-3'}`}>
    <div className="border border-gray-400 rounded-xl p-3 h-full w-full flex flex-col justify-between bg-white relative overflow-hidden">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          {school.logoUrl && !isCanhoto && (
            <img src={school.logoUrl} alt="Logo" className="h-6 w-6 object-contain" />
          )}
          <div>
            <h2 className="font-black text-[10px] uppercase leading-tight text-gray-900">{school.name || 'Instituição'}</h2>
            {!isCanhoto && <p className="text-[7px] text-gray-500 font-medium uppercase">{school.subtitle || 'Educação'}</p>}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[7px] text-gray-400 uppercase font-bold">{isCanhoto ? 'Escola' : 'Aluno'}</span>
          <div className="bg-gray-950 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">
            {installmentNum}/{totalInstallments}
          </div>
        </div>
      </div>
      
      <div className="space-y-1.5 text-[10px] text-gray-800 flex-1 flex flex-col justify-center">
        <div className="flex items-end gap-1">
          <span className="font-bold text-gray-500 uppercase text-[7px]">Aluno:</span>
          <span className="flex-1 border-b border-gray-200 font-bold text-gray-900 text-[10px] truncate">
            {studentName}
          </span>
        </div>

        <div className="flex items-end gap-1">
          <span className="font-bold text-gray-500 uppercase text-[7px]">Grupo:</span>
          <span className="flex-1 border-b border-gray-200 font-bold text-gray-900 text-[10px] truncate">
            {responsavelName}
          </span>
        </div>
        
        <div className="flex flex-row items-end justify-between gap-2 overflow-hidden">
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-gray-500 uppercase text-[7px] truncate">Valor:</span>
            <span className="font-black text-gray-900 text-[10px] truncate">
              {value ? `R$ ${value}` : ''}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-gray-500 uppercase text-[7px] truncate">Referência:</span>
            <span className="font-bold text-gray-900 text-[9px] truncate">
              {monthName.substring(0,3)}/{year}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-gray-500 uppercase text-[7px] truncate">Vencimento:</span>
            <span className="font-black text-red-600 text-[10px] truncate">
              {dueDay}/{installmentNum.toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between mt-1 pt-1 border-t border-gray-100">
        <div className="flex flex-col">
           <span className="font-bold text-gray-500 uppercase text-[6px]">Pagamento: ____/____/____</span>
        </div>
        {!isCanhoto && (
          <div className="flex flex-col items-end w-1/3">
            <div className="border-b border-gray-300 w-full mb-0.5"></div>
            <span className="font-bold text-gray-400 uppercase text-[6px]">Assinatura</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const CoverSheet = ({ school, studentName, responsavelName, year }: any) => {
  const pixPayload = generatePixPayload('71988628791', school.name || 'INSTITUICAO');

  return (
    <div className="flex w-full h-full items-center justify-between p-1 bg-white">
      <div className="border-2 border-brand-900 rounded-2xl w-full h-full flex flex-row items-center p-4 relative overflow-hidden bg-white gap-6">
        <div className="absolute top-0 left-0 w-2 h-full bg-brand-600"></div>
        
        {/* Left: Logo & Title */}
        <div className="flex flex-col items-center justify-center gap-2 w-[30%] border-r border-gray-100 pr-4">
          {school.logoUrl ? (
             <img src={school.logoUrl} alt="Logo" className="h-14 object-contain" />
          ) : (
            <div className="h-12 w-12 bg-brand-50 border border-brand-200 border-dashed flex items-center justify-center rounded-2xl text-brand-400">
              <School className="w-8 h-8" />
            </div>
          )}
          <div className="text-center">
            <h1 className="text-sm font-black text-brand-900 uppercase leading-tight">{school.name || 'NOME DA ESCOLA'}</h1>
          </div>
        </div>
        
        {/* Middle: Info */}
        <div className="flex-1 space-y-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Carnê de Pagamento</span>
            <span className="text-lg font-black text-gray-900 leading-none">ANO LETIVO {year}</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex flex-col border-l-2 border-brand-200 pl-3">
              <span className="text-[8px] font-bold text-gray-400 uppercase">Aluno(a)</span>
              <span className="font-bold text-gray-900 text-sm uppercase">{studentName || '__________________'}</span>
            </div>
            
            <div className="flex flex-col border-l-2 border-brand-200 pl-3">
              <span className="text-[8px] font-bold text-gray-400 uppercase">Grupo/ano</span>
              <span className="font-bold text-gray-900 text-sm uppercase">{responsavelName || '__________________'}</span>
            </div>
          </div>
        </div>

        {/* Right: Pix Payment */}
        <div className="w-[28%] flex flex-col items-center justify-center gap-1.5 p-3 bg-brand-50 rounded-2xl border border-brand-100">
          <span className="text-[7px] font-black text-brand-900 uppercase text-center leading-tight">
            Pague via PIX
          </span>
          <div className="bg-white p-1 rounded-lg border border-brand-200">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixPayload)}`} 
              alt="Pix QR Code" 
              className="w-16 h-16"
            />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[6px] font-bold text-gray-400 uppercase">Chave Pix:</span>
            <span className="text-[9px] font-black text-brand-700">71988628791</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'config' | 'school' | 'students'>('config');
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('enrolled_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });
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
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('enrolled_students', JSON.stringify(students));
  }, [students]);

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

  const addStudent = (name: string, studentClass: string) => {
    if (!name || !studentClass) return;
    const newStudent: Student = {
      id: Date.now().toString(),
      name: name.toUpperCase(),
      class: studentClass
    };
    setStudents(prev => [...prev, newStudent]);
  };

  const removeStudent = (id: string) => {
    if (confirm("Deseja remover este aluno?")) {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  const selectStudent = (student: Student) => {
    setConfig(prev => ({
      ...prev,
      studentName: student.name,
      responsavelName: student.class
    }));
    setStudentSearchTerm('');
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
               onClick={() => setActiveTab('students')}
               className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold text-sm ${activeTab === 'students' ? 'bg-brand-50 text-brand-600 border border-brand-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <User className="w-4 h-4" />
              Alunos
            </button>
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
                      <div className="col-span-2 relative">
                        <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5 flex items-center gap-1.5 ml-1">
                          <User className="w-3 h-3" /> Buscar Aluno Matriculado
                        </label>
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Digite o nome para buscar..."
                            value={studentSearchTerm}
                            onChange={e => setStudentSearchTerm(e.target.value)}
                            className="w-full bg-blue-50/50 border border-brand-100 rounded-2xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-bold"
                          />
                          <AnimatePresence>
                            {studentSearchTerm && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto"
                              >
                                {students.filter(s => s.name.toLowerCase().includes(studentSearchTerm.toLowerCase())).length > 0 ? (
                                  students.filter(s => s.name.toLowerCase().includes(studentSearchTerm.toLowerCase())).map(student => (
                                    <button
                                      key={student.id}
                                      onClick={() => selectStudent(student)}
                                      className="w-full text-left px-4 py-3 hover:bg-brand-50 border-b border-gray-50 last:border-0 transition-colors"
                                    >
                                      <div className="font-bold text-gray-900 text-sm">{student.name}</div>
                                      <div className="text-[10px] text-brand-600 font-bold uppercase">{student.class}</div>
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-4 py-3 text-xs text-gray-400 italic">Nenhum aluno encontrado</div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5 flex items-center gap-1.5 ml-1">
                          <User className="w-3 h-3" /> Nome no Carnê
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
                ) : activeTab === 'students' ? (
                  <motion.div 
                    key="students"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-6"
                  >
                    <div className="bg-brand-50 p-6 rounded-2xl border border-brand-100">
                      <h4 className="text-xs font-black text-brand-900 uppercase mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Nova Matrícula
                      </h4>
                      <div className="space-y-4">
                        <input 
                          type="text" 
                          id="new-student-name"
                          placeholder="Nome Completo do Aluno"
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-bold"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const nameInput = document.getElementById('new-student-name') as HTMLInputElement;
                              const classInput = document.getElementById('new-student-class') as HTMLSelectElement;
                              addStudent(nameInput.value, classInput.value);
                              nameInput.value = '';
                            }
                          }}
                        />
                        <div className="flex gap-3">
                          <select 
                            id="new-student-class"
                            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-bold"
                          >
                            <option value="">Selecione a Classe</option>
                            {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <button 
                            onClick={() => {
                              const nameInput = document.getElementById('new-student-name') as HTMLInputElement;
                              const classInput = document.getElementById('new-student-class') as HTMLSelectElement;
                              if (nameInput.value && classInput.value) {
                                addStudent(nameInput.value, classInput.value);
                                nameInput.value = '';
                                classInput.value = '';
                              } else {
                                alert("Preencha nome e classe.");
                              }
                            }}
                            className="bg-brand-600 text-white px-6 rounded-xl font-bold hover:bg-brand-700 transition-colors"
                          >
                            Matricular
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alunos Matriculados ({students.length})</h4>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {students.length === 0 ? (
                           <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs italic">
                             Nenhum aluno matriculado ainda.
                           </div>
                        ) : (
                          students.map(student => (
                            <div key={student.id} className="bg-white border border-gray-100 p-3 rounded-xl flex items-center justify-between group hover:border-brand-200 transition-all shadow-sm">
                              <div>
                                <div className="font-bold text-gray-900 text-sm">{student.name}</div>
                                <div className="text-[10px] text-brand-600 font-bold uppercase">{student.class}</div>
                              </div>
                              <button 
                                onClick={() => removeStudent(student.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors p-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
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
                    Use papel <strong>A4</strong> em orientação <strong>Retrato</strong> (Portrait).
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-white/20 w-4 h-4 rounded-full flex items-center justify-center text-[8px] mt-0.5">2</span>
                    Ajuste as margens para <strong>Mínimas</strong> ou <strong>Nulas</strong>.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-white/20 w-4 h-4 rounded-full flex items-center justify-center text-[8px] mt-0.5">3</span>
                    O sistema imprime <strong>4 parcelas por página</strong>.
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
              <span className="bg-brand-100 text-brand-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight">A4 Portrait (4 units/page)</span>
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

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            background: white !important;
          }
          .print-hidden {
            display: none !important;
          }
          .print-break-after-page {
            page-break-after: always;
          }
          .print-break-inside-avoid {
            page-break-inside: avoid;
          }
        }
        
        /* Print Layout Helpers */
        .carne-container {
          width: 210mm;
          margin: 0 auto;
          background: white;
        }
        .carne-strip {
          height: 74.25mm;
          width: 210mm;
          overflow: hidden;
          box-sizing: border-box;
          border-bottom: 1px dashed #eee;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ddd;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ccc;
        }
      `}} />

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

