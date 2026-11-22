package com.betterschool.wear.data

import com.betterschool.wear.domain.WearCourseEvent
import com.betterschool.wear.domain.WearGrade
import com.betterschool.wear.domain.WearHomework
import com.betterschool.wear.domain.WearMessage
import com.betterschool.wear.domain.WearPairingSessionPayload
import com.betterschool.wear.domain.WearStudentProfile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.FormBody
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.net.URLEncoder
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.concurrent.TimeUnit

data class PairingTicket(
    val code: String,
    val qrUrl: String
)

/**
 * Client HTTP natif Kotlin (OkHttp) exécutant directement les requêtes vers <ecole>.smartschool.be.
 * Enregistre chaque requête exécutée dans [lastSmartschoolTrace] pour permettre une vérification transparente.
 */
class SmartschoolApiClient(private val sessionManager: SessionManager) {

    @Volatile
    var lastSmartschoolTrace: String = "Aucune requête exécutée"
        private set

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(12, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .followRedirects(false) // Permet de détecter immédiatement un 302 vers /login
        .build()

    private fun recordTrace(method: String, endpoint: String, statusCode: Int) {
        val time = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"))
        val hostShort = sessionManager.schoolHost.removePrefix("https://").removePrefix("http://")
        lastSmartschoolTrace = "[$time] $method $hostShort$endpoint -> HTTP $statusCode"
    }

    suspend fun createPairingTicket(): PairingTicket = withContext(Dispatchers.IO) {
        val fallbackCode = (100000..999999).random().toString()
        val reqBody = """{"code":"$fallbackCode"}""".toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url("$PAIRING_RELAY_BASE_URL/api/wear-pair/create")
            .post(reqBody)
            .build()

        return@withContext try {
            httpClient.newCall(request).execute().use { response ->
                val body = response.body?.string().orEmpty()
                if (response.isSuccessful && body.isNotBlank()) {
                    val obj = JSONObject(body)
                    val code = obj.optString("code", fallbackCode)
                    val pairUrl = obj.optString("pairUrl", "$PAIRING_RELAY_BASE_URL/?wearPair=$code")
                    PairingTicket(code = code, qrUrl = pairUrl)
                } else {
                    PairingTicket(
                        code = fallbackCode,
                        qrUrl = "$PAIRING_RELAY_BASE_URL/?wearPair=$fallbackCode"
                    )
                }
            }
        } catch (_: Exception) {
            PairingTicket(
                code = fallbackCode,
                qrUrl = "$PAIRING_RELAY_BASE_URL/?wearPair=$fallbackCode"
            )
        }
    }

    suspend fun pollPairingSession(code: String): WearPairingSessionPayload? = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url("$PAIRING_RELAY_BASE_URL/api/wear-pair/poll?code=${URLEncoder.encode(code, "UTF-8")}")
            .get()
            .build()

        return@withContext try {
            httpClient.newCall(request).execute().use { response ->
                val body = response.body?.string().orEmpty()
                if (!response.isSuccessful || body.isBlank()) return@use null

                val obj = JSONObject(body)
                val status = obj.optString("status")
                val s = obj.optJSONObject("session")
                if (status == "paired" && s != null) {
                    val snap = s.optJSONObject("snapshot")
                    val snapCourses = mutableListOf<WearCourseEvent>()
                    val snapHomeworks = mutableListOf<WearHomework>()
                    val snapMessages = mutableListOf<WearMessage>()
                    val snapGrades = mutableListOf<WearGrade>()

                    snap?.optJSONArray("courses")?.let { arr ->
                        for (i in 0 until arr.length()) {
                            val c = arr.optJSONObject(i) ?: continue
                            snapCourses.add(
                                WearCourseEvent(
                                    id = c.optString("id", "c$i"),
                                    subject = c.optString("subject", "Cours"),
                                    subjectCode = c.optString("subjectCode", "CRS"),
                                    teacher = c.optString("teacher", ""),
                                    room = c.optString("room", "—"),
                                    startTime = c.optString("startTime", ""),
                                    endTime = c.optString("endTime", ""),
                                    date = c.optString("date", ""),
                                    colorHex = 0xFF4F46E5,
                                    isCurrent = c.optString("status") == "in_progress",
                                    isUpcoming = c.optString("status") == "scheduled"
                                )
                            )
                        }
                    }

                    snap?.optJSONArray("homeworks")?.let { arr ->
                        for (i in 0 until arr.length()) {
                            val h = arr.optJSONObject(i) ?: continue
                            snapHomeworks.add(
                                WearHomework(
                                    id = h.optString("id", "h$i"),
                                    assignmentId = h.optString("assignmentId", ""),
                                    platformId = h.optString("platformId", ""),
                                    subject = h.optString("subject", "Matière"),
                                    title = h.optString("title", "Devoir"),
                                    dueDate = h.optString("dueDate", ""),
                                    dueTime = h.optString("dueTime", "").ifEmpty { null },
                                    isCompleted = h.optBoolean("isCompleted", false)
                                )
                            )
                        }
                    }

                    snap?.optJSONArray("messages")?.let { arr ->
                        for (i in 0 until arr.length()) {
                            val m = arr.optJSONObject(i) ?: continue
                            val preview = m.optString("previewSnippet", "")
                            snapMessages.add(
                                WearMessage(
                                    id = m.optString("id", "m$i"),
                                    senderName = m.optString("senderName", "Smartschool"),
                                    subject = m.optString("subject", ""),
                                    dateLabel = m.optString("dateLabel", ""),
                                    previewSnippet = preview,
                                    fullBodyText = preview,
                                    isUnread = m.optBoolean("isUnread", false)
                                )
                            )
                        }
                    }

                    snap?.optJSONArray("grades")?.let { arr ->
                        for (i in 0 until arr.length()) {
                            val g = arr.optJSONObject(i) ?: continue
                            val subj = g.optString("subject", "Matière")
                            snapGrades.add(
                                WearGrade(
                                    id = g.optString("id", "g$i"),
                                    subject = subj,
                                    title = g.optString("title", "Évaluation"),
                                    scoreText = g.optString("scoreText", ""),
                                    percentage = g.optDouble("percentage", 0.0),
                                    date = g.optString("date", ""),
                                    colorName = g.optString("colorName", "green"),
                                    teacherName = g.optString("teacherName", ""),
                                    isSommatif = g.optBoolean("isSommatif", true),
                                    hoursPerWeek = SmartschoolParsers.extractHoursFromCourseName(subj)
                                )
                            )
                        }
                    }

                    val overallAvg = if (!s.isNull("overallAveragePct")) {
                        s.optDouble("overallAveragePct", Double.NaN).takeIf { !it.isNaN() && it > 0.0 }
                    } else null

                    WearPairingSessionPayload(
                        version = s.optInt("version", 1),
                        host = s.optString("host", ""),
                        userId = s.optString("userId", ""),
                        platformId = s.optString("platformId", ""),
                        studentName = s.optString("studentName", "Élève"),
                        studentClass = s.optString("studentClass", ""),
                        schoolName = s.optString("schoolName", "Smartschool"),
                        cookies = s.optString("cookies", ""),
                        isDemoMode = s.optBoolean("isDemoMode", false),
                        pairedAt = s.optString("pairedAt", ""),
                        overallAveragePct = overallAvg,
                        snapshotCourses = snapCourses,
                        snapshotHomeworks = snapHomeworks,
                        snapshotMessages = snapMessages,
                        snapshotGrades = snapGrades
                    )
                } else {
                    null
                }
            }
        } catch (_: Exception) {
            null
        }
    }

    /**
     * Interroge la base de données SQLite du serveur BetterSchool (GET /api/user-average?userId=...)
     * pour récupérer la moyenne générale exacte synchronisée chaque fois que l'élève va sur le Web.
     */
    suspend fun fetchSqliteUserAverage(userId: String = sessionManager.userId): Double? =
        withContext(Dispatchers.IO) {
            val cleanId = userId.trim()
            if (cleanId.isEmpty()) return@withContext null

            val url = "$PAIRING_RELAY_BASE_URL/api/user-average?userId=${URLEncoder.encode(cleanId, "UTF-8")}"
            val request = Request.Builder().url(url).get().build()

            return@withContext try {
                httpClient.newCall(request).execute().use { response ->
                    val body = response.body?.string().orEmpty()
                    if (!response.isSuccessful || body.isBlank()) return@use null
                    val obj = JSONObject(body)
                    if (obj.optBoolean("ok", false) && !obj.isNull("overallAveragePct")) {
                        obj.optDouble("overallAveragePct", Double.NaN).takeIf { !it.isNaN() && it > 0.0 }
                    } else {
                        null
                    }
                }
            } catch (_: Exception) {
                null
            }
        }

    /**
     * Requête directe Smartschool : GET /planner/api/v1/planned-elements/user/{userId}
     */
    suspend fun fetchDirectScheduleAndHomeworks(): Pair<List<WearCourseEvent>, List<WearHomework>> =
        withContext(Dispatchers.IO) {
            val host = sessionManager.schoolHost
            val userId = sessionManager.userId
            val platformId = sessionManager.platformId

            val zone = ZoneId.systemDefault()
            val today = LocalDate.now(zone)
            val fromIso = ZonedDateTime.of(today.atTime(0, 0, 0), zone)
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)
            val toIso = ZonedDateTime.of(today.plusDays(7).atTime(23, 59, 59), zone)
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)

            val encodedFrom = URLEncoder.encode(fromIso, "UTF-8")
            val encodedTo = URLEncoder.encode(toIso, "UTF-8")
            val path = "/planner/api/v1/planned-elements/user/$userId" +
                "?from=$encodedFrom&to=$encodedTo&includes=icon,courses,locations,upload-folders"

            val request = buildAuthenticatedRequest("$host$path").get().build()

            httpClient.newCall(request).execute().use { response ->
                recordTrace("GET", "/planner/api/v1/...", response.code)
                val body = response.body?.string().orEmpty()
                if (!response.isSuccessful || body.isBlank()) {
                    throw IllegalStateException("HTTP ${response.code} sur /planner/api/v1")
                }
                SmartschoolParsers.parsePlannerElements(body, platformId)
            }
        }

    /**
     * Requête directe Smartschool : POST /planner/api/v1/planned-assignments/{platformId}/{assignmentId}/resolve
     */
    suspend fun toggleHomeworkResolved(
        platformId: String,
        assignmentId: String,
        resolve: Boolean
    ): Boolean = withContext(Dispatchers.IO) {
        val host = sessionManager.schoolHost
        val action = if (resolve) "resolve" else "unresolve"
        val path = "/planner/api/v1/planned-assignments/$platformId/$assignmentId/$action"

        val emptyJsonBody = "{}".toRequestBody("application/json".toMediaType())
        val request = buildAuthenticatedRequest("$host$path")
            .header("X-Requested-With", "XMLHttpRequest")
            .post(emptyJsonBody)
            .build()

        return@withContext try {
            httpClient.newCall(request).execute().use { response ->
                recordTrace("POST", "/planner/.../$action", response.code)
                response.isSuccessful
            }
        } catch (_: Exception) {
            false
        }
    }

    /**
     * Requête directe Smartschool : GET /results/api/v1/evaluations/?pageNumber=1&itemsOnPage=50
     * + Enrichissement automatique des évaluations de type "project" via GET /results/api/v1/evaluations/{id}
     * (exactement comme fetchRealEvaluations() dans src/services/smartschoolApi.ts:730)
     */
    suspend fun fetchDirectGrades(): List<WearGrade> = withContext(Dispatchers.IO) {
        val host = sessionManager.schoolHost
        val path = "/results/api/v1/evaluations/?pageNumber=1&itemsOnPage=50"

        val request = buildAuthenticatedRequest("$host$path").get().build()

        val rawArray = httpClient.newCall(request).execute().use { response ->
            recordTrace("GET", "/results/api/v1/evaluations", response.code)
            val body = response.body?.string().orEmpty()
            if (!response.isSuccessful || body.isBlank()) {
                throw IllegalStateException("HTTP ${response.code} sur /results/api/v1/evaluations")
            }
            val trimmed = body.trim()
            if (trimmed.startsWith("[")) {
                JSONArray(trimmed)
            } else {
                val root = JSONObject(trimmed)
                root.optJSONArray("evaluations")
                    ?: root.optJSONArray("items")
                    ?: root.optJSONArray("results")
                    ?: JSONArray()
            }
        }

        val grades = mutableListOf<WearGrade>()
        for (i in 0 until rawArray.length()) {
            var evObj = rawArray.optJSONObject(i) ?: continue
            val evalType = evObj.optString("type", "normal")
            val identifier = evObj.optString("identifier", "")

            // Si c'est un projet LPD sans projectGoals dans la liste, appeler l'endpoint de détail Smartschool
            if (evalType == "project" && identifier.isNotEmpty()) {
                val existingGoals = evObj.optJSONObject("details")?.optJSONArray("projectGoals")
                if (existingGoals == null || existingGoals.length() == 0) {
                    val detailObj = fetchSingleEvaluationDetail(host, identifier)
                    if (detailObj != null) {
                        evObj = detailObj
                    }
                }
            }

            val parsedGrade = SmartschoolParsers.parseSingleSkoreEvaluation(evObj)
            if (parsedGrade != null) {
                grades.add(parsedGrade)
            }
        }

        grades.sortedByDescending { it.date }
    }

    private fun fetchSingleEvaluationDetail(host: String, identifier: String): JSONObject? {
        val url = "$host/results/api/v1/evaluations/$identifier"
        val request = buildAuthenticatedRequest(url).get().build()
        return try {
            httpClient.newCall(request).execute().use { response ->
                val body = response.body?.string().orEmpty()
                if (response.isSuccessful && body.isNotBlank()) JSONObject(body) else null
            }
        } catch (_: Exception) {
            null
        }
    }

    /**
     * Requête directe Smartschool : POST /?module=Messages&file=dispatcher (XML RPC)
     */
    suspend fun fetchDirectMessages(): List<WearMessage> = withContext(Dispatchers.IO) {
        val host = sessionManager.schoolHost
        val dispatcherUrl = "$host/?module=Messages&file=dispatcher"

        val listCommandXml = """
            <request>
                <command>
                    <subsystem>postboxes</subsystem>
                    <action>message list</action>
                    <params>
                        <param name="boxType"><![CDATA[inbox]]></param>
                        <param name="boxID"><![CDATA[0]]></param>
                        <param name="sortField"><![CDATA[date]]></param>
                        <param name="sortKey"><![CDATA[desc]]></param>
                        <param name="poll"><![CDATA[false]]></param>
                        <param name="layout"><![CDATA[new]]></param>
                    </params>
                </command>
            </request>
        """.trimIndent()

        val formBody = FormBody.Builder().add("command", listCommandXml).build()

        val request = buildAuthenticatedRequest(dispatcherUrl)
            .header("X-Requested-With", "XMLHttpRequest")
            .post(formBody)
            .build()

        val rawList = httpClient.newCall(request).execute().use { response ->
            recordTrace("POST", "/?module=Messages&file=dispatcher", response.code)
            val body = response.body?.string().orEmpty()
            if (!response.isSuccessful || body.isBlank()) {
                throw IllegalStateException("HTTP ${response.code} sur Messages Dispatcher")
            }
            SmartschoolParsers.parseMessagesListXml(body)
        }

        if (rawList.isEmpty()) return@withContext emptyList()

        val latest = rawList.first()
        val detailBody = fetchSingleMessageBody(dispatcherUrl, latest.id)
        if (!detailBody.isNullOrBlank()) {
            val enrichedLatest = latest.copy(
                previewSnippet = detailBody.take(140),
                fullBodyText = detailBody
            )
            return@withContext listOf(enrichedLatest) + rawList.drop(1)
        }

        rawList
    }

    private fun fetchSingleMessageBody(dispatcherUrl: String, msgId: String): String? {
        val showCommandXml = """
            <request>
                <command>
                    <subsystem>postboxes</subsystem>
                    <action>show message</action>
                    <params>
                        <param name="msgID"><![CDATA[$msgId]]></param>
                        <param name="boxType"><![CDATA[inbox]]></param>
                        <param name="limitList"><![CDATA[true]]></param>
                    </params>
                </command>
            </request>
        """.trimIndent()

        val formBody = FormBody.Builder().add("command", showCommandXml).build()

        val request = buildAuthenticatedRequest(dispatcherUrl)
            .header("X-Requested-With", "XMLHttpRequest")
            .post(formBody)
            .build()

        return try {
            httpClient.newCall(request).execute().use { response ->
                val xml = response.body?.string().orEmpty()
                if (response.isSuccessful && xml.isNotBlank()) {
                    SmartschoolParsers.parseMessageDetailBodyXml(xml)
                } else {
                    null
                }
            }
        } catch (_: Exception) {
            null
        }
    }

    /**
     * Requête directe Smartschool : POST /Studentcard/Student/getStudents
     */
    suspend fun fetchDirectStudentProfile(): WearStudentProfile? = withContext(Dispatchers.IO) {
        val host = sessionManager.schoolHost
        if (!host.startsWith("http")) return@withContext null
        val url = "$host/Studentcard/Student/getStudents"
        val emptyForm = "".toRequestBody("application/x-www-form-urlencoded; charset=UTF-8".toMediaType())

        val request = buildAuthenticatedRequest(url)
            .header("X-Requested-With", "XMLHttpRequest")
            .post(emptyForm)
            .build()

        return@withContext try {
            httpClient.newCall(request).execute().use { response ->
                recordTrace("POST", "/Studentcard/Student/getStudents", response.code)
                val body = response.body?.string().orEmpty()
                if (response.isSuccessful && body.isNotBlank()) {
                    SmartschoolParsers.parseStudentProfile(
                        rawJson = body,
                        fallbackUserId = sessionManager.userId,
                        fallbackPlatformId = sessionManager.platformId
                    )
                } else {
                    null
                }
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun buildAuthenticatedRequest(url: String): Request.Builder {
        val builder = Request.Builder()
            .url(url)
            .header("Accept", "application/json, text/plain, */*")
            .header("X-Requested-With", "XMLHttpRequest")
            .header("User-Agent", "Mozilla/5.0 (Linux; Android 14; Wear OS) AppleWebKit/537.36")
            .header("Referer", "${sessionManager.schoolHost}/")

        val cookies = sessionManager.cookies
        if (cookies.isNotBlank()) {
            builder.header("Cookie", cookies)
        }
        return builder
    }

    companion object {
        const val PAIRING_RELAY_BASE_URL = "https://betterschool.dino.icu"
    }
}
