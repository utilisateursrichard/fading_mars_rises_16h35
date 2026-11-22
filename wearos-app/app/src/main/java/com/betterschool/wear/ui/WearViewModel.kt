package com.betterschool.wear.ui

import android.app.Application
import androidx.compose.runtime.Immutable
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.betterschool.wear.data.PairingTicket
import com.betterschool.wear.data.SessionManager
import com.betterschool.wear.data.SmartschoolApiClient
import com.betterschool.wear.data.SmartschoolParsers
import com.betterschool.wear.domain.TileDisplayMode
import com.betterschool.wear.domain.WearCourseEvent
import com.betterschool.wear.domain.WearGrade
import com.betterschool.wear.domain.WearHomework
import com.betterschool.wear.domain.WearMessage
import com.betterschool.wear.domain.WearMockData
import com.betterschool.wear.domain.WearStudentProfile
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

@Immutable
data class WearUiState(
    val isLoading: Boolean = false,
    val isPaired: Boolean = false,
    val isDemoMode: Boolean = false,
    val schoolHost: String = "",
    val profile: WearStudentProfile = WearStudentProfile("", "", "", "", ""),
    val todayCourses: List<WearCourseEvent> = emptyList(),
    val messages: List<WearMessage> = emptyList(),
    val grades: List<WearGrade> = emptyList(),
    val weightedAverage: Double? = null,
    val homeworks: List<WearHomework> = emptyList(),
    val pairingTicket: PairingTicket? = null,
    val isPollingPairing: Boolean = false,
    val tileDisplayMode: TileDisplayMode = TileDisplayMode.NEXT_COURSE
)

class WearViewModel(application: Application) : AndroidViewModel(application) {

    private val sessionManager = SessionManager(application.applicationContext)
    private val apiClient = SmartschoolApiClient(sessionManager)

    private val _uiState = MutableStateFlow(WearUiState())
    val uiState: StateFlow<WearUiState> = _uiState.asStateFlow()

    private var pairingPollJob: Job? = null
    private var syncJob: Job? = null
    private var lastSyncTimestampMs: Long = 0L

    init {
        initializeSessionState()
    }

    private fun initializeSessionState() {
        val paired = sessionManager.isPaired
        val demo = sessionManager.isDemoMode

        when {
            paired -> {
                _uiState.update {
                    it.copy(
                        isPaired = true,
                        isDemoMode = false,
                        schoolHost = sessionManager.schoolHost,
                        tileDisplayMode = sessionManager.tileDisplayMode,
                        weightedAverage = sessionManager.cachedAveragePct,
                        profile = WearStudentProfile(
                            userId = sessionManager.userId,
                            platformId = sessionManager.platformId,
                            fullName = sessionManager.studentName.ifEmpty { "Élève connecté" },
                            studentClass = sessionManager.studentClass,
                            schoolName = sessionManager.schoolName.ifEmpty { "Smartschool" }
                        )
                    )
                }
                refreshFromSmartschool(force = true)
            }
            demo -> {
                applyDemoData()
            }
            else -> {
                _uiState.update {
                    it.copy(
                        isPaired = false,
                        isDemoMode = false,
                        todayCourses = emptyList(),
                        messages = emptyList(),
                        grades = emptyList(),
                        homeworks = emptyList()
                    )
                }
                startQrPairingOnWatch()
            }
        }
    }

    /**
     * Appelé automatiquement quand l'écran de la montre s'éteint (ON_PAUSE / ON_STOP).
     * Coupe instantanément 100% des requêtes et du polling pour ne jamais consommer de réseau écran éteint.
     */
    fun onScreenPaused() {
        pairingPollJob?.cancel()
        pairingPollJob = null
    }

    /**
     * Appelé quand l'écran de la montre se rallume (ON_RESUME).
     * Relance le polling uniquement si la montre est sur l'écran d'appairage non connecté.
     */
    fun onScreenResumed() {
        val state = _uiState.value
        if (!state.isPaired && !state.isDemoMode && pairingPollJob == null) {
            startQrPairingOnWatch()
        }
    }

    private fun applyDemoData() {
        pairingPollJob?.cancel()
        val avg = SmartschoolParsers.computeWeightedGeneralAverage(WearMockData.grades)
        _uiState.update {
            it.copy(
                isLoading = false,
                isPaired = false,
                isDemoMode = true,
                isPollingPairing = false,
                profile = WearMockData.profile,
                todayCourses = WearMockData.todayCourses,
                messages = WearMockData.messages,
                grades = WearMockData.grades,
                weightedAverage = avg,
                homeworks = WearMockData.homeworks
            )
        }
    }

    fun enterDemoMode() {
        sessionManager.isDemoMode = true
        applyDemoData()
    }

    fun disconnectAndReturnToPairing() {
        syncJob?.cancel()
        sessionManager.clearSession()
        lastSyncTimestampMs = 0L
        _uiState.update {
            WearUiState(
                isPaired = false,
                isDemoMode = false
            )
        }
        startQrPairingOnWatch()
    }

    /**
     * Synchronisation directe avec anti-spam (cooldown de 15s et verrou si déjà en cours).
     * Ne relance loginToSmartschool() que si PHPSESSID est absent ou expiré (via executeWithAutoReauth).
     */
    fun refreshFromSmartschool(force: Boolean = false) {
        if (sessionManager.isDemoMode && !sessionManager.isPaired) {
            applyDemoData()
            return
        }
        if (!sessionManager.hasValidLiveSession) return

        // Anti-spam : ne pas relancer si une sync est déjà en cours ou si la dernière date de moins de 15s
        val now = System.currentTimeMillis()
        if (_uiState.value.isLoading) return
        if (!force && (now - lastSyncTimestampMs) < 15_000L) return

        syncJob?.cancel()
        syncJob = viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }

            try {
                // 0. Se connecter uniquement si on n'a pas encore de cookie PHPSESSID en cache
                // (si PHPSESSID a expiré, executeWithAutoReauth s'en chargera automatiquement)
                if (!sessionManager.cookies.contains("PHPSESSID") && sessionManager.hasCredentials) {
                    apiClient.loginToSmartschool()
                }

                // 1. Profil Studentcard (et découverte du userId si absent)
                val certifiedProfile = apiClient.fetchDirectStudentProfile()
                if (certifiedProfile != null) {
                    sessionManager.userId = certifiedProfile.userId
                    sessionManager.platformId = certifiedProfile.platformId
                    sessionManager.studentName = certifiedProfile.fullName
                    sessionManager.studentClass = certifiedProfile.studentClass
                }

                // 2. Exécution parallèle des requêtes Notes, Messages et Moyenne SQLite
                val gradesDeferred = async { runCatching { apiClient.fetchDirectGrades() }.getOrDefault(emptyList()) }
                val messagesDeferred = async { runCatching { apiClient.fetchDirectMessages() }.getOrDefault(emptyList()) }
                val grades = gradesDeferred.await()
                val messages = messagesDeferred.await()

                // 3. Horaire & Devoirs (utilise le userId résolu par Studentcard ou Skore)
                val (courses, homeworks) = runCatching {
                    apiClient.fetchDirectScheduleAndHomeworks()
                }.getOrDefault(Pair(emptyList(), emptyList()))

                val sqliteAvg = runCatching {
                    apiClient.fetchSqliteUserAverage(sessionManager.userId)
                }.getOrNull()

                val effectiveAvg = sqliteAvg
                    ?: SmartschoolParsers.computeWeightedGeneralAverage(grades)
                    ?: sessionManager.cachedAveragePct

                if (effectiveAvg != null) {
                    sessionManager.cachedAveragePct = effectiveAvg
                }

                lastSyncTimestampMs = System.currentTimeMillis()

                _uiState.update { state ->
                    state.copy(
                        isLoading = false,
                        isDemoMode = false,
                        isPaired = true,
                        profile = certifiedProfile ?: state.profile,
                        todayCourses = courses.ifEmpty { state.todayCourses },
                        homeworks = homeworks.ifEmpty { state.homeworks },
                        grades = grades.ifEmpty { state.grades },
                        weightedAverage = effectiveAvg ?: state.weightedAverage,
                        messages = messages.ifEmpty { state.messages }
                    )
                }
            } catch (_: Exception) {
                _uiState.update { state ->
                    state.copy(isLoading = false)
                }
            }
        }
    }

    fun toggleHomework(homework: WearHomework) {
        val targetCompleted = !homework.isCompleted

        _uiState.update { state ->
            val updatedList = state.homeworks.map {
                if (it.id == homework.id) {
                    val newImportance = SmartschoolParsers.calculateHomeworkImportance(
                        dueDateStr = it.dueDate,
                        assignmentTypeName = "${it.typeLabel} ${it.title}",
                        isCompleted = targetCompleted
                    )
                    it.copy(isCompleted = targetCompleted, importanceScore = newImportance)
                } else {
                    it
                }
            }
            state.copy(homeworks = SmartschoolParsers.sortHomeworksByImportance(updatedList))
        }

        if (!uiState.value.isDemoMode && sessionManager.hasValidLiveSession) {
            viewModelScope.launch {
                apiClient.toggleHomeworkResolved(
                    platformId = homework.platformId,
                    assignmentId = homework.assignmentId,
                    resolve = targetCompleted
                )
            }
        }
    }

    fun startQrPairingOnWatch() {
        pairingPollJob?.cancel()
        pairingPollJob = viewModelScope.launch {
            val existingCode = _uiState.value.pairingTicket?.code
            val localCode = existingCode ?: (100000..999999).random().toString()
            _uiState.update {
                it.copy(
                    isPollingPairing = true,
                    pairingTicket = PairingTicket(
                        code = localCode,
                        qrUrl = "https://betterschool.dino.icu/?wearPair=$localCode"
                    )
                )
            }

            val ticket = apiClient.createPairingTicket()
            _uiState.update {
                it.copy(pairingTicket = ticket)
            }

            val startTime = System.currentTimeMillis()
            while (isActive && System.currentTimeMillis() - startTime < 5 * 60 * 1000L) {
                delay(2500L)
                val pairedPayload = apiClient.pollPairingSession(ticket.code)
                if (pairedPayload != null) {
                    sessionManager.savePairedSession(pairedPayload)
                    _uiState.update { state ->
                        state.copy(
                            isPollingPairing = false,
                            pairingTicket = null,
                            isDemoMode = false,
                            isPaired = true,
                            isLoading = true,
                            schoolHost = sessionManager.schoolHost,
                            profile = WearStudentProfile(
                                userId = pairedPayload.userId,
                                platformId = pairedPayload.platformId,
                                fullName = pairedPayload.studentName.ifEmpty { "Élève connecté" },
                                studentClass = pairedPayload.studentClass,
                                schoolName = pairedPayload.schoolName.ifEmpty { "Smartschool" }
                            ),
                            weightedAverage = pairedPayload.overallAveragePct
                        )
                    }
                    refreshFromSmartschool(force = true)
                    break
                }
            }
        }
    }

    fun setTileDisplayMode(mode: TileDisplayMode) {
        sessionManager.tileDisplayMode = mode
        _uiState.update { it.copy(tileDisplayMode = mode) }
    }
}
