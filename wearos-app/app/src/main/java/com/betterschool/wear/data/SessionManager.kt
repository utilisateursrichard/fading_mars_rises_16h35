package com.betterschool.wear.data

import android.content.Context
import android.content.SharedPreferences
import com.betterschool.wear.domain.TileDisplayMode
import com.betterschool.wear.domain.WearPairingSessionPayload

/**
 * Gestionnaire de session sur la montre Wear OS.
 * Par défaut, aucune session n'est active et le Mode Démo est DÉSACTIVÉ :
 * la montre s'ouvre directement sur l'écran de Connexion.
 */
class SessionManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_FILE_NAME, Context.MODE_PRIVATE)

    var isPaired: Boolean
        get() = prefs.getBoolean(KEY_IS_PAIRED, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_PAIRED, value).apply()

    var schoolHost: String
        get() = prefs.getString(KEY_HOST, "") ?: ""
        set(value) = prefs.edit().putString(KEY_HOST, value.trimEnd('/')).apply()

    var userId: String
        get() = prefs.getString(KEY_USER_ID, "") ?: ""
        set(value) = prefs.edit().putString(KEY_USER_ID, value.trim()).apply()

    var platformId: String
        get() = prefs.getString(KEY_PLATFORM_ID, "") ?: ""
        set(value) = prefs.edit().putString(KEY_PLATFORM_ID, value.trim()).apply()

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

    // Par défaut false : si la montre n'est pas connectée, on affiche l'écran de connexion (pas de démo imposée)
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

    val hasValidLiveSession: Boolean
        get() = isPaired && cookies.isNotBlank() && schoolHost.startsWith("http")

    fun savePairedSession(payload: WearPairingSessionPayload) {
        val editor = prefs.edit()
            .putBoolean(KEY_IS_PAIRED, true)
            .putString(KEY_HOST, payload.host.trimEnd('/'))
            .putString(KEY_USER_ID, payload.userId.trim())
            .putString(KEY_PLATFORM_ID, payload.platformId.trim())
            .putString(KEY_STUDENT_NAME, payload.studentName)
            .putString(KEY_STUDENT_CLASS, payload.studentClass)
            .putString(KEY_SCHOOL_NAME, payload.schoolName)
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
            .remove(KEY_USER_ID)
            .remove(KEY_STUDENT_NAME)
            .remove(KEY_CACHED_AVG_PCT)
            .putBoolean(KEY_DEMO_MODE, false)
            .apply()
    }

    companion object {
        private const val PREFS_FILE_NAME = "betterschool_wear_prefs_v2"
        private const val KEY_IS_PAIRED = "smsc_is_paired"
        private const val KEY_HOST = "smsc_host"
        private const val KEY_USER_ID = "smsc_user_id"
        private const val KEY_PLATFORM_ID = "smsc_platform_id"
        private const val KEY_COOKIES = "smsc_cookies"
        private const val KEY_STUDENT_NAME = "smsc_student_name"
        private const val KEY_STUDENT_CLASS = "smsc_student_class"
        private const val KEY_SCHOOL_NAME = "smsc_school_name"
        private const val KEY_DEMO_MODE = "smsc_demo_mode"
        private const val KEY_TILE_MODE = "smsc_tile_mode"
        private const val KEY_CACHED_AVG_PCT = "smsc_cached_avg_pct"
    }
}
