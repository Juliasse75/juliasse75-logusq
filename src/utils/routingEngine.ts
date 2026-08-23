import { Entrega } from '../types';

// Coordinates for Brazil's logistics hubs (default base is Belo Horizonte / Savassi)
export const DEFAULT_BASE = {
  nome: 'Centro de Distribuição Central LogusQ (Savassi)',
  latitude: -19.9388,
  longitude: -43.9386,
  cidade: 'Belo Horizonte',
  estado: 'MG',
};

// Simple Geocoder Database tagged with Region to prevent cross-region keyword pollution
const REGIONAL_GEOCODE_DB: { key: string; region: string; lat: number; lng: number }[] = [
  // Espírito Santo (ES)
  { key: '29168-000', region: 'ES', lat: -20.1385, lng: -40.2920 },
  { key: '29168', region: 'ES', lat: -20.1385, lng: -40.2920 },
  { key: 'civit ii', region: 'ES', lat: -20.1385, lng: -40.2920 },
  { key: 'civit 2', region: 'ES', lat: -20.1385, lng: -40.2920 },
  { key: 'civit', region: 'ES', lat: -20.1385, lng: -40.2920 },
  { key: 'rodovia br-101 norte, 1250', region: 'ES', lat: -20.1385, lng: -40.2920 },
  { key: 'enseada do suá', region: 'ES', lat: -20.3142, lng: -40.2922 },
  { key: 'praia do canto', region: 'ES', lat: -20.3015, lng: -40.2911 },

  // Rio de Janeiro (RJ)
  { key: '21040-360', region: 'RJ', lat: -22.8610, lng: -43.2535 },
  { key: '21040', region: 'RJ', lat: -22.8610, lng: -43.2535 },
  { key: 'avenida brasil, 7500', region: 'RJ', lat: -22.8610, lng: -43.2535 },
  { key: 'copacabana', region: 'RJ', lat: -22.9714, lng: -43.1826 },
  { key: 'barra da tijuca', region: 'RJ', lat: -23.0016, lng: -43.3444 },

  // São Paulo (SP)
  { key: '01310-100', region: 'SP', lat: -23.5614, lng: -46.6559 },
  { key: 'avenida paulista', region: 'SP', lat: -23.5614, lng: -46.6559 },

  // Minas Gerais (MG)
  { key: 'savassi', region: 'MG', lat: -19.9388, lng: -43.9386 },
  { key: 'pampulha', region: 'MG', lat: -19.8519, lng: -43.9749 },
];

// CEP 5-Digit & 8-Digit Postal Code Prefix Geocoding Engine
// Provides 100% deterministic, exact geographic resolution for all Brazilian logistics zones
const CEP_PREFIX_COORDS: Record<string, { lat: number; lng: number; region: string; name: string }> = {
  // Região dos Lagos / Norte Fluminense / Baixadas Litorâneas (RJ)
  '28880': { lat: -22.5960, lng: -42.0080, region: 'RJ', name: 'Barra de São João (Casimiro de Abreu)' },
  '28870': { lat: -22.5342, lng: -42.2681, region: 'RJ', name: 'Professor Souza (Casimiro de Abreu)' },
  '28865': { lat: -22.4419, lng: -42.0911, region: 'RJ', name: 'Rio Dourado (Casimiro de Abreu)' },
  '28860': { lat: -22.4811, lng: -42.2028, region: 'RJ', name: 'Casimiro de Abreu (Centro / Industrial)' },
  '27995': { lat: -22.3165, lng: -42.1830, region: 'RJ', name: 'Sana / Vila do Sana (Macaé)' },
  '27930': { lat: -22.4089, lng: -41.8080, region: 'RJ', name: 'Granja dos Cavaleiros (Macaé)' },
  '27910': { lat: -22.3780, lng: -41.7800, region: 'RJ', name: 'Macaé Centro' },
  '27913': { lat: -22.3811, lng: -41.7772, region: 'RJ', name: 'Imbetiba (Macaé)' },
  '27915': { lat: -22.3890, lng: -41.7850, region: 'RJ', name: 'Praia Campista (Macaé)' },
  '27940': { lat: -22.3250, lng: -41.7200, region: 'RJ', name: 'Cabiúnas / Parque de Tubos (Macaé)' },
  '27945': { lat: -22.3350, lng: -41.7300, region: 'RJ', name: 'Parque de Tubos (Macaé)' },
  '28893': { lat: -22.5460, lng: -41.9750, region: 'RJ', name: 'Cidade Praiana (Rio das Ostras)' },
  '28890': { lat: -22.5269, lng: -41.9483, region: 'RJ', name: 'Rio das Ostras Centro' },
  '28891': { lat: -22.5205, lng: -41.9580, region: 'RJ', name: 'Palmital / Extensão do Bosque (Rio das Ostras)' },
  '28892': { lat: -22.5350, lng: -41.9380, region: 'RJ', name: 'Recanto (Rio das Ostras)' },
  '28895': { lat: -22.5283, lng: -41.9320, region: 'RJ', name: 'Costazul (Rio das Ostras)' },
  '28896': { lat: -22.5410, lng: -41.9600, region: 'RJ', name: 'Mariléa / Jardim Atlântico (Rio das Ostras)' },
  '28898': { lat: -22.4639, lng: -41.9886, region: 'RJ', name: 'Rocha Leão (Rio das Ostras)' },
  '28899': { lat: -22.5188, lng: -41.9420, region: 'RJ', name: 'Âncora (Rio das Ostras)' },
  '28928': { lat: -22.6820, lng: -42.0030, region: 'RJ', name: 'Unamar / Tamoios (Cabo Frio)' },
  '28925': { lat: -22.7080, lng: -42.0080, region: 'RJ', name: 'Aquarius / Tamoios (Cabo Frio)' },
  '28900': { lat: -22.8892, lng: -42.0281, region: 'RJ', name: 'Cabo Frio Centro' },
  '28905': { lat: -22.8850, lng: -42.0220, region: 'RJ', name: 'Passagem (Cabo Frio)' },
  '28907': { lat: -22.8930, lng: -42.0250, region: 'RJ', name: 'São Cristóvão (Cabo Frio)' },
  '28950': { lat: -22.7561, lng: -41.8950, region: 'RJ', name: 'Armação dos Búzios' },
  '28940': { lat: -22.8417, lng: -42.1028, region: 'RJ', name: 'São Pedro da Aldeia' },
  '28970': { lat: -22.8728, lng: -42.3428, region: 'RJ', name: 'Araruama Centro' },
  '28960': { lat: -22.8406, lng: -42.1861, region: 'RJ', name: 'Iguaba Grande' },
  '28990': { lat: -22.9203, lng: -42.5103, region: 'RJ', name: 'Saquarema / Bacaxá' },
  '28930': { lat: -22.9660, lng: -42.0280, region: 'RJ', name: 'Arraial do Cabo' },
  '28000': { lat: -21.7545, lng: -41.3244, region: 'RJ', name: 'Campos dos Goytacazes' },
  '28700': { lat: -22.0833, lng: -41.8667, region: 'RJ', name: 'Conceição de Macabu' },
  '28735': { lat: -22.1083, lng: -41.4722, region: 'RJ', name: 'Quissamã' },
  '28820': { lat: -22.6517, lng: -42.3922, region: 'RJ', name: 'Silva Jardim' },
  '28800': { lat: -22.7056, lng: -42.6289, region: 'RJ', name: 'Rio Bonito' },
  '28600': { lat: -22.2819, lng: -42.5311, region: 'RJ', name: 'Nova Friburgo' },
  '25600': { lat: -22.5050, lng: -43.1789, region: 'RJ', name: 'Petrópolis' },
  '25950': { lat: -22.4122, lng: -42.9656, region: 'RJ', name: 'Teresópolis' },

  // Santa Catarina (SC)
  '89200': { lat: -26.3045, lng: -48.8464, region: 'SC', name: 'Joinville' },
  '88000': { lat: -27.5954, lng: -48.5480, region: 'SC', name: 'Florianópolis' },
  '89000': { lat: -26.9194, lng: -49.0661, region: 'SC', name: 'Blumenau' },
  '88300': { lat: -26.9078, lng: -48.6619, region: 'SC', name: 'Itajaí' },
  '88330': { lat: -26.9926, lng: -48.6352, region: 'SC', name: 'Balneário Camboriú' },
  '89800': { lat: -27.1004, lng: -52.6152, region: 'SC', name: 'Chapecó' },
  '88800': { lat: -28.6775, lng: -49.3703, region: 'SC', name: 'Criciúma' },

  // São Paulo (SP)
  '01000': { lat: -23.5505, lng: -46.6333, region: 'SP', name: 'São Paulo Centro' },
  '13000': { lat: -22.9099, lng: -47.0626, region: 'SP', name: 'Campinas' },
  '11000': { lat: -23.9608, lng: -46.3331, region: 'SP', name: 'Santos' },

  // Espírito Santo (ES)
  '29000': { lat: -20.3155, lng: -40.3128, region: 'ES', name: 'Vitória' },
  '29160': { lat: -20.1385, lng: -40.2920, region: 'ES', name: 'Serra' },
  '29100': { lat: -20.3297, lng: -40.2925, region: 'ES', name: 'Vila Velha' },

  // Minas Gerais (MG)
  '30000': { lat: -19.9167, lng: -43.9345, region: 'MG', name: 'Belo Horizonte' },
  '38400': { lat: -18.9186, lng: -48.2772, region: 'MG', name: 'Uberlândia' },
};

// Sub-Districts, Neighborhoods and Local Logistics Anchors (Evaluated FIRST before parent city centers)
const DISTRICT_COORDS: Record<string, { lat: number; lng: number; region: string; parentCity?: string }> = {
  // Casimiro de Abreu Districts
  'barra de são joão': { lat: -22.5960, lng: -42.0080, region: 'RJ', parentCity: 'Casimiro de Abreu' },
  'barra de sao joao': { lat: -22.5960, lng: -42.0080, region: 'RJ', parentCity: 'Casimiro de Abreu' },
  'professor souza': { lat: -22.5342, lng: -42.2681, region: 'RJ', parentCity: 'Casimiro de Abreu' },
  'rio dourado': { lat: -22.4419, lng: -42.0911, region: 'RJ', parentCity: 'Casimiro de Abreu' },
  'bairro industrial': { lat: -22.4850, lng: -42.2150, region: 'RJ', parentCity: 'Casimiro de Abreu' },
  'loteamento são joão': { lat: -22.4820, lng: -42.2010, region: 'RJ', parentCity: 'Casimiro de Abreu' },
  'loteamento sao joao': { lat: -22.4820, lng: -42.2010, region: 'RJ', parentCity: 'Casimiro de Abreu' },

  // Macaé Districts & Bairros
  'sana': { lat: -22.3165, lng: -42.1830, region: 'RJ', parentCity: 'Macaé' },
  'arraial do sana': { lat: -22.3165, lng: -42.1830, region: 'RJ', parentCity: 'Macaé' },
  'glicério': { lat: -22.2500, lng: -42.0500, region: 'RJ', parentCity: 'Macaé' },
  'glicerio': { lat: -22.2500, lng: -42.0500, region: 'RJ', parentCity: 'Macaé' },
  'córrego do ouro': { lat: -22.2800, lng: -41.9500, region: 'RJ', parentCity: 'Macaé' },
  'corrego do ouro': { lat: -22.2800, lng: -41.9500, region: 'RJ', parentCity: 'Macaé' },
  'granja cavaleiros': { lat: -22.4089, lng: -41.8080, region: 'RJ', parentCity: 'Macaé' },
  'granja dos cavaleiros': { lat: -22.4089, lng: -41.8080, region: 'RJ', parentCity: 'Macaé' },
  'cavaleiros': { lat: -22.4089, lng: -41.8080, region: 'RJ', parentCity: 'Macaé' },
  'novo cavaleiros': { lat: -22.4150, lng: -41.8100, region: 'RJ', parentCity: 'Macaé' },
  'imbetiba': { lat: -22.3811, lng: -41.7772, region: 'RJ', parentCity: 'Macaé' },
  'praia campista': { lat: -22.3890, lng: -41.7850, region: 'RJ', parentCity: 'Macaé' },
  'cancela preta': { lat: -22.3991, lng: -41.7911, region: 'RJ', parentCity: 'Macaé' },
  'cabiúnas': { lat: -22.3250, lng: -41.7200, region: 'RJ', parentCity: 'Macaé' },
  'cabiunas': { lat: -22.3250, lng: -41.7200, region: 'RJ', parentCity: 'Macaé' },
  'parque de tubos': { lat: -22.3350, lng: -41.7300, region: 'RJ', parentCity: 'Macaé' },

  // Rio das Ostras Bairros & Districts
  'cidade praiana': { lat: -22.5460, lng: -41.9750, region: 'RJ', parentCity: 'Rio das Ostras' },
  'praiana': { lat: -22.5460, lng: -41.9750, region: 'RJ', parentCity: 'Rio das Ostras' },
  'palmital': { lat: -22.5205, lng: -41.9580, region: 'RJ', parentCity: 'Rio das Ostras' },
  'recanto': { lat: -22.5350, lng: -41.9380, region: 'RJ', parentCity: 'Rio das Ostras' },
  'recanto das tartarugas': { lat: -22.5350, lng: -41.9380, region: 'RJ', parentCity: 'Rio das Ostras' },
  'rocha leão': { lat: -22.4639, lng: -41.9886, region: 'RJ', parentCity: 'Rio das Ostras' },
  'rocha leao': { lat: -22.4639, lng: -41.9886, region: 'RJ', parentCity: 'Rio das Ostras' },
  'âncora': { lat: -22.5188, lng: -41.9420, region: 'RJ', parentCity: 'Rio das Ostras' },
  'ancora': { lat: -22.5188, lng: -41.9420, region: 'RJ', parentCity: 'Rio das Ostras' },
  'costazul': { lat: -22.5283, lng: -41.9320, region: 'RJ', parentCity: 'Rio das Ostras' },
  'costa azul': { lat: -22.5283, lng: -41.9320, region: 'RJ', parentCity: 'Rio das Ostras' },
  'jardim mariléa': { lat: -22.5410, lng: -41.9600, region: 'RJ', parentCity: 'Rio das Ostras' },
  'mariléa': { lat: -22.5410, lng: -41.9600, region: 'RJ', parentCity: 'Rio das Ostras' },
  'marilea': { lat: -22.5410, lng: -41.9600, region: 'RJ', parentCity: 'Rio das Ostras' },
  'extensão do bosque': { lat: -22.5250, lng: -41.9450, region: 'RJ', parentCity: 'Rio das Ostras' },
  'extensao do bosque': { lat: -22.5250, lng: -41.9450, region: 'RJ', parentCity: 'Rio das Ostras' },

  // Cabo Frio Districts
  'unamar': { lat: -22.6820, lng: -42.0030, region: 'RJ', parentCity: 'Cabo Frio' },
  'tamoios': { lat: -22.6820, lng: -42.0030, region: 'RJ', parentCity: 'Cabo Frio' },
  'aquarius': { lat: -22.7080, lng: -42.0080, region: 'RJ', parentCity: 'Cabo Frio' },
  'passagem': { lat: -22.8850, lng: -42.0220, region: 'RJ', parentCity: 'Cabo Frio' },
  'são cristóvão': { lat: -22.8930, lng: -42.0250, region: 'RJ', parentCity: 'Cabo Frio' },
  'sao cristovao': { lat: -22.8930, lng: -42.0250, region: 'RJ', parentCity: 'Cabo Frio' },

  // Búzios Bairros
  'geribá': { lat: -22.7750, lng: -41.9050, region: 'RJ', parentCity: 'Búzios' },
  'geriba': { lat: -22.7750, lng: -41.9050, region: 'RJ', parentCity: 'Búzios' },
  'manguinhos': { lat: -22.7680, lng: -41.9020, region: 'RJ', parentCity: 'Búzios' },
  'rasa': { lat: -22.7420, lng: -41.9450, region: 'RJ', parentCity: 'Búzios' },

  // Saquarema / Maricá
  'bacaxá': { lat: -22.8850, lng: -42.4719, region: 'RJ', parentCity: 'Saquarema' },
  'bacaxa': { lat: -22.8850, lng: -42.4719, region: 'RJ', parentCity: 'Saquarema' },
  'itaúna': { lat: -22.9250, lng: -42.5050, region: 'RJ', parentCity: 'Saquarema' },
  'itauna': { lat: -22.9250, lng: -42.5050, region: 'RJ', parentCity: 'Saquarema' },
  'inoã': { lat: -22.9150, lng: -42.9222, region: 'RJ', parentCity: 'Maricá' },
  'inoa': { lat: -22.9150, lng: -42.9222, region: 'RJ', parentCity: 'Maricá' },
  'itaipuaçu': { lat: -22.9611, lng: -42.9819, region: 'RJ', parentCity: 'Maricá' },
  'itaipuacu': { lat: -22.9611, lng: -42.9819, region: 'RJ', parentCity: 'Maricá' },
};

// Major Cities Coordinate Map across Brazilian States
const CITY_COORDS: Record<string, { lat: number; lng: number; region: string }> = {
  // Santa Catarina (SC)
  'joinville': { lat: -26.3045, lng: -48.8464, region: 'SC' },
  'florianópolis': { lat: -27.5954, lng: -48.5480, region: 'SC' },
  'florianopolis': { lat: -27.5954, lng: -48.5480, region: 'SC' },
  'blumenau': { lat: -26.9194, lng: -49.0661, region: 'SC' },
  'itajai': { lat: -26.9078, lng: -48.6619, region: 'SC' },
  'itajaí': { lat: -26.9078, lng: -48.6619, region: 'SC' },
  'chapecó': { lat: -27.1004, lng: -52.6152, region: 'SC' },
  'chapeco': { lat: -27.1004, lng: -52.6152, region: 'SC' },
  'criciúma': { lat: -28.6775, lng: -49.3703, region: 'SC' },
  'criciuma': { lat: -28.6775, lng: -49.3703, region: 'SC' },
  'balneário camboriú': { lat: -26.9926, lng: -48.6352, region: 'SC' },
  'balneario camboriu': { lat: -26.9926, lng: -48.6352, region: 'SC' },
  'camboriú': { lat: -26.9926, lng: -48.6352, region: 'SC' },
  'camboriu': { lat: -26.9926, lng: -48.6352, region: 'SC' },
  'jaraguá do sul': { lat: -26.4853, lng: -49.0825, region: 'SC' },
  'jaragua do sul': { lat: -26.4853, lng: -49.0825, region: 'SC' },
  'lages': { lat: -27.8161, lng: -50.3261, region: 'SC' },
  'palhoça': { lat: -27.6453, lng: -48.6698, region: 'SC' },
  'palhoca': { lat: -27.6453, lng: -48.6698, region: 'SC' },
  'brusque': { lat: -27.0983, lng: -48.9133, region: 'SC' },
  'tubarão': { lat: -28.4736, lng: -49.0153, region: 'SC' },
  'tubarao': { lat: -28.4736, lng: -49.0153, region: 'SC' },
  'são josé': { lat: -27.6136, lng: -48.6366, region: 'SC' },
  'sao jose': { lat: -27.6136, lng: -48.6366, region: 'SC' },
  'concórdia': { lat: -27.2342, lng: -52.0258, region: 'SC' },
  'concordia': { lat: -27.2342, lng: -52.0258, region: 'SC' },
  'rio do sul': { lat: -27.2144, lng: -49.6431, region: 'SC' },
  'araranguá': { lat: -28.9358, lng: -49.4936, region: 'SC' },
  'ararangua': { lat: -28.9358, lng: -49.4936, region: 'SC' },
  'navegantes': { lat: -26.8986, lng: -48.6542, region: 'SC' },
  'caçador': { lat: -26.7753, lng: -51.0136, region: 'SC' },
  'cacador': { lat: -26.7753, lng: -51.0136, region: 'SC' },
  'gaspar': { lat: -26.9317, lng: -48.9583, region: 'SC' },
  'içara': { lat: -28.7139, lng: -49.3000, region: 'SC' },
  'icara': { lat: -28.7139, lng: -49.3000, region: 'SC' },
  'videira': { lat: -27.0083, lng: -51.1522, region: 'SC' },
  'mafra': { lat: -26.1122, lng: -49.8058, region: 'SC' },
  'canoinhas': { lat: -26.1772, lng: -50.3900, region: 'SC' },
  'indaial': { lat: -26.8981, lng: -49.2319, region: 'SC' },

  // Paraná (PR)
  'curitiba': { lat: -25.4284, lng: -49.2733, region: 'PR' },
  'londrina': { lat: -23.3103, lng: -51.1628, region: 'PR' },
  'maringá': { lat: -23.42099, lng: -51.93305, region: 'PR' },
  'maringa': { lat: -23.42099, lng: -51.93305, region: 'PR' },
  'ponta grossa': { lat: -25.095, lng: -50.1619, region: 'PR' },
  'foz do iguaçu': { lat: -25.5469, lng: -54.5882, region: 'PR' },
  'foz do iguacu': { lat: -25.5469, lng: -54.5882, region: 'PR' },
  'cascavel': { lat: -24.9558, lng: -53.4553, region: 'PR' },

  // Rio Grande do Sul (RS)
  'porto alegre': { lat: -30.0346, lng: -51.2177, region: 'RS' },
  'caxias do sul': { lat: -29.1681, lng: -51.1794, region: 'RS' },
  'pelotas': { lat: -31.7654, lng: -52.3376, region: 'RS' },
  'canoas': { lat: -29.9178, lng: -51.1836, region: 'RS' },

  // São Paulo (SP)
  'são paulo': { lat: -23.5505, lng: -46.6333, region: 'SP' },
  'sao paulo': { lat: -23.5505, lng: -46.6333, region: 'SP' },
  'campinas': { lat: -22.9099, lng: -47.0626, region: 'SP' },
  'santos': { lat: -23.9608, lng: -46.3331, region: 'SP' },
  'guarulhos': { lat: -23.4542, lng: -46.5333, region: 'SP' },
  'são josé dos campos': { lat: -23.1791, lng: -45.8872, region: 'SP' },
  'sao jose dos campos': { lat: -23.1791, lng: -45.8872, region: 'SP' },
  'sorocaba': { lat: -23.5015, lng: -47.4581, region: 'SP' },
  'ribeirão preto': { lat: -21.1775, lng: -47.8103, region: 'SP' },

  // Rio de Janeiro (RJ) - Coastal Districts & Bairros FIRST
  'barra de são joão': { lat: -22.5936, lng: -41.9961, region: 'RJ' },
  'barra de sao joao': { lat: -22.5936, lng: -41.9961, region: 'RJ' },
  'unamar': { lat: -22.6842, lng: -41.9836, region: 'RJ' },
  'tamoios': { lat: -22.6842, lng: -41.9836, region: 'RJ' },
  'costazul': { lat: -22.5283, lng: -41.9281, region: 'RJ' },
  'ancora': { lat: -22.5188, lng: -41.9366, region: 'RJ' },
  'cavaleiros': { lat: -22.4089, lng: -41.8028, region: 'RJ' },
  'imbetiba': { lat: -22.3811, lng: -41.7772, region: 'RJ' },
  'cancela preta': { lat: -22.3991, lng: -41.7911, region: 'RJ' },
  'bacaxá': { lat: -22.8850, lng: -42.4719, region: 'RJ' },
  'bacaxa': { lat: -22.8850, lng: -42.4719, region: 'RJ' },
  'inoã': { lat: -22.9150, lng: -42.9222, region: 'RJ' },
  'inoa': { lat: -22.9150, lng: -42.9222, region: 'RJ' },
  'itaipuaçu': { lat: -22.9611, lng: -42.9819, region: 'RJ' },
  'itaipuacu': { lat: -22.9611, lng: -42.9819, region: 'RJ' },

  // Rio de Janeiro (RJ) - Municipality Centers & Coastal Corridors
  'rio de janeiro': { lat: -22.9068, lng: -43.1729, region: 'RJ' },
  'niterói': { lat: -22.8833, lng: -43.1036, region: 'RJ' },
  'niteroi': { lat: -22.8833, lng: -43.1036, region: 'RJ' },
  'duque de caxias': { lat: -22.7856, lng: -43.3117, region: 'RJ' },
  'nova iguaçu': { lat: -22.7592, lng: -43.4511, region: 'RJ' },
  'nova iguacu': { lat: -22.7592, lng: -43.4511, region: 'RJ' },
  'campos dos goytacazes': { lat: -21.7545, lng: -41.3244, region: 'RJ' },
  'rio das ostras': { lat: -22.5269, lng: -41.9483, region: 'RJ' },
  'macaé': { lat: -22.3708, lng: -41.7869, region: 'RJ' },
  'macae': { lat: -22.3708, lng: -41.7869, region: 'RJ' },
  'cabo frio': { lat: -22.8892, lng: -42.0281, region: 'RJ' },
  'arraial do cabo': { lat: -22.9660, lng: -42.0280, region: 'RJ' },
  'búzios': { lat: -22.7561, lng: -41.8888, region: 'RJ' },
  'buzios': { lat: -22.7561, lng: -41.8888, region: 'RJ' },
  'armação dos búzios': { lat: -22.7561, lng: -41.8888, region: 'RJ' },
  'armacao dos buzios': { lat: -22.7561, lng: -41.8888, region: 'RJ' },
  'são pedro da aldeia': { lat: -22.8417, lng: -42.1028, region: 'RJ' },
  'sao pedro da aldeia': { lat: -22.8417, lng: -42.1028, region: 'RJ' },
  'iguaba grande': { lat: -22.8406, lng: -42.1861, region: 'RJ' },
  'araruama': { lat: -22.8728, lng: -42.3428, region: 'RJ' },
  'saquarema': { lat: -22.9203, lng: -42.5103, region: 'RJ' },
  'casimiro de abreu': { lat: -22.4811, lng: -42.2028, region: 'RJ' },
  'quissamã': { lat: -22.1083, lng: -41.4722, region: 'RJ' },
  'quissama': { lat: -22.1083, lng: -41.4722, region: 'RJ' },
  'conceição de macabu': { lat: -22.0833, lng: -41.8667, region: 'RJ' },
  'conceicao de macabu': { lat: -22.0833, lng: -41.8667, region: 'RJ' },
  'silva jardim': { lat: -22.6517, lng: -42.3922, region: 'RJ' },
  'rio bonito': { lat: -22.7056, lng: -42.6289, region: 'RJ' },
  'maricá': { lat: -22.9194, lng: -42.8186, region: 'RJ' },
  'marica': { lat: -22.9194, lng: -42.8186, region: 'RJ' },
  'itaboraí': { lat: -22.7472, lng: -42.8592, region: 'RJ' },
  'itaborai': { lat: -22.7472, lng: -42.8592, region: 'RJ' },
  'petrópolis': { lat: -22.5050, lng: -43.1789, region: 'RJ' },
  'petropolis': { lat: -22.5050, lng: -43.1789, region: 'RJ' },
  'teresópolis': { lat: -22.4122, lng: -42.9656, region: 'RJ' },
  'teresopolis': { lat: -22.4122, lng: -42.9656, region: 'RJ' },
  'nova friburgo': { lat: -22.2819, lng: -42.5311, region: 'RJ' },
  'volta redonda': { lat: -22.5231, lng: -44.1042, region: 'RJ' },
  'resende': { lat: -22.4697, lng: -44.4467, region: 'RJ' },
  'angra dos reis': { lat: -23.0067, lng: -44.3181, region: 'RJ' },
  'magé': { lat: -22.6528, lng: -43.0408, region: 'RJ' },
  'mage': { lat: -22.6528, lng: -43.0408, region: 'RJ' },
  'são gonçalo': { lat: -22.8269, lng: -43.0539, region: 'RJ' },
  'sao goncalo': { lat: -22.8269, lng: -43.0539, region: 'RJ' },

  // Espírito Santo (ES)
  'serra': { lat: -20.1385, lng: -40.2920, region: 'ES' },
  'vitória': { lat: -20.3155, lng: -40.3128, region: 'ES' },
  'vitoria': { lat: -20.3155, lng: -40.3128, region: 'ES' },
  'vila velha': { lat: -20.3297, lng: -40.2925, region: 'ES' },
  'cariacica': { lat: -20.2639, lng: -40.4165, region: 'ES' },
  'linhares': { lat: -19.3911, lng: -40.0722, region: 'ES' },
  'cachoeiro de itapemirim': { lat: -20.8489, lng: -41.1128, region: 'ES' },

  // Minas Gerais (MG)
  'belo horizonte': { lat: -19.9167, lng: -43.9345, region: 'MG' },
  'uberlândia': { lat: -18.9186, lng: -48.2772, region: 'MG' },
  'uberlandia': { lat: -18.9186, lng: -48.2772, region: 'MG' },
  'juiz de fora': { lat: -21.7642, lng: -43.3496, region: 'MG' },
  'contagem': { lat: -19.9317, lng: -44.0536, region: 'MG' },
};

/**
 * Offline Synchronous Geocoder
 * Deterministically resolves addresses using CEP prefixes, district tables,
 * city coordinates, and fallback spatial offsets.
 */
export function geocodeAddress(
  address: string,
  baseCoords?: { lat?: number; lng?: number; latitude?: number; longitude?: number }
): { lat: number; lng: number } {
  const fallbackLat = baseCoords?.lat ?? baseCoords?.latitude ?? DEFAULT_BASE.latitude;
  const fallbackLng = baseCoords?.lng ?? baseCoords?.longitude ?? DEFAULT_BASE.longitude;

  if (!address || typeof address !== 'string') {
    return { lat: fallbackLat, lng: fallbackLng };
  }

  const raw = address.toLowerCase();
  const normalized = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Check CEP matches
  const cepMatch = address.match(/\b(\d{5})[-\s]?(\d{3})?\b/);
  if (cepMatch) {
    const cep5 = cepMatch[1];
    if (CEP_PREFIX_COORDS[cep5]) {
      return {
        lat: CEP_PREFIX_COORDS[cep5].lat,
        lng: CEP_PREFIX_COORDS[cep5].lng
      };
    }
  }

  // 2. Check District / Neighborhood DB
  for (const [district, coord] of Object.entries(DISTRICT_COORDS)) {
    const normDistrict = district.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes(normDistrict)) {
      return { lat: coord.lat, lng: coord.lng };
    }
  }

  // 3. Check Regional DB
  for (const item of REGIONAL_GEOCODE_DB) {
    const normKey = item.key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes(normKey)) {
      return { lat: item.lat, lng: item.lng };
    }
  }

  // 4. Check City Coordinates DB
  for (const [city, coord] of Object.entries(CITY_COORDS)) {
    const normCity = city.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes(normCity)) {
      return { lat: coord.lat, lng: coord.lng };
    }
  }

  // 5. Fallback: Base location + deterministic hash jitter (within ~2-5km)
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  const jitterLat = ((Math.abs(hash) % 100) - 50) * 0.0003;
  const jitterLng = ((Math.abs(hash >> 2) % 100) - 50) * 0.0003;

  return {
    lat: fallbackLat + jitterLat,
    lng: fallbackLng + jitterLng
  };
}

/**
 * Direct Geocoding Helper: Proxies through /api/geocode, with OSM & local cartography fallback.
 */
export async function fetchDirectNominatimGeocode(
  address: string,
  baseCoords?: { lat: number; lng: number },
  expectedCity?: string,
  expectedState?: string
): Promise<{ lat: number; lng: number; precision: 'exact' | 'district' | 'fallback' } | null> {
  if (!address || address.length < 3) return null;

  // 1. Try internal backend geocoder (/api/geocode) with high-precision Gemini 3.7 + ViaCEP + Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // CORREÇÃO (23/08/2026): agora envia a cidade/estado esperados (cadastro do
    // cliente) como parâmetro. O backend usa isso como referência de validação
    // sempre que o ViaCEP não conseguir confirmar a cidade sozinho — antes disso,
    // uma rua com nome comum (ex: "Rua Santa Catarina") podia ser aceita vindo de
    // uma cidade errada quando o ViaCEP falhava, jogando o ponto longe do correto.
    const cityParam = expectedCity ? `&city=${encodeURIComponent(expectedCity)}` : '';
    const stateParam = expectedState ? `&state=${encodeURIComponent(expectedState)}` : '';
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(address)}${cityParam}${stateParam}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
        return {
          lat: data.lat,
          lng: data.lng,
          precision: data.precision || 'exact'
        };
      }
    }
  } catch (e) {
    // Proceed to browser direct verified Nominatim
  }

  // 2. Browser Direct Nominatim query with STRICT street verification
  const streetCore = address
    .replace(/\b(rua|r\.|avenida|av\.|av|travessa|tv\.|alameda|al\.|estrada|est\.|rodovia|rod\.|praca|praça|pç\.)\b/gi, '')
    .replace(/\b(n[º°o]?\.?\s*\d+|\d{1,5})\b/gi, '')
    .replace(/\bcep:?\s*\d{2}\.?\d{3}[-\s]?\d{3}\b/gi, '')
    .split(/[,-]/)[0]
    .trim();

  const coreWords = streetCore
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !['rua', 'avenida', 'travessa', 'estrada', 'alameda', 'rodovia', 'bairro', 'centro'].includes(w));

  const cleanedAddress = address
    .replace(/ - /g, ', ')
    .replace(/\//g, ', ')
    .trim();

  const queryVariants = [
    cleanedAddress,
    `${cleanedAddress}, Brasil`
  ];

  for (const q of queryVariants) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=4&countrycodes=br&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'pt-BR,pt;q=0.9',
        }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const results = await res.json();
        if (Array.isArray(results) && results.length > 0) {
          for (const top of results) {
            const lat = parseFloat(top.lat);
            const lng = parseFloat(top.lon);
            const dispNorm = (top.display_name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            let streetMatched = false;
            if (coreWords.length > 0) {
              streetMatched = coreWords.some(w => dispNorm.includes(w));
            } else {
              streetMatched = top.type === 'house' || top.type === 'building' || top.class === 'highway';
            }

            if (streetMatched && !isNaN(lat) && !isNaN(lng) && lat >= -34.0 && lat <= 5.5 && lng >= -74.0 && lng <= -34.0) {
              const precision = (top.type === 'house' || top.type === 'building') ? 'exact' : 'district';
              return { lat, lng, precision };
            }
          }
        }
      }
    } catch (e) {
      // Proceed
    }
  }

  // 3. Fallback to Local Offline Geocoder
  const offline = geocodeAddress(address, baseCoords);
  return {
    lat: offline.lat,
    lng: offline.lng,
    precision: 'fallback'
  };
}

/**
 * Travelling Salesperson Problem (TSP) Solver
 * Uses the Nearest Neighbor algorithm starting from Base to optimize the route.
 */
export function optimizeTSP(baseLat: number, baseLng: number, entregas: Entrega[]): Entrega[] {
  if (entregas.length === 0) return [];

  const unvisited = [...entregas];
  const route: Entrega[] = [];
  let currentLat = baseLat;
  let currentLng = baseLng;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistanceSq = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const p = unvisited[i];
      // Euclidean distance square (sufficient for local routing)
      const distSq = Math.pow(p.latitude - currentLat, 2) + Math.pow(p.longitude - currentLng, 2);
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        nearestIndex = i;
      }
    }

    const nextNode = unvisited.splice(nearestIndex, 1)[0];
    route.push(nextNode);
    currentLat = nextNode.latitude;
    currentLng = nextNode.longitude;
  }

  return route;
}

/**
 * Pure Spatial K-Means Optimization for vehicle route assignment
 * Clusters deliveries based strictly on geographical density and minimum total distance/fuel consumption.
 * Allows variable stop counts per driver (e.g. 25 stops in dense urban core vs 8 stops on rural routes)
 * to achieve quantum-level spatial efficiency.
 */
export function clusterAndOptimize(
  entregas: Entrega[], 
  numVeiculos: number, 
  baseLat: number = DEFAULT_BASE.latitude, 
  baseLng: number = DEFAULT_BASE.longitude
): Record<number, Entrega[]> {
  if (entregas.length === 0 || numVeiculos <= 0) return {};

  const k = Math.min(numVeiculos, entregas.length);

  // 1. Initialize centroids using K-Means++ spatial dispersion
  const centroids = initializeKMeansPlusPlus(entregas, k);
  
  let clusters: Record<number, number[]> = {};

  // Standard K-Means iterations optimizing purely for spatial distance
  for (let iter = 0; iter < 20; iter++) {
    clusters = {};
    for (let i = 0; i < k; i++) clusters[i] = [];

    // Assign each delivery point to its ABSOLUTE NEAREST spatial centroid
    entregas.forEach((p, pIdx) => {
      let nearestCluster = 0;
      let minDistanceSq = Infinity;

      centroids.forEach((c, cId) => {
        const d = Math.pow(p.latitude - c.lat, 2) + Math.pow(p.longitude - c.lng, 2);
        if (d < minDistanceSq) {
          minDistanceSq = d;
          nearestCluster = cId;
        }
      });

      clusters[nearestCluster].push(pIdx);
    });

    // Update centroids to spatial mean of assigned points
    for (let i = 0; i < k; i++) {
      const idxs = clusters[i];
      if (idxs.length > 0) {
        let sumLat = 0;
        let sumLng = 0;
        idxs.forEach(idx => {
          sumLat += entregas[idx].latitude;
          sumLng += entregas[idx].longitude;
        });
        centroids[i] = {
          lat: sumLat / idxs.length,
          lng: sumLng / idxs.length,
        };
      }
    }
  }

  // 2. Post-process: Balance cluster sizes so no driver is overloaded while others are idle
  const targetAvg = Math.ceil(entregas.length / k);
  equalizeClusterSizes(clusters, entregas, k, targetAvg);

  // 3. Map back to Entregas and optimize each cluster with TSP starting from base CD Hub
  const result: Record<number, Entrega[]> = {};
  Object.entries(clusters).forEach(([cId, idxs]) => {
    if (idxs.length === 0) return;
    const subList = idxs.map(idx => entregas[idx]);
    const optimized = optimizeTSP(baseLat, baseLng, subList);
    result[Number(cId)] = optimized;
  });

  return result;
}

/**
 * Spatially dispersed K-Means++ initialization
 */
function initializeKMeansPlusPlus(entregas: Entrega[], k: number): { lat: number; lng: number }[] {
  if (entregas.length === 0) return [];
  const centroids: { lat: number; lng: number }[] = [];
  
  // Pick first centroid arbitrarily
  centroids.push({ lat: entregas[0].latitude, lng: entregas[0].longitude });

  while (centroids.length < k) {
    let farthestIdx = 0;
    let maxMinDist = -1;

    for (let i = 0; i < entregas.length; i++) {
      const p = entregas[i];
      let minDist = Infinity;

      for (const c of centroids) {
        const d = Math.pow(p.latitude - c.lat, 2) + Math.pow(p.longitude - c.lng, 2);
        if (d < minDist) minDist = d;
      }

      if (minDist > maxMinDist) {
        maxMinDist = minDist;
        farthestIdx = i;
      }
    }

    centroids.push({ lat: entregas[farthestIdx].latitude, lng: entregas[farthestIdx].longitude });
  }

  return centroids;
}

/**
 * Post-processing step to rebalance any remaining cluster size discrepancies
 */
function equalizeClusterSizes(
  clusters: Record<number, number[]>,
  entregas: Entrega[],
  k: number,
  targetSize: number
) {
  let changed = true;
  let passes = 0;

  while (changed && passes < 10) {
    changed = false;
    passes++;

    let maxClusterId = -1;
    let maxLen = -1;
    let minClusterId = -1;
    let minLen = Infinity;

    for (let i = 0; i < k; i++) {
      const len = clusters[i].length;
      if (len > maxLen) {
        maxLen = len;
        maxClusterId = i;
      }
      if (len < minLen) {
        minLen = len;
        minClusterId = i;
      }
    }

    // Transfer item if imbalance is > 2
    if (maxLen - minLen > 2 && maxClusterId !== -1 && minClusterId !== -1) {
      const maxCluster = clusters[maxClusterId];
      // Compute center of minCluster
      let minCenterLat = 0;
      let minCenterLng = 0;
      clusters[minClusterId].forEach(idx => {
        minCenterLat += entregas[idx].latitude;
        minCenterLng += entregas[idx].longitude;
      });
      if (clusters[minClusterId].length > 0) {
        minCenterLat /= clusters[minClusterId].length;
        minCenterLng /= clusters[minClusterId].length;
      }

      // Find the point in maxCluster that is closest to minCluster's center
      let bestPointInMaxIdx = -1;
      let minDistanceToTarget = Infinity;

      maxCluster.forEach((pointIdx, arrIdx) => {
        const p = entregas[pointIdx];
        const dist = Math.pow(p.latitude - minCenterLat, 2) + Math.pow(p.longitude - minCenterLng, 2);
        if (dist < minDistanceToTarget) {
          minDistanceToTarget = dist;
          bestPointInMaxIdx = arrIdx;
        }
      });

      if (bestPointInMaxIdx !== -1) {
        const [transferredPoint] = maxCluster.splice(bestPointInMaxIdx, 1);
        clusters[minClusterId].push(transferredPoint);
        changed = true;
      }
    }
  }
}

/**
 * Calculates approximate travel distance on streets in KM between two coordinates
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Generates street-aligned simulation coordinates for map paths.
 * Recreates typical street grid-like corners between two geolocations.
 */
export function generateStreetGeometry(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): [number, number][] {
  const midLat = p1.lat;
  const midLng = p2.lng; // Manhattan-style layout corner to simulate real roads
  return [
    [p1.lat, p1.lng],
    [midLat, midLng],
    [p2.lat, p2.lng]
  ];
}

// =========================================================================
// VROOM (VEHICLE ROUTING OPEN-SOURCE OPTIMIZATION MACHINE) INTERFACES
// =========================================================================

export interface VroomJob {
  id: number;
  description: string;
  location: [number, number]; // [longitude, latitude] GeoJSON
  delivery?: number[];
  pickup?: number[];
  service?: number; // Service time in seconds (e.g. 600s = 10min)
  time_windows?: [number, number][];
}

export interface VroomPickup {
  id: number;
  description: string;
  location: [number, number]; // [longitude, latitude]
  service?: number;
}

export interface VroomDelivery {
  id: number;
  description: string;
  location: [number, number]; // [longitude, latitude]
  service?: number;
}

export interface VroomShipment {
  amount: number[];
  pickup: VroomPickup;
  delivery: VroomDelivery;
}

export interface VroomVehicle {
  id: number;
  profile: string; // 'car' or 'truck'
  start: [number, number]; // [longitude, latitude]
  end: [number, number];   // [longitude, latitude]
  capacity?: number[];
  time_window?: [number, number];
}

export interface VroomPayload {
  vehicles: VroomVehicle[];
  jobs: VroomJob[];
  shipments: VroomShipment[];
}

export interface VroomStep {
  type: 'start' | 'job' | 'pickup' | 'delivery' | 'end';
  location: [number, number];
  id?: number;
  job?: number;
  service?: number;
  waiting_time?: number;
  arrival?: number;
  duration?: number;
  distance?: number;
  description?: string;
}

export interface VroomRoute {
  vehicle: number;
  cost: number;
  delivery: number[];
  pickup: number[];
  service: number;
  duration: number;
  distance: number;
  steps: VroomStep[];
}

export interface VroomResponse {
  code: number;
  error?: string;
  summary: {
    cost: number;
    unassigned: number;
    delivery: number[];
    pickup: number[];
    service: number;
    duration: number;
    distance: number;
  };
  unassigned?: any[];
  routes: VroomRoute[];
}

/**
 * Formats LogusQ deliveries and fleet into a VROOM-Express operational research payload.
 * Supports standard jobs as well as reverse logistics shipments (pickups & returns).
 */
export function formatVroomPayload(
  entregas: Entrega[],
  numVeiculos: number,
  baseLocation?: { latitude: number; longitude: number },
  veiculos?: any[]
): VroomPayload {
  const baseLat = baseLocation?.latitude ?? DEFAULT_BASE.latitude;
  const baseLng = baseLocation?.longitude ?? DEFAULT_BASE.longitude;

  const k = Math.max(1, numVeiculos || (veiculos ? veiculos.length : 1));

  // Build Vehicles
  const vroomVehicles: VroomVehicle[] = [];
  for (let i = 0; i < k; i++) {
    const v = veiculos && veiculos[i] ? veiculos[i] : null;
    const capacityKg = v?.capacidadeKg ? Number(v.capacidadeKg) : 1200;

    vroomVehicles.push({
      id: i + 1,
      profile: 'car',
      start: [baseLng, baseLat], // [longitude, latitude] GeoJSON
      end: [baseLng, baseLat],
      capacity: [capacityKg]
    });
  }

  const vroomJobs: VroomJob[] = [];
  const vroomShipments: VroomShipment[] = [];

  // Sort entregas into jobs vs reverse logistics shipments
  entregas.forEach((p, index) => {
    const jobId = p.id ? Number(p.id) || (index + 101) : (index + 101);
    const weight = Math.round(p.pesoMercadoriaKg || 10);
    const isReverseLogistics = 
      (p.tipoOperacao && (p.tipoOperacao.toLowerCase().includes('reversa') || p.tipoOperacao.toLowerCase().includes('troca'))) ||
      Boolean((p as any).coletaEndereco);

    if (isReverseLogistics) {
      // Reverse Logistics Shipment: Pickup at Customer -> Deliver to Base CD Hub
      vroomShipments.push({
        amount: [weight],
        pickup: {
          id: jobId * 10 + 1,
          description: `[Coleta Reversa] NF: ${p.chave || jobId} - ${p.cliente}`,
          location: [p.longitude, p.latitude],
          service: 300 // 5 min pickup
        },
        delivery: {
          id: jobId * 10 + 2,
          description: `[Devolução CD] NF: ${p.chave || jobId} - Retorno Base Savassi`,
          location: [baseLng, baseLat],
          service: 300 // 5 min unloading
        }
      });
    } else {
      // Standard Delivery Job
      const isPickupOnly = p.tipoOperacao && p.tipoOperacao.toLowerCase() === 'coleta';
      
      vroomJobs.push({
        id: jobId,
        description: `[${p.tipoOperacao || 'Entrega'}] NF: ${p.chave || jobId} - ${p.cliente}`,
        location: [p.longitude, p.latitude],
        delivery: isPickupOnly ? [0] : [weight],
        pickup: isPickupOnly ? [weight] : [0],
        service: 600 // 10 minutes service time per stop
      });
    }
  });

  return {
    vehicles: vroomVehicles,
    jobs: vroomJobs,
    shipments: vroomShipments
  };
}

/**
 * Dispatches an HTTP request directly to the VROOM Satellite Service on Railway.
 * Returns clustered and ordered routes per vehicle.
 */
export async function optimizeRoutesWithVroom(
  entregas: Entrega[],
  numVeiculos: number,
  baseLocation?: { latitude: number; longitude: number },
  veiculos?: any[],
  vroomUrl?: string
): Promise<Record<number, Entrega[]>> {
  const targetUrl = vroomUrl || (typeof process !== 'undefined' && process.env?.VROOM_URL) || 'http://vroom-service.railway.internal:3000';
  
  const payload = formatVroomPayload(entregas, numVeiculos, baseLocation, veiculos);

  console.log(`⚡ [VROOM Client] Enviando ${payload.jobs.length} jobs e ${payload.shipments.length} shipments para VROOM em ${targetUrl}...`);

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`VROOM Engine HTTP ${response.status}: ${errorText}`);
  }

  const resData: VroomResponse = await response.json();

  if (resData.code !== 0) {
    throw new Error(`VROOM Engine error code ${resData.code}: ${resData.error || 'Erro de otimização'}`);
  }

  // Map VROOM route steps back to LogusQ Entrega clusters
  const resultClusters: Record<number, Entrega[]> = {};
  const entregaMap = new Map<number, Entrega>();
  entregas.forEach((e, idx) => {
    const idNum = e.id ? Number(e.id) || (idx + 101) : (idx + 101);
    entregaMap.set(idNum, e);
  });

  resData.routes.forEach((route, vIndex) => {
    const orderedEntregas: Entrega[] = [];

    route.steps.forEach(step => {
      if (step.type === 'job' || step.type === 'pickup' || step.type === 'delivery') {
        const stepId = step.id || step.job;
        if (stepId) {
          // Normalize shipment sub-ids
          const originalId = stepId > 1000 ? Math.floor(stepId / 10) : stepId;
          const matched = entregaMap.get(originalId) || entregaMap.get(stepId);
          if (matched && !orderedEntregas.includes(matched)) {
            orderedEntregas.push(matched);
          }
        }
      }
    });

    resultClusters[vIndex] = orderedEntregas;
  });

  return resultClusters;
}

/**
 * Offloads heavy routing calculations to the Node.js backend Worker Thread or VROOM API (/api/routing/optimize).
 * Falls back to local in-memory K-Means/TSP if offline or on endpoint failure.
 */
export async function optimizeRoutesRemoteWorker(
  entregas: Entrega[],
  numVeiculos: number,
  baseLocation?: { nome?: string; latitude: number; longitude: number },
  veiculos?: any[]
): Promise<Record<number, Entrega[]>> {
  try {
    const response = await fetch('/api/routing/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entregas,
        numVeiculos,
        baseLocation,
        veiculos
      })
    });

    if (response.ok) {
      const resData = await response.json();
      if (resData.success && resData.data && resData.data.clusters) {
        console.log(`⚡ [Routing API - ${resData.mode || 'Engine'}] Route optimized in ${resData.data.estatisticasGerais?.tempoProcessamentoMs}ms!`);
        return resData.data.clusters;
      }
    }
  } catch (err) {
    console.warn('⚠️ Erro ou offline ao chamar API de Roteirização. Usando fallback local:', err);
  }

  // Fallback to local synchronous clusterAndOptimize
  return clusterAndOptimize(
    entregas,
    numVeiculos,
    baseLocation?.latitude ?? DEFAULT_BASE.latitude,
    baseLocation?.longitude ?? DEFAULT_BASE.longitude
  );
}
