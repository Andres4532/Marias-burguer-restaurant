/** Permite localhost y URLs sin TLD (p. ej. imágenes subidas al servidor). */
export const HTTP_URL_VALIDATION_OPTIONS = {
  require_tld: false,
  protocols: ['http', 'https'],
};
