package com.betterschool.wear.data

import android.content.Context
import android.content.SharedPreferences
import com.betterschool.wear.domain.TileDisplayMode
import com.betterschool.wear.domain.WearPairingSessionPayload

/**
 * Gestionnaire de session sur la montre Wear OS.
 * Conserve les tokens Smartschool (PHPSESSID, smscndc, pid), l'hôte de l'école et le userId
 * reçus lors du scan du QR Code affiché par la montre.
 */
class SessionManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_FILE_NAME, Context.MODE_PRIVATE)

    var schoolHost: String
        get() = prefs.getString(KEY_HOST, "https://jean23.smartschool.be") ?: "https://jean23.smartschool.be"
        set(value) = prefs.edit().putString(KEY_HOST, value.trimEnd('/')).apply()

    var userId: String
        get() = prefs.getString(KEY_USER_ID, "4907_5748_0") ?: "4907_5748_0"
        set(value) = prefs.edit().putString(KEY_USER_ID, value.trim()).apply()

    var platformId: String
        get() = prefs.getString(KEY_PLATFORM_ID, "4907") ?: "4907"
        set(value) = prefs.edit().putString(KEY_PLATFORM_ID, value.trim()).apply()

    var cookies: String
        get() = prefs.getString(KEY_COOKIES, "") ?: ""
        set(value) = prefs.edit().putString(KEY_COOKIES, value.trim()).apply()

    var studentName: String
        get() = prefs.getString(KEY_STUDENT_NAME, "Richard De Gandt") ?: "Richard De Gandt"
        set(value) = prefs.edit().putString(KEY_STUDENT_NAME, value).apply()

    var studentClass: String
        get() = prefs.getString(KEY_STUDENT_CLASS, "4T1") ?: "4T1"
        set(value) = prefs.edit().putString(KEY_STUDENT_CLASS, value).apply()

    var schoolName: String
        get() = prefs.getString(KEY_SCHOOL_NAME, "Collège Jean XXIII") ?: "Collège Jean XXIII"
        set(value) = prefs.edit().putString(KEY_SCHOOL_NAME, value).apply()

    var isDemoMode: Boolean
        get() = prefs.getBoolean(KEY_DEMO_MODE, cookies.isBlank())
        set(value) = prefs.edit().putBoolean(KEY_DEMO_MODE, value).apply()

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
        get() = cookies.isNotBlank() && userId.isNotBlank() && schoolHost.startsWith("http")

    fun savePairedSession(payload: WearPairingSessionPayload) {
        prefs.edit()
            .putString(KEY_HOST, payload.host.trimEnd('/'))
            .putString(KEY_USER_ID, payload.userId.trim())
            .putString(KEY_PLATFORM_ID, payload.platformId.trim().ifEmpty {
                payload.userId.substringBefore('_', "4907")
            })
            .putString(KEY_STUDENT_NAME, payload.studentName)
            .putString(KEY_STUDENT_CLASS, payload.studentClass)
            .putString(KEY_SCHOOL_NAME, payload.schoolName)
            .putString(KEY_COOKIES, payload.cookies.trim())
            .putBoolean(KEY_DEMO_MODE, payload.isDemoMode || payload.cookies.isBlank())
            .apply()
    }

    fun clearSession() {
        prefs.edit()
            .remove(KEY_COOKIES)
            .putBoolean(KEY_DEMO_MODE, true)
            .apply()
    }

    companion object {
        private const val PREFS_FILE_NAME = "betterschool_wear_secure_prefs"
        private const val KEY_HOST = "smsc_host"
        private const val KEY_USER_ID = "smsc_user_id"
        private const val KEY_PLATFORM_ID = "smsc_platform_id"
        private const val KEY_COOKIES = "smsc_cookies"
        private const val KEY_STUDENT_NAME = "smsc_student_name"
        private const val KEY_STUDENT_CLASS = "smsc_student_class"
        private const val KEY_SCHOOL_NAME = "smsc_school_name"
        private const val KEY_DEMO_MODE = "smsc_demo_mode"
        private const val KEY_TILE_MODE = "smsc_tile_mode"
    }
}
