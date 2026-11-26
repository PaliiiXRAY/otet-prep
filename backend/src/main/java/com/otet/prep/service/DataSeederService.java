package com.otet.prep.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.otet.prep.model.entity.Question;
import com.otet.prep.model.entity.QuestionOption;
import com.otet.prep.model.entity.TestPaper;
import com.otet.prep.repository.QuestionRepository;
import com.otet.prep.repository.TestPaperRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

@Service
public class DataSeederService implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeederService.class);

    private final TestPaperRepository testPaperRepository;
    private final QuestionRepository questionRepository;
    private final ObjectMapper objectMapper;

    public DataSeederService(TestPaperRepository testPaperRepository,
                             QuestionRepository questionRepository,
                             ObjectMapper objectMapper) {
        this.testPaperRepository = testPaperRepository;
        this.questionRepository = questionRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) {
        // Run async or immediate seed
        new Thread(this::seedDatabase).start();
    }

    public synchronized Map<String, Object> seedDatabase() {
        Map<String, Object> result = new HashMap<>();
        long count = testPaperRepository.count();
        if (count > 0) {
            log.info("[DataSeeder] Database already contains {} test papers. Skipping seed.", count);
            result.put("status", "ALREADY_SEEDED");
            result.put("paperCount", count);
            return result;
        }

        log.info("[DataSeeder] Empty database detected. Ingesting test papers and questions from seed_data.json...");

        try {
            ClassPathResource resource = new ClassPathResource("seed_data.json");
            if (!resource.exists()) {
                log.warn("[DataSeeder] seed_data.json not found on classpath!");
                result.put("status", "ERROR");
                result.put("message", "seed_data.json not found on classpath");
                return result;
            }

            try (InputStream is = resource.getInputStream()) {
                JsonNode root = objectMapper.readTree(is);
                JsonNode papersNode = root.get("papers");

                if (papersNode != null && papersNode.isArray()) {
                    int totalPapers = 0;
                    int totalQuestions = 0;

                    for (JsonNode pNode : papersNode) {
                        try {
                            int qCount = seedSinglePaper(pNode);
                            totalPapers++;
                            totalQuestions += qCount;
                            log.info("[DataSeeder] Ingested paper: {} with {} questions", pNode.get("paperCode").asText(), qCount);
                        } catch (Exception ex) {
                            log.error("[DataSeeder] Error seeding paper {}: {}", pNode.get("paperCode"), ex.getMessage());
                        }
                    }

                    log.info("[DataSeeder] Successfully finished seeding {} papers with {} total questions!",
                            totalPapers, totalQuestions);
                    result.put("status", "SUCCESS");
                    result.put("papersSeeded", totalPapers);
                    result.put("questionsSeeded", totalQuestions);
                    return result;
                }
            }
        } catch (Exception e) {
            log.error("[DataSeeder] Fatal error during database seeding: {}", e.getMessage(), e);
            result.put("status", "FATAL_ERROR");
            result.put("error", e.getMessage());
        }

        return result;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int seedSinglePaper(JsonNode pNode) {
        String code = pNode.get("paperCode").asText();
        String title = pNode.get("title").asText();
        String desc = pNode.has("description") ? pNode.get("description").asText() : "";
        String targetClass = pNode.has("targetClass") ? pNode.get("targetClass").asText() : "";
        int duration = pNode.has("durationMinutes") ? pNode.get("durationMinutes").asInt() : 150;

        TestPaper paper = new TestPaper(code, title, desc, targetClass, duration);

        JsonNode qArray = pNode.get("questions");
        int qCount = 0;

        if (qArray != null && qArray.isArray()) {
            int qNum = 1;
            for (JsonNode qNode : qArray) {
                Question question = new Question();
                question.setQuestionNumber(qNum++);
                question.setSubject(qNode.has("subject") ? qNode.get("subject").asText() : "General");

                JsonNode qTextNode = qNode.get("q");
                if (qTextNode != null) {
                    question.setQuestionEn(qTextNode.has("en") ? qTextNode.get("en").asText() : "");
                    question.setQuestionOr(qTextNode.has("or") ? qTextNode.get("or").asText() : "");
                } else {
                    question.setQuestionEn("Question text missing");
                }

                int answerIdx = qNode.has("answer") ? qNode.get("answer").asInt() : 0;
                question.setCorrectOptionIndex(answerIdx);
                question.setExplanation(qNode.has("explanation") ? qNode.get("explanation").asText() : "");

                JsonNode optsNode = qNode.get("options");
                if (optsNode != null) {
                    JsonNode enOpts = optsNode.get("en");
                    JsonNode orOpts = optsNode.get("or");

                    if (enOpts != null && enOpts.isArray()) {
                        for (int i = 0; i < enOpts.size(); i++) {
                            String enText = enOpts.get(i).asText();
                            String orText = (orOpts != null && orOpts.isArray() && i < orOpts.size())
                                    ? orOpts.get(i).asText() : enText;
                            question.addOption(new QuestionOption(i, enText, orText));
                        }
                    }
                }

                paper.addQuestion(question);
                qCount++;
            }
        }

        paper.setTotalQuestions(qCount);
        testPaperRepository.save(paper);
        return qCount;
    }
}
