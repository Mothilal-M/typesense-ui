import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, Loader2, Check, Plus, Wand2 } from "lucide-react";
import type { CollectionSchema } from "../types";
import { typesenseService } from "../services/typesense";
import { useApp } from "../context/AppContext";
import { useToast } from "../hooks/useToast";

interface NaturalLanguageRulesProps {
  isOpen: boolean;
  onClose: () => void;
  collection: CollectionSchema;
}

interface GeneratedRule {
  id: string;
  rule: { query: string; match: "exact" | "contains" };
  includes?: { id: string; position: number }[];
  excludes?: { id: string }[];
  filter_by?: string;
  sort_by?: string;
  replace_query?: string;
}

const EXAMPLE_PROMPTS = [
  'Boost electronics with rating > 4.5 when users search for "best"',
  'Hide out-of-stock items when searching for "buy"',
  'Pin product ID "abc123" at position 1 for query "featured"',
  'Sort by price ascending when users search for "cheap"',
  'Replace query "laptop" with "notebook computer"',
  'Filter by category:=Shoes when query contains "sneakers"',
];

async function generateRuleWithAI(
  prompt: string,
  apiKey: string,
  collection: CollectionSchema
): Promise<GeneratedRule> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

  const fieldsSummary = collection.fields.map((f) => `${f.name} (${f.type}${f.facet ? ", facet" : ""})`).join(", ");

  const aiPrompt = `You are an expert at Typesense search overrides. Convert this natural language rule into a Typesense override JSON.

Collection "${collection.name}" has fields: ${fieldsSummary}

User's rule: "${prompt}"

Typesense override schema:
- id: a short kebab-case identifier
- rule: { query: string, match: "exact" | "contains" }
- includes: optional array of { id: string, position: number } to pin documents
- excludes: optional array of { id: string } to hide documents
- filter_by: optional Typesense filter string (e.g. "rating:>4.5")
- sort_by: optional sort string (e.g. "price:asc")
- replace_query: optional replacement query string

Use only fields that exist in the collection. For filter_by, use Typesense syntax: field:=value, field:>value, field:[min..max], field:=[v1,v2].

Respond ONLY with valid JSON matching the override schema above.`;

  const result = await model.generateContent(aiPrompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI did not return valid JSON");
  return JSON.parse(jsonMatch[0]) as GeneratedRule;
}

export function NaturalLanguageRules({ isOpen, onClose, collection }: NaturalLanguageRulesProps) {
  const { geminiApiKey } = useApp();
  const { addToast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRule, setGeneratedRule] = useState<GeneratedRule | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) { addToast("error", "Enter a rule description"); return; }
    if (!geminiApiKey) { addToast("error", "Gemini API key is required"); return; }

    setIsGenerating(true);
    setGeneratedRule(null);
    try {
      const rule = await generateRuleWithAI(prompt, geminiApiKey, collection);
      setGeneratedRule(rule);
      addToast("success", "Rule generated! Review and apply below.");
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to generate rule");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, geminiApiKey, collection, addToast]);

  const handleApply = async () => {
    if (!generatedRule) return;
    setIsSaving(true);
    try {
      const { id, ...body } = generatedRule;
      await typesenseService.upsertOverride(collection.name, id, body);
      addToast("success", `Override "${id}" created!`);
      setGeneratedRule(null);
      setPrompt("");
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to apply rule");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[9999] animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Natural Language Rules</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Describe rules in plain English → AI creates overrides</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-5 space-y-4">
          {/* Prompt input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
              Describe your search rule
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='e.g. "Boost electronics with rating > 4.5 when users search for best"'
              className="w-full h-24 p-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Example prompts */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Try these examples:</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(ex)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/40 transition-colors"
                >
                  {ex.length > 50 ? ex.slice(0, 47) + "..." : ex}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || !geminiApiKey}
            className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating rule...</>
            ) : (
              <><Wand2 className="w-5 h-5" /> Generate Override Rule</>
            )}
          </button>

          {!geminiApiKey && (
            <p className="text-xs text-center text-amber-600 dark:text-amber-400">
              Configure your Gemini API key in the AI chat panel to use this feature.
            </p>
          )}

          {/* Generated Rule Preview */}
          {generatedRule && (
            <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10 space-y-3 animate-fade-in">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" /> Generated Override
              </h3>

              <div className="space-y-2">
                <RuleField label="ID" value={generatedRule.id} />
                <RuleField label="Trigger Query" value={`"${generatedRule.rule.query}" (${generatedRule.rule.match})`} />
                {generatedRule.filter_by && <RuleField label="filter_by" value={generatedRule.filter_by} mono />}
                {generatedRule.sort_by && <RuleField label="sort_by" value={generatedRule.sort_by} mono />}
                {generatedRule.replace_query && <RuleField label="replace_query" value={generatedRule.replace_query} />}
                {generatedRule.includes && generatedRule.includes.length > 0 && (
                  <RuleField label="Pinned" value={generatedRule.includes.map((i) => `${i.id} @ pos ${i.position}`).join(", ")} />
                )}
                {generatedRule.excludes && generatedRule.excludes.length > 0 && (
                  <RuleField label="Hidden" value={generatedRule.excludes.map((e) => e.id).join(", ")} />
                )}
              </div>

              {/* Raw JSON */}
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium">View Raw JSON</summary>
                <pre className="mt-2 p-3 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 overflow-auto max-h-40 font-mono">
                  {JSON.stringify(generatedRule, null, 2)}
                </pre>
              </details>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleApply}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Apply to Collection
                </button>
                <button onClick={() => setGeneratedRule(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function RuleField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">{label}:</span>
      <span className={`text-xs text-gray-800 dark:text-gray-200 ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
