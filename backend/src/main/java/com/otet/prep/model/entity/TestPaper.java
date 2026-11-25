package com.otet.prep.model.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_papers")
public class TestPaper {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String paperCode; // e.g. "paper1", "paper2-social", "paper2-science"

    @Column(nullable = false)
    private String title;

    @Column(length = 500)
    private String description;

    private String targetClass; // e.g. "Classes I to V"

    private int durationMinutes = 150;

    private int totalQuestions = 150;

    @OneToMany(mappedBy = "testPaper", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("questionNumber ASC")
    private List<Question> questions = new ArrayList<>();

    public TestPaper() {}

    public TestPaper(String paperCode, String title, String description, String targetClass, int durationMinutes) {
        this.paperCode = paperCode;
        this.title = title;
        this.description = description;
        this.targetClass = targetClass;
        this.durationMinutes = durationMinutes;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPaperCode() { return paperCode; }
    public void setPaperCode(String paperCode) { this.paperCode = paperCode; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTargetClass() { return targetClass; }
    public void setTargetClass(String targetClass) { this.targetClass = targetClass; }

    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }

    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }

    public List<Question> getQuestions() { return questions; }
    public void setQuestions(List<Question> questions) { this.questions = questions; }

    public void addQuestion(Question question) {
        questions.add(question);
        question.setTestPaper(this);
    }
}
