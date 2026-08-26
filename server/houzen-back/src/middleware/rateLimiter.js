const rateLimit = require('express-rate-limit');

const commonOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisiÃ§Ãµes. Tente novamente mais tarde.' }
};

const generalLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  max: 300
});

const authLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { error: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.' }
});

const registrationLimiter = rateLimit({
  ...commonOptions,
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Limite de cadastros atingido. Tente novamente mais tarde.' }
});

const passwordResetLimiter = rateLimit({
  ...commonOptions,
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Limite de recuperaÃ§Ãµes atingido. Tente novamente mais tarde.' }
});

module.exports = {
  generalLimiter,
  authLimiter,
  registrationLimiter,
  passwordResetLimiter
};
