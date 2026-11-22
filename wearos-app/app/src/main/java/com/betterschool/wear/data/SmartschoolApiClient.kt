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
import okhttp3.Response
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
 * Client HTTP natif Kotlin (OkHttp) exécutant 100% des requêtes directement vers <ecole>.smartschool.be.
 * - Capture et met à jour automatiquement les cookies Set-Cookie (PHPSESSID, smscndc, pid) à chaque réponse.
 * - Se connecte directement sur Smartschool (/login -> /account-verification) si des identifiants sont présents
 *   et renouvelle automatiquement la session PHPSESSID dès qu'elle expire, sans jamais nécessiter de ré-appairer !
 */
class SmartschoolApiClient(private val sessionManager: SessionManager) {

    @Volatile
    var lastSmartschoolTrace: String = "Aucune requête exécutée"
        private set

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(12, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .followRedirects(false)
        .build()

    private fun recordTrace(method: String, endpoint: String, statusCode: Int) {
        val time = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"))
        val hostShort = sessionManager.schoolHost.removePrefix("https://").removePrefix("http://")
        lastSmartschoolTrace = "[$time] $method $hostShort$endpoint -> HTTP $statusCode"
    }

    /**
     * Authentification autonome directe de la montre auprès de <ecole>.smartschool.be/login
     * Permet à la montre d'obtenir et de renouveler son propre cookie PHPSESSID HttpOnly.
     */
    suspend fun loginToSmartschool(): Boolean = withContext(Dispatchers.IO) {
        val host = sessionManager.schoolHost
        val username = sessionManager.username
        val password = sessionManager.password
        if (!host.startsWith("http") || username.isBlank() || password.isBlank()) {
            return@withContext sessionManager.cookies.contains("PHPSESSID")
        }

        return@withContext try {
            // Étape 1 : GET /login pour récupérer le cookie initial et les inputs cachés (_token, _generationTime)
            val getLoginReq = buildAuthenticatedRequest("$host/login").get().build()
            val loginHtml = httpClient.newCall(getLoginReq).execute().use { res ->
                sessionManager.mergeCookiesFromResponse(res.headers("Set-Cookie"))
                recordTrace("GET", "/login", res.code)
                res.body?.string().orEmpty()
            }

            // Extraction de tous les champs <input> du formulaire login_form
            val formFields = extractHtmlFormInputs(loginHtml, "login_form")
            formFields["login_form[_username]"] = username
            formFields["login_form[_password]"] = password

            val formBodyBuilder = FormBody.Builder()
            for ((k, v) in formFields) {
                formBodyBuilder.add(k, v)
            }

            // Étape 2 : POST /login (ou /login-check selon l'action du form)
            val actionPath = extractFormAction(loginHtml) ?: "/login"
            val postUrl = if (actionPath.startsWith("http")) actionPath else "$host/${actionPath.trimStart('/')}"

            val postLoginReq = buildAuthenticatedRequest(postUrl)
                .header("Referer", "$host/login")
                .post(formBodyBuilder.build())
                .build()

            var redirectLocation: String? = null
            httpClient.newCall(postLoginReq).execute().use { res ->
                sessionManager.mergeCookiesFromResponse(res.headers("Set-Cookie"))
                recordTrace("POST", "/login", res.code)
                if (res.code in 301..303) {
                    redirectLocation = res.header("Location")
                }
            }

            // Étape 3 : Si Smartschool demande la vérification de date de naissance (/account-verification)
            if (redirectLocation != null && redirectLocation!!.contains("account-verification")) {
                val verifUrl = if (redirectLocation!!.startsWith("http")) {
                    redirectLocation!!
                } else {
                    "$host/${redirectLocation!!.trimStart('/')}"
                }

                val verifHtml = httpClient.newCall(buildAuthenticatedRequest(verifUrl).get().build()).execute().use { res ->
                    sessionManager.mergeCookiesFromResponse(res.headers("Set-Cookie"))
                    res.body?.string().orEmpty()
                }

                if (sessionManager.birthDate.isNotBlank()) {
                    val verifFields = extractAllFormInputs(verifHtml)
                    // Remplir le champ de question de sécurité (date de naissance YYYY-MM-DD)
                    val answerKey = verifFields.keys.firstOrNull {
                        !it.contains("_token") && (it.contains("security_question") || it.contains("birth") || it.contains("verification"))
                    } ?: "account_verification_form[_security_question_answer]"
                    verifFields[answerKey] = sessionManager.birthDate

                    val verifForm = FormBody.Builder()
                    for ((k, v) in verifFields) verifForm.add(k, v)

                    httpClient.newCall(
                        buildAuthenticatedRequest(verifUrl)
                            .header("Referer", verifUrl)
                            .post(verifForm.build())
                            .build()
                    ).execute().use { res ->
                        sessionManager.mergeCookiesFromResponse(res.headers("Set-Cookie"))
                        recordTrace("POST", "/account-verification", res.code)
                    }
                }
            }

            sessionManager.cookies.isNotBlank()
        } catch (_: Exception) {
            false
        }
    }

    /**
     * Exécute une requête Smartschool en capturant les nouveaux cookies Set-Cookie,
     * et si la session PHPSESSID a expiré (HTTP 302 vers /login ou HTTP 401/403),
     * reconnecte automatiquement la montre via loginToSmartschool() puis rejoue la requête !
     */
    private suspend fun executeWithAutoReauth(
        methodLabel: String,
        endpointLabel: String,
        requestFactory: () -> Request
    ): Pair<Int, String> {
        // Si on a des identifiants mais pas encore de cookie PHPSESSID, se connecter d'abord
        if (!sessionManager.cookies.contains("PHPSESSID") && sessionManager.hasCredentials) {
            loginToSmartschool()
        }

        val firstAttempt = httpClient.newCall(requestFactory()).execute().use { res ->
            sessionManager.mergeCookiesFromResponse(res.headers("Set-Cookie"))
            val loc = res.header("Location").orEmpty()
            val isLoginRedirect = (res.code in 301..303 && loc.contains("login", ignoreCase = true)) ||
                res.code == 401 || res.code == 403
            val body = res.body?.string().orEmpty()
            Triple(res.code, body, isLoginRedirect)
        }

        if (!firstAttempt.third) {
            recordTrace(methodLabel, endpointLabel, firstAttempt.first)
            return Pair(firstAttempt.first, firstAttempt.second)
        }

        // La session PHPSESSID a expiré -> reconnexion automatique en arrière-plan !
        if (sessionManager.hasCredentials && loginToSmartschool()) {
            return httpClient.newCall(requestFactory()).execute().use { res ->
                sessionManager.mergeCookiesFromResponse(res.headers("Set-Cookie"))
                recordTrace(methodLabel, endpointLabel, res.code)
                Pair(res.code, res.body?.string().orEmpty())
            }
        }

        recordTrace(methodLabel, endpointLabel, firstAttempt.first)
        return Pair(firstAttempt.first, firstAttempt.second)
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
                    val overallAvg = if (!s.isNull("overallAveragePct")) {
                        s.optDouble("overallAveragePct", Double.NaN).takeIf { !it.isNaN() && it > 0.0 }
                    } else null

                    WearPairingSessionPayload(
                        version = s.optInt("version", 2),
                        host = s.optString("host", ""),
                        userId = s.optString("userId", ""),
                        platformId = s.optString("platformId", ""),
                        studentName = s.optString("studentName", ""),
                        studentClass = s.optString("studentClass", ""),
                        schoolName = s.optString("schoolName", ""),
                        username = s.optString("username", ""),
                        password = s.optString("password", ""),
                        birthDate = s.optString("birthDate", ""),
                        cookies = s.optString("cookies", ""),
                        isDemoMode = s.optBoolean("isDemoMode", false),
                        pairedAt = s.optString("pairedAt", ""),
                        overallAveragePct = overallAvg
                    )
                } else {
                    null
                }
            }
        } catch (_: Exception) {
            null
        }
    }

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

            val (code, body) = executeWithAutoReauth("GET", "/planner/api/v1/...") {
                buildAuthenticatedRequest("$host$path").get().build()
            }

            if (code !in 200..299 || body.isBlank()) {
                throw IllegalStateException("HTTP $code sur /planner/api/v1")
            }
            SmartschoolParsers.parsePlannerElements(body, platformId)
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

        return@withContext try {
            val (code, _) = executeWithAutoReauth("POST", "/planner/.../$action") {
                val emptyJsonBody = "{}".toRequestBody("application/json".toMediaType())
                buildAuthenticatedRequest("$host$path")
                    .header("X-Requested-With", "XMLHttpRequest")
                    .post(emptyJsonBody)
                    .build()
            }
            code in 200..299
        } catch (_: Exception) {
            false
        }
    }

    /**
     * Requête directe Smartschool : GET /results/api/v1/evaluations/?pageNumber=1&itemsOnPage=50
     */
    suspend fun fetchDirectGrades(): List<WearGrade> = withContext(Dispatchers.IO) {
        val host = sessionManager.schoolHost
        val path = "/results/api/v1/evaluations/?pageNumber=1&itemsOnPage=50"

        val (code, body) = executeWithAutoReauth("GET", "/results/api/v1/evaluations") {
            buildAuthenticatedRequest("$host$path").get().build()
        }

        if (code !in 200..299 || body.isBlank()) {
            throw IllegalStateException("HTTP $code sur /results/api/v1/evaluations")
        }

        val trimmed = body.trim()
        val rawArray = if (trimmed.startsWith("[")) {
            JSONArray(trimmed)
        } else {
            val root = JSONObject(trimmed)
            root.optJSONArray("evaluations")
                ?: root.optJSONArray("items")
                ?: root.optJSONArray("results")
                ?: JSONArray()
        }

        val grades = mutableListOf<WearGrade>()
        for (i in 0 until rawArray.length()) {
            var evObj = rawArray.optJSONObject(i) ?: continue
            val evalType = evObj.optString("type", "normal")
            val identifier = evObj.optString("identifier", "")

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
                sessionManager.mergeCookiesFromResponse(response.headers("Set-Cookie"))
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

        val (code, body) = executeWithAutoReauth("POST", "/?module=Messages&file=dispatcher") {
            val formBody = FormBody.Builder().add("command", listCommandXml).build()
            buildAuthenticatedRequest(dispatcherUrl)
                .header("X-Requested-With", "XMLHttpRequest")
                .post(formBody)
                .build()
        }

        if (code !in 200..299 || body.isBlank()) {
            throw IllegalStateException("HTTP $code sur Messages Dispatcher")
        }

        val rawList = SmartschoolParsers.parseMessagesListXml(body)
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
                sessionManager.mergeCookiesFromResponse(response.headers("Set-Cookie"))
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

        return@withContext try {
            val (code, body) = executeWithAutoReauth("POST", "/Studentcard/Student/getStudents") {
                val emptyForm = "".toRequestBody("application/x-www-form-urlencoded; charset=UTF-8".toMediaType())
                buildAuthenticatedRequest(url)
                    .header("X-Requested-With", "XMLHttpRequest")
                    .post(emptyForm)
                    .build()
            }
            if (code in 200..299 && body.isNotBlank()) {
                SmartschoolParsers.parseStudentProfile(
                    rawJson = body,
                    fallbackUserId = sessionManager.userId,
                    fallbackPlatformId = sessionManager.platformId
                )
            } else {
                null
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun extractHtmlFormInputs(html: String, prefix: String): MutableMap<String, String> {
        val fields = linkedMapOf<String, String>()
        val inputRegex = Regex("<input[^>]+>", RegexOption.IGNORE_CASE)
        val nameRegex = Regex("""name\s*=\s*["']([^"']+)["']""", RegexOption.IGNORE_CASE)
        val valRegex = Regex("""value\s*=\s*["']([^"']*)["']""", RegexOption.IGNORE_CASE)

        for (match in inputRegex.findAll(html)) {
            val tag = match.value
            val name = nameRegex.find(tag)?.groupValues?.getOrNull(1) ?: continue
            if (name.startsWith(prefix)) {
                val value = valRegex.find(tag)?.groupValues?.getOrNull(1) ?: ""
                fields[name] = value
            }
        }
        return fields
    }

    private fun extractAllFormInputs(html: String): MutableMap<String, String> {
        val fields = linkedMapOf<String, String>()
        val inputRegex = Regex("<input[^>]+>", RegexOption.IGNORE_CASE)
        val nameRegex = Regex("""name\s*=\s*["']([^"']+)["']""", RegexOption.IGNORE_CASE)
        val valRegex = Regex("""value\s*=\s*["']([^"']*)["']""", RegexOption.IGNORE_CASE)

        for (match in inputRegex.findAll(html)) {
            val tag = match.value
            val name = nameRegex.find(tag)?.groupValues?.getOrNull(1) ?: continue
            val value = valRegex.find(tag)?.groupValues?.getOrNull(1) ?: ""
            fields[name] = value
        }
        return fields
    }

    private fun extractFormAction(html: String): String? {
        val formRegex = Regex("""<form[^>]*name\s*=\s*["']login_form["'][^>]*>""", RegexOption.IGNORE_CASE)
        val actionRegex = Regex("""action\s*=\s*["']([^"']+)["']""", RegexOption.IGNORE_CASE)
        val formTag = formRegex.find(html)?.value ?: return null
        return actionRegex.find(formTag)?.groupValues?.getOrNull(1)
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
