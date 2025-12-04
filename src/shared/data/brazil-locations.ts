import type { BrazilState } from '@shared/types'

/**
 * Lista completa dos 27 estados do Brasil com suas principais cidades
 * Dados estáticos para uso em filtros e seleção de localização
 */
export const brazilStates: BrazilState[] = [
  {
    name: 'Acre',
    code: 'AC',
    cities: ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá'],
  },
  {
    name: 'Alagoas',
    code: 'AL',
    cities: ['Maceió', 'Arapiraca', 'Palmeira dos Índios', 'Rio Largo'],
  },
  {
    name: 'Amapá',
    code: 'AP',
    cities: ['Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque'],
  },
  {
    name: 'Amazonas',
    code: 'AM',
    cities: ['Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru'],
  },
  {
    name: 'Bahia',
    code: 'BA',
    cities: ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Itabuna'],
  },
  {
    name: 'Ceará',
    code: 'CE',
    cities: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral'],
  },
  {
    name: 'Distrito Federal',
    code: 'DF',
    cities: ['Brasília', 'Taguatinga', 'Ceilândia', 'Samambaia', 'Planaltina'],
  },
  {
    name: 'Espírito Santo',
    code: 'ES',
    cities: ['Vitória', 'Vila Velha', 'Serra', 'Cariacica', 'Cachoeiro de Itapemirim'],
  },
  {
    name: 'Goiás',
    code: 'GO',
    cities: ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia'],
  },
  {
    name: 'Maranhão',
    code: 'MA',
    cities: ['São Luís', 'Imperatriz', 'Caxias', 'Timon', 'Codó'],
  },
  {
    name: 'Mato Grosso',
    code: 'MT',
    cities: ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra'],
  },
  {
    name: 'Mato Grosso do Sul',
    code: 'MS',
    cities: ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã'],
  },
  {
    name: 'Minas Gerais',
    code: 'MG',
    cities: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim'],
  },
  {
    name: 'Pará',
    code: 'PA',
    cities: ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Castanhal'],
  },
  {
    name: 'Paraíba',
    code: 'PB',
    cities: ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux'],
  },
  {
    name: 'Paraná',
    code: 'PR',
    cities: ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel'],
  },
  {
    name: 'Pernambuco',
    code: 'PE',
    cities: ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina'],
  },
  {
    name: 'Piauí',
    code: 'PI',
    cities: ['Teresina', 'Parnaíba', 'Picos', 'Floriano', 'Piripiri'],
  },
  {
    name: 'Rio de Janeiro',
    code: 'RJ',
    cities: ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói'],
  },
  {
    name: 'Rio Grande do Norte',
    code: 'RN',
    cities: ['Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba'],
  },
  {
    name: 'Rio Grande do Sul',
    code: 'RS',
    cities: ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria'],
  },
  {
    name: 'Rondônia',
    code: 'RO',
    cities: ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal'],
  },
  {
    name: 'Roraima',
    code: 'RR',
    cities: ['Boa Vista', 'Rorainópolis', 'Caracaraí', 'Alto Alegre', 'Mucajaí'],
  },
  {
    name: 'Santa Catarina',
    code: 'SC',
    cities: ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Criciúma'],
  },
  {
    name: 'São Paulo',
    code: 'SP',
    cities: [
      'São Paulo',
      'Guarulhos',
      'Campinas',
      'São Bernardo do Campo',
      'Santos',
      'Taquaritinga',
      'Matão',
      'São Carlos',
      'Ribeirão Preto',
    ],
  },
  {
    name: 'Sergipe',
    code: 'SE',
    cities: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão'],
  },
  {
    name: 'Tocantins',
    code: 'TO',
    cities: ['Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins'],
  },
]

/**
 * Busca cidades de um estado pelo código
 * @param stateCode - Código UF de 2 letras (ex: 'SP', 'RJ')
 * @returns Array de cidades ou array vazio se estado não encontrado
 */
export function getCitiesByStateCode(stateCode: string): string[] {
  const state = brazilStates.find((s) => s.code === stateCode)
  return state?.cities ?? []
}

/**
 * Busca nome do estado pelo código
 * @param stateCode - Código UF de 2 letras (ex: 'SP', 'RJ')
 * @returns Nome do estado ou string vazia se não encontrado
 */
export function getStateNameByCode(stateCode: string): string {
  const state = brazilStates.find((s) => s.code === stateCode)
  return state?.name ?? ''
}

/**
 * Busca código do estado pelo nome
 * @param stateName - Nome do estado (ex: 'São Paulo', 'Rio de Janeiro')
 * @returns Código UF ou string vazia se não encontrado
 */
export function getStateCodeByName(stateName: string): string {
  const state = brazilStates.find((s) => s.name === stateName)
  return state?.code ?? ''
}

/**
 * Verifica se uma cidade existe em um estado
 * @param stateCode - Código UF de 2 letras
 * @param cityName - Nome da cidade
 * @returns true se a cidade existe no estado
 */
export function cityExistsInState(stateCode: string, cityName: string): boolean {
  const cities = getCitiesByStateCode(stateCode)
  return cities.includes(cityName)
}
