"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { type RequestPayload } from "@/types";

interface ExamReadinessFormProps {
  agentId: string;
  onSend: (payload: RequestPayload) => Promise<void>;
  disabled?: boolean;
}

const QUESTION_TYPES = [
  { id: "mcq", label: "Multiple Choice" },
  { id: "short_text", label: "Short Answer" },
  { id: "essay", label: "Essay" },
  { id: "coding", label: "Coding" },
  { id: "math", label: "Math" },
] as const;

export default function ExamReadinessForm({
  agentId,
  onSend,
  disabled,
}: ExamReadinessFormProps) {
  const [subject, setSubject] = useState("");
  const [assessmentType, setAssessmentType] = useState<
    "quiz" | "exam" | "assignment"
  >("quiz");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Question type counts
  const [typeCounts, setTypeCounts] = useState({
    mcq: 2,
    short_text: 1,
    essay: 0,
    coding: 0,
    math: 0,
  });

  // Advanced options
  const [pdfInputPaths, setPdfInputPaths] = useState("");
  const [useRag, setUseRag] = useState(false);
  const [ragTopK, setRagTopK] = useState(6);
  const [ragMaxChars, setRagMaxChars] = useState(4000);
  const [exportPdf, setExportPdf] = useState(false);
  const [pdfOutputFilename, setPdfOutputFilename] = useState("");

  // Calculate total question count dynamically
  const totalQuestions = Object.values(typeCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  const handleTypeCountChange = (
    type: keyof typeof typeCounts,
    delta: number
  ) => {
    setTypeCounts((prev) => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || totalQuestions === 0 || loading || disabled) return;

    setLoading(true);

    // Filter out question types with 0 count
    const filteredTypeCounts = Object.entries(typeCounts).reduce(
      (acc, [key, value]) => {
        if (value > 0) {
          acc[key as keyof typeof typeCounts] = value;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    const payload: RequestPayload = {
      agentId,
      request: `Generate a ${difficulty} ${assessmentType} for ${subject}`,
      priority: 5,
      autoRoute: false,
      modelOverride: null,
      subject,
      assessment_type: assessmentType,
      difficulty,
      question_count: totalQuestions,
      type_counts: filteredTypeCounts,
    };

    // Add advanced options if enabled
    if (useRag && pdfInputPaths.trim()) {
      payload.use_rag = true;
      payload.pdf_input_paths = pdfInputPaths
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      payload.rag_top_k = ragTopK;
      payload.rag_max_chars = ragMaxChars;
    }

    if (exportPdf) {
      payload.export_pdf = true;
      if (pdfOutputFilename.trim()) {
        payload.pdf_output_filename = pdfOutputFilename.trim();
      }
    }

    try {
      await onSend(payload);
      // Collapse form after successful submission
      setIsCollapsed(true);
    } catch (error) {
      console.error("Failed to generate assessment:", error);
    } finally {
      setLoading(false);
    }
  };

  // If collapsed, show minimal header
  if (isCollapsed) {
    return (
      <Card className="p-4">
        <Button
          type="button"
          variant="ghost"
          className="w-full flex items-center justify-between"
          onClick={() => setIsCollapsed(false)}
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold">Assessment Generator</span>
            <span className="text-xs text-muted-foreground">
              ({subject} • {difficulty} • {totalQuestions} questions)
            </span>
          </div>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6 space-y-6">
        {/* Header with minimize button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Assessment Generator</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>

        {/* Basic Configuration */}
        <div className="space-y-4">
          <h4 className="text-base font-medium">Basic Configuration</h4>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject / Topic *</Label>
            <Input
              id="subject"
              placeholder="e.g., Python Programming, Data Structures"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          {/* Assessment Type & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assessment-type">Assessment Type *</Label>
              <Select
                value={assessmentType}
                onValueChange={(value: any) => setAssessmentType(value)}
              >
                <SelectTrigger id="assessment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty *</Label>
              <Select
                value={difficulty}
                onValueChange={(value: any) => setDifficulty(value)}
              >
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Question Types */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Question Types</h3>
            <span className="text-sm text-muted-foreground">
              Total: <span className="font-semibold">{totalQuestions}</span>{" "}
              questions
            </span>
          </div>

          <div className="space-y-3">
            {QUESTION_TYPES.map(({ id, label }) => (
              <div
                key={id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <span className="font-medium">{label}</span>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTypeCountChange(id, -1)}
                    disabled={typeCounts[id] === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold">
                    {typeCounts[id]}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTypeCountChange(id, 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="space-y-4">
          <Button
            type="button"
            variant="ghost"
            className="w-full flex items-center justify-between"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span className="font-semibold">Advanced Options</span>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>

          {showAdvanced && (
            <div className="space-y-4 pt-2">
              {/* RAG Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use-rag"
                    checked={useRag}
                    onCheckedChange={(checked) => setUseRag(checked as boolean)}
                  />
                  <Label htmlFor="use-rag" className="cursor-pointer">
                    Use RAG (Retrieval-Augmented Generation)
                  </Label>
                </div>

                {useRag && (
                  <div className="pl-6 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="pdf-inputs">PDF Input Paths</Label>
                      <Input
                        id="pdf-inputs"
                        placeholder="e.g., lecture1.pdf, tutorial.pdf"
                        value={pdfInputPaths}
                        onChange={(e) => setPdfInputPaths(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Comma-separated filenames. Files must exist in server's
                        rag_documents/ folder.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="rag-top-k">Top K Chunks</Label>
                        <Input
                          id="rag-top-k"
                          type="number"
                          min="1"
                          max="20"
                          value={ragTopK}
                          onChange={(e) =>
                            setRagTopK(parseInt(e.target.value) || 6)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rag-max-chars">Max Characters</Label>
                        <Input
                          id="rag-max-chars"
                          type="number"
                          min="1000"
                          max="10000"
                          step="1000"
                          value={ragMaxChars}
                          onChange={(e) =>
                            setRagMaxChars(parseInt(e.target.value) || 4000)
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PDF Export Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-pdf"
                    checked={exportPdf}
                    onCheckedChange={(checked) =>
                      setExportPdf(checked as boolean)
                    }
                  />
                  <Label htmlFor="export-pdf" className="cursor-pointer">
                    Export as PDF
                  </Label>
                </div>

                {exportPdf && (
                  <div className="pl-6 space-y-2">
                    <Label htmlFor="pdf-filename">
                      PDF Filename (optional)
                    </Label>
                    <Input
                      id="pdf-filename"
                      placeholder="e.g., python_quiz_week1.pdf"
                      value={pdfOutputFilename}
                      onChange={(e) => setPdfOutputFilename(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty for auto-generated filename.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={
            loading || disabled || !subject.trim() || totalQuestions === 0
          }
        >
          {loading ? (
            <>
              Generating Assessment...
              {useRag && (
                <span className="text-xs ml-2">
                  (Processing documents, this may take up to 5 minutes)
                </span>
              )}
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Generate Assessment
            </>
          )}
        </Button>

        {totalQuestions === 0 && (
          <p className="text-sm text-destructive text-center">
            Please select at least one question type.
          </p>
        )}

        {useRag && !loading && (
          <p className="text-xs text-muted-foreground text-center">
            ℹ️ Using RAG with documents may take longer (1-5 minutes) for
            embedding generation.
          </p>
        )}
      </Card>
    </form>
  );
}
