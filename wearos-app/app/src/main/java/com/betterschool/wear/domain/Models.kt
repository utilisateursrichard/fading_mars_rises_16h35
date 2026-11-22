package com.betterschool.wear.domain

enum class TileDisplayMode(val label: String) {
    NEXT_COURSE("Prochain Cours & Salle"),
    LATEST_GRADE("Dernière Note Skore"),
    LATEST_MESSAGE("Dernier Message")
}

data class WearPairingSessionPayload(
    val version: Int = 1,
    val host: String = "https://jean23.smartschool.be",
    val userId: String = "",
    val platformId: String = "4907",
    val studentName: String = "Richard De Gandt",
    val studentClass: String = "4T1",
    val schoolName: String = "Collège Jean XXIII",
    val cookies: String = "",
    val isDemoMode: Boolean = false,
    val pairedAt: String = "",
    val snapshotCourses: List<WearCourseEvent> = emptyList(),
    val snapshotHomeworks: List<WearHomework> = emptyList(),
    val snapshotMessages: List<WearMessage> = emptyList(),
    val snapshotGrades: List<WearGrade> = emptyList()
)

data class WearStudentProfile(
    val userId: String,
    val platformId: String,
    val fullName: String,
    val studentClass: String,
    val schoolName: String,
    val avatarUrl: String? = null
)

data class WearCourseEvent(
    val id: String,
    val subject: String,
    val subjectCode: String,
    val teacher: String,
    val room: String,
    val startTime: String, // HH:mm
    val endTime: String,   // HH:mm
    val date: String,      // YYYY-MM-DD
    val colorHex: Long,
    val isCurrent: Boolean = false,
    val isUpcoming: Boolean = false,
    val remainingMinutes: Int? = null,
    val progressFraction: Float = 0f
)

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
    val colorHex: Long = 0xFF6366F1
)

data class WearGrade(
    val id: String,
    val subject: String,
    val title: String,
    val scoreText: String,      // ex: "35,5/40"
    val percentage: Double,     // ex: 88.75
    val date: String,
    val colorName: String,      // "green", "mint", "yellow", "orange", "red"
    val teacherName: String,
    val isSommatif: Boolean = true,
    val hoursPerWeek: Int = 4
)

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
        userId = "4907_5748_0",
        platformId = "4907",
        fullName = "Richard De Gandt",
        studentClass = "4T1",
        schoolName = "Collège Jean XXIII"
    )

    val todayCourses = listOf(
        WearCourseEvent(
            id = "c1",
            subject = "Math. Imm. (5h)",
            subjectCode = "M5IM",
            teacher = "Nicolau NI",
            room = "D21",
            startTime = "08:25",
            endTime = "09:15",
            date = "Aujourd'hui",
            colorHex = 0xFF6366F1,
            isCurrent = false,
            isUpcoming = false,
            progressFraction = 1f
        ),
        WearCourseEvent(
            id = "c2",
            subject = "Sciences Nat.",
            subjectCode = "SC5",
            teacher = "Vandenberghe VB",
            room = "A52",
            startTime = "09:15",
            endTime = "10:05",
            date = "Aujourd'hui",
            colorHex = 0xFF10B981,
            isCurrent = true,
            isUpcoming = false,
            remainingMinutes = 18,
            progressFraction = 0.64f
        ),
        WearCourseEvent(
            id = "c3",
            subject = "4 T1 History",
            subjectCode = "HIST",
            teacher = "Deridder DR",
            room = "B14",
            startTime = "10:20",
            endTime = "11:10",
            date = "Aujourd'hui",
            colorHex = 0xFFF59E0B,
            isCurrent = false,
            isUpcoming = true,
            remainingMinutes = 65,
            progressFraction = 0f
        ),
        WearCourseEvent(
            id = "c4",
            subject = "Anglais (4h)",
            subjectCode = "ANG4",
            teacher = "Deridder DR",
            room = "D21",
            startTime = "11:10",
            endTime = "12:00",
            date = "Aujourd'hui",
            colorHex = 0xFF06B6D4,
            isCurrent = false,
            isUpcoming = true
        ),
        WearCourseEvent(
            id = "c5",
            subject = "Français (5h)",
            subjectCode = "FRA5",
            teacher = "Tondeur TC",
            room = "C12",
            startTime = "13:50",
            endTime = "14:40",
            date = "Aujourd'hui",
            colorHex = 0xFFEC4899,
            isCurrent = false,
            isUpcoming = true
        )
    )

    val messages = listOf(
        WearMessage(
            id = "984512",
            senderName = "Deridder DR",
            subject = "Synthèse d'Histoire — Chapitre 3",
            dateLabel = "Aujourd'hui 09:12",
            previewSnippet = "Bonjour à tous, n'oubliez pas d'apporter votre farde de documents pour le cours de 10h20 en salle B14.",
            fullBodyText = "Bonjour à tous,\n\nN'oubliez pas d'apporter votre farde de documents pour le cours de 10h20 en salle B14. La synthèse du chapitre 3 a été déposée dans l'espace cours.\n\nBonne journée,\nM. Deridder",
            isUnread = true,
            hasAttachment = true
        ),
        WearMessage(
            id = "984105",
            senderName = "Nicolau NI",
            subject = "Correction EndOfUnit Vectors",
            dateLabel = "Hier 16:40",
            previewSnippet = "Le corrigé détaillé de l'évaluation sur les vecteurs est disponible sur Smartschool.",
            fullBodyText = "Bonjour,\n\nLe corrigé détaillé de l'évaluation sur les vecteurs est maintenant disponible dans Documents > Chapitre 2.\n\nCordialement,\nNicolau NI",
            isUnread = false,
            hasAttachment = true
        ),
        WearMessage(
            id = "983890",
            senderName = "Tondeur TC",
            subject = "Sortie théâtre du vendredi",
            dateLabel = "20 Nov.",
            previewSnippet = "Rappel : rendez-vous à 13h30 devant l'entrée principale du collège.",
            fullBodyText = "Chers élèves de 4T1,\n\nRappel pour notre sortie théâtre : rendez-vous à 13h30 précises devant l'entrée principale.\n\nMme Tondeur",
            isUnread = false,
            hasAttachment = false
        )
    )

    val grades = listOf(
        WearGrade(
            id = "4907_5748_0_normal_58116",
            subject = "Math. Imm. (5h)",
            title = "EndOfUnit Vectors",
            scoreText = "35,5/40",
            percentage = 88.8,
            date = "Aujourd'hui",
            colorName = "green",
            teacherName = "Nicolau NI",
            isSommatif = true,
            hoursPerWeek = 5
        ),
        WearGrade(
            id = "4907_5748_0_project_11632",
            subject = "Sciences (8h)",
            title = "Test T.P. 1-40 (Calorimétrie)",
            scoreText = "16/20",
            percentage = 80.0,
            date = "18 Nov.",
            colorName = "green",
            teacherName = "Vandenberghe VB",
            isSommatif = true,
            hoursPerWeek = 8
        ),
        WearGrade(
            id = "4907_5748_0_normal_57901",
            subject = "4 T1 History (2h)",
            title = "Analyse de documents",
            scoreText = "14,5/20",
            percentage = 72.5,
            date = "15 Nov.",
            colorName = "mint",
            teacherName = "Deridder DR",
            isSommatif = true,
            hoursPerWeek = 2
        ),
        WearGrade(
            id = "4907_5748_0_normal_57410",
            subject = "Néerlandais (4h)",
            title = "Woordenschat Hoofdstuk 2",
            scoreText = "15/20",
            percentage = 75.0,
            date = "12 Nov.",
            colorName = "mint",
            teacherName = "Peeters PE",
            isSommatif = true,
            hoursPerWeek = 4
        )
    )

    val homeworks = listOf(
        WearHomework(
            id = "81c03373-9411-4a93-8ede-bdc23665af7d",
            assignmentId = "81c03373-9411-4a93-8ede-bdc23665af7d",
            platformId = "4907",
            subject = "Sciences Nat.",
            title = "Interro de calorimétrie",
            dueDate = "Aujourd'hui",
            dueTime = "13:50",
            isCompleted = false,
            typeLabel = "Interrogation",
            colorHex = 0xFF10B981
        ),
        WearHomework(
            id = "4ab22089-ead4-4606-b52b-69960a62fc38",
            assignmentId = "4ab22089-ead4-4606-b52b-69960a62fc38",
            platformId = "4907",
            subject = "Math. Imm.",
            title = "Exercices p. 42 n° 4 à 8",
            dueDate = "Demain",
            dueTime = "08:25",
            isCompleted = true,
            typeLabel = "Devoir",
            colorHex = 0xFF6366F1
        ),
        WearHomework(
            id = "9bc31012-ead4-4606-b52b-69960a62fc99",
            assignmentId = "9bc31012-ead4-4606-b52b-69960a62fc99",
            platformId = "4907",
            subject = "Anglais",
            title = "Reading comprehension Unit 3",
            dueDate = "Demain",
            dueTime = "11:10",
            isCompleted = false,
            typeLabel = "Tâche",
            colorHex = 0xFF06B6D4
        )
    )
}
