/**
 * Remove all non-numeric characters from string
 */
function cleanNumeric(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Validates Brazilian CEP (postal code) format
 * @param cep - CEP string (can be masked or unmasked)
 * @returns true if valid format (8 digits)
 */
export function validateCEP(cep: string): boolean {
  const cleaned = cleanNumeric(cep)
  return cleaned.length === 8
}

/**
 * Validates Brazilian CPF (individual tax ID)
 * @param cpf - CPF string (can be masked or unmasked)
 * @returns true if valid CPF with correct check digits
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = cleanNumeric(cpf)

  // Must have exactly 11 digits
  if (cleaned.length !== 11) return false

  // Reject known invalid patterns (all same digit)
  if (/^(\d)\1+$/.test(cleaned)) return false

  // Validate first check digit
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  let checkDigit = 11 - (sum % 11)
  if (checkDigit >= 10) checkDigit = 0
  if (checkDigit !== parseInt(cleaned.charAt(9))) return false

  // Validate second check digit
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  checkDigit = 11 - (sum % 11)
  if (checkDigit >= 10) checkDigit = 0
  if (checkDigit !== parseInt(cleaned.charAt(10))) return false

  return true
}

/**
 * Validates Brazilian CNPJ (company tax ID)
 * @param cnpj - CNPJ string (can be masked or unmasked)
 * @returns true if valid CNPJ with correct check digits
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cleanNumeric(cnpj)

  // Must have exactly 14 digits
  if (cleaned.length !== 14) return false

  // Reject known invalid patterns (all same digit)
  if (/^(\d)\1+$/.test(cleaned)) return false

  // Validate first check digit
  let sum = 0
  let weight = 5
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  let checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (checkDigit !== parseInt(cleaned.charAt(12))) return false

  // Validate second check digit
  sum = 0
  weight = 6
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (checkDigit !== parseInt(cleaned.charAt(13))) return false

  return true
}

/**
 * Validates Brazilian RG format (basic length check)
 * Note: RG doesn't have a standard validation algorithm
 * @param rg - RG string (can be masked or unmasked)
 * @returns true if format is valid (9 digits)
 */
export function validateRG(rg: string): boolean {
  const cleaned = cleanNumeric(rg)
  // Most RGs have 9 digits, but can vary by state
  return cleaned.length >= 7 && cleaned.length <= 10
}

/**
 * Validates Brazilian phone number format
 * @param phone - Phone string (can be masked or unmasked)
 * @returns true if valid format (10-11 digits)
 */
export function validatePhone(phone: string): boolean {
  const cleaned = cleanNumeric(phone)
  // 10 digits (landline) or 11 digits (cellphone with 9)
  return cleaned.length === 10 || cleaned.length === 11
}

/**
 * Exports for use with Zod schemas
 */
export const validators = {
  cep: validateCEP,
  cpf: validateCPF,
  cnpj: validateCNPJ,
  rg: validateRG,
  phone: validatePhone,
}
