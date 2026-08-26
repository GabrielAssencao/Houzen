const express = require('express');

const authController = require('../controllers/authController');
const { requireAdmin, requireAuth } = require('../middleware/auth');
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
} = require('../middleware/validators');

const router = express.Router();

router.post('/usuarios/registrar_teste', registrationLimiter, validarRegistro, authController.registrarUsuarioTeste);
router.post('/forgot-password', passwordResetLimiter, validarForgotPassword, authController.forgotPassword);
router.put('/reset-password', authLimiter, validarResetPassword, authController.resetPassword);
router.post('/login', authLimiter, validarLogin, authController.login);
router.post('/google', authLimiter, validarGoogleLogin, authController.googleLogin);

router.use(requireAuth);

router.get('/session', authController.getSession);
router.get('/dashboard/resumo', authController.getDashboardResumo);

router.get('/rh/funcionarios', authController.getFuncionarios);
router.post('/rh/funcionarios', validarFuncionario, authController.criarFuncionario);
router.put('/rh/funcionarios/:id', validarIdParam, validarFuncionario, authController.editarFuncionario);
router.delete('/rh/funcionarios/:id', validarIdParam, authController.deletarFuncionario);

router.get('/suprimentos', authController.getSuprimentos);
router.post('/suprimentos', validarSuprimento, authController.criarSuprimento);
router.put('/suprimentos/:id', validarIdParam, validarSuprimento, authController.editarSuprimento);
router.delete('/suprimentos/:id', validarIdParam, authController.deletarSuprimento);

router.get('/sedes', authController.getSedes);
router.post('/sedes', validarSede, authController.criarSede);

router.get('/frota', authController.getFrota);
router.post('/frota', validarFrota, authController.criarFrota);
router.put('/frota/:id', validarIdParam, validarFrota, authController.editarFrota);
router.delete('/frota/:id', validarIdParam, authController.deletarFrota);

router.get('/cronograma', authController.getCronograma);
router.post('/cronograma', validarCronograma, authController.criarCronograma);
router.put('/cronograma/:id', validarIdParam, validarStatusCronograma, authController.atualizarStatusCronograma);
router.delete('/cronograma/:id', validarIdParam, authController.deletarCronograma);

router.get('/obras', authController.getObras);
router.post('/obras', validarObra, authController.criarObra);
router.put('/obras/:id', validarIdParam, validarObra, authController.editarObra);
router.delete('/obras/:id', validarIdParam, authController.deletarObra);

router.use('/admin', requireAdmin);
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
router.put('/admin/usuarios/:id', validarIdParam, validarAcessoUsuario, authController.atualizarAcessoUsuario);
router.delete('/admin/usuarios/:id', validarIdParam, authController.excluirUsuario);

module.exports = router;
