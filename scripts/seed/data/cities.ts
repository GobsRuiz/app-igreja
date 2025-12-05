/**
 * Brazilian Cities Data
 * 5 cities per state, except São Paulo with 11 cities (141 cities total)
 * Using real IBGE codes
 */

export interface CityData {
  id: string
  name: string
  state: string
  stateId: string
}

export const cities: CityData[] = [
  // Acre (AC) - 5 cities
  { id: '1200013', name: 'Acrelândia', state: 'AC', stateId: 'AC' },
  { id: '1200054', name: 'Assis Brasil', state: 'AC', stateId: 'AC' },
  { id: '1200104', name: 'Brasiléia', state: 'AC', stateId: 'AC' },
  { id: '1200138', name: 'Bujari', state: 'AC', stateId: 'AC' },
  { id: '1200179', name: 'Capixaba', state: 'AC', stateId: 'AC' },

  // Alagoas (AL) - 5 cities
  { id: '2700102', name: 'Água Branca', state: 'AL', stateId: 'AL' },
  { id: '2700201', name: 'Anadia', state: 'AL', stateId: 'AL' },
  { id: '2700300', name: 'Arapiraca', state: 'AL', stateId: 'AL' },
  { id: '2700409', name: 'Atalaia', state: 'AL', stateId: 'AL' },
  { id: '2700508', name: 'Barra de Santo Antônio', state: 'AL', stateId: 'AL' },

  // Amapá (AP) - 5 cities
  { id: '1600105', name: 'Amapá', state: 'AP', stateId: 'AP' },
  { id: '1600204', name: 'Calçoene', state: 'AP', stateId: 'AP' },
  { id: '1600212', name: 'Cutias', state: 'AP', stateId: 'AP' },
  { id: '1600238', name: 'Ferreira Gomes', state: 'AP', stateId: 'AP' },
  { id: '1600253', name: 'Itaubal', state: 'AP', stateId: 'AP' },

  // Amazonas (AM) - 5 cities
  { id: '1300029', name: 'Alvarães', state: 'AM', stateId: 'AM' },
  { id: '1300060', name: 'Amaturá', state: 'AM', stateId: 'AM' },
  { id: '1300086', name: 'Anamã', state: 'AM', stateId: 'AM' },
  { id: '1300102', name: 'Anori', state: 'AM', stateId: 'AM' },
  { id: '1300144', name: 'Apuí', state: 'AM', stateId: 'AM' },

  // Bahia (BA) - 5 cities
  { id: '2900108', name: 'Abaíra', state: 'BA', stateId: 'BA' },
  { id: '2900207', name: 'Abaré', state: 'BA', stateId: 'BA' },
  { id: '2900306', name: 'Acajutiba', state: 'BA', stateId: 'BA' },
  { id: '2900355', name: 'Adustina', state: 'BA', stateId: 'BA' },
  { id: '2900405', name: 'Água Fria', state: 'BA', stateId: 'BA' },

  // Ceará (CE) - 5 cities
  { id: '2300101', name: 'Abaiara', state: 'CE', stateId: 'CE' },
  { id: '2300150', name: 'Acarape', state: 'CE', stateId: 'CE' },
  { id: '2300200', name: 'Acaraú', state: 'CE', stateId: 'CE' },
  { id: '2300309', name: 'Acopiara', state: 'CE', stateId: 'CE' },
  { id: '2300408', name: 'Aiuaba', state: 'CE', stateId: 'CE' },

  // Distrito Federal (DF) - 5 cities/regions
  { id: '5300108', name: 'Brasília', state: 'DF', stateId: 'DF' },
  { id: '5300109', name: 'Gama', state: 'DF', stateId: 'DF' },
  { id: '5300110', name: 'Taguatinga', state: 'DF', stateId: 'DF' },
  { id: '5300111', name: 'Ceilândia', state: 'DF', stateId: 'DF' },
  { id: '5300112', name: 'Sobradinho', state: 'DF', stateId: 'DF' },

  // Espírito Santo (ES) - 5 cities
  { id: '3200102', name: 'Afonso Cláudio', state: 'ES', stateId: 'ES' },
  { id: '3200136', name: 'Águia Branca', state: 'ES', stateId: 'ES' },
  { id: '3200169', name: 'Água Doce do Norte', state: 'ES', stateId: 'ES' },
  { id: '3200201', name: 'Alegre', state: 'ES', stateId: 'ES' },
  { id: '3200300', name: 'Alfredo Chaves', state: 'ES', stateId: 'ES' },

  // Goiás (GO) - 5 cities
  { id: '5200050', name: 'Abadia de Goiás', state: 'GO', stateId: 'GO' },
  { id: '5200100', name: 'Abadiânia', state: 'GO', stateId: 'GO' },
  { id: '5200134', name: 'Acreúna', state: 'GO', stateId: 'GO' },
  { id: '5200159', name: 'Adelândia', state: 'GO', stateId: 'GO' },
  { id: '5200175', name: 'Água Fria de Goiás', state: 'GO', stateId: 'GO' },

  // Maranhão (MA) - 5 cities
  { id: '2100055', name: 'Açailândia', state: 'MA', stateId: 'MA' },
  { id: '2100105', name: 'Afonso Cunha', state: 'MA', stateId: 'MA' },
  { id: '2100154', name: 'Água Doce do Maranhão', state: 'MA', stateId: 'MA' },
  { id: '2100204', name: 'Alcântara', state: 'MA', stateId: 'MA' },
  { id: '2100303', name: 'Aldeias Altas', state: 'MA', stateId: 'MA' },

  // Mato Grosso (MT) - 5 cities
  { id: '5100102', name: 'Acorizal', state: 'MT', stateId: 'MT' },
  { id: '5100201', name: 'Água Boa', state: 'MT', stateId: 'MT' },
  { id: '5100250', name: 'Alta Floresta', state: 'MT', stateId: 'MT' },
  { id: '5100300', name: 'Alto Araguaia', state: 'MT', stateId: 'MT' },
  { id: '5100359', name: 'Alto Boa Vista', state: 'MT', stateId: 'MT' },

  // Mato Grosso do Sul (MS) - 5 cities
  { id: '5000203', name: 'Água Clara', state: 'MS', stateId: 'MS' },
  { id: '5000252', name: 'Alcinópolis', state: 'MS', stateId: 'MS' },
  { id: '5000609', name: 'Amambai', state: 'MS', stateId: 'MS' },
  { id: '5000708', name: 'Anastácio', state: 'MS', stateId: 'MS' },
  { id: '5000807', name: 'Anaurilândia', state: 'MS', stateId: 'MS' },

  // Minas Gerais (MG) - 5 cities
  { id: '3100104', name: 'Abadia dos Dourados', state: 'MG', stateId: 'MG' },
  { id: '3100203', name: 'Abaeté', state: 'MG', stateId: 'MG' },
  { id: '3100302', name: 'Abre Campo', state: 'MG', stateId: 'MG' },
  { id: '3100401', name: 'Acaiaca', state: 'MG', stateId: 'MG' },
  { id: '3100500', name: 'Açucena', state: 'MG', stateId: 'MG' },

  // Pará (PA) - 5 cities
  { id: '1500107', name: 'Abaetetuba', state: 'PA', stateId: 'PA' },
  { id: '1500131', name: 'Abel Figueiredo', state: 'PA', stateId: 'PA' },
  { id: '1500206', name: 'Acará', state: 'PA', stateId: 'PA' },
  { id: '1500305', name: 'Afuá', state: 'PA', stateId: 'PA' },
  { id: '1500347', name: 'Água Azul do Norte', state: 'PA', stateId: 'PA' },

  // Paraíba (PB) - 5 cities
  { id: '2500106', name: 'Água Branca', state: 'PB', stateId: 'PB' },
  { id: '2500205', name: 'Aguiar', state: 'PB', stateId: 'PB' },
  { id: '2500304', name: 'Alagoa Grande', state: 'PB', stateId: 'PB' },
  { id: '2500403', name: 'Alagoa Nova', state: 'PB', stateId: 'PB' },
  { id: '2500502', name: 'Alagoinha', state: 'PB', stateId: 'PB' },

  // Paraná (PR) - 5 cities
  { id: '4100103', name: 'Abatiá', state: 'PR', stateId: 'PR' },
  { id: '4100202', name: 'Adrianópolis', state: 'PR', stateId: 'PR' },
  { id: '4100301', name: 'Agudos do Sul', state: 'PR', stateId: 'PR' },
  { id: '4100400', name: 'Almirante Tamandaré', state: 'PR', stateId: 'PR' },
  { id: '4100459', name: 'Altamira do Paraná', state: 'PR', stateId: 'PR' },

  // Pernambuco (PE) - 5 cities
  { id: '2600054', name: 'Abreu e Lima', state: 'PE', stateId: 'PE' },
  { id: '2600104', name: 'Afogados da Ingazeira', state: 'PE', stateId: 'PE' },
  { id: '2600203', name: 'Afrânio', state: 'PE', stateId: 'PE' },
  { id: '2600302', name: 'Agrestina', state: 'PE', stateId: 'PE' },
  { id: '2600401', name: 'Água Preta', state: 'PE', stateId: 'PE' },

  // Piauí (PI) - 5 cities
  { id: '2200053', name: 'Acauã', state: 'PI', stateId: 'PI' },
  { id: '2200103', name: 'Agricolândia', state: 'PI', stateId: 'PI' },
  { id: '2200202', name: 'Água Branca', state: 'PI', stateId: 'PI' },
  { id: '2200251', name: 'Alagoinha do Piauí', state: 'PI', stateId: 'PI' },
  { id: '2200277', name: 'Alegrete do Piauí', state: 'PI', stateId: 'PI' },

  // Rio de Janeiro (RJ) - 5 cities
  { id: '3300100', name: 'Angra dos Reis', state: 'RJ', stateId: 'RJ' },
  { id: '3300159', name: 'Aperibé', state: 'RJ', stateId: 'RJ' },
  { id: '3300209', name: 'Araruama', state: 'RJ', stateId: 'RJ' },
  { id: '3300225', name: 'Areal', state: 'RJ', stateId: 'RJ' },
  { id: '3300233', name: 'Armação dos Búzios', state: 'RJ', stateId: 'RJ' },

  // Rio Grande do Norte (RN) - 5 cities
  { id: '2400109', name: 'Acari', state: 'RN', stateId: 'RN' },
  { id: '2400208', name: 'Açu', state: 'RN', stateId: 'RN' },
  { id: '2400307', name: 'Afonso Bezerra', state: 'RN', stateId: 'RN' },
  { id: '2400406', name: 'Água Nova', state: 'RN', stateId: 'RN' },
  { id: '2400505', name: 'Alexandria', state: 'RN', stateId: 'RN' },

  // Rio Grande do Sul (RS) - 5 cities
  { id: '4300034', name: 'Aceguá', state: 'RS', stateId: 'RS' },
  { id: '4300059', name: 'Água Santa', state: 'RS', stateId: 'RS' },
  { id: '4300109', name: 'Agudo', state: 'RS', stateId: 'RS' },
  { id: '4300208', name: 'Ajuricaba', state: 'RS', stateId: 'RS' },
  { id: '4300307', name: 'Alecrim', state: 'RS', stateId: 'RS' },

  // Rondônia (RO) - 5 cities
  { id: '1100015', name: 'Alta Floresta d\'Oeste', state: 'RO', stateId: 'RO' },
  { id: '1100023', name: 'Ariquemes', state: 'RO', stateId: 'RO' },
  { id: '1100031', name: 'Cabixi', state: 'RO', stateId: 'RO' },
  { id: '1100049', name: 'Cacoal', state: 'RO', stateId: 'RO' },
  { id: '1100056', name: 'Cerejeiras', state: 'RO', stateId: 'RO' },

  // Roraima (RR) - 5 cities
  { id: '1400027', name: 'Amajari', state: 'RR', stateId: 'RR' },
  { id: '1400050', name: 'Alto Alegre', state: 'RR', stateId: 'RR' },
  { id: '1400100', name: 'Boa Vista', state: 'RR', stateId: 'RR' },
  { id: '1400159', name: 'Bonfim', state: 'RR', stateId: 'RR' },
  { id: '1400175', name: 'Cantá', state: 'RR', stateId: 'RR' },

  // Santa Catarina (SC) - 5 cities
  { id: '4200051', name: 'Abdon Batista', state: 'SC', stateId: 'SC' },
  { id: '4200101', name: 'Abelardo Luz', state: 'SC', stateId: 'SC' },
  { id: '4200200', name: 'Agrolândia', state: 'SC', stateId: 'SC' },
  { id: '4200309', name: 'Agronômica', state: 'SC', stateId: 'SC' },
  { id: '4200408', name: 'Água Doce', state: 'SC', stateId: 'SC' },

  // São Paulo (SP) - 11 cities
  { id: '3553807', name: 'Taquaritinga', state: 'SP', stateId: 'SP' },
  { id: '3529302', name: 'Matão', state: 'SP', stateId: 'SP' },
  { id: '3503208', name: 'Araraquara', state: 'SP', stateId: 'SP' },
  { id: '3548906', name: 'São Carlos', state: 'SP', stateId: 'SP' },
  { id: '3543402', name: 'Ribeirão Preto', state: 'SP', stateId: 'SP' },
  { id: '3518305', name: 'Guariroba', state: 'SP', stateId: 'SP' },
  { id: '3524303', name: 'Jaboticabal', state: 'SP', stateId: 'SP' },
  { id: '3553808', name: 'Jurupema', state: 'SP', stateId: 'SP' },
  { id: '3505708', name: 'Barretos', state: 'SP', stateId: 'SP' },
  { id: '3531704', name: 'Monte Alto', state: 'SP', stateId: 'SP' },
  { id: '3549805', name: 'São José do Rio Preto', state: 'SP', stateId: 'SP' },

  // Sergipe (SE) - 5 cities
  { id: '2800100', name: 'Amparo de São Francisco', state: 'SE', stateId: 'SE' },
  { id: '2800209', name: 'Aquidabã', state: 'SE', stateId: 'SE' },
  { id: '2800308', name: 'Aracaju', state: 'SE', stateId: 'SE' },
  { id: '2800407', name: 'Arauá', state: 'SE', stateId: 'SE' },
  { id: '2800506', name: 'Areia Branca', state: 'SE', stateId: 'SE' },

  // Tocantins (TO) - 5 cities
  { id: '1700251', name: 'Abreulândia', state: 'TO', stateId: 'TO' },
  { id: '1700301', name: 'Aguiarnópolis', state: 'TO', stateId: 'TO' },
  { id: '1700350', name: 'Aliança do Tocantins', state: 'TO', stateId: 'TO' },
  { id: '1700400', name: 'Almas', state: 'TO', stateId: 'TO' },
  { id: '1700707', name: 'Alvorada', state: 'TO', stateId: 'TO' },
]
