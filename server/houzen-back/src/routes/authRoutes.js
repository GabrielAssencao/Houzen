const express = require('express');

const authController = require('../controllers/authController');
const {
  requireAdmin,
  requireAuth,
  requireSuperAdmin,
  requirePasswordChangeCompleted,
  requireAnyModulePermission
} = require('../middleware/auth');
const {
  authLimiter,
  passwordResetLimiter,
  registrationLimiter
} = require('../middleware/rateLimiter');
const {
  validarIdParam,
  validarLogin,
  validarRegistro,
  validarForgotPassword,
  validarTrocaSenhaTemporaria,
  validarRejeicaoReset,
  validarResolucaoReset,
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
  validarTema,
  validarAdminObra,
  validarAdminSede,
  validarAdminFuncionario,
  validarAdminSuprimento,
  validarAdminFrota,
  validarAdminCronograma
} = require('../middleware/validators');

const router = express.Router();

router.post('/usuarios/registrar_teste', registrationLimiter, validarRegistro, authController.registrarUsuarioTeste);
router.post('/forgot-password', passwordResetLimiter, validarForgotPassword, authController.requestPasswordReset);
router.post('/login', authLimiter, validarLogin, authController.login);
router.post('/google', authLimiter, validarGoogleLogin, authController.googleLogin);

router.use(requireAuth);

router.get('/session', authController.getSession);
router.put('/change-temporary-password', authLimiter, validarTrocaSenhaTemporaria, authController.changeTemporaryPassword);
router.put('/preferences/theme', validarTema, authController.updateThemePreference);
router.use(requirePasswordChangeCompleted);
router.get('/dashboard/resumo', requireAnyModulePermission('dashboard'), authController.getDashboardResumo);

router.get('/rh/funcionarios', requireAnyModulePermission('rh'), authController.getFuncionarios);
router.post('/rh/funcionarios', requireAnyModulePermission('rh'), validarFuncionario, authController.criarFuncionario);
router.put('/rh/funcionarios/:id', requireAnyModulePermission('rh'), validarIdParam, validarFuncionario, authController.editarFuncionario);
router.delete('/rh/funcionarios/:id', requireAnyModulePermission('rh'), validarIdParam, authController.deletarFuncionario);

router.get('/suprimentos', requireAnyModulePermission('suprimentos'), authController.getSuprimentos);
router.post('/suprimentos', requireAnyModulePermission('suprimentos'), validarSuprimento, authController.criarSuprimento);
router.put('/suprimentos/:id', requireAnyModulePermission('suprimentos'), validarIdParam, validarSuprimento, authController.editarSuprimento);
router.delete('/suprimentos/:id', requireAnyModulePermission('suprimentos'), validarIdParam, authController.deletarSuprimento);

router.get('/sedes', requireAnyModulePermission('suprimentos', 'frota', 'obras'), authController.getSedes);
router.post('/sedes', requireAnyModulePermission('suprimentos', 'frota', 'obras'), validarSede, authController.criarSede);

router.get('/frota', requireAnyModulePermission('frota'), authController.getFrota);
router.post('/frota', requireAnyModulePermission('frota'), validarFrota, authController.criarFrota);
router.put('/frota/:id', requireAnyModulePermission('frota'), validarIdParam, validarFrota, authController.editarFrota);
router.delete('/frota/:id', requireAnyModulePermission('frota'), validarIdParam, authController.deletarFrota);

router.get('/cronograma', requireAnyModulePermission('cronograma'), authController.getCronograma);
router.post('/cronograma', requireAnyModulePermission('cronograma'), validarCronograma, authController.criarCronograma);
router.put('/cronograma/:id', requireAnyModulePermission('cronograma'), validarIdParam, validarStatusCronograma, authController.atualizarStatusCronograma);
router.delete('/cronograma/:id', requireAnyModulePermission('cronograma'), validarIdParam, authController.deletarCronograma);

router.get('/obras', requireAnyModulePermission('dashboard', 'obras', 'rh', 'suprimentos', 'frota', 'cronograma'), authController.getObras);
router.post('/obras', requireAnyModulePermission('obras', 'cronograma'), validarObra, authController.criarObra);
router.put('/obras/:id', requireAnyModulePermission('obras', 'cronograma'), validarIdParam, validarObra, authController.editarObra);
router.delete('/obras/:id', requireAnyModulePermission('obras', 'cronograma'), validarIdParam, authController.deletarObra);

router.use('/admin', requireAdmin);
router.get('/admin/password-reset-requests', requireSuperAdmin, authController.listPasswordResetRequests);
router.post('/admin/password-reset-requests/:id/resolve', requireSuperAdmin, validarIdParam, validarResolucaoReset, authController.resolvePasswordResetRequest);
router.put('/admin/password-reset-requests/:id/reject', requireSuperAdmin, validarIdParam, validarRejeicaoReset, authController.rejectPasswordResetRequest);
router.get('/admin/usuarios', authController.listarUsuariosAdmin);
router.post('/admin/usuarios', validarUsuarioEmpresa, authController.criarUsuarioEmpresa);
router.get('/admin/usuarios/:id/obras', validarIdParam, authController.getObrasAdmin);
router.get('/admin/usuarios/:id/sedes', validarIdParam, authController.getSedesAdmin);
router.post('/admin/popular/obra', validarAdminObra, authController.popularObraAdmin);
router.post('/admin/popular/sede', validarAdminSede, authController.popularSedeAdmin);
router.post('/admin/popular/funcionario', validarAdminFuncionario, authController.popularFuncionarioAdmin);
router.post('/admin/popular/suprimento', validarAdminSuprimento, authController.popularSuprimentoAdmin);
router.post('/admin/popular/frota', validarAdminFrota, authController.popularFrotaAdmin);
router.post('/admin/popular/cronograma', validarAdminCronograma, authController.popularCronogramaAdmin);
router.put('/admin/usuarios/:id', requireSuperAdmin, validarIdParam, validarAcessoUsuario, authController.atualizarAcessoUsuario);
router.delete('/admin/usuarios/:id', requireSuperAdmin, validarIdParam, authController.excluirUsuario);

module.exports = router;
