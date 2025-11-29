"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Clock, BookOpen, BarChart } from "lucide-react";
import { type AssessmentResponse } from "@/types";

interface AssessmentPreviewProps {
  assessment: AssessmentResponse;
  pdfPath?: string;
}

export default function AssessmentPreview({
  assessment,
  pdfPath,
}: AssessmentPreviewProps) {
  const handleDownloadPdf = () => {
    if (pdfPath) {
      // In a real implementation, this would trigger a download from the backend
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      window.open(`${apiBaseUrl}/download/${pdfPath}`, "_blank");
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "hard":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      mcq: "Multiple Choice",
      short_text: "Short Answer",
      essay: "Essay",
      coding: "Coding",
      math: "Math",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{assessment.title}</h2>
              <p className="text-sm text-muted-foreground">
                {assessment.description}
              </p>
            </div>
            {pdfPath && (
              <Button onClick={handleDownloadPdf} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={getDifficultyColor(assessment.difficulty)}
            >
              {assessment.difficulty.toUpperCase()}
            </Badge>
            <Badge variant="outline">
              <BookOpen className="w-3 h-3 mr-1" />
              {assessment.assessment_type}
            </Badge>
            <Badge variant="outline">
              <BarChart className="w-3 h-3 mr-1" />
              {assessment.total_questions} Questions
            </Badge>
            <Badge variant="outline">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(assessment.created_at).toLocaleString()}
            </Badge>
          </div>

          {/* Metadata */}
          <div className="pt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>
              Subject:{" "}
              <span className="font-medium text-foreground">
                {assessment.subject}
              </span>
            </span>
            {assessment.metadata.used_rag && (
              <span className="text-blue-600">✓ RAG-Enhanced</span>
            )}
            {assessment.metadata.allow_latex && (
              <span className="text-purple-600">✓ LaTeX Support</span>
            )}
          </div>
        </div>
      </Card>

      {/* Questions */}
      <div className="space-y-3">
        {assessment.questions.map((question, index) => (
          <Card key={question.question_id} className="p-5">
            <div className="space-y-3">
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-lg">Q{index + 1}.</span>
                    <Badge variant="secondary" className="text-xs">
                      {getQuestionTypeLabel(question.question_type)}
                    </Badge>
                  </div>
                  <p className="text-base font-medium">
                    {question.question_text}
                  </p>
                </div>
              </div>

              {/* Options (for MCQ) */}
              {question.question_type === "mcq" &&
                question.options.length > 0 && (
                  <div className="pl-8 space-y-2">
                    {question.options.map((option, optIndex) => {
                      const isCorrect = option === question.correct_answer;
                      return (
                        <div
                          key={optIndex}
                          className={`p-2 rounded border ${
                            isCorrect
                              ? "bg-green-500/10 border-green-500/30"
                              : "bg-muted/30 border-border"
                          }`}
                        >
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          {option}
                          {isCorrect && (
                            <span className="ml-2 text-green-600 font-semibold">
                              ✓ Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* Answer Section */}
              <Separator />
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-sm font-semibold text-green-600">
                    Answer:
                  </span>
                  <p className="text-sm flex-1">{question.correct_answer}</p>
                </div>

                {question.explanation && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-semibold text-blue-600">
                      Explanation:
                    </span>
                    <p className="text-sm text-muted-foreground flex-1">
                      {question.explanation}
                    </p>
                  </div>
                )}

                {question.expected_keywords &&
                  question.expected_keywords.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-semibold text-purple-600">
                        Expected Keywords:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {question.expected_keywords.map((keyword, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Summary Footer */}
      <Card className="p-4 bg-muted/30">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              Question Distribution:
            </span>
            {Object.entries(assessment.metadata.type_distribution).map(
              ([type, count]) =>
                count > 0 && (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {getQuestionTypeLabel(type)}: {count}
                  </Badge>
                )
            )}
          </div>
          <span className="text-muted-foreground">
            Created by:{" "}
            <span className="font-medium">
              {assessment.metadata.created_by}
            </span>
          </span>
        </div>
      </Card>
    </div>
  );
}
