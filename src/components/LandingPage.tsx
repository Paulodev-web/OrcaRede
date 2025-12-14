'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { 
  Zap, 
  Clock, 
  FileText, 
  AlertTriangle, 
  Database, 
  Calculator, 
  Download,
  Check,
  ArrowRight,
  Play,
  Shield,
  TrendingUp,
  Users
} from 'lucide-react';
import Link from 'next/link';

// Componente de animação reutilizável
const AnimatedSection = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.6,
            delay,
            ease: [0.25, 0.4, 0.25, 1]
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
};

// Header Sticky com Glassmorphism
const Header = () => {
  const [scrolled, setScrolled] = React.useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 backdrop-blur-lg shadow-lg border-b border-slate-200' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-slate-900">OrçaRede</span>
          </div>

          {/* Navigation - Hidden on mobile */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#funcionalidades" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">
              Funcionalidades
            </a>
            <a href="#precos" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">
              Preços
            </a>
            <a href="#faq" className="text-slate-700 hover:text-blue-600 transition-colors font-medium">
              FAQ
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link
              href="/login"
              className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 text-slate-700 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-all font-medium"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="px-3 sm:px-6 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-600/30"
            >
              Começar Agora
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

// Hero Section
const HeroSection = () => {
  return (
    <section className="relative pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-60 -left-40 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 sm:space-y-8">
            <AnimatedSection>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-200"
              >
                ⚡ Sistema de Orçamentos Inteligente
              </motion.div>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                Orçamentos de Infraestrutura Elétrica em{' '}
                <span className="text-blue-600 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Minutos
                </span>
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
                Abandone as planilhas. Padronize composições, elimine erros e gere propostas 
                profissionais automaticamente.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="group px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold text-lg shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 flex items-center justify-center space-x-2"
                >
                  <span>Testar Gratuitamente</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="group px-8 py-4 border-2 border-slate-300 text-slate-700 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-all font-semibold text-lg flex items-center justify-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>Ver Demonstração</span>
                </button>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Sem cartão de crédito</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Cancele quando quiser</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Suporte dedicado</span>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Right - Floating Dashboard Preview */}
          <AnimatedSection delay={0.5}>
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative"
            >
              <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                {/* Mock Dashboard */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-8 bg-slate-700 rounded w-3/4 animate-pulse"></div>
                    <div className="h-8 bg-slate-700 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-blue-50 rounded-lg border border-blue-200"></div>
                    <div className="h-24 bg-green-50 rounded-lg border border-green-200"></div>
                  </div>
                  <div className="h-32 bg-slate-50 rounded-lg border border-slate-200"></div>
                  <div className="h-24 bg-slate-50 rounded-lg border border-slate-200"></div>
                </div>
              </div>
              
              {/* Floating elements */}
              <motion.div
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-6 -right-6 bg-white p-4 rounded-xl shadow-xl border border-slate-200"
              >
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-slate-700">PDF Gerado</span>
                </div>
              </motion.div>

              <motion.div
                animate={{
                  y: [0, 15, 0],
                  rotate: [0, -5, 0]
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
                className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-slate-200"
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-700">+234% Mais Rápido</span>
                </div>
              </motion.div>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

// Pain Points Section
const PainPointsSection = () => {
  const painPoints = [
    {
      icon: AlertTriangle,
      title: 'Erros de Fórmula',
      description: 'Um erro no Excel pode custar o lucro da obra inteira.',
      color: 'red'
    },
    {
      icon: Clock,
      title: 'Lentidão',
      description: 'Dias perdidos apenas levantando quantitativos.',
      color: 'orange'
    },
    {
      icon: FileText,
      title: 'Propostas Amadoras',
      description: 'Orçamentos que não passam credibilidade ao cliente.',
      color: 'yellow'
    }
  ];

  const colorClasses = {
    red: 'bg-red-50 border-red-200 text-red-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600'
  };

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              O jeito antigo está te custando dinheiro
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
              Planilhas e métodos manuais estão sabotando sua produtividade
            </p>
          </div>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {painPoints.map((point, index) => (
            <AnimatedSection key={index} delay={index * 0.1}>
              <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all"
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 border-2 ${colorClasses[point.color as keyof typeof colorClasses]}`}>
                  <point.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                  {point.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {point.description}
                </p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

// Solution Section (Bento Grid)
const SolutionSection = () => {
  const features = [
    {
      icon: Database,
      title: 'Banco de Composições',
      description: 'Biblioteca completa de composições padronizadas e testadas. Crie suas próprias ou use templates prontos.',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: Calculator,
      title: 'Cálculo Automático',
      description: 'Quantitativos calculados automaticamente. Zero margem para erros humanos.',
      gradient: 'from-green-500 to-green-600'
    },
    {
      icon: Download,
      title: 'Exportação em PDF',
      description: 'Propostas profissionais com sua marca. Impressione seus clientes desde o primeiro contato.',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      icon: Shield,
      title: 'Seguro e Confiável',
      description: 'Dados criptografados e backups automáticos. Seus orçamentos sempre protegidos.',
      gradient: 'from-red-500 to-red-600'
    },
    {
      icon: TrendingUp,
      title: 'Análise de Margem',
      description: 'Visualize suas margens em tempo real. Tome decisões baseadas em dados reais.',
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      icon: Users,
      title: 'Colaboração em Equipe',
      description: 'Trabalhe em equipe com segurança. Controle de permissões e histórico de alterações.',
      gradient: 'from-indigo-500 to-indigo-600'
    }
  ];

  return (
    <section id="funcionalidades" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Tudo que você precisa para orçar com{' '}
              <span className="text-blue-600">excelência</span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
              Funcionalidades desenvolvidas para engenheiros que buscam produtividade e precisão
            </p>
          </div>
        </AnimatedSection>

        {/* Bento Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <AnimatedSection key={index} delay={index * 0.1}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="group bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 sm:p-8 border-2 border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

// Stats Section
const StatsSection = () => {
  const stats = [
    { value: '95%', label: 'Redução de Erros' },
    { value: '10x', label: 'Mais Rápido' },
    { value: '500+', label: 'Empresas Confiam' },
    { value: '24/7', label: 'Suporte Dedicado' }
  ];

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {stats.map((stat, index) => (
            <AnimatedSection key={index} delay={index * 0.1}>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-400 text-sm sm:text-base">
                  {stat.label}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

// Pricing Section
const PricingSection = () => {
  const plans = [
    {
      name: 'Starter',
      price: 'R$ 97',
      period: '/mês',
      description: 'Perfeito para pequenas empresas começando',
      features: [
        'Até 50 orçamentos/mês',
        'Banco de composições básico',
        'Exportação em PDF',
        'Suporte por email',
        '1 usuário'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: 'R$ 297',
      period: '/mês',
      description: 'Ideal para empresas em crescimento',
      features: [
        'Orçamentos ilimitados',
        'Banco de composições completo',
        'Exportação personalizada',
        'Suporte prioritário',
        'Até 5 usuários',
        'Análise de margem',
        'API de integração'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'Para grandes empresas com necessidades específicas',
      features: [
        'Tudo do Professional',
        'Usuários ilimitados',
        'Gerente de conta dedicado',
        'Treinamento personalizado',
        'SLA garantido',
        'Infraestrutura dedicada',
        'Desenvolvimento customizado'
      ],
      popular: false
    }
  ];

  return (
    <section id="precos" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Planos que crescem com você
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
              Escolha o plano ideal para sua empresa. Todos incluem 14 dias de teste grátis.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <AnimatedSection key={index} delay={index * 0.1}>
              <motion.div
                whileHover={{ y: -10 }}
                className={`relative rounded-2xl p-8 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-2xl border-4 border-blue-500'
                    : 'bg-white border-2 border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-slate-900 px-4 py-1 rounded-full text-sm font-bold">
                      Mais Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${plan.popular ? 'text-blue-100' : 'text-slate-600'}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                      {plan.price}
                    </span>
                    <span className={`ml-2 ${plan.popular ? 'text-blue-100' : 'text-slate-600'}`}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className={`w-5 h-5 mr-3 flex-shrink-0 ${
                        plan.popular ? 'text-blue-200' : 'text-green-600'
                      }`} />
                      <span className={`text-sm ${plan.popular ? 'text-blue-50' : 'text-slate-600'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Começar Teste Grátis
                </Link>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.4}>
          <div className="mt-12 text-center">
            <p className="text-slate-600">
              Todos os planos incluem 14 dias de teste gratuito. Sem cartão de crédito necessário.
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

// FAQ Section
const FAQSection = () => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const faqs = [
    {
      question: 'Como funciona o período de teste gratuito?',
      answer: 'Você tem 14 dias para testar todas as funcionalidades sem compromisso. Não pedimos cartão de crédito e você pode cancelar a qualquer momento.'
    },
    {
      question: 'Posso importar minhas planilhas existentes?',
      answer: 'Sim! Oferecemos suporte para importação de planilhas Excel. Nossa equipe pode auxiliar na migração dos seus dados.'
    },
    {
      question: 'Os dados são seguros?',
      answer: 'Absolutamente. Utilizamos criptografia de ponta a ponta, backups automáticos diários e infraestrutura em nuvem de nível empresarial.'
    },
    {
      question: 'Posso personalizar as composições?',
      answer: 'Sim! Você pode criar suas próprias composições, adaptar as existentes e construir uma biblioteca personalizada para sua empresa.'
    }
  ];

  return (
    <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-3xl mx-auto">
        <AnimatedSection>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-lg sm:text-xl text-slate-600">
              Tudo o que você precisa saber sobre o OrçaRede
            </p>
          </div>
        </AnimatedSection>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <AnimatedSection key={index} delay={index * 0.1}>
              <motion.div
                className="bg-slate-50 rounded-xl border-2 border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-slate-100 transition-colors"
                >
                  <span className="font-semibold text-slate-900 pr-4">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ArrowRight className="w-5 h-5 text-slate-600 transform rotate-90" />
                  </motion.div>
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openIndex === index ? 'auto' : 0,
                    opacity: openIndex === index ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5 text-slate-600">
                    {faq.answer}
                  </div>
                </motion.div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Final Section
const CTASection = () => {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <AnimatedSection>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Pronto para profissionalizar seus orçamentos?
          </h2>
          <p className="text-lg sm:text-xl text-slate-300 mb-8 sm:mb-12 max-w-2xl mx-auto">
            Junte-se a centenas de empresas que já transformaram sua forma de orçar
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="group px-8 sm:px-12 py-4 sm:py-5 bg-white text-blue-600 rounded-lg hover:bg-slate-50 transition-all font-bold text-lg shadow-2xl hover:shadow-3xl flex items-center space-x-2"
            >
              <span>Começar Gratuitamente</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="px-8 sm:px-12 py-4 sm:py-5 border-2 border-white text-white rounded-lg hover:bg-white/10 transition-all font-bold text-lg"
            >
              Já tenho uma conta
            </Link>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.3}>
          <div className="mt-8 sm:mt-12 flex flex-wrap justify-center items-center gap-6 text-slate-300">
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-sm">14 dias grátis</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-sm">Sem cartão de crédito</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-sm">Cancele quando quiser</span>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

// Footer
const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">OrçaRede</span>
            </div>
            <p className="text-slate-400 max-w-md">
              Transformando a forma como empresas orçam infraestrutura elétrica.
              Mais rápido, mais preciso, mais profissional.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Produto</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a></li>
              <li><a href="#precos" className="hover:text-white transition-colors">Preços</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Empresa</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-center text-slate-400">
          <p>&copy; 2025 OrçaRede. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

// Main Landing Page Component
export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <PainPointsSection />
      <SolutionSection />
      <StatsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};
