/**
 * Sample Multilingual Resumes and Job Descriptions for Instant Demo & Testing
 */

const SAMPLE_JOB_DESCRIPTIONS = [
  {
    id: 'jd-cloud-engineer',
    title: 'Senior Cloud & Full-Stack Engineer',
    department: 'Engineering / Platform',
    experienceRequired: '5+ Years',
    description: `Title: Senior Cloud & Full-Stack Engineer
Department: Core Infrastructure & Web Engineering
Location: Global / Remote (Cross-functional team)

Overview:
We are seeking a Senior Cloud & Full-Stack Engineer to architect, build, and maintain high-scale distributed applications. You will collaborate with international teams across Europe, North America, and the Middle East.

Key Responsibilities:
- Design and deploy cloud infrastructure using AWS or GCP with microservices architecture.
- Develop robust backend services using Node.js, Python, or Go, and high-performance frontends using React / TypeScript.
- Build CI/CD automation pipelines with Docker and Kubernetes.
- Optimize database queries (PostgreSQL, MongoDB, Redis) for low-latency queries.
- Participate in code reviews, mentor junior engineers, and champion engineering best practices.

Must-Have Requirements:
- 5+ years of software engineering experience in enterprise or high-growth environments.
- Deep hands-on experience with Node.js, React, and RESTful/GraphQL APIs.
- Production experience with Docker, Kubernetes, and Cloud architectures (AWS/Azure/GCP).
- Strong understanding of database schema design and caching strategies.
- Excellent English communication skills (written and spoken) for cross-border collaboration.

Nice to Have:
- Multilingual skills (Spanish, Arabic, French, or German).
- AWS Solutions Architect or Kubernetes (CKA) Certification.
- Experience with AI API integrations (OpenAI, Groq, Anthropic).`
  },
  {
    id: 'jd-global-hr',
    title: 'Global HR & People Operations Manager',
    department: 'Human Resources & Talent',
    experienceRequired: '6+ Years',
    description: `Title: Global HR & People Operations Manager
Department: People & Culture
Location: Remote / Global Multi-Country Support

Overview:
We are looking for an experienced Global HR Manager to oversee our distributed international talent strategy across 8+ countries. The ideal candidate has experience managing multi-country compliance, international benefits, payroll coordination, and multilingual talent acquisition.

Key Responsibilities:
- Manage the end-to-end recruitment lifecycle for technical and executive positions across EMEA, LATAM, and APAC.
- Oversee international labor law compliance, contractor agreements, and employer-of-record (EOR) partnerships.
- Implement scalable HR tech workflows, Applicant Tracking Systems (ATS), and performance review systems.
- Resolve cross-border employee relations, grievance handling, and cultural integration challenges.
- Drive employee engagement, compensation benchmarking, and talent retention initiatives.

Must-Have Requirements:
- 6+ years in HR management, with at least 3 years in a distributed, multi-country organization.
- Experience with global HRIS platforms (Workday, BambooHR, Deel, Remote.com).
- Deep knowledge of international labor standards and compliance in multiple jurisdictions.
- Fluent written and spoken English; additional language fluency is a major advantage.
- Outstanding conflict resolution, empathetic leadership, and negotiation skills.`
  },
  {
    id: 'jd-supply-chain',
    title: 'International Supply Chain & Logistics Lead',
    department: 'Operations',
    experienceRequired: '4+ Years',
    description: `Title: International Supply Chain & Logistics Lead
Department: Global Operations & Freight
Location: Hybrid / Remote

Overview:
Looking for a proactive Supply Chain Lead to manage cross-border shipping routes, vendor negotiations, custom clearances, and inventory optimization across international trade corridors.

Requirements:
- 4+ years in international logistics, freight forwarding, or supply chain analytics.
- Proven experience with ERP systems (SAP, Oracle SCM) and freight tracking tools.
- Experience managing international customs regulations, Incoterms 2020, and tariff classifications.
- Proven track record of reducing freight expenses and transit delays.
- Strong multilingual negotiation capability.`
  }
];

const SAMPLE_RESUMES = [
  {
    id: 'resume-arabic-cloud',
    filename: 'Ahmed_Al_Mansoor_CV.pdf',
    language: 'Arabic',
    languageFlag: '🇦🇪',
    candidateName: 'Ahmed Al-Mansoor',
    rawText: `السيرة الذاتية: أحمد المنصور
البريد الإلكتروني: ahmed.mansoor@techdubai.ae | الهاتف: +971 50 123 4567 | دبي، الإمارات العربية المتحدة

الملخص المهني:
مهندس برمجيات وحوسبة سحابية أول يتمتع بخبرة تزيد عن 7 سنوات في بناء وتصميم الأنظمة الموزعة عالية الأداء، والحوسبة السحابية (AWS & Kubernetes)، وتطوير الواجهات الخلفية باستخدام Node.js و Python. خبرة واسعة في قيادة الفرق التقنية متعددة الجنسيات في الشرق الأوسط وأوروبا.

المهارات الأساسية:
- الحوسبة السحابية: Amazon Web Services (AWS), Docker, Kubernetes (CKA), Terraform.
- لغات البرمجة: JavaScript, TypeScript, Node.js, Python, Go.
- واجهات المستخدم: React.js, Next.js, Redux, Tailwind CSS.
- قواعد البيانات: PostgreSQL, MongoDB, Redis, Elasticsearch.
- منهجيات العمل: Agile, Scrum, DevOps, CI/CD Pipelines.
- اللغات: العربية (اللغة الأم)، الإنجليزية (طلاقة مهنية كاملة).

الخبرات المهنية:
1. كبير مهندسي السحابة - شركة الخليج للحلول الرقمية (دبي) | 2021 - حتى الآن
- قيادة فريق مكون من 9 مهندسين لإعادة هيكلة النظام الأساسي إلى بنية الخدمات المصغرة (Microservices) باستخدام AWS EKS و Node.js.
- تخفيض زمن استجابة واجهات برمجة التطبيقات بنسبة 45% وتحسين كفاءة استهلاك السحابة بمقدار 18,000 دولار شهرياً.
- إعداد خطوط الأنابيب المؤتمتة (CI/CD) عبر GitHub Actions لتسليم أكثر من 25 تطبيقاً بسلاسة.

2. مهندس نظم متكاملة - واحة التقنية العالمية (الرياض) | 2017 - 2021
- تطوير بوابات الدفع الإلكتروني والخدمات المصرفية الرقمية بالاعتماد على React و Node.js.
- دمج تقنيات التخزين المؤقت Redis لتحمل أكثر من 50,000 طلب متزامن في الثانية.

التعليم والشهادات:
- بكالوريوس في علوم الحاسوب وهندسة البرمجيات - جامعة الإمارات (2017).
- شهادة مهندس حلول معتمد من AWS (AWS Certified Solutions Architect - Associate).
- شهادة مدير كوبرنيتيس معتمد (Certified Kubernetes Administrator - CKA).`
  },
  {
    id: 'resume-spanish-dev',
    filename: 'Sofia_Alvarez_Curriculum.pdf',
    language: 'Spanish',
    languageFlag: '🇪🇸',
    candidateName: 'Sofía Álvarez Ramírez',
    rawText: `CURRÍCULUM VITAE: SOFÍA ÁLVAREZ RAMÍREZ
Email: sofia.alvarez@madriddev.es | Teléfono: +34 612 345 678 | Madrid, España

PERFIL PROFESIONAL:
Ingeniera de Software Senior y Desarrolladora Full-Stack con más de 6 años de experiencia en la construcción de aplicaciones web escalables utilizando React, TypeScript, Node.js y arquitecturas en la nube (AWS). Apasionada por el código limpio, la optimización de rendimiento y la colaboración en equipos remotos internacionales.

COMPETENCIAS CLAVE:
- Frontend: React, TypeScript, Next.js, Redux Toolkit, Tailwind CSS, Jest.
- Backend & Cloud: Node.js, Express, NestJS, Docker, AWS (Lambda, S3, ECS, RDS).
- Bases de Datos: PostgreSQL, MySQL, Redis, DynamoDB.
- Prácticas: CI/CD, Git, Metodología Scrum/Agile, TDD, Microservicios.
- Idiomas: Español (Nativo), Inglés (C1 Avanzado - Certificado Cambridge), Francés (Básico).

EXPERIENCIA LABORAL:
1. Desarrolladora Full-Stack Senior - Iberia Tech Solutions (Madrid) | 2021 - Presente
- Liderazgo técnico en la creación de una plataforma SaaS global de reservas utilizada por más de 300,000 usuarios mensuales.
- Implementación de microfrontends con React y backends con Node.js y AWS Lambda.
- Reducción del tiempo de carga inicial de la aplicación en un 55% mediante división de código y renderizado del lado del servidor (SSR).

2. Ingeniera de Software - Innovación Digital SL (Barcelona) | 2018 - 2021
- Desarrollo de APIs RESTful seguras y paneles de administración dinámicos para clientes bancarios.
- Automatización de despliegues mediante Docker y GitLab CI.

FORMACIÓN ACADÉMICA Y CERTIFICACIONES:
- Grado en Ingeniería Informática - Universidad Politécnica de Madrid (2018).
- Certificación AWS Certified Developer - Associate (2022).`
  },
  {
    id: 'resume-german-hr',
    filename: 'Maximilian_Weber_Lebenslauf.docx',
    language: 'German',
    languageFlag: '🇩🇪',
    candidateName: 'Maximilian Weber',
    rawText: `LEBENSLAUF: MAXIMILIAN WEBER
E-Mail: m.weber@berlin-hr.de | Telefon: +49 30 9876543 | Berlin, Deutschland

BERUFLICHES PROFIL:
Erfahrener Global HR & People Operations Manager mit über 8 Jahren Erfahrung in der Führung internationaler Personalprozesse, Talentakquise und arbeitsrechtlicher Compliance in der DACH-Region, Großbritannien und den USA. Spezialisiert auf hybride Arbeitsmodelle, Personalentwicklung und moderne HR-Tech-Lösungen.

KERNKOMPETENZEN:
- Internationales Personalmanagement, Global Mobility & Employer-of-Record (EOR).
- HR-Software: Workday, Personio, BambooHR, Deel, Culture Amp, Greenhouse.
- Arbeitsrecht (DACH & EU), Compliance, Vergütungs- und Betriebsratsverhandlungen.
- Sprachen: Deutsch (Muttersprache), Englisch (Verhandlungssicher / C2), Spanisch (Grundkenntnisse).

BERUFLICHER WERDEGANG:
1. Head of People Operations - Global Tech Ventures GmbH (Berlin) | 2020 - Heute
- Steuerung sämtlicher HR-Aktivitäten für 450 Mitarbeiter in 6 Ländern.
- Einführung von Deel und Personio, wodurch die internationale Einstellungszeit um 40% verkürzt wurde.
- Konzeption von Mitarbeiterbindungsprogrammen, Senkung der Fluktuationsrate um 22%.

2. Senior Talent & HR Manager - European Retail Group (Frankfurt) | 2016 - 2020
- Leitung des Talent-Recruiting-Teams für Fach- und Führungskräfte in ganz Europa.
- Verhandlung von Betriebsvereinbarungen und Begleitung von Restrukturierungsprozessen.

AUSBILDUNG:
- Master of Science in International Business & Human Resource Management - Humboldt-Universität zu Berlin (2016).
- Zertifizierter People Analytics Specialist (SHRM / HRCI).`
  },
  {
    id: 'resume-french-supply',
    filename: 'Camille_Laurent_CV.xlsx',
    language: 'French',
    languageFlag: '🇫🇷',
    candidateName: 'Camille Laurent',
    rawText: `CURRICULUM VITAE: CAMILLE LAURENT
Email: camille.laurent@logistique-paris.fr | Téléphone: +33 1 42 68 55 00 | Lyon, France

RÉSUMÉ PROFESSIONNEL:
Responsable Supply Chain & Logistique Internationale avec 5 ans d'expérience dans l'optimisation des flux d'approvisionnement, la négociation avec les transitaires maritimes et aériens, et le déploiement de solutions ERP (SAP S/4HANA). Bilingue français-anglais avec d'excellentes capacités d'analyse de données.

COMPÉTENCES CLÉS:
- Gestion de la chaîne logistique, Incoterms 2020, dédouanement et conformité douanière.
- Systèmes d'information: SAP S/4HANA, Oracle SCM, Tableau, Excel avancé (Power Query, VBA).
- Gestion des stocks, prévision de la demande, réduction des coûts de fret de 18%.
- Langues: Français (Langue maternelle), Anglais (Courant / Professionnel).

EXPÉRIENCE PROFESSIONNELLE:
1. Coordinatrice Logistique Internationale - EuroTrans Logistics (Lyon) | 2021 - Présent
- Supervision des flux de transport de marchandises entre l'Asie, l'Europe et l'Afrique du Nord.
- Négociation des contrats avec les transporteurs maritimes, réalisant une économie annuelle de 240 000 €.
- Suivi des formalités douanières et respect des normes réglementaires internationales.

2. Gestionnaire Approvisionnements - Alstom Transport (Paris) | 2019 - 2021
- Gestion des commandes fournisseurs et planification des stocks de sécurité.
- Mise en œuvre d'indicateurs de performance (KPI) pour le taux de service client (OTIF > 97%).

FORMATION:
- Master en Management de la Chaîne Logistique & Achats - EM Lyon Business School (2019).`
  },
  {
    id: 'resume-urdu-dev',
    filename: 'Muhammad_Tariq_Resume.pdf',
    language: 'Urdu',
    languageFlag: '🇵🇰',
    candidateName: 'محمد طارق (Muhammad Tariq)',
    rawText: `ریزیومے: محمد طارق
ای میل: tariq.fullstack@devpk.com | فون: +92 300 1234567 | لاہور، پاکستان

پیشہ ورانہ خلاصہ:
5 سال سے زائد تجربہ کار فل اسٹیک ویب ڈویلپر اور سافٹ ویئر انجینئر۔ ری ایکٹ (React.js)، نوڈ (Node.js)، ایکسپریس، اور کلاؤڈ کمپیوٹنگ (AWS / Docker) میں خصوصی مہارت۔ عالمی سطح پر مختلف بین الاقوامی کلائنٹس کے ساتھ ریموٹ کام کرنے کا وسیع اور کامیاب تجربہ۔

بنیادی مہارتیں (Core Skills):
- فرنٹ اینڈ: React.js, Next.js, Redux, JavaScript (ES6+), TypeScript, Tailwind CSS.
- بیک اینڈ: Node.js, Express.js, REST APIs, GraphQL, Microservices.
- ڈیٹا بیس: MongoDB, PostgreSQL, MySQL, Redis.
- کلاؤڈ اور ڈیولپمنٹ ٹولز: Docker, AWS (EC2, S3), Git, CI/CD, JIRA.
- زبانیں: اردو (مادری زبان)، انگریزی (روانی سے بول چال اور تحریر).

پیشہ ورانہ تجربہ:
1. سینئر فل اسٹیک انجینئر - ٹیک ویژن سسٹمز (لاہور) | 2022 - تا حال
- بین الاقوامی ای کامرس اور لاجسٹکس کلائنٹس کے لیے ہائی اسکیل ویب ایپلیکیشنز تیار کیں۔
- ری ایکٹ اور نوڈ جے ایس کا استعمال کرتے ہوئے سسٹم کی اسپیڈ اور کارکردگی میں 40 فیصد اضافہ کیا۔
- کوڈ ریویو، ٹیم کی رہنمائی اور کلین کوڈ پریکٹسز کو یقینی بنایا۔

2. سافٹ ویئر ڈویلپر - سمارٹ ٹیک سافٹ ویئر ہاؤس | 2019 - 2022
- فرنٹ اینڈ اور بیک اینڈ ماڈیولز کی ڈیولپمنٹ اور بگ فکسنگ۔
- پے منٹ گیٹ ویز (Stripe / PayPal) اور تھرڈ پارٹی اے پی آئیز کی انٹیگریشن۔

تعلیم اور اسناد:
- بی ایس کمپیوٹر سائنس (BS CS) - پنجاب یونیورسٹی، لاہور (2019)۔
- فل اسٹیک سرٹیفیکیشن (Meta Front-End & Node.js Developer).`
  },
  {
    id: 'resume-chinese-data',
    filename: 'Li_Wei_Resume_Cloud.pdf',
    language: 'Chinese',
    languageFlag: '🇨🇳',
    candidateName: '李伟 (Li Wei)',
    rawText: `个人简历：李伟 (Li Wei)
电子邮箱: liwei.cloud@techshanghai.cn | 电话: +86 21 8765 4321 | 上海，中国

职业概况:
资深全栈与云平台研发工程师，拥有5年分布式系统、微服务及高并发网络架构经验。精通 Node.js、React、TypeScript 以及云原生技术（Kubernetes、Docker、阿里云/AWS）。具备出色的跨国远程团队协作与英文技术沟通能力。

核心专业技能:
- 前端技术: React.js, TypeScript, Next.js, Webpack, Tailwind CSS.
- 后端开发: Node.js, NestJS, Python, Go, 分布式微服务架构.
- 云原生与运维: Docker, Kubernetes, AWS (S3, ECS, RDS), CI/CD (GitHub Actions).
- 数据库与缓存: PostgreSQL, Redis, MongoDB, Kafka 消息队列.
- 语言技能: 中文 (母语), 英语 (流利，可作为工作语言).

工作经历:
1. 资深研发工程师 - 矩阵数字科技 (上海) | 2021年至今
- 主导跨国跨境电商 SaaS 平台的微服务架构设计，系统日均处理请求量超 2000 万次。
- 运用 React + TypeScript 重构核心前端应用，页面首屏加载时间缩短 50%。
- 构建自动化持续集成与部署 (CI/CD) 流水线，将系统发布周期从数天缩短至小时级。

2. 软件工程师 - 极客智能网络 | 2019年 - 2021年
- 负责高并发 API 接口设计与性能调优，利用 Redis 缓存技术消除数据库瓶颈。
- 参与国际化多语言支持框架的搭建。

教育背景与认证:
- 计算机科学与技术学士 - 上海交通大学 (2019)
- AWS 认证解决方案架构师 (AWS Certified Solutions Architect)`
  }
];

module.exports = {
  SAMPLE_JOB_DESCRIPTIONS,
  SAMPLE_RESUMES
};
