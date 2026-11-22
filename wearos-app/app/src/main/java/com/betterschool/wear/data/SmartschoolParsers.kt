package com.betterschool.wear.data

import com.betterschool.wear.domain.WearCourseEvent
import com.betterschool.wear.domain.WearGrade
import com.betterschool.wear.domain.WearHomework
import com.betterschool.wear.domain.WearMessage
import com.betterschool.wear.domain.WearStudentProfile
import org.json.JSONArray
import org.json.JSONObject
import org.w3c.dom.Element
import org.xml.sax.InputSource
import java.io.StringReader
import java.time.LocalTime
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import javax.xml.parsers.DocumentBuilderFactory
import kotlin.math.roundToInt

/**
 * Parsers JSON et XML RPC alignés à 100% avec src/services/smartschoolParsers.ts
 */
object SmartschoolParsers {

    private val hourFormatter = DateTimeFormatter.ofPattern("HH:mm")

    fun parsePlannerElements(
        rawJson: String,
        defaultPlatformId: String
    ): Pair<List<WearCourseEvent>, List<WearHomework>> {
        val courses = mutableListOf<WearCourseEvent>()
        val homeworks = mutableListOf<WearHomework>()

        val array = try {
            val trimmed = rawJson.trim()
            if (trimmed.startsWith("[")) {
                JSONArray(trimmed)
            } else {
                val root = JSONObject(trimmed)
                root.optJSONArray("items")
                    ?: root.optJSONArray("elements")
                    ?: root.optJSONArray("plannedElements")
                    ?: root.optJSONArray("data")
                    ?: JSONArray()
            }
        } catch (_: Exception) {
            return Pair(emptyList(), emptyList())
        }

        val now = LocalTime.now()

        for (i in 0 until array.length()) {
            val obj = array.optJSONObject(i) ?: continue
            val id = obj.optString("id").takeIf { it.isNotEmpty() } ?: continue
            val elementType = obj.optString("plannedElementType", "planned-placeholders")

            val periodObj = obj.optJSONObject("period")
            val fromIso = periodObj?.optString("dateTimeFrom").orEmpty()
            val toIso = periodObj?.optString("dateTimeTo").orEmpty()
            val isDeadline = periodObj?.optBoolean("deadline", false) ?: false

            val startTimeStr = extractTimeHHmm(fromIso)
            val endTimeStr = extractTimeHHmm(toIso)
            val dateStr = fromIso.take(10)

            val coursesArr = obj.optJSONArray("courses")
            val firstCourse = coursesArr?.optJSONObject(0)
            val courseName = firstCourse?.optString("name")?.takeIf { it.isNotEmpty() }
                ?: obj.optString("name").takeIf { it.isNotEmpty() }
                ?: "Cours"

            val scheduleCodes = firstCourse?.optJSONArray("scheduleCodes")
            val subjectCode = scheduleCodes?.optString(0)?.takeIf { it.isNotEmpty() }
                ?: courseName.take(4).uppercase()

            val colorToken = obj.optString("color", "indigo")
            val colorHex = mapSmartschoolColor(colorToken)

            val isAssignment = isDeadline ||
                elementType == "planned-assignments" ||
                elementType == "planned-to-dos" ||
                elementType == "planned-lesson-cluster-assignments"

            if (isAssignment) {
                val title = obj.optString("name").takeIf { it.isNotEmpty() } ?: courseName
                val resolvedStatus = obj.optString("resolvedStatus", "unresolved")
                val assignmentTypeName = obj.optJSONObject("assignmentType")
                    ?.optString("name")?.takeIf { it.isNotEmpty() } ?: "Devoir"

                homeworks.add(
                    WearHomework(
                        id = id,
                        assignmentId = id,
                        platformId = defaultPlatformId,
                        subject = courseName,
                        title = title,
                        dueDate = dateStr,
                        dueTime = startTimeStr.ifEmpty { null },
                        isCompleted = resolvedStatus == "resolved",
                        typeLabel = assignmentTypeName,
                        colorHex = colorHex
                    )
                )
            } else {
                val teacherObj = obj.optJSONObject("organisers")
                    ?.optJSONArray("users")
                    ?.optJSONObject(0)
                val teacherName = teacherObj?.optJSONObject("name")
                    ?.optString("startingWithLastName")?.takeIf { it.isNotEmpty() }
                    ?: "Enseignant"

                val roomTitle = obj.optJSONArray("locations")
                    ?.optJSONObject(0)
                    ?.optString("title")?.takeIf { it.isNotEmpty() }
                    ?: "—"

                val startLocal = parseLocalTimeOrNull(startTimeStr)
                val endLocal = parseLocalTimeOrNull(endTimeStr)

                var isCurrent = false
                var isUpcoming = false
                var remainingMin: Int? = null
                var progress = 0f

                if (startLocal != null && endLocal != null) {
                    when {
                        !now.isBefore(startLocal) && now.isBefore(endLocal) -> {
                            isCurrent = true
                            val totalMin = ChronoUnit.MINUTES.between(startLocal, endLocal).coerceAtLeast(1)
                            val elapsedMin = ChronoUnit.MINUTES.between(startLocal, now).coerceAtLeast(0)
                            remainingMin = ChronoUnit.MINUTES.between(now, endLocal).toInt().coerceAtLeast(0)
                            progress = (elapsedMin.toFloat() / totalMin.toFloat()).coerceIn(0f, 1f)
                        }
                        now.isBefore(startLocal) -> {
                            isUpcoming = true
                            remainingMin = ChronoUnit.MINUTES.between(now, startLocal).toInt().coerceAtLeast(0)
                        }
                        else -> {
                            progress = 1f
                        }
                    }
                }

                courses.add(
                    WearCourseEvent(
                        id = id,
                        subject = courseName,
                        subjectCode = subjectCode,
                        teacher = teacherName,
                        room = roomTitle,
                        startTime = startTimeStr,
                        endTime = endTimeStr,
                        date = dateStr,
                        colorHex = colorHex,
                        isCurrent = isCurrent,
                        isUpcoming = isUpcoming,
                        remainingMinutes = remainingMin,
                        progressFraction = progress
                    )
                )
            }
        }

        return Pair(
            courses.sortedBy { it.startTime },
            homeworks.sortedWith(compareBy<WearHomework> { it.isCompleted }.thenBy { it.dueDate })
        )
    }

    /**
     * Parse un objet évaluation Skore (type "normal" ou "project" enrichi avec details.projectGoals)
     * en appliquant exactement extractScoreFromEvaluation() et isFormativeEvaluation() de smartschoolParsers.ts.
     */
    fun parseSingleSkoreEvaluation(obj: JSONObject): WearGrade? {
        val isPublished = obj.optBoolean("isPublished", true)
        if (!isPublished) return null

        val identifier = obj.optString("identifier").takeIf { it.isNotEmpty() } ?: return null
        val name = obj.optString("name", "Évaluation")
        val dateIso = obj.optString("date", "")
        val evalType = obj.optString("type", "normal")
        val doesCount = obj.optBoolean("doesCount", true)

        val compObj = obj.optJSONObject("component")
        val compAbbr = compObj?.optString("abbreviation", "")?.uppercase() ?: ""
        val compName = compObj?.optString("name", "") ?: ""

        // Règle officielle isFormativeEvaluation (smartschoolParsers.ts:653)
        val isFormative = compAbbr == "F" ||
            compName.contains("formatif", ignoreCase = true) ||
            compName.contains("formatief", ignoreCase = true) ||
            !doesCount

        val courseName = obj.optJSONArray("courses")
            ?.optJSONObject(0)
            ?.optString("name")?.takeIf { it.isNotEmpty() } ?: "Autre matière"

        // Poids horaire hebdomadaire : (Xh) ou 1 par défaut (identique à smartschoolParsers.ts:774)
        val hoursPerWeek = extractHoursFromCourseName(courseName)

        val teacherName = obj.optJSONObject("gradebookOwner")
            ?.optJSONObject("name")
            ?.optString("startingWithLastName").orEmpty()

        val graphic = obj.optJSONObject("graphic")
        val colorName = graphic?.optString("color", "green") ?: "green"

        var obtained: Double? = null
        var total: Double? = null
        var scoreText: String? = null
        var percentage: Double? = null

        // Cas 1 : Évaluation de type "project" avec details.projectGoals (smartschoolParsers.ts:680)
        if (evalType == "project") {
            val goalsArr = obj.optJSONObject("details")?.optJSONArray("projectGoals")
            if (goalsArr != null && goalsArr.length() > 0) {
                var sumObt = 0.0
                var sumTot = 0.0
                for (gIdx in 0 until goalsArr.length()) {
                    val gObj = goalsArr.optJSONObject(gIdx) ?: continue
                    val desc = gObj.optJSONObject("graphic")?.optString("description")
                    val frac = parseFractionPair(desc)
                    if (frac != null && frac.second > 0) {
                        sumObt += frac.first
                        sumTot += frac.second
                    }
                }
                if (sumTot > 0) {
                    obtained = sumObt
                    total = sumTot
                    scoreText = "${formatNumberClean(sumObt)}/${formatNumberClean(sumTot)}"
                    percentage = ((sumObt / sumTot) * 100.0).roundToInt().toDouble()
                }
            }
        }

        // Cas 2 : Description directe X/Y (ex: "35,5/40")
        if (obtained == null) {
            val desc = graphic?.optString("description")?.takeIf { it.isNotEmpty() && it != "null" }
            val frac = parseFractionPair(desc)
            if (frac != null && frac.second > 0) {
                obtained = frac.first
                total = frac.second
                scoreText = desc
                val graphicVal = if (graphic != null && !graphic.isNull("value")) {
                    graphic.optDouble("value", Double.NaN).takeIf { !it.isNaN() }
                } else null
                percentage = graphicVal ?: ((frac.first / frac.second) * 100.0).roundToInt().toDouble()
            }
        }

        // Cas 3 : Pourcentage brut (ex: value: 89)
        if (obtained == null && graphic != null && !graphic.isNull("value")) {
            val pctVal = graphic.optDouble("value", Double.NaN)
            if (!pctVal.isNaN() && pctVal >= 0.0) {
                obtained = pctVal
                total = 100.0
                scoreText = "${pctVal.roundToInt()}%"
                percentage = pctVal
            }
        }

        val finalPct = percentage ?: return null
        val finalText = scoreText ?: "${finalPct.roundToInt()}%"
        val periodName = obj.optJSONObject("period")?.optString("name", "") ?: ""

        return WearGrade(
            id = identifier,
            subject = courseName,
            title = name,
            scoreText = finalText,
            percentage = finalPct,
            date = dateIso.take(10),
            colorName = colorName,
            teacherName = teacherName,
            isSommatif = !isFormative,
            hoursPerWeek = hoursPerWeek,
            periodName = periodName
        )
    }

    /**
     * Calcule la moyenne générale pondérée EXACTEMENT comme buildSubjectReportsFromEvaluations()
     * dans src/services/smartschoolParsers.ts (lignes 855-960) :
     * - Filtre sur la première période active (computed.periods[0]) si présente,
     * - Ignore les évaluations formatives (isSommatif == false),
     * - Somme les points bruts (sumObtained / sumTotal) par matière, arrondis à 0.1%,
     * - Pondère par les heures de cours hebdomadaires ((Xh) ou 1 par défaut).
     */
    fun computeWeightedGeneralAverage(grades: List<WearGrade>): Double? {
        if (grades.isEmpty()) return null
        val activePeriod = grades.firstOrNull { it.periodName.isNotBlank() }?.periodName
        val periodFiltered = if (!activePeriod.isNullOrBlank()) {
            grades.filter { it.periodName.isBlank() || it.periodName == activePeriod }
        } else {
            grades
        }
        val sommatifs = periodFiltered.filter { it.isSommatif }
        if (sommatifs.isEmpty()) return null

        val bySubject = sommatifs.groupBy { it.subject }
        var totalWeightedPercentage = 0.0
        var totalActiveHours = 0

        for ((subjectName, subjectGrades) in bySubject) {
            var sumObtained = 0.0
            var sumTotal = 0.0

            for (g in subjectGrades) {
                val frac = parseFractionPair(g.scoreText)
                if (frac != null && frac.second > 0) {
                    sumObtained += frac.first
                    sumTotal += frac.second
                } else if (g.percentage >= 0.0) {
                    sumObtained += g.percentage
                    sumTotal += 100.0
                }
            }

            if (sumTotal > 0.0) {
                // Arrondi à 1 décimale par matière comme Number(((sumObtained / sumTotal) * 100).toFixed(1))
                val coursePct = ((sumObtained / sumTotal) * 1000.0).roundToInt() / 10.0
                val hours = extractHoursFromCourseName(subjectName)
                totalWeightedPercentage += coursePct * hours
                totalActiveHours += hours
            }
        }

        return if (totalActiveHours > 0) {
            ((totalWeightedPercentage / totalActiveHours) * 10.0).roundToInt() / 10.0
        } else {
            null
        }
    }

    fun parseMessagesListXml(rawXml: String): List<WearMessage> {
        val messages = mutableListOf<WearMessage>()
        try {
            val factory = DocumentBuilderFactory.newInstance()
            val builder = factory.newDocumentBuilder()
            val doc = builder.parse(InputSource(StringReader(rawXml)))
            val messageNodes = doc.getElementsByTagName("message")

            for (i in 0 until messageNodes.length) {
                val node = messageNodes.item(i) as? Element ?: continue
                val children = (0 until node.childNodes.length)
                    .mapNotNull { node.childNodes.item(it) as? Element }

                if (children.size < 8) continue

                val id = children.getOrNull(0)?.textContent?.trim() ?: continue
                val from = children.getOrNull(1)?.textContent?.trim() ?: "Smartschool"
                val subject = children.getOrNull(3)?.textContent?.trim() ?: "(Sans objet)"
                val dateLabel = children.getOrNull(4)?.textContent?.trim() ?: ""
                val status = children.getOrNull(5)?.textContent?.trim() ?: "1"
                val attachmentCount = children.getOrNull(6)?.textContent?.trim()?.toIntOrNull() ?: 0
                val unreadFlag = children.getOrNull(7)?.textContent?.trim() ?: "0"
                val realBox = children.getOrNull(14)?.textContent?.trim() ?: "inbox"

                val isUnread = realBox == "inbox" && unreadFlag == "1" && status != "1"

                messages.add(
                    WearMessage(
                        id = id,
                        senderName = from,
                        subject = subject,
                        dateLabel = dateLabel,
                        previewSnippet = subject,
                        fullBodyText = subject,
                        isUnread = isUnread,
                        hasAttachment = attachmentCount > 0
                    )
                )
            }
        } catch (_: Exception) {
        }
        return messages
    }

    fun parseMessageDetailBodyXml(rawXml: String): String? {
        return try {
            val factory = DocumentBuilderFactory.newInstance()
            val builder = factory.newDocumentBuilder()
            val doc = builder.parse(InputSource(StringReader(rawXml)))
            val bodyNodes = doc.getElementsByTagName("body")
            if (bodyNodes.length > 0) {
                val rawHtml = bodyNodes.item(0).textContent ?: ""
                stripHtmlForWatch(rawHtml)
            } else {
                null
            }
        } catch (_: Exception) {
            null
        }
    }

    fun parseStudentProfile(
        rawJson: String,
        fallbackUserId: String,
        fallbackPlatformId: String
    ): WearStudentProfile? {
        return try {
            val arr = JSONArray(rawJson)
            if (arr.length() == 0) return null
            var currentObj: JSONObject? = null
            for (i in 0 until arr.length()) {
                val candidate = arr.optJSONObject(i)
                if (candidate?.optBoolean("isCurrentUser", false) == true) {
                    currentObj = candidate
                    break
                }
            }
            val obj = currentObj ?: arr.optJSONObject(0) ?: return null

            val userIdNum = obj.optInt("userID", -1)
            val fullNameBin = obj.optString("fullNameBIN").takeIf { it.isNotEmpty() }
                ?: obj.optString("fullName").takeIf { it.isNotEmpty() }
                ?: "Élève"
            val studentClass = obj.optString("class").trim()
            val photoUrl = obj.optString("photoUrl").takeIf { it.isNotEmpty() }

            WearStudentProfile(
                userId = if (userIdNum > 0) "${fallbackPlatformId}_${userIdNum}_0" else fallbackUserId,
                platformId = fallbackPlatformId,
                fullName = fullNameBin,
                studentClass = studentClass,
                schoolName = "Smartschool",
                avatarUrl = photoUrl
            )
        } catch (_: Exception) {
            null
        }
    }

    fun stripHtmlForWatch(html: String): String {
        return html
            .replace(Regex("<br\\s*/?>", RegexOption.IGNORE_CASE), "\n")
            .replace(Regex("</p>", RegexOption.IGNORE_CASE), "\n\n")
            .replace(Regex("<[^>]+>"), "")
            .replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replace("&quot;", "\"")
            .replace("&#039;", "'")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .lines()
            .joinToString("\n") { it.trim() }
            .replace(Regex("\n{3,}"), "\n\n")
            .trim()
    }

    private fun extractTimeHHmm(isoString: String): String {
        return try {
            val odt = OffsetDateTime.parse(isoString)
            odt.toLocalTime().format(hourFormatter)
        } catch (_: Exception) {
            if (isoString.length >= 16) isoString.substring(11, 16) else ""
        }
    }

    private fun parseLocalTimeOrNull(hhMm: String): LocalTime? {
        return try {
            LocalTime.parse(hhMm, hourFormatter)
        } catch (_: Exception) {
            null
        }
    }

    /**
     * Identique à extractHoursFromCourseName dans src/services/smartschoolParsers.ts (ligne 774) :
     * Renvoie 1 par défaut si "(Xh)" n'est pas présent dans le titre du cours.
     */
    fun extractHoursFromCourseName(courseName: String): Int {
        val match = Regex("\\((\\d+)\\s*h\\)", RegexOption.IGNORE_CASE).find(courseName)
        val parsed = match?.groupValues?.getOrNull(1)?.toIntOrNull()
        return if (parsed != null && parsed > 0) parsed else 1
    }

    fun parseFractionPair(text: String?): Pair<Double, Double>? {
        if (text.isNullOrBlank()) return null
        val match = Regex("^([0-9]+(?:[.,][0-9]+)?)\\s*/\\s*([0-9]+(?:[.,][0-9]+)?)$").find(text.trim())
            ?: Regex("([0-9]+(?:[.,][0-9]+)?)\\s*/\\s*([0-9]+(?:[.,][0-9]+)?)").find(text.trim())
            ?: return null
        val obtained = match.groupValues[1].replace(',', '.').toDoubleOrNull() ?: return null
        val total = match.groupValues[2].replace(',', '.').toDoubleOrNull() ?: return null
        return Pair(obtained, total)
    }

    private fun formatNumberClean(v: Double): String {
        return if (v % 1.0 == 0.0) v.toInt().toString() else v.toString().replace('.', ',')
    }

    private fun mapSmartschoolColor(token: String): Long {
        return when {
            token.contains("green") || token.contains("mint") -> 0xFF059669
            token.contains("aqua") || token.contains("blue") -> 0xFF0284C7
            token.contains("yellow") || token.contains("amber") || token.contains("orange") -> 0xFFEA580C
            token.contains("red") || token.contains("rose") || token.contains("pink") -> 0xFFE11D48
            token.contains("purple") || token.contains("violet") -> 0xFF9333EA
            else -> 0xFF4F46E5
        }
    }
}
