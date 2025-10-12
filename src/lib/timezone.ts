import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TIMEZONE = 'America/Sao_Paulo'; // Horário de Brasília

/**
 * Retorna a data/hora atual no timezone de Brasília
 */
export const getBrasiliaDate = (): Date => {
  return toZonedTime(new Date(), TIMEZONE);
};

/**
 * Converte uma data para o timezone de Brasília
 */
export const toBrasiliaTime = (date: Date | string): Date => {
  return toZonedTime(date, TIMEZONE);
};

/**
 * Formata uma data no timezone de Brasília
 */
export const formatBrasiliaDate = (
  date: Date | string,
  formatStr: string = 'dd/MM/yyyy HH:mm:ss'
): string => {
  return formatInTimeZone(date, TIMEZONE, formatStr, { locale: ptBR });
};

/**
 * Retorna a data atual de Brasília formatada como YYYY-MM-DD
 */
export const getTodayBrasilia = (): string => {
  return formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd');
};

/**
 * Retorna a hora atual de Brasília formatada como HH:mm:ss
 */
export const getCurrentTimeBrasilia = (): string => {
  return formatInTimeZone(new Date(), TIMEZONE, 'HH:mm:ss');
};

/**
 * Retorna a hora atual de Brasília formatada como HH:mm
 */
export const getCurrentTimeShortBrasilia = (): string => {
  return formatInTimeZone(new Date(), TIMEZONE, 'HH:mm');
};

/**
 * Converte uma data de Brasília para UTC (para salvar no banco)
 */
export const brasiliaToUtc = (date: Date | string): Date => {
  return fromZonedTime(date, TIMEZONE);
};

export { TIMEZONE };
