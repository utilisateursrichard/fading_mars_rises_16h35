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
    val tileDisplayMode: TileDisplayMode = TileDisplayMode.NEXT_COURSE,
    val statusBanner: String? = null
)

class WearViewModel(application: Application) : AndroidViewModel(application) {

    private val sessionManager = SessionManager(application.applicationContext)
    private val apiClient = SmartschoolApiClient(sessionManager)

    private val _uiState = MutableStateFlow(WearUiState())
    val uiState: StateFlow<WearUiState> = _uiState.asStateFlow()

    private var pairingPollJob: Job? = null

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
                refreshFromSmartschool()
            }
            demo -> {
                applyDemoData()
            }
            else -> {
                // Non connecté : aucune fausse donnée, démarrage automatique du code d'appairage !
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
                homeworks = WearMockData.homeworks,
                statusBanner = "Mode Démo"
            )
        }
    }

    fun enterDemoMode() {
        sessionManager.isDemoMode = true
        applyDemoData()
    }

    fun disconnectAndReturnToPairing() {
        sessionManager.clearSession()
        _uiState.update {
            WearUiState(
                isPaired = false,
                isDemoMode = false
            )
        }
        startQrPairingOnWatch()
    }

    fun refreshFromSmartschool() {
        if (sessionManager.isDemoMode && !sessionManager.isPaired) {
            applyDemoData()
            return
        }
        if (!sessionManager.hasValidLiveSession) {
            // Même sans cookie direct (ex: PHPSESSID HttpOnly), rafraîchir la moyenne générale depuis SQLite !
            if (sessionManager.userId.isNotBlank()) {
                viewModelScope.launch {
                    val sqliteAvg = apiClient.fetchSqliteUserAverage(sessionManager.userId)
                    if (sqliteAvg != null) {
                        sessionManager.cachedAveragePct = sqliteAvg
                        _uiState.update { it.copy(weightedAverage = sqliteAvg) }
                    }
                }
            }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, statusBanner = "Synchronisation...") }

            // 1. Récupérer en priorité la moyenne générale exacte stockée dans la base SQLite du serveur
            val sqliteAvg = runCatching { apiClient.fetchSqliteUserAverage(sessionManager.userId) }.getOrNull()
            if (sqliteAvg != null) {
                sessionManager.cachedAveragePct = sqliteAvg
                _uiState.update { it.copy(weightedAverage = sqliteAvg) }
            }

            try {
                val certifiedProfile = apiClient.fetchDirectStudentProfile()
                if (certifiedProfile != null) {
                    sessionManager.userId = certifiedProfile.userId
                    sessionManager.studentName = certifiedProfile.fullName
                    sessionManager.studentClass = certifiedProfile.studentClass
                }

                val (courses, homeworks) = apiClient.fetchDirectScheduleAndHomeworks()
                val grades = runCatching { apiClient.fetchDirectGrades() }.getOrDefault(emptyList())
                val freshSqliteAvg = sqliteAvg ?: runCatching {
                    apiClient.fetchSqliteUserAverage(sessionManager.userId)
                }.getOrNull()
                val effectiveAvg = freshSqliteAvg
                    ?: SmartschoolParsers.computeWeightedGeneralAverage(grades)
                    ?: sessionManager.cachedAveragePct
                if (effectiveAvg != null) {
                    sessionManager.cachedAveragePct = effectiveAvg
                }
                val messages = runCatching { apiClient.fetchDirectMessages() }.getOrDefault(emptyList())

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
                        messages = messages.ifEmpty { state.messages },
                        statusBanner = apiClient.lastSmartschoolTrace
                    )
                }
            } catch (e: Exception) {
                _uiState.update { state ->
                    state.copy(
                        isLoading = false,
                        statusBanner = apiClient.lastSmartschoolTrace
                    )
                }
            }
        }
    }

    fun toggleHomework(homework: WearHomework) {
        val targetCompleted = !homework.isCompleted

        _uiState.update { state ->
            state.copy(
                homeworks = state.homeworks.map {
                    if (it.id == homework.id) it.copy(isCompleted = targetCompleted) else it
                }
            )
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
            val localCode = (100000..999999).random().toString()
            _uiState.update {
                it.copy(
                    isPollingPairing = true,
                    pairingTicket = PairingTicket(
                        code = localCode,
                        qrUrl = "https://betterschool.dino.icu/?wearPair=$localCode"
                    ),
                    statusBanner = "En attente de connexion..."
                )
            }

            val ticket = apiClient.createPairingTicket()
            _uiState.update {
                it.copy(
                    pairingTicket = ticket,
                    statusBanner = "Entrez ce code sur BetterSchool Web"
                )
            }

            val startTime = System.currentTimeMillis()
            while (isActive && System.currentTimeMillis() - startTime < 5 * 60 * 1000L) {
                delay(2000L)
                val pairedPayload = apiClient.pollPairingSession(ticket.code)
                if (pairedPayload != null) {
                    sessionManager.savePairedSession(pairedPayload)
                    val sqliteAvg = runCatching {
                        apiClient.fetchSqliteUserAverage(pairedPayload.userId)
                    }.getOrNull()
                    val exactAvg = sqliteAvg
                        ?: pairedPayload.overallAveragePct
                        ?: SmartschoolParsers.computeWeightedGeneralAverage(pairedPayload.snapshotGrades)
                    if (exactAvg != null) {
                        sessionManager.cachedAveragePct = exactAvg
                    }
                    _uiState.update { state ->
                        state.copy(
                            isPollingPairing = false,
                            pairingTicket = null,
                            isDemoMode = false,
                            isPaired = true,
                            schoolHost = sessionManager.schoolHost,
                            profile = WearStudentProfile(
                                userId = pairedPayload.userId,
                                platformId = pairedPayload.platformId,
                                fullName = pairedPayload.studentName.ifEmpty { "Élève connecté" },
                                studentClass = pairedPayload.studentClass,
                                schoolName = pairedPayload.schoolName.ifEmpty { "Smartschool" }
                            ),
                            todayCourses = pairedPayload.snapshotCourses,
                            homeworks = pairedPayload.snapshotHomeworks,
                            messages = pairedPayload.snapshotMessages,
                            grades = pairedPayload.snapshotGrades,
                            weightedAverage = exactAvg,
                            statusBanner = "Connecté"
                        )
                    }
                    if (sessionManager.hasValidLiveSession) {
                        refreshFromSmartschool()
                    }
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
