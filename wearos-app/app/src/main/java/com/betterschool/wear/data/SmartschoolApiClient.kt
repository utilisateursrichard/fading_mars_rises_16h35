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
import org.json.JSONObject
import java.net.URLEncoder
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.concurrent.TimeUnit

data class PairingTicket(
    val code: String,
    val qrUrl: String
)

/**
 * Client HTTP natif Kotlin (OkHttp) sans aucune restriction CORS.
 */
class SmartschoolApiClient(private val sessionManager: SessionManager) {

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(12, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .followRedirects(true)
        .build()

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
                                    colorHex = 0xFF6366F1,
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
                                    platformId = h.optString("platformId", "4907"),
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
                            snapGrades.add(
                                WearGrade(
                                    id = g.optString("id", "g$i"),
                                    subject = g.optString("subject", "Matière"),
                                    title = g.optString("title", "Évaluation"),
                                    scoreText = g.optString("scoreText", ""),
                                    percentage = g.optDouble("percentage", 75.0),
                                    date = g.optString("date", ""),
                                    colorName = g.optString("colorName", "green"),
                                    teacherName = g.optString("teacherName", "")
                                )
                            )
                        }
                    }

                    WearPairingSessionPayload(
                        version = s.optInt("version", 1),
                        host = s.optString("host", "https://jean23.smartschool.be"),
                        userId = s.optString("userId", ""),
                        platformId = s.optString("platformId", "4907"),
                        studentName = s.optString("studentName", "Élève"),
                        studentClass = s.optString("studentClass", ""),
                        schoolName = s.optString("schoolName", "Smartschool"),
                        cookies = s.optString("cookies", ""),
                        isDemoMode = s.optBoolean("isDemoMode", false),
                        pairedAt = s.optString("pairedAt", ""),
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
            val url = "$host/planner/api/v1/planned-elements/user/$userId" +
                "?from=$encodedFrom&to=$encodedTo&includes=icon,courses,locations,upload-folders"

            val request = buildAuthenticatedRequest(url).get().build()

            httpClient.newCall(request).execute().use { response ->
                val body = response.body?.string().orEmpty()
                if (!response.isSuccessful || body.isBlank()) {
                    throw IllegalStateException("HTTP ${response.code} sur /planner/api/v1")
                }
                SmartschoolParsers.parsePlannerElements(body, platformId)
            }
        }

    suspend fun toggleHomeworkResolved(
        platformId: String,
        assignmentId: String,
        resolve: Boolean
    ): Boolean = withContext(Dispatchers.IO) {
        val host = sessionManager.schoolHost
        val action = if (resolve) "resolve" else "unresolve"
        val url = "$host/planner/api/v1/planned-assignments/$platformId/$assignmentId/$action"

        val emptyJsonBody = "{}".toRequestBody("application/json".toMediaType())
        val request = buildAuthenticatedRequest(url)
            .header("X-Requested-With", "XMLHttpRequest")
            .post(emptyJsonBody)
            .build()

        return@withContext try {
            httpClient.newCall(request).execute().use { response -> response.isSuccessful }
        } catch (_: Exception) {
            false
        }
    }

    suspend fun fetchDirectGrades(): List<WearGrade> = withContext(Dispatchers.IO) {
        val host = sessionManager.schoolHost
        val url = "$host/results/api/v1/evaluations/?pageNumber=1&itemsOnPage=50"

        val request = buildAuthenticatedRequest(url).get().build()

        httpClient.newCall(request).execute().use { response ->
            val body = response.body?.string().orEmpty()
            if (!response.isSuccessful || body.isBlank()) {
                throw IllegalStateException("HTTP ${response.code} sur /results/api/v1/evaluations")
            }
            SmartschoolParsers.parseSkoreEvaluations(body)
        }
    }

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

    suspend fun fetchDirectStudentProfile(): WearStudentProfile? = withContext(Dispatchers.IO) {
        val host = sessionManager.schoolHost
        val url = "$host/Studentcard/Student/getStudents"
        val emptyForm = "".toRequestBody("application/x-www-form-urlencoded; charset=UTF-8".toMediaType())

        val request = buildAuthenticatedRequest(url)
            .header("X-Requested-With", "XMLHttpRequest")
            .post(emptyForm)
            .build()

        return@withContext try {
            httpClient.newCall(request).execute().use { response ->
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
            .header("User-Agent", "BetterSchool-WearOS/1.0 (Android; WearOS)")
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
