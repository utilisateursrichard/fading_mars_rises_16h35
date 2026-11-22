package com.betterschool.wear.data

import android.content.Context
import android.content.SharedPreferences
import com.betterschool.wear.domain.TileDisplayMode
import com.betterschool.wear.domain.WearPairingSessionPayload

/**
 * Gestionnaire de session persistante sur la montre Wear OS.
 * Stocke les identifiants / cookies Smartschool et met à jour dynamiquement le CookieJar
 * pour que la montre fasse 100% de ses requêtes elle-même vers Smartschool sans jamais ré-appairer.
 */
class SessionManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_FILE_NAME, Context.MODE_PRIVATE)

    var isPaired: Boolean
        get() = prefs.getBoolean(KEY_IS_PAIRED, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_PAIRED, value).apply()

    var schoolHost: String
        get() = prefs.getString(KEY_HOST, "") ?: ""
        set(value) = prefs.edit().putString(KEY_HOST, value.trim().trimEnd('/')).apply()

    var userId: String
        get() = prefs.getString(KEY_USER_ID, "") ?: ""
        set(value) = prefs.edit().putString(KEY_USER_ID, value.trim()).apply()

    var platformId: String
        get() = prefs.getString(KEY_PLATFORM_ID, "") ?: ""
        set(value) = prefs.edit().putString(KEY_PLATFORM_ID, value.trim()).apply()

    var username: String
        get() = prefs.getString(KEY_USERNAME, "") ?: ""
        set(value) = prefs.edit().putString(KEY_USERNAME, value.trim()).apply()

    var password: String
        get() = prefs.getString(KEY_PASSWORD, "") ?: ""
        set(value) = prefs.edit().putString(KEY_PASSWORD, value).apply()

    var birthDate: String
        get() = prefs.getString(KEY_BIRTHDATE, "") ?: ""
        set(value) = prefs.edit().putString(KEY_BIRTHDATE, value.trim()).apply()

    var cookies: String
        get() = prefs.getString(KEY_COOKIES, "") ?: ""
        set(value) = prefs.edit().putString(KEY_COOKIES, value.trim()).apply()

    var studentName: String
        get() = prefs.getString(KEY_STUDENT_NAME, "") ?: ""
        set(value) = prefs.edit().putString(KEY_STUDENT_NAME, value).apply()

    var studentClass: String
        get() = prefs.getString(KEY_STUDENT_CLASS, "") ?: ""
        set(value) = prefs.edit().putString(KEY_STUDENT_CLASS, value).apply()

    var schoolName: String
        get() = prefs.getString(KEY_SCHOOL_NAME, "") ?: ""
        set(value) = prefs.edit().putString(KEY_SCHOOL_NAME, value).apply()

    var isDemoMode: Boolean
        get() = prefs.getBoolean(KEY_DEMO_MODE, false)
        set(value) = prefs.edit().putBoolean(KEY_DEMO_MODE, value).apply()

    var cachedAveragePct: Double?
        get() {
            val raw = prefs.getFloat(KEY_CACHED_AVG_PCT, -1f)
            return if (raw > 0f) ((raw.toDouble() * 10.0).toInt() / 10.0) else null
        }
        set(value) {
            if (value != null && value > 0.0) {
                prefs.edit().putFloat(KEY_CACHED_AVG_PCT, value.toFloat()).apply()
            } else {
                prefs.edit().remove(KEY_CACHED_AVG_PCT).apply()
            }
        }

    var tileDisplayMode: TileDisplayMode
        get() {
            val saved = prefs.getString(KEY_TILE_MODE, TileDisplayMode.NEXT_COURSE.name)
            return try {
                TileDisplayMode.valueOf(saved ?: TileDisplayMode.NEXT_COURSE.name)
            } catch (_: Exception) {
                TileDisplayMode.NEXT_COURSE
            }
        }
        set(value) = prefs.edit().putString(KEY_TILE_MODE, value.name).apply()

    /**
     * Cache persistant des évaluations de type "project" (LPD) déjà résolues,
     * pour ne jamais spammer Smartschool avec 15 requêtes GET /results/api/v1/evaluations/{id} à chaque sync.
     */
    fun getCachedProjectEvaluationJson(identifier: String): String? {
        if (identifier.isBlank()) return null
        return prefs.getString("proj_eval_$identifier", null)
    }

    fun saveCachedProjectEvaluationJson(identifier: String, rawJson: String) {
        if (identifier.isBlank() || rawJson.isBlank()) return
        prefs.edit().putString("proj_eval_$identifier", rawJson).apply()
    }

    val hasCredentials: Boolean
        get() = username.isNotBlank() && password.isNotBlank() && schoolHost.startsWith("http")

    val hasValidLiveSession: Boolean
        get() = isPaired && schoolHost.startsWith("http") && (cookies.isNotBlank() || hasCredentials)

    /**
     * Fusionne les nouveaux cookies Set-Cookie reçus de Smartschool avec ceux existants
     */
    @Synchronized
    fun mergeCookiesFromResponse(setCookieHeaders: List<String>) {
        if (setCookieHeaders.isEmpty()) return
        val cookieMap = linkedMapOf<String, String>()

        // 1. Charger les cookies actuels
        cookies.split(";").forEach { part ->
            val trimmed = part.trim()
            val eq = trimmed.indexOf('=')
            if (eq > 0) {
                val k = trimmed.substring(0, eq).trim()
                val v = trimmed.substring(eq + 1).trim()
                if (k.isNotEmpty() && v.isNotEmpty()) {
                    cookieMap[k] = v
                }
            }
        }

        // 2. Écraser / ajouter les nouveaux cookies Set-Cookie du serveur Smartschool
        for (header in setCookieHeaders) {
            val firstPair = header.substringBefore(';').trim()
            val eq = firstPair.indexOf('=')
            if (eq > 0) {
                val k = firstPair.substring(0, eq).trim()
                val v = firstPair.substring(eq + 1).trim()
                if (k.isNotEmpty()) {
                    if (v.equals("deleted", ignoreCase = true) || v.isEmpty()) {
                        cookieMap.remove(k)
                    } else {
                        cookieMap[k] = v
                    }
                }
            }
        }

        if (cookieMap.isNotEmpty()) {
            cookies = cookieMap.entries.joinToString("; ") { "${it.key}=${it.value}" }
        }
    }

    fun savePairedSession(payload: WearPairingSessionPayload) {
        val normalizedHost = normalizeSmartschoolHost(payload.host)
        val editor = prefs.edit()
            .putBoolean(KEY_IS_PAIRED, true)
            .putString(KEY_HOST, normalizedHost)
            .putString(KEY_USER_ID, payload.userId.trim())
            .putString(KEY_PLATFORM_ID, payload.platformId.trim().ifEmpty {
                payload.userId.substringBefore('_', "")
            })
            .putString(KEY_STUDENT_NAME, payload.studentName)
            .putString(KEY_STUDENT_CLASS, payload.studentClass)
            .putString(KEY_SCHOOL_NAME, payload.schoolName)
            .putString(KEY_USERNAME, payload.username.trim())
            .putString(KEY_PASSWORD, payload.password)
            .putString(KEY_BIRTHDATE, payload.birthDate.trim())
            .putString(KEY_COOKIES, payload.cookies.trim())
            .putBoolean(KEY_DEMO_MODE, payload.isDemoMode)

        if (payload.overallAveragePct != null && payload.overallAveragePct > 0.0) {
            editor.putFloat(KEY_CACHED_AVG_PCT, payload.overallAveragePct.toFloat())
        }
        editor.apply()
    }

    fun clearSession() {
        prefs.edit()
            .putBoolean(KEY_IS_PAIRED, false)
            .remove(KEY_COOKIES)
            .remove(KEY_USERNAME)
            .remove(KEY_PASSWORD)
            .remove(KEY_BIRTHDATE)
            .remove(KEY_USER_ID)
            .remove(KEY_STUDENT_NAME)
            .remove(KEY_CACHED_AVG_PCT)
            .putBoolean(KEY_DEMO_MODE, false)
            .apply()
    }

    companion object {
        private const val PREFS_FILE_NAME = "betterschool_wear_prefs_v3"
        private const val KEY_IS_PAIRED = "smsc_is_paired"
        private const val KEY_HOST = "smsc_host"
        private const val KEY_USER_ID = "smsc_user_id"
        private const val KEY_PLATFORM_ID = "smsc_platform_id"
        private const val KEY_USERNAME = "smsc_username"
        private const val KEY_PASSWORD = "smsc_password"
        private const val KEY_BIRTHDATE = "smsc_birthdate"
        private const val KEY_COOKIES = "smsc_cookies"
        private const val KEY_STUDENT_NAME = "smsc_student_name"
        private const val KEY_STUDENT_CLASS = "smsc_student_class"
        private const val KEY_SCHOOL_NAME = "smsc_school_name"
        private const val KEY_DEMO_MODE = "smsc_demo_mode"
        private const val KEY_TILE_MODE = "smsc_tile_mode"
        private const val KEY_CACHED_AVG_PCT = "smsc_cached_avg_pct"

        fun normalizeSmartschoolHost(raw: String): String {
            var h = raw.trim().trimEnd('/')
            if (h.isEmpty()) return ""
            if (!h.startsWith("http://") && !h.startsWith("https://")) {
                if (!h.contains(".")) {
                    h = "$h.smartschool.be"
                }
                h = "https://$h"
            }
            return h.trimEnd('/')
        }
    }
}
