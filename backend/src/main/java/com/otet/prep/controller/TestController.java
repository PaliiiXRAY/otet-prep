package com.otet.prep.controller;

import com.otet.prep.model.dto.*;
import com.otet.prep.service.DataSeederService;
import com.otet.prep.service.TestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class TestController {

    private final TestService testService;
    private final DataSeederService dataSeederService;

    public TestController(TestService testService, DataSeederService dataSeederService) {
        this.testService = testService;
        this.dataSeederService = dataSeederService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "OTET Assessment & Analytics Engine",
                "features", "Autosave, Crash Recovery, AI Diagnostics",
                "timestamp", java.time.Instant.now().toString()
        ));
    }

    @GetMapping("/tests")
    public ResponseEntity<List<TestPaperSummaryDTO>> getAvailableTests() {
        return ResponseEntity.ok(testService.getAllTestPapers());
    }

    @GetMapping("/tests/{paperCode}/questions")
    public ResponseEntity<List<QuestionResponseDTO>> getQuestions(@PathVariable String paperCode) {
        return ResponseEntity.ok(testService.getQuestionsForPaper(paperCode));
    }

    @PostMapping("/tests/{paperCode}/start")
    public ResponseEntity<StartTestResponseDTO> startOrResumeTest(
            @PathVariable String paperCode,
            @RequestBody(required = false) StartTestRequestDTO request) {
        return ResponseEntity.ok(testService.startOrResumeTest(paperCode, request));
    }

    @PostMapping("/attempts/{attemptId}/autosave")
    public ResponseEntity<Map<String, Object>> autosaveAttempt(
            @PathVariable Long attemptId,
            @RequestBody AutosaveRequestDTO request) {
        return ResponseEntity.ok(testService.autosaveAttempt(attemptId, request));
    }

    @PostMapping("/attempts/{attemptId}/submit")
    public ResponseEntity<TestResultDTO> submitAttempt(
            @PathVariable Long attemptId,
            @RequestBody(required = false) SubmitTestRequestDTO request) {
        return ResponseEntity.ok(testService.submitAttempt(attemptId, request));
    }

    @GetMapping("/students/{email}/history")
    public ResponseEntity<List<StudentHistorySummaryDTO>> getStudentHistory(@PathVariable String email) {
        return ResponseEntity.ok(testService.getStudentHistory(email));
    }

    @GetMapping("/students/{email}/active")
    public ResponseEntity<?> getActiveAttempt(@PathVariable String email) {
        return testService.getActiveResumeAttempt(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @RequestMapping(value = "/admin/seed", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, Object>> triggerSeed() {
        return ResponseEntity.ok(dataSeederService.seedDatabase());
    }
}
