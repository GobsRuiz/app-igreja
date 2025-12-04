import type { Event } from '@shared/types'

/**
 * Eventos mockados para desenvolvimento e testes
 * Contém exemplos dos 3 tipos de eventos: Batismos, Reuniões para Mocidade, Ensaios Musicais Regionais
 *
 * IMPORTANTE: Estes dados serão substituídos por chamadas à API em produção
 */
export const mockEvents: Event[] = [
  // ========================================
  // BATISMOS
  // ========================================
  {
    id: '1',
    title: 'Batismo nas Águas',
    date: '2025-12-02',
    time: '15:00',
    church: 'Igreja Batista de Taquaritinga',
    address: 'Rua São Paulo, 450 - Centro',
    city: 'Taquaritinga',
    conductor: 'Pastor João Silva',
    description: 'Cerimônia de batismo nas águas com celebração especial.',
    latitude: -21.408333,
    longitude: -48.505833,
    attachments: [],
    eventType: 'Batismos',
    isFavorite: false,
    isNotifying: false,
  },
  {
    id: '2',
    title: 'Batismo e Ceia',
    date: '2025-12-05',
    time: '16:00',
    church: 'Igreja Metodista Central',
    address: 'Av. Doutor Carlos Botelho, 1200',
    city: 'São Carlos',
    conductor: 'Pastora Ana Paula',
    description: 'Batismo seguido de santa ceia.',
    latitude: -22.017532,
    longitude: -47.890939,
    attachments: [],
    eventType: 'Batismos',
    isFavorite: false,
    isNotifying: false,
  },
  {
    id: '3',
    title: 'Batismo Especial',
    date: '2025-12-08',
    time: '14:00',
    church: 'Igreja Presbiteriana',
    address: 'Rua Nove de Julho, 789',
    city: 'Ribeirão Preto',
    conductor: 'Pastor Roberto Lima',
    description: 'Batismo especial com momento de louvor.',
    latitude: -21.170401,
    longitude: -47.810326,
    attachments: [],
    eventType: 'Batismos',
    isFavorite: false,
    isNotifying: false,
  },

  // ========================================
  // REUNIÕES PARA MOCIDADE
  // ========================================
  {
    id: '4',
    title: 'Encontro de Jovens',
    date: '2025-12-03',
    time: '19:30',
    church: 'Igreja Adventista',
    address: 'Rua Luiz de Camões, 320',
    city: 'Matão',
    conductor: 'Líder Marcos Vieira',
    description: 'Reunião especial da mocidade com louvor e palavra.',
    latitude: -21.602778,
    longitude: -48.365833,
    attachments: [],
    eventType: 'Reuniões para Mocidade',
    isFavorite: false,
    isNotifying: false,
  },
  {
    id: '5',
    title: 'Célula de Jovens',
    date: '2025-12-06',
    time: '20:00',
    church: 'Igreja Batista de Taquaritinga',
    address: 'Rua São Paulo, 450 - Centro',
    city: 'Taquaritinga',
    conductor: 'Líder Júlia Santos',
    description: 'Célula semanal de jovens com estudo bíblico.',
    latitude: -21.408333,
    longitude: -48.505833,
    attachments: [],
    eventType: 'Reuniões para Mocidade',
    isFavorite: false,
    isNotifying: false,
  },
  {
    id: '6',
    title: 'Mocidade em Ação',
    date: '2025-12-09',
    time: '18:30',
    church: 'Igreja Assembleia de Deus',
    address: 'Rua Conde do Pinhal, 1500',
    city: 'São Carlos',
    conductor: 'Pastor Pedro Oliveira',
    description: 'Encontro mensal da mocidade regional.',
    latitude: -22.007532,
    longitude: -47.895939,
    attachments: [],
    eventType: 'Reuniões para Mocidade',
    isFavorite: false,
    isNotifying: false,
  },

  // ========================================
  // ENSAIOS MUSICAIS REGIONAIS
  // ========================================
  {
    id: '7',
    title: 'Ensaio Regional - Soprano',
    date: '2025-12-04',
    time: '19:00',
    church: 'Congregação Central',
    address: 'Av. Presidente Vargas, 2300',
    city: 'Ribeirão Preto',
    conductor: 'Maestro Carlos Eduardo',
    description: 'Ensaio regional do coral soprano.',
    latitude: -21.177401,
    longitude: -47.815326,
    attachments: [],
    eventType: 'Ensaios Musicais Regionais',
    isFavorite: true,
    isNotifying: true,
  },
  {
    id: '8',
    title: 'Ensaio Geral da Orquestra',
    date: '2025-12-07',
    time: '15:00',
    church: 'Igreja Matriz',
    address: 'Praça da Independência, 50',
    city: 'Matão',
    conductor: 'Maestrina Maria Helena',
    description: 'Ensaio geral da orquestra regional.',
    latitude: -21.607778,
    longitude: -48.370833,
    attachments: [],
    eventType: 'Ensaios Musicais Regionais',
    isFavorite: false,
    isNotifying: false,
  },
  {
    id: '9',
    title: 'Ensaio Regional - Tenor',
    date: '2025-12-10',
    time: '19:00',
    church: 'Congregação Central',
    address: 'Av. Presidente Vargas, 2300',
    city: 'Ribeirão Preto',
    conductor: 'Maestro Carlos Eduardo',
    description: 'Ensaio regional do coral tenor.',
    latitude: -21.177401,
    longitude: -47.815326,
    attachments: [
      {
        url: 'https://example.com/partitura.pdf',
        name: 'partitura.pdf',
        type: 'application/pdf',
      },
    ],
    eventType: 'Ensaios Musicais Regionais',
    isFavorite: false,
    isNotifying: false,
  },
]

/**
 * Busca eventos por cidade
 * @param city - Nome da cidade
 * @returns Array de eventos da cidade
 */
export function getEventsByCity(city: string): Event[] {
  return mockEvents.filter((event) => event.city === city)
}

/**
 * Busca eventos por tipo
 * @param eventType - Tipo do evento
 * @returns Array de eventos do tipo especificado
 */
export function getEventsByType(eventType: Event['eventType']): Event[] {
  return mockEvents.filter((event) => event.eventType === eventType)
}

/**
 * Busca eventos favoritos
 * @returns Array de eventos marcados como favoritos
 */
export function getFavoriteEvents(): Event[] {
  return mockEvents.filter((event) => event.isFavorite)
}

/**
 * Busca eventos com notificação ativa
 * @returns Array de eventos com notificação ativada
 */
export function getNotifyingEvents(): Event[] {
  return mockEvents.filter((event) => event.isNotifying)
}

/**
 * Busca evento por ID
 * @param id - ID do evento
 * @returns Evento encontrado ou undefined
 */
export function getEventById(id: string): Event | undefined {
  return mockEvents.find((event) => event.id === id)
}
