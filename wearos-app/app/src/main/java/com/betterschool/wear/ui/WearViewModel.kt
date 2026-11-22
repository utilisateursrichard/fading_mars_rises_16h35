package com.betterschool.wear.ui

import android.app.Application
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

data class WearUiState(
    val isLoading: Boolean = false,
    val isDemoMode: Boolean = true,
    val isPaired: Boolean = false,
    val schoolHost: String = "https://jean23.smartschool.be",
    val profile: WearStudentProfile = WearMockData.profile,
    val todayCourses: List<WearCourseEvent> = WearMockData.todayCourses,
    val messages: List<WearMessage> = WearMockData.messages,
    val grades: List<WearGrade> = WearMockData.grades,
    val weightedAverage: Double? = 81.6,
    val homeworks: List<WearHomework> = WearMockData.homeworks,
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
        loadInitialData()
    }

    private fun loadInitialData() {
        val isDemo = sessionManager.isDemoMode || !sessionManager.hasValidLiveSession
        _uiState.update {
            it.copy(
                isDemoMode = isDemo,
                isPaired = sessionManager.hasValidLiveSession,
                schoolHost = sessionManager.schoolHost,
                tileDisplayMode = sessionManager.tileDisplayMode,
                profile = WearStudentProfile(
                    userId = sessionManager.userId,
                    platformId = sessionManager.platformId,
                    fullName = sessionManager.studentName,
                    studentClass = sessionManager.studentClass,
                    schoolName = sessionManager.schoolName
                )
            )
        }

        if (isDemo) {
            applyDemoData()
        } else {
            refreshFromSmartschool()
        }
    }

    private fun applyDemoData() {
        val avg = SmartschoolParsers.computeWeightedGeneralAverage(WearMockData.grades)
        _uiState.update {
            it.copy(
                isLoading = false,
                isDemoMode = true,
                profile = WearMockData.profile,
                todayCourses = WearMockData.todayCourses,
                messages = WearMockData.messages,
                grades = WearMockData.grades,
                weightedAverage = avg,
                homeworks = WearMockData.homeworks,
                statusBanner = "Mode Démo actif"
            )
        }
    }

    /**
     * Exécute les requêtes HTTP directes depuis la montre vers Smartschool (OkHttp sans CORS)
     */
    fun refreshFromSmartschool() {
        if (sessionManager.isDemoMode || !sessionManager.hasValidLiveSession) {
            applyDemoData()
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, statusBanner = "Synchronisation Smartschool...") }

            try {
                // 1. Sécurité Anti-Usurpation : le userId est toujours résolu et certifié par le serveur
                // Smartschool à partir du cookie de session (isCurrentUser == true dans /Studentcard/Student/getStudents)
                val certifiedProfile = apiClient.fetchDirectStudentProfile()
                if (certifiedProfile != null) {
                    sessionManager.userId = certifiedProfile.userId
                    sessionManager.studentName = certifiedProfile.fullName
                    sessionManager.studentClass = certifiedProfile.studentClass
                }

                // 2. Horaire du jour & Devoirs (/planner/api/v1/...) avec le userId certifié par la session
                val (courses, homeworks) = apiClient.fetchDirectScheduleAndHomeworks()

                // 3. Dernières notes Skore (/results/api/v1/evaluations/)
                val grades = runCatching { apiClient.fetchDirectGrades() }.getOrDefault(emptyList())
                val weightedAvg = SmartschoolParsers.computeWeightedGeneralAverage(grades)

                // 4. Derniers messages (/?module=Messages&file=dispatcher)
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
                        weightedAverage = weightedAvg ?: state.weightedAverage,
                        messages = messages.ifEmpty { state.messages },
                        statusBanner = "Synchronisé avec Smartschool"
                    )
                }
            } catch (e: Exception) {
                _uiState.update { state ->
                    state.copy(
                        isLoading = false,
                        statusBanner = "Erreur réseau : ${e.message ?: "Session expirée"}"
                    )
                }
            }
        }
    }

    /**
     * Coche ou décoche un devoir directement au poignet et envoie la requête à Smartschool
     */
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

    /**
     * Génère un QR Code sur la montre et démarre l'écoute du relais betterschool.dino.icu
     * pour que l'utilisateur puisse scanner sa montre depuis son téléphone ou PC.
     */
    fun startQrPairingOnWatch() {
        pairingPollJob?.cancel()
        pairingPollJob = viewModelScope.launch {
            _uiState.update { it.copy(isPollingPairing = true, statusBanner = "Création du QR Code...") }
            val ticket = apiClient.createPairingTicket()
            _uiState.update {
                it.copy(
                    pairingTicket = ticket,
                    statusBanner = "Scannez ce QR Code sur BetterSchool Web"
                )
            }

            // Poll toutes les 2 secondes pendant 5 minutes
            val startTime = System.currentTimeMillis()
            while (isActive && System.currentTimeMillis() - startTime < 5 * 60 * 1000L) {
                delay(2000L)
                val pairedPayload = apiClient.pollPairingSession(ticket.code)
                if (pairedPayload != null) {
                    sessionManager.savePairedSession(pairedPayload)
                    val snapAvg = SmartschoolParsers.computeWeightedGeneralAverage(pairedPayload.snapshotGrades)
                    _uiState.update { state ->
                        state.copy(
                            isPollingPairing = false,
                            pairingTicket = null,
                            isDemoMode = pairedPayload.isDemoMode,
                            isPaired = true,
                            schoolHost = sessionManager.schoolHost,
                            profile = WearStudentProfile(
                                userId = pairedPayload.userId,
                                platformId = pairedPayload.platformId,
                                fullName = pairedPayload.studentName,
                                studentClass = pairedPayload.studentClass,
                                schoolName = pairedPayload.schoolName
                            ),
                            todayCourses = pairedPayload.snapshotCourses.ifEmpty { state.todayCourses },
                            homeworks = pairedPayload.snapshotHomeworks.ifEmpty { state.homeworks },
                            messages = pairedPayload.snapshotMessages.ifEmpty { state.messages },
                            grades = pairedPayload.snapshotGrades.ifEmpty { state.grades },
                            weightedAverage = snapAvg ?: state.weightedAverage,
                            statusBanner = "Connecté à ${pairedPayload.studentName}"
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

    fun stopQrPairingOnWatch() {
        pairingPollJob?.cancel()
        _uiState.update { it.copy(isPollingPairing = false, pairingTicket = null) }
    }

    fun toggleDemoMode() {
        val nextDemo = !_uiState.value.isDemoMode
        sessionManager.isDemoMode = nextDemo
        if (nextDemo) {
            applyDemoData()
        } else {
            refreshFromSmartschool()
        }
    }

    fun setTileDisplayMode(mode: TileDisplayMode) {
        sessionManager.tileDisplayMode = mode
        _uiState.update { it.copy(tileDisplayMode = mode) }
    }
}
