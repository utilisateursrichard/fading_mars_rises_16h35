package com.betterschool.wear.domain

import androidx.compose.runtime.Immutable

enum class TileDisplayMode(val label: String) {
    NEXT_COURSE("Prochain Cours & Salle"),
    LATEST_GRADE("Dernière Note"),
    LATEST_MESSAGE("Dernier Message")
}

/**
 * Payload d'appairage initial (transmis une seule fois à la montre).
 * Ne contient AUCUN snapshot statique de cours/messages/notes : la montre utilise
 * ces paramètres d'authentification pour interroger elle-même Smartschool en direct.
 */
@Immutable
data class WearPairingSessionPayload(
    val version: Int = 2,
    val host: String = "",
    val userId: String = "",
    val platformId: String = "",
    val studentName: String = "",
    val studentClass: String = "",
    val schoolName: String = "",
    val username: String = "",
    val password: String = "",
    val birthDate: String = "",
    val cookies: String = "",
    val isDemoMode: Boolean = false,
    val pairedAt: String = "",
    val overallAveragePct: Double? = null
)

@Immutable
data class WearStudentProfile(
    val userId: String,
    val platformId: String,
    val fullName: String,
    val studentClass: String,
    val schoolName: String,
    val avatarUrl: String? = null
)

@Immutable
data class WearCourseEvent(
    val id: String,
    val subject: String,
    val subjectCode: String,
    val teacher: String,
    val room: String,
    val startTime: String,
    val endTime: String,
    val date: String,
    val colorHex: Long,
    val isCurrent: Boolean = false,
    val isUpcoming: Boolean = false,
    val remainingMinutes: Int? = null,
    val progressFraction: Float = 0f
)

@Immutable
data class WearHomework(
    val id: String,
    val assignmentId: String,
    val platformId: String,
    val subject: String,
    val title: String,
    val dueDate: String,
    val dueTime: String?,
    val isCompleted: Boolean,
    val typeLabel: String = "Devoir",
    val colorHex: Long = 0xFF4F46E5,
    val importanceScore: Int = 5
)

@Immutable
data class WearGrade(
    val id: String,
    val subject: String,
    val title: String,
    val scoreText: String,
    val percentage: Double,
    val date: String,
    val colorName: String,
    val teacherName: String,
    val isSommatif: Boolean = true,
    val hoursPerWeek: Int = 1,
    val periodName: String = ""
)

@Immutable
data class WearMessage(
    val id: String,
    val senderName: String,
    val subject: String,
    val dateLabel: String,
    val previewSnippet: String,
    val fullBodyText: String,
    val isUnread: Boolean,
    val hasAttachment: Boolean = false
)

object WearMockData {
    val profile = WearStudentProfile(
        userId = "demo_01",
        platformId = "0000",
        fullName = "Élève Démo",
        studentClass = "Terminale",
        schoolName = "Mode Démo BetterSchool"
    )

    val todayCourses = listOf(
        WearCourseEvent(
            id = "demo_c1",
            subject = "Mathématiques",
            subjectCode = "MATH",
            teacher = "M. Martin",
            room = "B204",
            startTime = "08:30",
            endTime = "09:30",
            date = "Aujourd'hui",
            colorHex = 0xFF0284C7,
            isCurrent = true,
            isUpcoming = false,
            remainingMinutes = 25,
            progressFraction = 0.58f
        ),
        WearCourseEvent(
            id = "demo_c2",
            subject = "Physique-Chimie",
            subjectCode = "PC",
            teacher = "Mme Dubois",
            room = "Labo 2",
            startTime = "09:30",
            endTime = "10:30",
            date = "Aujourd'hui",
            colorHex = 0xFF059669,
            isCurrent = false,
            isUpcoming = true,
            remainingMinutes = 85
        ),
        WearCourseEvent(
            id = "demo_c3",
            subject = "Histoire-Géo",
            subjectCode = "HIST",
            teacher = "M. Laurent",
            room = "A102",
            startTime = "10:45",
            endTime = "11:45",
            date = "Aujourd'hui",
            colorHex = 0xFFEA580C,
            isCurrent = false,
            isUpcoming = true
        ),
        WearCourseEvent(
            id = "demo_c4",
            subject = "Anglais",
            subjectCode = "ANG",
            teacher = "Mme Moreau",
            room = "C105",
            startTime = "13:30",
            endTime = "14:30",
            date = "Aujourd'hui",
            colorHex = 0xFFE11D48,
            isCurrent = false,
            isUpcoming = true
        )
    )

    val messages = listOf(
        WearMessage(
            id = "demo_m1",
            senderName = "M. Martin",
            subject = "Rappel — Cours de Mathématiques",
            dateLabel = "09:15",
            previewSnippet = "Pensez à apporter votre calculatrice graphique pour la séance d'exercices en salle B204.",
            fullBodyText = "Pensez à apporter votre calculatrice graphique pour la séance d'exercices en salle B204.",
            isUnread = true
        ),
        WearMessage(
            id = "demo_m2",
            senderName = "Mme Dubois",
            subject = "Support de TP Chimie",
            dateLabel = "Hier",
            previewSnippet = "Le protocole du TP de demain a été publié dans l'espace cours.",
            fullBodyText = "Le protocole du TP de demain a été publié dans l'espace cours.",
            isUnread = false
        )
    )

    val grades = listOf(
        WearGrade(
            id = "demo_g1",
            subject = "Mathématiques",
            title = "Contrôle — Suites & Limites",
            scoreText = "17/20",
            percentage = 85.0,
            date = "Aujourd'hui",
            colorName = "green",
            teacherName = "M. Martin",
            isSommatif = true,
            hoursPerWeek = 6
        ),
        WearGrade(
            id = "demo_g2",
            subject = "Physique-Chimie",
            title = "TP Cinétique chimique",
            scoreText = "15,5/20",
            percentage = 77.5,
            date = "Cette semaine",
            colorName = "mint",
            teacherName = "Mme Dubois",
            isSommatif = true,
            hoursPerWeek = 4
        )
    )

    val homeworks = listOf(
        WearHomework(
            id = "demo_h1",
            assignmentId = "demo_h1",
            platformId = "0000",
            subject = "Mathématiques",
            title = "Exercices 12 à 15 p. 84",
            dueDate = "Demain",
            dueTime = "08:30",
            isCompleted = false,
            typeLabel = "Devoir",
            colorHex = 0xFF0284C7
        ),
        WearHomework(
            id = "demo_h2",
            assignmentId = "demo_h2",
            platformId = "0000",
            subject = "Physique-Chimie",
            title = "Préparer le compte-rendu TP",
            dueDate = "Jeudi",
            dueTime = "09:30",
            isCompleted = true,
            typeLabel = "TP",
            colorHex = 0xFF059669
        )
    )
}
