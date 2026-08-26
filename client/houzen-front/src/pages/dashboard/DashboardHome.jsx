import { useEffect, useState } from 'react';
import axios from 'axios';

import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Box,
  Briefcase
} from 'lucide-react';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function DashboardHome() {

  const [resumo, setResumo] = useState({
    despesas: 0,
    receitas: 0,
    obras_andamento: 0,
    obras_finalizadas: 0,
    funcionarios: 0,
    equipamentos: 0,
    lista_obras: []
  });

  const [, setCarregando] = useState(true);

  // FORMATADOR GLOBAL DE MOEDA
  const formatarMoeda = (valor) => {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  };

  // API
  const API_URL =
    import.meta.env.VITE_API_URL ||
    'https://houzen-back.onrender.com';

  useEffect(() => {

    const userStorage = localStorage.getItem('@Houzen:user');

    const config = {};

    if (userStorage) {

      const user = JSON.parse(userStorage);

      config.headers = {
        Authorization: `Bearer ${user.token}`
      };

    }

    axios
      .get(`${API_URL}/api/auth/dashboard/resumo`, config)
      .then((res) => {

        setResumo(res.data);
        setCarregando(false);

      })
      .catch((error) => {

        console.error(
          'Erro ao conectar com a API Multi-Obras:',
          error
        );

        setCarregando(false);

      });

  }, [API_URL]);

  const despesasAtuais =
    Number(resumo.despesas) || 0;

  const receitasAtuais =
    Number(resumo.receitas) || 0;

  const saldoGlobal =
    receitasAtuais - despesasAtuais;

  // DADOS DO GRÁFICO PRINCIPAL
  const dadosGrafico = [
    { name: 'Jan', Receitas: 0, Despesas: 0 },
    { name: 'Fev', Receitas: 0, Despesas: 0 },
    { name: 'Mar', Receitas: 0, Despesas: 0 },
    { name: 'Abr', Receitas: 0, Despesas: 0 },
    {
      name: 'Mai',
      Receitas: receitasAtuais,
      Despesas: despesasAtuais
    },
  ];

  // DADOS DO GRÁFICO MOBILE
  const dadosPizza = [
    {
      name: 'Receitas',
      value: receitasAtuais,
    },
    {
      name: 'Despesas',
      value: despesasAtuais,
    },
  ];

  const COLORS = ['#10B981', '#EF4444'];

  return (

    <div style={{ color: '#FFFFFF' }}>

      {/* CABEÇALHO */}
      <div className="mb-4">

        <h1
          className="fw-bold fs-3 mb-1"
          style={{ letterSpacing: '-0.5px' }}
        >
          Painel Executivo
        </h1>

        <p className="text-secondary small">
          Visão consolidada da carteira de engenharia da empresa
        </p>

      </div>

      {/* CARDS SUPERIORES */}
      <div className="row g-4 mb-4">

        {/* DESPESAS */}
        <div className="col-12 col-md-3">

          <div
            className="card p-3 border-0 rounded-4"
            style={{ backgroundColor: '#151518' }}
          >

            <div className="d-flex justify-content-between align-items-center mb-2">

              <span className="text-secondary small fw-medium">
                Despesas Consolidadas
              </span>

              <div className="p-2 rounded bg-danger bg-opacity-10 text-danger">
                <ArrowDownRight size={18} />
              </div>

            </div>

            <h3
              className="fw-bold m-0"
              style={{ color: '#EF4444' }}
            >
              {formatarMoeda(despesasAtuais)}
            </h3>

          </div>

        </div>

        {/* RECEITAS */}
        <div className="col-12 col-md-3">

          <div
            className="card p-3 border-0 rounded-4"
            style={{ backgroundColor: '#151518' }}
          >

            <div className="d-flex justify-content-between align-items-center mb-2">

              <span className="text-secondary small fw-medium">
                Receitas Consolidadas
              </span>

              <div className="p-2 rounded bg-success bg-opacity-10 text-success">
                <ArrowUpRight size={18} />
              </div>

            </div>

            <h3
              className="fw-bold m-0"
              style={{ color: '#10B981' }}
            >
              {formatarMoeda(receitasAtuais)}
            </h3>

          </div>

        </div>

        {/* OBRAS EM ANDAMENTO */}
        <div className="col-12 col-md-3">

          <div
            className="card p-3 border-0 rounded-4"
            style={{ backgroundColor: '#151518' }}
          >

            <div className="d-flex justify-content-between align-items-center mb-2">

              <span className="text-secondary small fw-medium">
                Obras em Andamento
              </span>

              <div className="p-2 rounded bg-warning bg-opacity-10 text-warning">
                <Briefcase size={18} />
              </div>

            </div>

            <h3
              className="fw-bold m-0"
              style={{ color: '#F59E0B' }}
            >
              {resumo.obras_andamento}

              <span className="fs-6 fw-normal text-secondary">
                {' '}ativas
              </span>

            </h3>

          </div>

        </div>

        {/* OBRAS FINALIZADAS */}
        <div className="col-12 col-md-3">

          <div
            className="card p-3 border-0 rounded-4"
            style={{ backgroundColor: '#151518' }}
          >

            <div className="d-flex justify-content-between align-items-center mb-2">

              <span className="text-secondary small fw-medium">
                Obras Finalizadas
              </span>

              <div className="p-2 rounded bg-primary bg-opacity-10 text-primary">
                <Briefcase size={18} />
              </div>

            </div>

            <h3
              className="fw-bold m-0"
              style={{ color: '#3B82F6' }}
            >
              {resumo.obras_finalizadas}

              <span className="fs-6 fw-normal text-secondary">
                {' '}concluídas
              </span>

            </h3>

          </div>

        </div>

      </div>

      {/* ÁREA DOS GRÁFICOS */}
      <div className="row g-4 mb-4">

        {/* GRÁFICO DESKTOP/TABLET */}
        <div className="col-12 col-lg-8 d-none d-md-block">

          <div
            className="card p-4 border-0 rounded-4 h-100"
            style={{ backgroundColor: '#151518' }}
          >

            <div className="d-flex justify-content-between align-items-center mb-4">

              <div>

                <h5
                  className="fw-bold m-0"
                  style={{
                    fontSize: '16px',
                    color: '#FFFFFF'
                  }}
                >
                  Fluxo de Caixa Geral da Empreiteira
                </h5>

                <span className="text-secondary small">
                  Evolução do faturamento total somado
                </span>

              </div>

              <div className="d-flex gap-3 small text-secondary">

                <span className="d-flex align-items-center gap-1.5">

                  <span
                    className="rounded-circle d-inline-block"
                    style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#F97316'
                    }}
                  ></span>

                  Receitas

                </span>

                <span className="d-flex align-items-center gap-1.5">

                  <span
                    className="rounded-circle d-inline-block"
                    style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#EF4444'
                    }}
                  ></span>

                  Despesas

                </span>

              </div>

            </div>

            <div
              style={{
                width: '100%',
                height: 240,
                minWidth: 0
              }}
            >

              <ResponsiveContainer width="100%" height="100%">

                <AreaChart
                  data={dadosGrafico}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0
                  }}
                >

                  <defs>

                    <linearGradient
                      id="colorReceitas"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >

                      <stop
                        offset="5%"
                        stopColor="#F97316"
                        stopOpacity={0.2}
                      />

                      <stop
                        offset="95%"
                        stopColor="#F97316"
                        stopOpacity={0}
                      />

                    </linearGradient>

                    <linearGradient
                      id="colorDespesas"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >

                      <stop
                        offset="5%"
                        stopColor="#EF4444"
                        stopOpacity={0.1}
                      />

                      <stop
                        offset="95%"
                        stopColor="#EF4444"
                        stopOpacity={0}
                      />

                    </linearGradient>

                  </defs>

                  <CartesianGrid
                    stroke="rgba(38, 38, 41, 0.3)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    stroke="#52525B"
                    tickLine={false}
                    style={{ fontSize: '12px' }}
                  />

                  <YAxis
                    stroke="#52525B"
                    tickLine={false}
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) =>
                      `R$ ${(value / 1000).toFixed(0)}k`
                    }
                  />

                  <Tooltip
                    formatter={(value) =>
                      formatarMoeda(Number(value))
                    }
                    contentStyle={{
                      backgroundColor: '#0F0F11',
                      borderColor:
                        'rgba(38, 38, 41, 0.8)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="Receitas"
                    stroke="#F97316"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorReceitas)"
                  />

                  <Area
                    type="monotone"
                    dataKey="Despesas"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDespesas)"
                  />

                </AreaChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div>

        {/* GRÁFICO MOBILE */}
        <div className="col-12 d-block d-md-none">

          <div
            className="card p-4 border-0 rounded-4"
            style={{ backgroundColor: '#151518' }}
          >

            <div className="mb-3">

              <h5
                className="fw-bold m-0 text-white"
                style={{ fontSize: '16px' }}
              >
                Distribuição Financeira
              </h5>

              <span className="text-secondary small">
                Receitas x Despesas
              </span>

            </div>

            <div style={{ width: '100%', height: 280 }}>

              <ResponsiveContainer width="100%" height="100%">

                <PieChart>

                  <Pie
                    data={dadosPizza}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >

                    {dadosPizza.map((entry, index) => (

                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />

                    ))}

                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      formatarMoeda(Number(value))
                    }
                    contentStyle={{
                      backgroundColor: '#0F0F11',
                      border:
                        '1px solid rgba(38, 38, 41, 0.8)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div>

        {/* CARD LATERAL */}
        <div className="col-12 col-lg-4">

          <div
            className="card p-4 border-0 rounded-4 h-100 d-flex flex-column justify-content-between"
            style={{ backgroundColor: '#151518' }}
          >

            <div>

              <span className="text-secondary small fw-medium d-block mb-1">
                Saldo Líquido Geral da Empresa
              </span>

              <h2
                className={`fw-bold m-0 ${
                  saldoGlobal >= 0
                    ? 'text-success'
                    : 'text-danger'
                }`}
                style={{ fontSize: '28px' }}
              >
                {formatarMoeda(saldoGlobal)}
              </h2>

              <span
                className={`badge mt-2 px-2.5 py-1 rounded small ${
                  saldoGlobal >= 0
                    ? 'bg-success bg-opacity-10 text-success'
                    : 'bg-danger bg-opacity-10 text-danger'
                }`}
              >
                {saldoGlobal >= 0
                  ? 'Balanço Geral Positivo'
                  : 'Atenção ao Caixa'}
              </span>

            </div>

            <hr
              style={{
                borderColor:
                  'rgba(38, 38, 41, 0.5)'
              }}
            />

            <div className="d-flex flex-column gap-3">

              <div className="d-flex justify-content-between align-items-center">

                <span className="text-secondary small d-flex align-items-center gap-2">
                  <Users size={16} />
                  Recursos Humanos Ativos
                </span>

                <span className="fw-semibold text-white">
                  {resumo.funcionarios} operários
                </span>

              </div>

              <div className="d-flex justify-content-between align-items-center">

                <span className="text-secondary small d-flex align-items-center gap-2">
                  <Box size={16} />
                  Maquinários Alocados
                </span>

                <span className="fw-semibold text-white">
                  {resumo.equipamentos} ativos
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* DETALHAMENTO INDIVIDUAL DE CADA OBRA */}
      <div
        className="card p-4 border-0 rounded-4 mb-4"
        style={{ backgroundColor: '#151518' }}
      >

        <h5
          className="fw-bold mb-3 text-white"
          style={{ fontSize: '16px' }}
        >
          Desempenho por Canteiro de Obras
        </h5>

        <div className="table-responsive">

          <table
            className="table table-dark table-hover m-0"
            style={{ '--bs-table-bg': 'transparent' }}
          >

            <thead>

              <tr
                className="text-secondary small border-bottom"
                style={{
                  borderColor:
                    'rgba(38, 38, 41, 0.6)'
                }}
              >

                <th className="py-3">
                  Nome do Projeto (Obra)
                </th>

                <th className="py-3">
                  Status
                </th>

                <th className="py-3">
                  Aportes (Receitas)
                </th>

                <th className="py-3">
                  Gastos (Despesas)
                </th>

                <th className="py-3">
                  Lucro do Projeto
                </th>

              </tr>

            </thead>

            <tbody>

              {resumo.lista_obras &&
                resumo.lista_obras.map((obra) => (

                  <tr
                    key={obra.id}
                    className="align-middle border-bottom"
                    style={{
                      borderColor:
                        'rgba(38, 38, 41, 0.2)'
                    }}
                  >

                    <td className="py-3 fw-medium text-white">
                      {obra.nome}
                    </td>

                    <td>

                      <span
                        className={`badge px-2 py-1 rounded small ${
                          obra.status === 'Em Andamento'
                            ? 'bg-warning bg-opacity-10 text-warning'
                            : 'bg-success bg-opacity-10 text-success'
                        }`}
                      >
                        {obra.status}
                      </span>

                    </td>

                    <td className="text-secondary">
                      {formatarMoeda(obra.receitas)}
                    </td>

                    <td className="text-secondary">
                      {formatarMoeda(obra.despesas)}
                    </td>

                    <td
                      className={`fw-semibold ${
                        Number(obra.lucro) >= 0
                          ? 'text-success'
                          : 'text-danger'
                      }`}
                    >
                      {formatarMoeda(obra.lucro)}
                    </td>

                  </tr>

                ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}
