import * as Linking from 'expo-linking'
import { Platform } from 'react-native'

/**
 * Serviço para integração com aplicativos de mapas
 * Suporta Google Maps, Waze e Apple Maps
 */
export class MapService {
  /**
   * Valida coordenadas geográficas
   * @throws Error se coordenadas inválidas
   */
  private static validateCoordinates(latitude: number, longitude: number): void {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude inválida. Deve estar entre -90 e 90.')
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude inválida. Deve estar entre -180 e 180.')
    }
  }

  /**
   * Abre Google Maps com navegação para as coordenadas especificadas
   * Fallback para versão web se o app não estiver instalado
   *
   * @param latitude - Latitude do destino (-90 a 90)
   * @param longitude - Longitude do destino (-180 a 180)
   * @param label - Label opcional para o destino
   * @throws Error se coordenadas inválidas ou não conseguir abrir URL
   */
  static async openGoogleMaps(
    latitude: number,
    longitude: number,
    label?: string
  ): Promise<void> {
    this.validateCoordinates(latitude, longitude)

    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}${
      label ? `&destination_label=${encodeURIComponent(label)}` : ''
    }`

    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}`,
      android: `google.navigation:q=${latitude},${longitude}`,
      default: webUrl,
    })

    try {
      const canOpen = await Linking.canOpenURL(url)
      if (canOpen) {
        await Linking.openURL(url)
      } else {
        // Fallback para versão web
        await Linking.openURL(webUrl)
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[MapService] Erro ao abrir Google Maps:', error)
      }
      throw new Error('Não foi possível abrir o Google Maps')
    }
  }

  /**
   * Abre Waze com navegação para as coordenadas especificadas
   *
   * @param latitude - Latitude do destino (-90 a 90)
   * @param longitude - Longitude do destino (-180 a 180)
   * @throws Error se coordenadas inválidas ou Waze não disponível
   */
  static async openWaze(latitude: number, longitude: number): Promise<void> {
    this.validateCoordinates(latitude, longitude)

    const url = `https://www.waze.com/ul?ll=${latitude},${longitude}&navigate=yes`

    try {
      const canOpen = await Linking.canOpenURL(url)
      if (canOpen) {
        await Linking.openURL(url)
      } else {
        throw new Error('Waze não está disponível')
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[MapService] Erro ao abrir Waze:', error)
      }
      throw new Error('Não foi possível abrir o Waze')
    }
  }

  /**
   * Abre Apple Maps com navegação para as coordenadas especificadas
   * Funciona em todas as plataformas (fallback para versão web)
   *
   * @param latitude - Latitude do destino (-90 a 90)
   * @param longitude - Longitude do destino (-180 a 180)
   * @param label - Label opcional para o destino
   * @throws Error se coordenadas inválidas ou não conseguir abrir URL
   */
  static async openAppleMaps(
    latitude: number,
    longitude: number,
    label?: string
  ): Promise<void> {
    this.validateCoordinates(latitude, longitude)

    const url = `http://maps.apple.com/?daddr=${latitude},${longitude}${
      label ? `&dname=${encodeURIComponent(label)}` : ''
    }`

    try {
      await Linking.openURL(url)
    } catch (error) {
      if (__DEV__) {
        console.error('[MapService] Erro ao abrir Apple Maps:', error)
      }
      throw new Error('Não foi possível abrir o Apple Maps')
    }
  }
}
