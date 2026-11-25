package com.otet.prep.model.dto;

import java.util.List;
import java.util.Map;

public class QuestionResponseDTO {
    private Long id;
    private int questionNumber;
    private String subject;
    private Map<String, String> q; // {"en": "...", "or": "..."}
    private Map<String, List<String>> options; // {"en": ["opt1", "opt2", ...], "or": ["..."]}

    public QuestionResponseDTO(Long id, int questionNumber, String subject, Map<String, String> q, Map<String, List<String>> options) {
        this.id = id;
        this.questionNumber = questionNumber;
        this.subject = subject;
        this.q = q;
        this.options = options;
    }

    public Long getId() { return id; }
    public int getQuestionNumber() { return questionNumber; }
    public String getSubject() { return subject; }
    public Map<String, String> getQ() { return q; }
    public Map<String, List<String>> getOptions() { return options; }
}
