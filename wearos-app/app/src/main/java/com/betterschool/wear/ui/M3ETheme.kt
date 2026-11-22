package com.betterschool.wear.ui

import androidx.compose.ui.graphics.Color

/**
 * Thème officiel M3E Pro Dark Mode (OLED Wear OS) conforme à documentation/M3E Pro.md (sections 2, 5.1 & 5.3) :
 * - Fond OLED : #090D16
 * - Cartes Bento (.dark .m3-card) : #0F172A avec micro-bordure rgba(51, 65, 85, 0.8) (#1E293B / #334155)
 * - Matrice officielle des badges de matières Dark Mode (bgDark, textDark, borderDark)
 */
object M3ETheme {
    val CanvasBg = Color(0xFF090D16)      // dark:bg-[#090D16]
    val CardBg = Color(0xFF0F172A)        // dark .m3-card background: #0f172a
    val SubtleSurface = Color(0xFF1E293B) // slate-800
    val CardBorder = Color(0xFF334155)    // slate-700 (rgba(51, 65, 85, 0.8))

    val TextPrimary = Color(0xFFF1F5F9)   // slate-100
    val TextSecondary = Color(0xFFCBD5E1) // slate-300
    val TextMuted = Color(0xFF94A3B8)     // slate-400

    val BrandIndigo = Color(0xFF6366F1)       // brand-500
    val BrandIndigoBg = Color(0xFF1E1B4B)     // brand-950
    val BrandIndigoBorder = Color(0xFF3730A3) // brand-800
    val BrandIndigoText = Color(0xFFA5B4FC)   // brand-300

    val EmeraldBg = Color(0xFF022C22)     // emerald-950
    val EmeraldBorder = Color(0xFF065F46) // emerald-800
    val EmeraldText = Color(0xFF6EE7B7)   // emerald-300
    val EmeraldDot = Color(0xFF10B981)    // emerald-500

    val AmberBg = Color(0xFF451A03)       // amber-950
    val AmberBorder = Color(0xFF92400E)   // amber-800
    val AmberText = Color(0xFFFCD34D)     // amber-300

    val RoseBg = Color(0xFF4C0519)        // rose-950
    val RoseBorder = Color(0xFF9F1239)    // rose-800
    val RoseText = Color(0xFFFDA4AF)      // rose-300

    data class SubjectPalette(
        val bg: Color,
        val text: Color,
        val border: Color,
        val dot: Color
    )

    /**
     * Implémentation exacte des tokens Dark Mode de getSubjectTheme() (section 5.3 de M3E Pro.md)
     */
    fun getSubjectPalette(subjectName: String): SubjectPalette {
        val norm = subjectName.lowercase()
        return when {
            norm.contains("math") -> SubjectPalette(
                bg = Color(0xFF082F49),     // bg-sky-950
                text = Color(0xFF7DD3FC),   // text-sky-300
                border = Color(0xFF075985), // border-sky-800
                dot = Color(0xFF38BDF8)     // sky-400
            )
            norm.contains("physiq") || norm.contains("chimi") || norm.contains("nsi") || norm.contains("techno") -> SubjectPalette(
                bg = Color(0xFF022C22),     // bg-emerald-950
                text = Color(0xFF6EE7B7),   // text-emerald-300
                border = Color(0xFF065F46), // border-emerald-800
                dot = Color(0xFF34D399)     // emerald-400
            )
            norm.contains("scien") || norm.contains("bio") -> SubjectPalette(
                bg = Color(0xFF1E1B4B),     // bg-indigo-950
                text = Color(0xFFA5B4FC),   // text-indigo-300
                border = Color(0xFF3730A3), // border-indigo-800
                dot = Color(0xFF818CF8)     // indigo-400
            )
            norm.contains("hist") || norm.contains("géo") || norm.contains("geo") || norm.contains("ses") -> SubjectPalette(
                bg = Color(0xFF431407),     // bg-orange-950
                text = Color(0xFFFDBA74),   // text-orange-300
                border = Color(0xFF9A3412), // border-orange-800
                dot = Color(0xFFFB923C)     // orange-400
            )
            norm.contains("angl") || norm.contains("lang") || norm.contains("néerl") || norm.contains("espag") || norm.contains("fran") -> SubjectPalette(
                bg = Color(0xFF4C0519),     // bg-rose-950
                text = Color(0xFFFDA4AF),   // text-rose-300
                border = Color(0xFF9F1239), // border-rose-800
                dot = Color(0xFFFB7185)     // rose-400
            )
            norm.contains("philo") -> SubjectPalette(
                bg = Color(0xFF451A03),     // bg-amber-950
                text = Color(0xFFFCD34D),   // text-amber-300
                border = Color(0xFF92400E), // border-amber-800
                dot = Color(0xFFFBBF24)     // amber-400
            )
            norm.contains("sport") || norm.contains("eps") || norm.contains("art") -> SubjectPalette(
                bg = Color(0xFF3B0764),     // bg-purple-950
                text = Color(0xFFD8B4FE),   // text-purple-300
                border = Color(0xFF6B21A8), // border-purple-800
                dot = Color(0xFFC084FC)     // purple-400
            )
            else -> SubjectPalette(
                bg = Color(0xFF1E293B),     // bg-slate-800
                text = Color(0xFFE2E8F0),   // text-slate-200
                border = Color(0xFF334155), // border-slate-700
                dot = Color(0xFF94A3B8)     // slate-400
            )
        }
    }
}
