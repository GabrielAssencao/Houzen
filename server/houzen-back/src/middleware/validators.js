const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados invÃ¡lidos.',
      detalhes: errors.array().map((item) => ({ campo: item.path, msg: item.msg }))
    });
  }
  return next();
};

const validarIdParam = [
  param('id').isInt({ min: 1 }).withMessage('id invÃ¡lido'),
  handleValidationErrors
];

const validarLogin = [
  body('email').trim().isEmail().withMessage('e-mail invÃ¡lido').normalizeEmail(),
  body('senha').isString().isLength({ min: 1, max: 72 }).withMessage('senha invÃ¡lida'),
  handleValidationErrors
];

const validarRegistro = [
  body('nome').trim().isLength({ min: 2, max: 100 }).withMessage('nome invÃ¡lido'),
  body('email').trim().isEmail().withMessage('e-mail invÃ¡lido').normalizeEmail(),
  body('senha').isString().isLength({ min: 8, max: 72 }).withMessage('senha precisa ter entre 8 e 72 caracteres'),
  body('nivel').optional().equals('comum').withMessage('nÃ­vel nÃ£o pode ser definido no cadastro pÃºblico'),
  handleValidationErrors
];

const validarForgotPassword = [
  body('email').trim().isEmail().withMessage('e-mail invÃ¡lido').normalizeEmail(),
  handleValidationErrors
];

const validarResetPassword = [
  body('token').isString().matches(/^[a-f0-9]{64}$/i).withMessage('token invÃ¡lido'),
  body('novaSenha').isString().isLength({ min: 8, max: 72 }).withMessage('senha precisa ter entre 8 e 72 caracteres'),
  handleValidationErrors
];

const validarGoogleLogin = [
  body('idToken').isString().isLength({ min: 100, max: 5000 }).withMessage('token do Google invÃ¡lido'),
  handleValidationErrors
];

const validarObra = [
  body('nome').trim().isLength({ min: 1, max: 255 }).withMessage('nome invÃ¡lido'),
  body('receitas').customSanitizer((value) => value === '' || value == null ? 0 : value).isFloat({ min: 0, max: 99999999.99 }).withMessage('receitas invÃ¡lidas').toFloat(),
  body('despesas').customSanitizer((value) => value === '' || value == null ? 0 : value).isFloat({ min: 0, max: 99999999.99 }).withMessage('despesas invÃ¡lidas').toFloat(),
  body('status').optional().trim().isLength({ min: 1, max: 50 }).withMessage('status invÃ¡lido'),
  handleValidationErrors
];

const validarFuncionario = [
  body('nome').trim().isLength({ min: 1, max: 255 }),
  body('cargo').trim().isLength({ min: 1, max: 255 }),
  body('departamento').trim().isLength({ min: 1, max: 255 }),
  body('horas').optional().trim().isLength({ max: 50 }),
  body('salario').isFloat({ min: 0, max: 99999999.99 }).withMessage('salÃ¡rio invÃ¡lido'),
  body('status').optional().trim().isLength({ min: 1, max: 50 }),
  body('obra_id').isInt({ min: 1 }).withMessage('obra_id invÃ¡lido'),
  handleValidationErrors
];

const validarDestino = body().custom((payload) => {
  const hasObra = Number.isInteger(payload.obra_id) && payload.obra_id > 0;
  const hasSede = Number.isInteger(payload.sede_id) && payload.sede_id > 0;
  if (hasObra === hasSede) {
    throw new Error('informe exatamente uma obra ou sede');
  }
  return true;
});

const validarSuprimento = [
  body('nome').trim().isLength({ min: 1, max: 255 }),
  body('categoria').trim().isLength({ min: 1, max: 100 }),
  body('qtd').trim().isLength({ min: 1, max: 100 }),
  body('preco').isFloat({ min: 0, max: 99999999.99 }).withMessage('preÃ§o invÃ¡lido'),
  body('fornecedor').trim().isLength({ min: 1, max: 255 }),
  body('status').optional().trim().isLength({ min: 1, max: 50 }),
  body('obra_id').optional({ nullable: true }).isInt({ min: 1 }),
  body('sede_id').optional({ nullable: true }).isInt({ min: 1 }),
  validarDestino,
  handleValidationErrors
];

const validarSede = [
  body('nome').trim().isLength({ min: 1, max: 255 }),
  handleValidationErrors
];

const validarFrota = [
  body('nome').trim().isLength({ min: 1, max: 255 }),
  body('tipo').trim().isLength({ min: 1, max: 100 }),
  body('codigo').trim().isLength({ min: 1, max: 50 }),
  body('operador').optional().trim().isLength({ max: 255 }),
  body('manutencao').optional().trim().isLength({ max: 100 }),
  body('status').optional().trim().isLength({ min: 1, max: 50 }),
  body('obra_id').optional({ nullable: true }).isInt({ min: 1 }),
  body('sede_id').optional({ nullable: true }).isInt({ min: 1 }),
  validarDestino,
  handleValidationErrors
];

const validarCronograma = [
  body('fase').trim().isLength({ min: 1, max: 255 }),
  body('descricao').trim().isLength({ min: 1, max: 5000 }),
  body('prazo').trim().isLength({ min: 1, max: 50 }),
  body('status').optional().trim().isLength({ min: 1, max: 50 }),
  body('ordem').customSanitizer((value) => value === '' || value == null ? 10 : value).isInt({ min: 0, max: 100000 }).toInt(),
  body('obra_id').isInt({ min: 1 }).withMessage('obra_id invÃ¡lido'),
  handleValidationErrors
];

const validarStatusCronograma = [
  body('status').trim().isLength({ min: 1, max: 50 }),
  handleValidationErrors
];

const validarUsuarioEmpresa = [
  body('nome').trim().isLength({ min: 2, max: 100 }),
  body('email').trim().isEmail().withMessage('e-mail invÃ¡lido').normalizeEmail(),
  body('senha').isString().isLength({ min: 8, max: 72 }).withMessage('senha precisa ter entre 8 e 72 caracteres'),
  body('nivel').optional().isIn(['comum', 'admin', 'empresa', 'operador']),
  body('status').optional().isIn(['ativo', 'inativo', 'suspenso']),
  body('permissoes').optional().isArray({ max: 20 }),
  body('permissoes.*').optional().isString().isLength({ min: 1, max: 50 }),
  handleValidationErrors
];

const validarAcessoUsuario = [
  body('nivel').isIn(['comum', 'admin', 'empresa', 'operador']),
  body('status').isIn(['ativo', 'inativo', 'suspenso']),
  body('permissoes').isArray({ max: 20 }),
  body('permissoes.*').isString().isLength({ min: 1, max: 50 }),
  handleValidationErrors
];

const validarUsuarioAlvo = body('usuario_id').isInt({ min: 1 }).toInt().withMessage('usuÃ¡rio alvo invÃ¡lido');
const normalizarObra = body('obra_id').customSanitizer((value) => value === '' ? null : value).optional({ nullable: true }).isInt({ min: 1 }).toInt();
const normalizarSede = body('sede_id').customSanitizer((value) => value === '' ? null : value).optional({ nullable: true }).isInt({ min: 1 }).toInt();

const validarAdminObra = [validarUsuarioAlvo, ...validarObra];
const validarAdminSede = [validarUsuarioAlvo, ...validarSede];
const validarAdminFuncionario = [
  validarUsuarioAlvo,
  body('nome').trim().isLength({ min: 1, max: 255 }),
  body('cargo').trim().isLength({ min: 1, max: 255 }),
  body('salario').isFloat({ min: 0, max: 99999999.99 }),
  body('status').optional().trim().isLength({ min: 1, max: 50 }),
  body('obra_id').isInt({ min: 1 }).toInt(),
  handleValidationErrors
];
const validarAdminSuprimento = [
  validarUsuarioAlvo,
  body('nome').trim().isLength({ min: 1, max: 255 }),
  body('qtd').trim().isLength({ min: 1, max: 100 }),
  body('preco').isFloat({ min: 0, max: 99999999.99 }),
  normalizarObra,
  normalizarSede,
  validarDestino,
  handleValidationErrors
];
const validarAdminFrota = [
  validarUsuarioAlvo,
  body('nome').trim().isLength({ min: 1, max: 255 }),
  body('tipo').trim().isLength({ min: 1, max: 100 }),
  body('codigo').trim().isLength({ min: 1, max: 50 }),
  body('status').optional().trim().isLength({ min: 1, max: 50 }),
  normalizarObra,
  normalizarSede,
  validarDestino,
  handleValidationErrors
];
const validarAdminCronograma = [
  validarUsuarioAlvo,
  body('obra_id').isInt({ min: 1 }).toInt(),
  body('fase').trim().isLength({ min: 1, max: 255 }),
  body('prazo').trim().isLength({ min: 1, max: 50 }),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validarIdParam,
  validarLogin,
  validarRegistro,
  validarForgotPassword,
  validarResetPassword,
  validarGoogleLogin,
  validarObra,
  validarFuncionario,
  validarSuprimento,
  validarSede,
  validarFrota,
  validarCronograma,
  validarStatusCronograma,
  validarUsuarioEmpresa,
  validarAcessoUsuario,
  validarAdminObra,
  validarAdminSede,
  validarAdminFuncionario,
  validarAdminSuprimento,
  validarAdminFrota,
  validarAdminCronograma
};
