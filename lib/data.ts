export interface TeamLink {
  label: string
  url: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  focus: string
  stack: string[]
  achievement: string
  links: TeamLink[]
}

export interface Project {
  id: string
  title: string
  description: string
  stack: string[]
  demoUrl?: string
  githubUrl?: string
}

export interface TimelineEvent {
  period: string
  title: string
  result: string
  description: string
}

export interface MetricItem {
  value: number
  suffix: string
  label: string
}

export interface SystemPillar {
  title: string
  description: string
  icon: "brain" | "backend" | "ux" | "rocket"
}

export const teamName = "TEAM NERIOR"

export const heroContent = {
  eyebrow: "Продуктовая команда для хакатонов и MVP",
  titleTop: "TEAM NERIOR",
  titleBottom: "Превращаем идеи в работающие системы",
  subtitle:
    "Проектируем, собираем и запускаем AI-продукты в сжатые сроки. Без шума. Без эго. Только результат.",
}

export const heroSignals = ["AI-архитектура", "Backend-системы", "Быстрый прототип", "Готовый запуск"]

export const systemPillars: SystemPillar[] = [
  {
    title: "AI и архитектура",
    description: "Проектируем понятные AI-флоу, устойчивые сервисы и технический фундамент под рост.",
    icon: "brain",
  },
  {
    title: "Backend-системы",
    description: "Собираем масштабируемые API, модели данных и инфраструктуру с первого релиза.",
    icon: "backend",
  },
  {
    title: "Продукт и UX",
    description: "Фокусируемся на логике продукта, чистом интерфейсе и понятном пользовательском пути.",
    icon: "ux",
  },
  {
    title: "Быстрый деплой",
    description: "От идеи до production-ready MVP за дни: с CI, метриками и готовностью к демонстрации.",
    icon: "rocket",
  },
]

export const teamMembers: TeamMember[] = [
  {
    id: "stepan-karpov",
    name: "Степан Карпов",
    role: "Лид команды",
    focus: "Архитектура, управление доставкой и продуктовая стратегия.",
    stack: ["Python", "React", "TypeScript", "Node.js", "Design Systems"],
    achievement: "Победитель UMIRhack 2025",
    links: [
      { label: "GitHub", url: "https://github.com" },
      { label: "Telegram", url: "https://t.me" },
    ],
  },
  {
    id: "vladislav-bogdan",
    name: "Владислав Богдан",
    role: "Backend и продукт",
    focus: "Экономика продукта, backend-реализация и формализация клиентских требований.",
    stack: ["Python", "FastAPI", "PostgreSQL", "Product Discovery"],
    achievement: "3 коммерческих MVP менее чем за 14 дней",
    links: [
      { label: "GitHub", url: "https://github.com" },
      { label: "LinkedIn", url: "https://linkedin.com" },
    ],
  },
  {
    id: "vladislava-kuznetsova",
    name: "Владислава Кузнецова",
    role: "Backend-инженер",
    focus: "Качество API, надежность сервисов и оптимизация производительности.",
    stack: ["Python", "FastAPI", "PostgreSQL", "Docker", "REST"],
    achievement: "Проектировала отказоустойчивые API для мультисервисных решений",
    links: [
      { label: "GitHub", url: "https://github.com" },
      { label: "Telegram", url: "https://t.me" },
    ],
  },
  {
    id: "tatyana-popova",
    name: "Татьяна Попова",
    role: "iOS разработчик",
    focus: "Нативные мобильные интерфейсы с приоритетом на UX и производительность.",
    stack: ["Swift", "SwiftUI", "UIKit", "Xcode"],
    achievement: "Запускала мобильные фичи в хакатонных продуктах",
    links: [
      { label: "GitHub", url: "https://github.com" },
      { label: "LinkedIn", url: "https://linkedin.com" },
    ],
  },
  {
    id: "roman-mikhailov",
    name: "Роман Михайлов",
    role: "Android разработчик",
    focus: "Composable Android-архитектура и быстрый релиз пользовательских модулей.",
    stack: ["Kotlin", "Jetpack Compose", "Android SDK", "Firebase"],
    achievement: "Собирал Android MVP-модули в 48-часовых спринтах",
    links: [
      { label: "GitHub", url: "https://github.com" },
      { label: "Telegram", url: "https://t.me" },
    ],
  },
  {
    id: "egor-linevich",
    name: "Егор Линевич",
    role: "Frontend разработчик",
    focus: "High-fidelity интерфейсы, motion-дизайн и высокая скорость реализации.",
    stack: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    achievement: "Проектировал и внедрял премиальные лендинги и продуктовые UI",
    links: [
      { label: "GitHub", url: "https://github.com" },
      { label: "Портфолио", url: "https://example.com" },
    ],
  },
]

export const techStackTags = [
  "Python",
  "FastAPI",
  "React",
  "TypeScript",
  "Next.js",
  "Node.js",
  "PostgreSQL",
  "Docker",
  "Kubernetes",
  "Redis",
  "AI Inference",
  "LLM Ops",
  "CI/CD",
  "Design Systems",
  "Figma",
  "DevOps",
]

export const projects: Project[] = [
  {
    id: "signalops-ai",
    title: "SignalOps AI",
    description:
      "Платформа операционной аналитики с AI-триажем инцидентов и actionable-инсайтами для команды.",
    stack: ["FastAPI", "React", "PostgreSQL", "Docker"],
    demoUrl: "#",
    githubUrl: "#",
  },
  {
    id: "trust-wallet-core",
    title: "Trust Wallet Core",
    description:
      "Fintech-ready backend для безопасной идентификации, транзакций и аудируемого управления доступом.",
    stack: ["Python", "FastAPI", "PostgreSQL", "Redis"],
    demoUrl: "#",
    githubUrl: "#",
  },
  {
    id: "neonflow-mobile",
    title: "NeonFlow Mobile",
    description:
      "Мобильное приложение для продуктовой телеметрии, live-метрик и синхронизации работы команды.",
    stack: ["Swift", "Kotlin", "Firebase"],
    demoUrl: "#",
    githubUrl: "#",
  },
  {
    id: "quantboard",
    title: "QuantBoard",
    description:
      "Дашборд реального времени для экспериментов, growth-циклов и принятия продуктовых решений.",
    stack: ["Next.js", "TypeScript", "D3", "Node.js"],
    demoUrl: "#",
    githubUrl: "#",
  },
  {
    id: "deploybridge",
    title: "DeployBridge",
    description:
      "Слой релиз-менеджмента с оценкой health пайплайнов, rollback-логикой и контролем окружений.",
    stack: ["Go", "PostgreSQL", "Docker", "Kubernetes"],
    demoUrl: "#",
    githubUrl: "#",
  },
  {
    id: "vaultguard-api",
    title: "VaultGuard API",
    description:
      "Security-first API-шлюз с политиками токенов, request fingerprinting и интеллектуальной маршрутизацией.",
    stack: ["Node.js", "TypeScript", "Redis", "DevOps"],
    demoUrl: "#",
    githubUrl: "#",
  },
]

export const timelineEvents: TimelineEvent[] = [
  {
    period: "2024",
    title: "Старт хакатонного трека",
    result: "Финалисты первого крупного турнира",
    description:
      "Проверили процесс в режиме дедлайна и собрали полноценное демо с архитектурным каркасом.",
  },
  {
    period: "2025",
    title: "UMIRhack",
    result: "1 место",
    description:
      "Спроектировали и защитили полноценный прототип за 48 часов: backend, UX и финальный питч.",
  },
  {
    period: "2025",
    title: "Коммерческий спринт",
    result: "MVP за 14 дней",
    description:
      "Собрали и выкатили production-ready MVP для реального клиента с мониторингом и поддержкой.",
  },
  {
    period: "2026",
    title: "Расширение AI-направления",
    result: "Параллельная работа над несколькими проектами",
    description:
      "Масштабировали процесс без потери скорости и качества архитектурных решений.",
  },
]

export const whyUsItems = [
  {
    title: "Релиз за дни, а не недели",
    description: "Короткие итерации, практичный scope и стабильный темп поставки результата.",
  },
  {
    title: "Архитектура прежде всего",
    description: "Проектируем систему так, чтобы она росла вместе с продуктом без постоянных переписок.",
  },
  {
    title: "Продакшен-мышление",
    description: "CI, мониторинг и дисциплина деплоя заложены в базовый процесс разработки.",
  },
  {
    title: "Чистый UX и сильный backend",
    description: "Интерфейсы выглядят дорого и работают стабильно даже под нагрузкой.",
  },
  {
    title: "Командная ответственность",
    description: "Работаем как единая система и закрываем весь цикл от идеи до запуска.",
  },
]

export const metrics: MetricItem[] = [
  { value: 12, suffix: "+", label: "Запущенных проектов" },
  { value: 5, suffix: "", label: "Пройденных хакатонов" },
  { value: 3, suffix: "", label: "MVP быстрее 2 недель" },
  { value: 2000, suffix: "+", label: "Коммитов в GitHub" },
  { value: 500, suffix: "+", label: "Stars сообщества" },
]

export const cultureStatement =
  "Мы ценим скорость, ответственность и глубокое техническое мышление. Без эго. Только исполнение."

export const cultureValues = [
  "Ясность вместо шума",
  "Быстрые циклы, чистый результат",
  "Решения для реальных пользователей",
  "Системное мышление в каждом спринте",
]

export const contactLinks = [
  {
    label: "GitHub команды",
    value: "github.com/nerior",
    href: "https://github.com",
  },
  {
    label: "Telegram",
    value: "@nerior_team",
    href: "https://t.me",
  },
  {
    label: "Email",
    value: "team@nerior.store",
    href: "mailto:team@nerior.store",
  },
]

export const navItems = [
  { label: "О команде", href: "#about" },
  { label: "Участники", href: "#team" },
  { label: "Стек", href: "#stack" },
  { label: "Проекты", href: "#projects" },
  { label: "Таймлайн", href: "#timeline" },
  { label: "Контакты", href: "#contacts" },
]
