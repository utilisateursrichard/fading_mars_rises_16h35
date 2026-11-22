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
 * Client HTTP natif Kotlin (OkHttp) exécutant exactement la séquence officielle de connexion Smartschool :
 * 1. GET  https://<ecole>.smartschool.be/login -> extrait login_form[_generationTime] & login_form[_token]
 * 2. POST https://<ecole>.smartschool.be/login -> soumet login_form[_username], [_password], [_generationTime], [_token]
 * 3. GET  https://<ecole>.smartschool.be/account-verification -> extrait account_verification_form[_token]
 * 4. POST https://<ecole>.smartschool.be/account-verification -> soumet account_verification_form[_security_question_answer]=YYYY-MM-DD & [_token]
 */
class SmartschoolApiClient(private val sessionManager: SessionManager) {

    @Volatile
    var lastSmartschoolTrace: String = "En attente"
        private set

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(18, TimeUnit.SECONDS)
        .followRedirects(false)
        .build()

    private fun recordTrace(method: String, endpoint: String, statusCode: Int) {
        val time = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"))
        val hostShort = sessionManager.schoolHost.removePrefix("https://").removePrefix("http://")
        lastSmartschoolTrace = "[$time] $method $hostShort$endpoint ($statusCode)"
    }

    /**
     * Exécute un GET en suivant manuellement les redirections 301/302/303 tout en fusionnant
     * les cookies Set-Cookie à chaque saut. Renvoie Triple(finalCode, finalUrl, finalBody).
     */
    private fun executeGetFollowingRedirects(initialUrl: String, maxHops: Int = 5): Triple<Int, String, String> {
        var currentUrl = initialUrl
        val host = sessionManager.schoolHost
        for (hop in 0 until maxHops) {
            val req = buildHtmlNavigationRequest(currentUrl).get().build()
            httpClient.newCall(req).execute().use { res ->
                sessionManager.mergeCookiesFromResponse(res.headers("Set-Cookie"))
                val code = res.code
                val loc = res.header("Location")
                if (code in 301..303 && !loc.isNullOrBlank()) {
                    currentUrl = if (loc.startsWith("http")) loc else "$host/${loc.trimStart('/')}"
                } else {
                    return Triple(code, currentUrl, res.body?.string().orEmpty())
                }
            }
        }
        return Triple(302, currentUrl, "")
    }

    /**
     * Authentification autonome exacte sur Smartschool (/login puis /account-verification)
     */
    suspend fun loginToSmartschool(): Boolean = withContext(Dispatchers.IO) {
        val host = sessionManager.schoolHost.ifBlank { "https://jean23.smartschool.be" }
        sessionManager.schoolHost = host
        val username = sessionManager.username
        val password = sessionManager.password
        val birthDate = normalizeBirthDate(sessionManager.birthDate)

        if (username.isBlank() || password.isBlank()) {
            return@withContext sessionManager.cookies.contains("PHPSESSID")
        }

        return@withContext try {
            // 1. GET https://jean23.smartschool.be/login
            val (getLoginCode, _, loginHtml) = executeGetFollowingRedirects("$host/login")
            recordTrace("GET", "/login", getLoginCode)

            val genTime = extractInputValueByName(loginHtml, "login_form[_generationTime]")
                ?: (System.currentTimeMillis() / 1000).toString()
            val loginToken = extractInputValueByName(loginHtml, "login_form[_token]") ?: ""

            // 2. POST https://jean23.smartschool.be/login
            val loginFormBody = FormBody.Builder()
                .add("login_form[_username]", username)
                .add("login_form[_password]", password)
                .add("login_form[_generationTime]", genTime)
                .add("login_form[_token]", loginToken)
                .build()

            val postLoginReq = buildHtmlNavigationRequest("$host/login")
                .header("Cache-Control", "max-age=0")
                .header("Referer", "$host/")
                .post(loginFormBody)
                .build()

            var nextLocation = ""
            var postLoginHtml = ""
            httpClient.newCall(postLoginReq).execute().use { res ->
                sessionManager.mergeCookiesFromResponse(res.headers("Set-Cookie"))
                recordTrace("POST", "/login", res.code)
                nextLocation = res.header("Location").orEmpty()
                postLoginHtml = res.body?.string().orEmpty()
            }

            // 3. Si Smartschool redirige vers /account-verification (ou si on le vérifie systématiquement)
            val needsAccountVerif = nextLocation.contains("account-verification", ignoreCase = true) ||
                postLoginHtml.contains("account_verification_form", ignoreCase = true) ||
                birthDate.isNotBlank()

            if (needsAccountVerif) {
                val (getVerifCode, finalVerifUrl, verifHtml) = executeGetFollowingRedirects("$host/account-verification")
                recordTrace("GET", "/account-verification", getVerifCode)

                val verifToken = extractInputValueByName(verifHtml, "account_verification_form[_token]")
                if (!verifToken.isNullOrBlank() && birthDate.isNotBlank()) {
                    // 4. POST https://jean23.smartschool.be/account-verification
                    val verifFormBody = FormBody.Builder()
                        .add("account_verification_form[_security_question_answer]", birthDate)
                        .add("account_verification_form[_token]", verifToken)
                        .build()

                    val postVerifReq = buildHtmlNavigationRequest("$host/account-verification")
                        .header("Cache-Control", "max-age=0")
                        .header("Referer", "$host/")
                        .post(verifFormBody)
                        .build()

                    httpClient.newCall(postVerifReq).execute().use { res ->
                        sessionManager.mergeCookiesFromResponse(res.headers("Set-Cookie"))
                        recordTrace("POST", "/account-verification", res.code)
                        val afterLoc = res.header("Location").orEmpty()
                        if (res.code in 301..303 && afterLoc.isNotBlank()) {
                            val target = if (afterLoc.startsWith("http")) afterLoc else "$host/${afterLoc.trimStart('/')}"
                            executeGetFollowingRedirects(target)
                        }
                    }
                } else if (finalVerifUrl.contains("account-verification") && birthDate.isBlank()) {
                    lastSmartschoolTrace = "Date de naissance requise pour /account-verification"
                    return@withContext false
                }
            }

            sessionManager.cookies.contains("PHPSESSID")
        } catch (e: Exception) {
            lastSmartschoolTrace = "Erreur login: ${e.message}"
            false
        }
    }

    /**
     * Exécute une requête API Smartschool. Si Smartschool renvoie 302 (/login ou /account-verification) ou 401/403,
     * lance automatiquement loginToSmartschool() puis rejoue la requête !
     */
    private suspend fun executeWithAutoReauth(
        methodLabel: String,
        endpointLabel: String,
        requestFactory: () -> Request
    ): Pair<Int, String> {
        if (!sessionManager.cookies.contains("PHPSESSID") && sessionManager.hasCredentials) {
            loginToSmartschool()
        }

        val firstAttempt = httpClient.newCall(requestFactory()).execute().use { res ->
            sessionManager.mergeCookiesFromResponse(res.headers("Set-Cookie"))
            val loc = res.header("Location").orEmpty()
            val body = res.body?.string().orEmpty()
            val needsAuth = (res.code in 301..303 && (loc.contains("login", ignoreCase = true) || loc.contains("verification", ignoreCase = true))) ||
                res.code == 401 || res.code == 403 ||
                body.contains("login_form[_token]") ||
                body.contains("account_verification_form[_token]")
            Triple(res.code, body, needsAuth)
        }

        if (!firstAttempt.third) {
            recordTrace(methodLabel, endpointLabel, firstAttempt.first)
            return Pair(firstAttempt.first, firstAttempt.second)
        }

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
                        host = s.optString("host", "https://jean23.smartschool.be"),
                        userId = s.optString("userId", ""),
                        platformId = s.optString("platformId", "4907"),
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

    suspend fun fetchDirectScheduleAndHomeworks(): Pair<List<WearCourseEvent>, List<WearHomework>> =
        withContext(Dispatchers.IO) {
            val host = sessionManager.schoolHost.ifBlank { "https://jean23.smartschool.be" }
            val userId = sessionManager.userId
            val platformId = sessionManager.platformId.ifBlank {
                userId.substringBefore('_', "4907")
            }

            if (userId.isBlank()) {
                throw IllegalStateException("userId non résolu")
            }

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

            val (code, body) = executeWithAutoReauth("GET", "/planner/api/v1") {
                buildAuthenticatedApiRequest("$host$path").get().build()
            }

            if (code !in 200..299 || body.isBlank()) {
                throw IllegalStateException("HTTP $code sur /planner")
            }
            SmartschoolParsers.parsePlannerElements(body, platformId)
        }

    suspend fun toggleHomeworkResolved(
        platformId: String,
        assignmentId: String,
        resolve: Boolean
    ): Boolean = withContext(Dispatchers.IO) {
        val host = sessionManager.schoolHost.ifBlank { "https://jean23.smartschool.be" }
        val action = if (resolve) "resolve" else "unresolve"
        val path = "/planner/api/v1/planned-assignments/$platformId/$assignmentId/$action"

        return@withContext try {
            val (code, _) = executeWithAutoReauth("POST", "/planner/$action") {
                val emptyJsonBody = "{}".toRequestBody("application/json".toMediaType())
                buildAuthenticatedApiRequest("$host$path").post(emptyJsonBody).build()
            }
            code in 200..299
        } catch (_: Exception) {
            false
        }
    }

    suspend fun fetchDirectGrades(): List<WearGrade> = withContext(Dispatchers.IO) {
        val host = sessionManager.schoolHost.ifBlank { "https://jean23.smartschool.be" }
        val path = "/results/api/v1/evaluations/?pageNumber=1&itemsOnPage=50"

        val (code, body) = executeWithAutoReauth("GET", "/results/api/v1") {
            buildAuthenticatedApiRequest("$host$path").get().build()
        }

        if (code !in 200..299 || body.isBlank()) {
            throw IllegalStateException("HTTP $code sur /results")
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

            // Si userId n'était pas encore connu, l'extraire depuis identifier (ex: 4907_5748_0_normal_58116)
            if (sessionManager.userId.isBlank() && identifier.contains("_")) {
                val parts = identifier.split("_")
                if (parts.size >= 3) {
                    sessionManager.platformId = parts[0]
                    sessionManager.userId = "${parts[0]}_${parts[1]}_${parts[2]}"
                }
            }

            if (evalType == "project" && identifier.isNotEmpty()) {
                val existingGoals = evObj.optJSONObject("details")?.optJSONArray("projectGoals")
                if (existingGoals == null || existingGoals.length() == 0) {
                    // 1. Vérifier d'abord le cache local persistant pour ne jamais re-télécharger un projet déjà connu
                    val cachedJson = sessionManager.getCachedProjectEvaluationJson(identifier)
                    if (!cachedJson.isNullOrBlank()) {
                        runCatching { JSONObject(cachedJson) }.getOrNull()?.let { evObj = it }
                    } else {
                        val detailObj = fetchSingleEvaluationDetail(host, identifier)
                        if (detailObj != null) {
                            sessionManager.saveCachedProjectEvaluationJson(identifier, detailObj.toString())
                            evObj = detailObj
                        }
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
        val request = buildAuthenticatedApiRequest(url).get().build()
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

    suspend fun fetchDirectMessages(): List<WearMessage> = withContext(Dispatchers.IO) {
        val host = sessionManager.schoolHost.ifBlank { "https://jean23.smartschool.be" }
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
                        <param name="poll_ids"><![CDATA[]]></param>
                        <param name="layout"><![CDATA[classic]]></param>
                    </params>
                </command>
            </request>
        """.trimIndent()

        val (code, body) = executeWithAutoReauth("POST", "/Messages/dispatcher") {
            val formBody = FormBody.Builder().add("command", listCommandXml).build()
            buildAuthenticatedApiRequest(dispatcherUrl).post(formBody).build()
        }

        if (code !in 200..299 || body.isBlank()) {
            throw IllegalStateException("HTTP $code sur Messages")
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
        val request = buildAuthenticatedApiRequest(dispatcherUrl).post(formBody).build()

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

    suspend fun fetchDirectStudentProfile(): WearStudentProfile? = withContext(Dispatchers.IO) {
        val host = sessionManager.schoolHost.ifBlank { "https://jean23.smartschool.be" }
        val url = "$host/Studentcard/Student/getStudents"

        return@withContext try {
            val (code, body) = executeWithAutoReauth("POST", "/Studentcard") {
                val emptyForm = "".toRequestBody("application/x-www-form-urlencoded; charset=UTF-8".toMediaType())
                buildAuthenticatedApiRequest(url).post(emptyForm).build()
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

    /**
     * Extrait la valeur d'un <input name="..." value="..."> quel que soit l'ordre des attributs
     */
    private fun extractInputValueByName(html: String, targetName: String): String? {
        val inputRegex = Regex("<input[^>]+>", RegexOption.IGNORE_CASE)
        val nameRegex = Regex("""name\s*=\s*["']([^"']+)["']""", RegexOption.IGNORE_CASE)
        val valRegex = Regex("""value\s*=\s*["']([^"']*)["']""", RegexOption.IGNORE_CASE)

        for (match in inputRegex.findAll(html)) {
            val tag = match.value
            val name = nameRegex.find(tag)?.groupValues?.getOrNull(1) ?: continue
            if (name == targetName) {
                return valRegex.find(tag)?.groupValues?.getOrNull(1) ?: ""
            }
        }
        return null
    }

    /**
     * Normalise une date de naissance au format YYYY-MM-DD attendu par account_verification_form
     */
    private fun normalizeBirthDate(raw: String): String {
        val trimmed = raw.trim()
        if (trimmed.isEmpty()) return ""
        // Si déjà YYYY-MM-DD
        if (Regex("""^\d{4}-\d{2}-\d{2}$""").matches(trimmed)) return trimmed
        // Si DD/MM/YYYY ou DD-MM-YYYY
        val dmy = Regex("""^(\d{2})[/.-](\d{2})[/.-](\d{4})$""").find(trimmed)
        if (dmy != null) {
            return "${dmy.groupValues[3]}-${dmy.groupValues[2]}-${dmy.groupValues[1]}"
        }
        return trimmed
    }

    /**
     * En-têtes exacts pour les pages HTML (/login et /account-verification)
     */
    private fun buildHtmlNavigationRequest(url: String): Request.Builder {
        val builder = Request.Builder()
            .url(url)
            .header(
                "Accept",
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/jxl,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
            )
            .header("Accept-Language", "en-US,en;q=0.9,fr-BE;q=0.8,fr;q=0.7")
            .header("Upgrade-Insecure-Requests", "1")
            .header("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")

        val cookies = sessionManager.cookies
        if (cookies.isNotBlank()) {
            builder.header("Cookie", cookies)
        }
        return builder
    }

    /**
     * En-têtes exacts pour les appels XHR / API (/planner/api/v1, /results/api/v1, /Studentcard, /Messages)
     */
    private fun buildAuthenticatedApiRequest(url: String): Request.Builder {
        val builder = Request.Builder()
            .url(url)
            .header("Accept", "application/json, text/plain, */*")
            .header("Accept-Language", "en-US,en;q=0.9,fr-BE;q=0.8,fr;q=0.7")
            .header("X-Requested-With", "XMLHttpRequest")
            .header("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
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
