package com.otet.prep.controller;

import com.otet.prep.model.dto.*;
import com.otet.prep.service.TestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class TestController {

    private final TestService testService;

    public TestController(TestService testService) {
        this.testService = testService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "OTET Assessment Engine",
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

    @PostMapping("/tests/{paperCode}/submit")
    public ResponseEntity<TestResultDTO> submitTest(@PathVariable String paperCode,
                                                    @RequestBody SubmitTestRequestDTO request) {
        return ResponseEntity.ok(testService.submitTest(paperCode, request));
    }
}
