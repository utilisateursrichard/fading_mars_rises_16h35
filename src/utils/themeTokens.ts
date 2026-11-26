import type { UIThemeId } from '../context/UIThemeContext';

export interface ThemeTokens {
  heroBanner: string;
  heroTitle: string;
  heroSubtitle: string;
  card: string;
  interactiveCard: string;
  primaryBtn: string;
  secondaryBtn: string;
  subSurface: string;
  pillSwitchTrack: string;
  pillSwitchActive: string;
  pillSwitchIdle: string;
  isDarkHero: boolean;
  isDarkTheme: boolean;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderSubtle: string;
  divider: string;
  inputField: string;
  tableHeader: string;
  tableRowHover: string;
  agendaGridContainer: string;
  agendaHoursAxis: string;
  agendaDayHeader: string;
  agendaTodayHeader: string;
  agendaTodayColumn: string;
  agendaTodayBadge: string;
  agendaHourLine: string;
  agendaHalfHourLine: string;
  agendaEventBlock: string;
  agendaEventActive: string;
  tabBar: string;
  tabActive: string;
  tabIdle: string;
}

const TOKENS_MAP: Record<UIThemeId, ThemeTokens> = {
  pulse: {
    heroBanner:
      'bg-[#121318] text-white rounded-[24px] shadow-[0_14px_38px_-14px_rgba(18,19,24,0.45)]',
    heroTitle: 'text-white',
    heroSubtitle: 'text-slate-300',
    card: 'bg-white rounded-[24px] ring-1 ring-black/[0.06] shadow-[0_8px_28px_-12px_rgba(18,19,24,0.08)]',
    interactiveCard:
      'bg-white rounded-[24px] ring-1 ring-black/[0.06] shadow-[0_8px_28px_-12px_rgba(18,19,24,0.08)] hover:-translate-y-0.5 hover:ring-indigo-500/35 transition-all duration-200',
    primaryBtn:
      'bg-[#121318] hover:bg-indigo-600 text-white rounded-full font-bold transition-colors',
    secondaryBtn:
      'bg-[#F3F2ED] hover:bg-[#E7E5DD] text-[#121318] rounded-full font-bold transition-colors',
    subSurface: 'bg-[#F3F2ED] rounded-2xl',
    pillSwitchTrack: 'bg-white/10 rounded-full p-1',
    pillSwitchActive: 'bg-white text-[#121318] rounded-full shadow-xs',
    pillSwitchIdle: 'text-white/70 hover:text-white rounded-full',
    isDarkHero: true,
    isDarkTheme: false,
    textPrimary: 'text-[#121318]',
    textSecondary: 'text-slate-600',
    textMuted: 'text-slate-400',
    borderSubtle: 'border-black/[0.07]',
    divider: 'divide-black/[0.06]',
    inputField: 'bg-[#F3F2ED] border border-black/[0.07] text-[#121318] rounded-2xl focus:ring-2 focus:ring-indigo-500/20',
    tableHeader: 'bg-[#F3F2ED]/80 text-slate-500 border-b border-black/[0.06]',
    tableRowHover: 'hover:bg-[#F3F2ED]/50',
    agendaGridContainer: 'bg-white rounded-[24px] ring-1 ring-black/[0.07] shadow-[0_12px_36px_-14px_rgba(18,19,24,0.1)] overflow-hidden',
    agendaHoursAxis: 'border-r border-black/[0.06] bg-[#F8F7F3] font-mono',
    agendaDayHeader: 'border-r last:border-r-0 border-black/[0.06] hover:bg-[#F3F2ED]/70',
    agendaTodayHeader: 'bg-[#121318] text-white',
    agendaTodayColumn: 'bg-amber-50/35',
    agendaTodayBadge: 'bg-amber-400 text-[#121318]',
    agendaHourLine: 'border-t border-black/[0.06]',
    agendaHalfHourLine: 'border-t border-black/[0.03] border-dashed',
    agendaEventBlock: 'bg-white ring-1 ring-black/[0.08] rounded-2xl shadow-xs hover:ring-indigo-500/50',
    agendaEventActive: 'bg-white ring-2 ring-emerald-500 rounded-2xl shadow-md',
    tabBar: 'border-b border-black/[0.08]',
    tabActive: 'border-[#121318] text-[#121318]',
    tabIdle: 'border-transparent text-slate-500 hover:text-[#121318]',
  },
  google_m3e: {
    heroBanner: 'bg-[#E6EEF8] text-[#191C20] rounded-[32px]',
    heroTitle: 'text-[#191C20]',
    heroSubtitle: 'text-[#42474E]',
    card: 'bg-white rounded-[28px]',
    interactiveCard:
      'bg-white hover:bg-[#EDF3FC] rounded-[28px] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
    primaryBtn:
      'bg-[#00639B] hover:bg-[#004D7A] text-white rounded-[18px] hover:rounded-full transition-all duration-300 font-bold',
    secondaryBtn:
      'bg-[#D3E4FF] hover:bg-[#C0D8FF] text-[#001C38] rounded-[18px] hover:rounded-full transition-all duration-300 font-bold',
    subSurface: 'bg-[#EEF3FA] rounded-[22px]',
    pillSwitchTrack: 'bg-[#D3E4FF]/65 rounded-full p-1',
    pillSwitchActive: 'bg-[#00639B] text-white rounded-full',
    pillSwitchIdle: 'text-[#001C38]/75 hover:text-[#001C38] rounded-full',
    isDarkHero: false,
    isDarkTheme: false,
    textPrimary: 'text-[#191C20]',
    textSecondary: 'text-[#42474E]',
    textMuted: 'text-[#72777F]',
    borderSubtle: 'border-[#D3E4FF]/70',
    divider: 'divide-[#E6EEF8]',
    inputField: 'bg-[#EEF3FA] border border-transparent text-[#191C20] rounded-full focus:ring-2 focus:ring-[#00639B]/30',
    tableHeader: 'bg-[#E6EEF8] text-[#001C38]',
    tableRowHover: 'hover:bg-[#EEF3FA]',
    agendaGridContainer: 'bg-[#F8FAFD] rounded-[32px] overflow-hidden',
    agendaHoursAxis: 'border-r border-[#D3E4FF]/60 bg-[#EEF3FA]/80',
    agendaDayHeader: 'border-r last:border-r-0 border-[#D3E4FF]/50 hover:bg-[#E6EEF8]',
    agendaTodayHeader: 'bg-[#D3E4FF]',
    agendaTodayColumn: 'bg-[#E6EEF8]/35',
    agendaTodayBadge: 'bg-[#00639B] text-white',
    agendaHourLine: 'border-t border-[#D3E4FF]/50',
    agendaHalfHourLine: 'border-t border-[#D3E4FF]/30 border-dashed',
    agendaEventBlock: 'bg-white rounded-[22px] shadow-[0_1px_3px_rgba(0,28,56,0.06)] hover:bg-[#EEF3FA] hover:shadow-md',
    agendaEventActive: 'bg-[#D3E4FF]/45 rounded-[22px] ring-2 ring-[#00639B]',
    tabBar: 'border-b border-[#D3E4FF]/70',
    tabActive: 'border-[#00639B] text-[#00639B]',
    tabIdle: 'border-transparent text-[#42474E] hover:text-[#191C20]',
  },
  nova: {
    heroBanner:
      'bg-gradient-to-br from-[#191D2A] to-[#12151F] text-white rounded-3xl border border-white/10 shadow-xl',
    heroTitle: 'text-white',
    heroSubtitle: 'text-slate-400',
    card: 'bg-[#131620] text-slate-100 rounded-3xl border border-white/[0.08]',
    interactiveCard:
      'bg-[#131620] hover:bg-[#191D2B] text-slate-100 rounded-3xl border border-white/[0.08] hover:border-amber-400/40 hover:-translate-y-0.5 transition-all duration-200',
    primaryBtn:
      'bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-full font-bold transition-colors',
    secondaryBtn:
      'bg-white/[0.08] hover:bg-white/[0.14] text-slate-100 rounded-full font-semibold transition-colors',
    subSurface: 'bg-[#1A1E2B] rounded-2xl',
    pillSwitchTrack: 'bg-white/[0.06] rounded-full p-1',
    pillSwitchActive: 'bg-amber-400 text-slate-950 rounded-full font-bold',
    pillSwitchIdle: 'text-slate-400 hover:text-white rounded-full',
    isDarkHero: true,
    isDarkTheme: true,
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-400',
    borderSubtle: 'border-white/[0.08]',
    divider: 'divide-white/[0.06]',
    inputField: 'bg-[#1A1E2B] border border-white/[0.1] text-slate-100 placeholder:text-slate-500 rounded-2xl focus:ring-2 focus:ring-amber-400/30',
    tableHeader: 'bg-[#191D2A] text-slate-400 border-b border-white/[0.08]',
    tableRowHover: 'hover:bg-white/[0.04]',
    agendaGridContainer: 'bg-[#131620] rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden',
    agendaHoursAxis: 'border-r border-white/[0.07] bg-[#0F121B]',
    agendaDayHeader: 'border-r last:border-r-0 border-white/[0.07] hover:bg-white/[0.03]',
    agendaTodayHeader: 'bg-amber-400/10',
    agendaTodayColumn: 'bg-amber-400/[0.03]',
    agendaTodayBadge: 'bg-amber-400 text-slate-950',
    agendaHourLine: 'border-t border-white/[0.06]',
    agendaHalfHourLine: 'border-t border-white/[0.03] border-dashed',
    agendaEventBlock: 'bg-[#1A1E2B] border border-white/[0.1] rounded-2xl hover:border-amber-400/50 text-slate-100',
    agendaEventActive: 'bg-[#1F2433] border border-amber-400/60 ring-2 ring-amber-400/40 rounded-2xl text-slate-100',
    tabBar: 'border-b border-white/[0.08]',
    tabActive: 'border-amber-400 text-amber-400',
    tabIdle: 'border-transparent text-slate-400 hover:text-white',
  },
  apple_pro: {
    heroBanner:
      'bg-white/95 backdrop-blur-xl text-[#1D1D1F] rounded-[20px] border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.04)]',
    heroTitle: 'text-[#1D1D1F]',
    heroSubtitle: 'text-[#6E6E73]',
    card: 'bg-white rounded-[18px] border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.04)]',
    interactiveCard:
      'bg-white rounded-[18px] border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.07)] transition-all duration-200',
    primaryBtn:
      'bg-[#007AFF] hover:bg-[#0066D6] text-white rounded-xl font-medium transition-colors',
    secondaryBtn:
      'bg-[#F5F5F7] hover:bg-[#EAEAEF] text-[#1D1D1F] rounded-xl font-medium transition-colors',
    subSurface: 'bg-[#F5F5F7] rounded-[14px]',
    pillSwitchTrack: 'bg-black/[0.06] rounded-lg p-0.5',
    pillSwitchActive: 'bg-white text-[#1D1D1F] rounded-md shadow-xs',
    pillSwitchIdle: 'text-[#6E6E73] hover:text-[#1D1D1F] rounded-md',
    isDarkHero: false,
    isDarkTheme: false,
    textPrimary: 'text-[#1D1D1F]',
    textSecondary: 'text-[#424245]',
    textMuted: 'text-[#6E6E73]',
    borderSubtle: 'border-black/[0.06]',
    divider: 'divide-black/[0.06]',
    inputField: 'bg-[#F5F5F7] border border-black/[0.06] text-[#1D1D1F] rounded-xl focus:ring-2 focus:ring-[#007AFF]/25',
    tableHeader: 'bg-[#F5F5F7]/90 text-[#6E6E73] border-b border-black/[0.06]',
    tableRowHover: 'hover:bg-[#F5F5F7]/70',
    agendaGridContainer: 'bg-white rounded-[18px] border border-black/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden',
    agendaHoursAxis: 'border-r border-black/[0.06] bg-[#FBFBFD]',
    agendaDayHeader: 'border-r last:border-r-0 border-black/[0.06] hover:bg-[#F5F5F7]/70',
    agendaTodayHeader: 'bg-[#FF3B30]/[0.05]',
    agendaTodayColumn: 'bg-[#007AFF]/[0.025]',
    agendaTodayBadge: 'bg-[#FF3B30] text-white',
    agendaHourLine: 'border-t border-black/[0.06]',
    agendaHalfHourLine: 'border-t border-black/[0.03] border-dashed',
    agendaEventBlock: 'bg-white border border-black/[0.08] border-l-4 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-md',
    agendaEventActive: 'bg-[#007AFF]/[0.06] border border-[#007AFF]/40 border-l-4 rounded-xl shadow-sm',
    tabBar: 'border-b border-black/[0.08]',
    tabActive: 'border-[#007AFF] text-[#007AFF]',
    tabIdle: 'border-transparent text-[#6E6E73] hover:text-[#1D1D1F]',
  },
  horizon: {
    heroBanner:
      'bg-gradient-to-br from-[#0F172A] to-[#1E3A8A] text-white rounded-3xl shadow-[0_12px_36px_-12px_rgba(15,23,42,0.3)]',
    heroTitle: 'text-white',
    heroSubtitle: 'text-blue-100/80',
    card: 'bg-white/95 rounded-3xl border border-white shadow-[0_8px_28px_-10px_rgba(15,23,42,0.08)]',
    interactiveCard:
      'bg-white/95 rounded-3xl border border-white shadow-[0_8px_28px_-10px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-10px_rgba(10,102,255,0.16)] transition-all duration-200',
    primaryBtn:
      'bg-[#0A66FF] hover:bg-[#0052D9] text-white rounded-full font-semibold transition-colors',
    secondaryBtn:
      'bg-[#EFF4FF] hover:bg-[#DCE7FF] text-[#0F172A] rounded-full font-semibold transition-colors',
    subSurface: 'bg-[#F5F7FA] rounded-2xl',
    pillSwitchTrack: 'bg-white/15 rounded-full p-1',
    pillSwitchActive: 'bg-white text-[#0F172A] rounded-full shadow-xs',
    pillSwitchIdle: 'text-white/75 hover:text-white rounded-full',
    isDarkHero: true,
    isDarkTheme: false,
    textPrimary: 'text-[#0F172A]',
    textSecondary: 'text-slate-600',
    textMuted: 'text-slate-400',
    borderSubtle: 'border-slate-200/70',
    divider: 'divide-slate-100',
    inputField: 'bg-[#F5F7FA] border border-slate-200/80 text-[#0F172A] rounded-2xl focus:ring-2 focus:ring-[#0A66FF]/20',
    tableHeader: 'bg-[#F5F7FA] text-slate-500 border-b border-slate-200/70',
    tableRowHover: 'hover:bg-[#EFF4FF]/60',
    agendaGridContainer: 'bg-white/95 rounded-3xl border border-white shadow-[0_12px_36px_-10px_rgba(15,23,42,0.09)] overflow-hidden',
    agendaHoursAxis: 'border-r border-slate-200/60 bg-[#F5F7FA]/80',
    agendaDayHeader: 'border-r last:border-r-0 border-slate-200/60 hover:bg-[#EFF4FF]/50',
    agendaTodayHeader: 'bg-[#EFF4FF]',
    agendaTodayColumn: 'bg-[#0A66FF]/[0.03]',
    agendaTodayBadge: 'bg-[#0A66FF] text-white',
    agendaHourLine: 'border-t border-slate-200/60',
    agendaHalfHourLine: 'border-t border-slate-100 border-dashed',
    agendaEventBlock: 'bg-white border border-slate-200/70 rounded-2xl shadow-xs hover:shadow-md hover:border-[#0A66FF]/40',
    agendaEventActive: 'bg-[#EFF4FF] border border-[#0A66FF]/50 ring-2 ring-[#0A66FF]/30 rounded-2xl shadow-sm',
    tabBar: 'border-b border-slate-200/70',
    tabActive: 'border-[#0A66FF] text-[#0A66FF]',
    tabIdle: 'border-transparent text-slate-500 hover:text-[#0F172A]',
  },
  obsidian: {
    heroBanner:
      'bg-[#151822] text-slate-100 rounded-xl border border-white/[0.08]',
    heroTitle: 'text-white',
    heroSubtitle: 'text-slate-400',
    card: 'bg-[#151822] text-slate-100 rounded-xl border border-white/[0.08]',
    interactiveCard:
      'bg-[#151822] hover:bg-[#191D2A] text-slate-100 rounded-xl border border-white/[0.08] hover:border-sky-400/40 transition-all duration-150',
    primaryBtn:
      'bg-[#38BDF8] hover:bg-[#7DD3FC] text-slate-950 rounded-lg font-semibold transition-colors',
    secondaryBtn:
      'bg-white/[0.07] hover:bg-white/[0.12] text-slate-200 rounded-lg font-semibold transition-colors',
    subSurface: 'bg-[#10131C] rounded-lg',
    pillSwitchTrack: 'bg-white/[0.05] rounded-lg p-0.5 border border-white/[0.06]',
    pillSwitchActive: 'bg-white/15 text-white rounded-md',
    pillSwitchIdle: 'text-slate-400 hover:text-white rounded-md',
    isDarkHero: true,
    isDarkTheme: true,
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-400',
    borderSubtle: 'border-white/[0.08]',
    divider: 'divide-white/[0.06]',
    inputField: 'bg-[#10131C] border border-white/[0.09] text-slate-100 placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-sky-400/30',
    tableHeader: 'bg-[#10131C] text-slate-400 border-b border-white/[0.08]',
    tableRowHover: 'hover:bg-white/[0.04]',
    agendaGridContainer: 'bg-[#151822] rounded-xl border border-white/[0.08] overflow-hidden',
    agendaHoursAxis: 'border-r border-white/[0.07] bg-[#10131C] font-mono',
    agendaDayHeader: 'border-r last:border-r-0 border-white/[0.07] hover:bg-white/[0.03]',
    agendaTodayHeader: 'bg-sky-400/10',
    agendaTodayColumn: 'bg-sky-400/[0.03]',
    agendaTodayBadge: 'bg-[#38BDF8] text-slate-950',
    agendaHourLine: 'border-t border-white/[0.06]',
    agendaHalfHourLine: 'border-t border-white/[0.03] border-dashed',
    agendaEventBlock: 'bg-[#10131C] border border-white/[0.09] rounded-lg hover:border-sky-400/50 text-slate-100',
    agendaEventActive: 'bg-[#10131C] border border-sky-400 ring-1 ring-sky-400/50 rounded-lg text-slate-100',
    tabBar: 'border-b border-white/[0.08]',
    tabActive: 'border-[#38BDF8] text-[#38BDF8]',
    tabIdle: 'border-transparent text-slate-400 hover:text-white',
  },
  m3e_pro: {
    heroBanner:
      'bg-white text-slate-900 rounded-3xl border border-slate-200/70 shadow-subtle',
    heroTitle: 'text-slate-900',
    heroSubtitle: 'text-slate-500',
    card: 'bg-white rounded-3xl border border-slate-200/70 shadow-subtle',
    interactiveCard:
      'bg-white rounded-3xl border border-slate-200/80 hover:border-indigo-300/80 shadow-xs hover:shadow-md transition-all duration-200',
    primaryBtn:
      'bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all',
    secondaryBtn:
      'bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors',
    subSurface: 'bg-slate-50/80 rounded-2xl',
    pillSwitchTrack: 'bg-slate-100 rounded-2xl p-1',
    pillSwitchActive: 'bg-white text-slate-900 rounded-xl shadow-xs',
    pillSwitchIdle: 'text-slate-500 hover:text-slate-900 rounded-xl',
    isDarkHero: false,
    isDarkTheme: false,
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    textMuted: 'text-slate-400',
    borderSubtle: 'border-slate-200/70',
    divider: 'divide-slate-100',
    inputField: 'bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-500/20',
    tableHeader: 'bg-slate-50/70 text-slate-400 border-b border-slate-100',
    tableRowHover: 'hover:bg-slate-50/80',
    agendaGridContainer: 'bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden',
    agendaHoursAxis: 'border-r border-slate-200/60 bg-slate-50/40',
    agendaDayHeader: 'border-r last:border-r-0 border-slate-200/60 hover:bg-slate-100/60',
    agendaTodayHeader: 'bg-indigo-50/50',
    agendaTodayColumn: 'bg-indigo-50/15',
    agendaTodayBadge: 'bg-indigo-600 text-white',
    agendaHourLine: 'border-t border-slate-100',
    agendaHalfHourLine: 'border-t border-slate-50/90 border-dashed',
    agendaEventBlock: 'bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md hover:ring-2 hover:ring-indigo-400/50',
    agendaEventActive: 'bg-white rounded-xl ring-2 ring-emerald-500 shadow-sm',
    tabBar: 'border-b border-slate-200',
    tabActive: 'border-indigo-600 text-indigo-600',
    tabIdle: 'border-transparent text-slate-500 hover:text-slate-900',
  },
};

export function getThemeTokens(theme: UIThemeId): ThemeTokens {
  return TOKENS_MAP[theme] || TOKENS_MAP.pulse;
}
