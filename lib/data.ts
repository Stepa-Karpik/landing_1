export interface TeamMember {
  id: string
  name: string
  role: string
  stack: string[]
  description: string
  achievement?: string
  photo: string
  links: { label: string; url: string; icon: "github" | "telegram" | "figma" | "portfolio" | "email" }[]
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
  year: string
  title: string
  description: string
}

export const teamMembers: TeamMember[] = [
  {
    id: "karpov",
    name: "Карпов Степан",
    role: "Team Lead",
    stack: ["Python", "React", "JavaScript", "Node.js", "TypeScript", "C++", "aiogram", "UI/UX", "Figma"],
    description: "Лидер команды с широким стеком и опытом организации продуктовой разработки от идеи до деплоя.",
    achievement: "Победитель хакатона UMIRhack 2025",
    photo: "/team/Karpov_Stepan.png",
    links: [
      { label: "GitHub", url: "https://github.com/", icon: "github" },
      { label: "Telegram", url: "https://t.me/", icon: "telegram" },
    ],
  },
  {
    id: "bogdan",
    name: "Богдан Владислав",
    role: "Предприниматель / Backend",
    stack: ["Python", "FastAPI", "PostgreSQL", "Management", "Business Development"],
    description: "Индивидуальный предприниматель с опытом управления продуктами и delivery. Совмещает бизнес-видение с инженерной реализацией.",
    photo: "/team/Bogdan_Vladislav.png",
    links: [
      { label: "GitHub", url: "https://github.com/", icon: "github" },
      { label: "Telegram", url: "https://t.me/", icon: "telegram" },
    ],
  },
  {
    id: "kuznetsova",
    name: "Кузнецова Владислава",
    role: "Backend разработчик",
    stack: ["Python", "FastAPI", "PostgreSQL", "Docker", "REST API"],
    description: "Backend-инженер с фокусом на чистую архитектуру и надёжные API. Опыт в проектировании и поддержке серверной логики.",
    photo: "/team/Kuznetsova_Vladislava.png",
    links: [
      { label: "GitHub", url: "https://github.com/", icon: "github" },
    ],
  },
  {
    id: "popova",
    name: "Попова Татьяна",
    role: "iOS разработчик",
    stack: ["Swift", "SwiftUI", "UIKit", "Xcode", "iOS"],
    description: "Мобильный разработчик, специализирующийся на создании нативных iOS-приложений с фокусом на UX и производительность.",
    photo: "/team/Popova_Tatyana.png",
    links: [
      { label: "GitHub", url: "https://github.com/", icon: "github" },
    ],
  },
  {
    id: "mikhailov",
    name: "Михайлов Роман",
    role: "Android разработчик",
    stack: ["Kotlin", "Jetpack Compose", "Android SDK", "Firebase"],
    description: "Android-инженер с опытом создания современных мобильных приложений на Kotlin и Jetpack Compose.",
    photo: "/team/Mikhailov_Roman.png",
    links: [
      { label: "GitHub", url: "https://github.com/", icon: "github" },
    ],
  },
  {
    id: "linevich",
    name: "Линевич Егор",
    role: "Frontend разработчик",
    stack: ["React", "TypeScript", "Next.js", "TailwindCSS", "JavaScript"],
    description: "Frontend-инженер с фокусом на современные веб-технологии, анимации и отзывчивые интерфейсы.",
    photo: "/team/Linevich_Egor.png",
    links: [
      { label: "GitHub", url: "https://github.com/", icon: "github" },
    ],
  },
]

export const projects: Project[] = [
  {
    id: "proj-1",
    title: "AI Assistant Platform",
    description: "Платформа интеллектуальных ассистентов с естественным языковым интерфейсом и интеграцией внешних сервисов.",
    stack: ["Python", "FastAPI", "React", "TypeScript"],
    demoUrl: "#",
    githubUrl: "#",
  },
  {
    id: "proj-2",
    title: "FinTrack Mobile",
    description: "Мобильное приложение для учёта личных финансов с аналитикой и прогнозированием расходов.",
    stack: ["Kotlin", "Swift", "Firebase"],
    demoUrl: "#",
    githubUrl: "#",
  },
  {
    id: "proj-3",
    title: "TaskFlow",
    description: "Система управления задачами с канбан-досками, автоматизацией и командной аналитикой.",
    stack: ["Next.js", "PostgreSQL", "Docker"],
    demoUrl: "#",
    githubUrl: "#",
  },
  {
    id: "proj-4",
    title: "SecureAPI Gateway",
    description: "API-шлюз с авторизацией, rate limiting и мониторингом для микросервисной архитектуры.",
    stack: ["Node.js", "Docker", "PostgreSQL"],
    githubUrl: "#",
  },
  {
    id: "proj-5",
    title: "EventHub",
    description: "Платформа для организации мероприятий с регистрацией, расписанием и push-уведомлениями.",
    stack: ["React", "Python", "FastAPI", "iOS"],
    demoUrl: "#",
    githubUrl: "#",
  },
  {
    id: "proj-6",
    title: "DataViz Dashboard",
    description: "Интерактивный дашборд для визуализации бизнес-метрик в реальном времени.",
    stack: ["React", "TypeScript", "D3.js"],
    demoUrl: "#",
    githubUrl: "#",
  },
]

export const timelineEvents: TimelineEvent[] = [
  {
    year: "2025",
    title: "UMIRhack 2025 -- Победа",
    description: "Первое место на хакатоне. Полный цикл от идеи до работающего прототипа за 48 часов.",
  },
  {
    year: "2025",
    title: "Коммерческие MVP",
    description: "Быстрые запуски продуктов для реальных клиентов с деплоем и поддержкой.",
  },
  {
    year: "2024",
    title: "Системы с деплоем",
    description: "Разработка и поддержка production-систем с CI/CD, мониторингом и масштабированием.",
  },
]

export const competencies = [
  { title: "Backend", description: "Python, FastAPI, Node.js, REST API, микросервисы" },
  { title: "Frontend", description: "React, Next.js, TypeScript, TailwindCSS" },
  { title: "Mobile", description: "iOS (Swift), Android (Kotlin), кроссплатформа" },
  { title: "UI/UX", description: "Figma, дизайн-системы, прототипирование" },
  { title: "Security", description: "Аудит, авторизация, защита API" },
  { title: "DevOps", description: "Docker, CI/CD, мониторинг, деплой" },
]

export const techTags = [
  "Python", "FastAPI", "React", "TypeScript", "Node.js",
  "PostgreSQL", "Docker", "iOS", "Kotlin", "Figma",
  "UI/UX", "aiogram", "Security", "Next.js", "TailwindCSS",
  "Swift", "C++", "Firebase", "REST API", "Git",
]

export const whyUsItems = [
  { title: "Быстро собираем MVP", description: "От идеи до работающего продукта за считанные дни" },
  { title: "Сильная инженерная база", description: "Глубокие знания архитектуры и best practices" },
  { title: "Чистый UX и дизайн", description: "Продуманные интерфейсы с дизайн-системой" },
  { title: "Деплой и прод-готовность", description: "CI/CD, мониторинг, масштабирование" },
  { title: "Предпринимательский подход", description: "Бизнес-мышление в каждом решении" },
  { title: "Скорость коммуникации", description: "Командная ответственность и прозрачность" },
]

export const cultureValues = [
  "Скорость без хаоса",
  "Качество в деталях",
  "Честная коммуникация",
  "Ответственность за результат",
  "Продуктовое мышление",
]

export const metrics = [
  { value: 6, label: "участников", suffix: "" },
  { value: 10, label: "проектов", suffix: "+" },
  { value: 5, label: "хакатонов", suffix: "+" },
  { value: 120, label: "недель прод-опыта", suffix: "+" },
]

export const navItems = [
  { label: "О команде", href: "#about" },
  { label: "Компетенции", href: "#competencies" },
  { label: "Участники", href: "#team" },
  { label: "Проекты", href: "#projects" },
  { label: "Опыт", href: "#experience" },
  { label: "Контакты", href: "#contacts" },
]
