/**
 * Brazilian States Data
 * All 27 states (26 states + 1 Federal District)
 */

export interface StateData {
  id: string
  code: string
  name: string
}

export const states: StateData[] = [
  { id: 'AC', code: 'AC', name: 'Acre' },
  { id: 'AL', code: 'AL', name: 'Alagoas' },
  { id: 'AP', code: 'AP', name: 'Amapá' },
  { id: 'AM', code: 'AM', name: 'Amazonas' },
  { id: 'BA', code: 'BA', name: 'Bahia' },
  { id: 'CE', code: 'CE', name: 'Ceará' },
  { id: 'DF', code: 'DF', name: 'Distrito Federal' },
  { id: 'ES', code: 'ES', name: 'Espírito Santo' },
  { id: 'GO', code: 'GO', name: 'Goiás' },
  { id: 'MA', code: 'MA', name: 'Maranhão' },
  { id: 'MT', code: 'MT', name: 'Mato Grosso' },
  { id: 'MS', code: 'MS', name: 'Mato Grosso do Sul' },
  { id: 'MG', code: 'MG', name: 'Minas Gerais' },
  { id: 'PA', code: 'PA', name: 'Pará' },
  { id: 'PB', code: 'PB', name: 'Paraíba' },
  { id: 'PR', code: 'PR', name: 'Paraná' },
  { id: 'PE', code: 'PE', name: 'Pernambuco' },
  { id: 'PI', code: 'PI', name: 'Piauí' },
  { id: 'RJ', code: 'RJ', name: 'Rio de Janeiro' },
  { id: 'RN', code: 'RN', name: 'Rio Grande do Norte' },
  { id: 'RS', code: 'RS', name: 'Rio Grande do Sul' },
  { id: 'RO', code: 'RO', name: 'Rondônia' },
  { id: 'RR', code: 'RR', name: 'Roraima' },
  { id: 'SC', code: 'SC', name: 'Santa Catarina' },
  { id: 'SP', code: 'SP', name: 'São Paulo' },
  { id: 'SE', code: 'SE', name: 'Sergipe' },
  { id: 'TO', code: 'TO', name: 'Tocantins' },
]
