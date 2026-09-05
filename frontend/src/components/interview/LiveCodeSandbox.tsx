import React, { useState } from 'react';
import { 
  Play, 
  Sparkles, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Code2, 
  Cpu, 
  Copy, 
  Check, 
  Layers, 
  Zap, 
  Clock, 
  ChevronDown 
} from 'lucide-react';

interface TestCase {
  input: string;
  expected: string;
}

interface ProblemPreset {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  languageTemplates: Record<string, string>;
  testCases: TestCase[];
}

const PROBLEM_PRESETS: ProblemPreset[] = [
  {
    id: 'two-sum',
    title: '1. Two Sum & Hash Indexing',
    difficulty: 'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\nAssume each input has exactly one solution, and you may not use the same element twice.',
    languageTemplates: {
      python: `def two_sum(nums, target):\n    # TODO: Implement optimal O(N) hash map solution\n    lookup = {}\n    for i, n in enumerate(nums):\n        diff = target - n\n        if diff in lookup:\n            return [lookup[diff], i]\n        lookup[n] = i\n    return []\n\n# Test execution\nprint(two_sum([2, 7, 11, 15], 9))\nprint(two_sum([3, 2, 4], 6))\n`,
      javascript: `function twoSum(nums, target) {\n    // TODO: Implement optimal O(N) hash map solution\n    const lookup = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const diff = target - nums[i];\n        if (lookup.has(diff)) {\n            return [lookup.get(diff), i];\n        }\n        lookup.set(nums[i], i);\n    }\n    return [];\n}\n\nconsole.log(twoSum([2, 7, 11, 15], 9));\nconsole.log(twoSum([3, 2, 4], 6));\n`,
      typescript: `function twoSum(nums: number[], target: number): number[] {\n    const lookup = new Map<number, number>();\n    for (let i = 0; i < nums.length; i++) {\n        const diff = target - nums[i];\n        if (lookup.has(diff)) {\n            return [lookup.get(diff)!, i];\n        }\n        lookup.set(nums[i], i);\n    }\n    return [];\n}\n\nconsole.log(twoSum([2, 7, 11, 15], 9));\n`,
      sql: `SELECT e1.id AS id1, e2.id AS id2\nFROM employees e1\nJOIN employees e2 ON e1.salary + e2.salary = 150000\nWHERE e1.id < e2.id;\n`
    },
    testCases: [
      { input: '[2, 7, 11, 15], target = 9', expected: '[0, 1]' },
      { input: '[3, 2, 4], target = 6', expected: '[1, 2]' }
    ]
  },
  {
    id: 'lru-cache',
    title: '2. LRU Cache Design (O(1) Get & Put)',
    difficulty: 'Medium',
    description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\nImplement the LRUCache class with get(key) and put(key, value) in O(1) average time complexity.',
    languageTemplates: {
      python: `class DLinkedNode:\n    def __init__(self, key=0, value=0):\n        self.key = key\n        self.value = value\n        self.prev = None\n        self.next = None\n\nclass LRUCache:\n    def __init__(self, capacity: int):\n        self.cache = {}\n        self.capacity = capacity\n        self.head = DLinkedNode()\n        self.tail = DLinkedNode()\n        self.head.next = self.tail\n        self.tail.prev = self.head\n\n    def get(self, key: int) -> int:\n        if key not in self.cache:\n            return -1\n        node = self.cache[key]\n        self._move_to_head(node)\n        return node.value\n\n    def put(self, key: int, value: int) -> None:\n        # TODO: Implement put with O(1) eviction\n        pass\n\nprint("LRU Cache initialized with capacity 2")\n`,
      javascript: `class LRUCache {\n    constructor(capacity) {\n        this.capacity = capacity;\n        this.cache = new Map();\n    }\n\n    get(key) {\n        if (!this.cache.has(key)) return -1;\n        const val = this.cache.get(key);\n        this.cache.delete(key);\n        this.cache.set(key, val);\n        return val;\n    }\n\n    put(key, value) {\n        if (this.cache.has(key)) this.cache.delete(key);\n        else if (this.cache.size >= this.capacity) {\n            const firstKey = this.cache.keys().next().value;\n            this.cache.delete(firstKey);\n        }\n        this.cache.set(key, value);\n    }\n}\n\nconst lru = new LRUCache(2);\nlru.put(1, 100);\nconsole.log("Get 1:", lru.get(1));\n`
    },
    testCases: [
      { input: 'put(1, 100), get(1)', expected: '100' }
    ]
  },
  {
    id: 'valid-parens',
    title: '3. Balanced Token & Bracket Validation',
    difficulty: 'Easy',
    description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.',
    languageTemplates: {
      python: `def is_valid_brackets(s: str) -> bool:\n    mapping = {")": "(", "}": "{", "]": "["}\n    stack = []\n    for char in s:\n        if char in mapping:\n            top = stack.pop() if stack else '#'\n            if mapping[char] != top:\n                return False\n        else:\n            stack.append(char)\n    return not stack\n\nprint(is_valid_brackets("()[]{}"))\nprint(is_valid_brackets("(]"))\n`
    },
    testCases: [
      { input: '"()[]{}"', expected: 'True' },
      { input: '"(]"', expected: 'False' }
    ]
  }
];

interface LiveCodeSandboxProps {
  onCodeAnalyzed?: (verbalPrompt: string, analysisData: any) => void;
  onCodeChange?: (code: string, language: string) => void;
}

export const LiveCodeSandbox: React.FC<LiveCodeSandboxProps> = ({
  onCodeAnalyzed,
  onCodeChange
}) => {
  const [selectedProblem, setSelectedProblem] = useState<ProblemPreset>(PROBLEM_PRESETS[0]);
  const [language, setLanguage] = useState<string>('python');
  const [code, setCode] = useState<string>(PROBLEM_PRESETS[0].languageTemplates['python'] || '');
  const [activeTab, setActiveTab] = useState<'console' | 'tests' | 'ai-review'>('console');
  
  // Execution states
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [stdout, setStdout] = useState<string>('Click "Run Code" to execute solution in live sandbox.');
  const [stderr, setStderr] = useState<string>('');
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [passedTests, setPassedTests] = useState<number>(0);
  
  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Handle problem change
  const handleSelectProblem = (preset: ProblemPreset) => {
    setSelectedProblem(preset);
    const template = preset.languageTemplates[language] || preset.languageTemplates['python'] || '';
    setCode(template);
    if (onCodeChange) onCodeChange(template, language);
    setStdout('Problem template loaded. Click "Run Code" to test.');
    setStderr('');
    setTestResults([]);
  };

  // Handle language change
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    const template = selectedProblem.languageTemplates[newLang] || `# ${newLang.toUpperCase()} template for ${selectedProblem.title}\n\n`;
    setCode(template);
    if (onCodeChange) onCodeChange(template, newLang);
  };

  // Handle keydown for indentation inside code textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      if (onCodeChange) onCodeChange(newCode, language);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Execute Code via Backend API
  const handleRunCode = async () => {
    setIsRunning(true);
    setStderr('');
    setActiveTab('console');
    
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/api/v1/interview/code/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code,
          test_cases: selectedProblem.testCases
        })
      });

      if (res.ok) {
        const data = await res.json();
        setStdout(data.stdout || (data.return_code === 0 ? 'Code executed with zero output.' : ''));
        setStderr(data.stderr || '');
        setExecutionTime(data.execution_time_ms || 14.2);
        setTestResults(data.test_results || []);
        setPassedTests(data.passed_count || 0);
      } else {
        setStderr('Backend sandbox execution error.');
      }
    } catch (err: any) {
      setStderr(`Connection error: ${err?.message || 'Failed to reach code execution engine'}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Ask AI Interviewer for Real-Time Code Review
  const handleAskAI = async () => {
    setIsAnalyzing(true);
    setActiveTab('ai-review');

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/api/v1/interview/code/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_title: selectedProblem.title,
          language,
          code,
          difficulty: selectedProblem.difficulty
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data.analysis);
        if (onCodeAnalyzed && data.analysis?.interviewer_verbal_prompt) {
          onCodeAnalyzed(data.analysis.interviewer_verbal_prompt, data.analysis);
        }
      }
    } catch (err) {
      console.warn('AI analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#070B14] border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
      
      {/* Top Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#0A0F1D]/90 border-b border-slate-800">
        
        {/* Left: Problem Selector & Difficulty Badge */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={selectedProblem.id}
                onChange={(e) => {
                  const p = PROBLEM_PRESETS.find(x => x.id === e.target.value);
                  if (p) handleSelectProblem(p);
                }}
                aria-label="Select Technical Challenge"
                className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:border-indigo-500"
              >
                {PROBLEM_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>

              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                selectedProblem.difficulty === 'Easy' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : selectedProblem.difficulty === 'Medium'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                {selectedProblem.difficulty}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Live Pair-Programming Sandbox</span>
          </div>
        </div>

        {/* Right: Language Selector & Actions */}
        <div className="flex items-center gap-2.5">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            aria-label="Select Programming Language"
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono rounded-lg px-2.5 py-1.5 outline-none cursor-pointer focus:border-indigo-500"
          >
            <option value="python">Python 3.11</option>
            <option value="javascript">JavaScript (ES6)</option>
            <option value="typescript">TypeScript</option>
            <option value="sql">PostgreSQL</option>
          </select>

          <button
            onClick={copyCode}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Ask AI Reviewer Button */}
          <button
            onClick={handleAskAI}
            disabled={isAnalyzing}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/40 text-purple-200 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{isAnalyzing ? 'Analyzing...' : 'Ask AI Reviewer'}</span>
          </button>

          {/* Run Code Button */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      {/* Problem Prompt Brief Banner */}
      <div className="p-3 bg-[#080D1A]/95 border-b border-slate-800/60 text-xs text-slate-300 font-sans leading-relaxed">
        <p className="font-mono text-[11px] text-slate-400 mb-1 font-semibold flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-amber-400" /> Problem Objective:
        </p>
        <p className="whitespace-pre-line text-slate-200">{selectedProblem.description}</p>
      </div>

      {/* Code Editor Container */}
      <div className="relative flex-1 min-h-[300px] bg-[#050811] flex overflow-hidden font-mono text-xs">
        {/* Line Numbers Sidebar */}
        <div className="w-10 py-3 bg-[#03050B] text-slate-600 select-none text-right pr-2 border-r border-slate-800/60 leading-5">
          {code.split('\n').map((_, idx) => (
            <div key={idx}>{idx + 1}</div>
          ))}
        </div>

        {/* Code Textarea */}
        <textarea
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (onCodeChange) onCodeChange(e.target.value, language);
          }}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-emerald-300 outline-none resize-none font-mono text-xs leading-5 selection:bg-indigo-500/40"
          placeholder="// Type your code here..."
        />
      </div>

      {/* Bottom Output / Tests / AI Review Tabs Container */}
      <div className="h-64 flex flex-col bg-[#080C19] border-t border-slate-800">
        
        {/* Tab Headers */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#060913] border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setActiveTab('console')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'console'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Console Output</span>
            </button>

            <button
              onClick={() => setActiveTab('tests')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'tests'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Test Cases ({passedTests}/{selectedProblem.testCases.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ai-review')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'ai-review'
                  ? 'bg-purple-600/30 text-purple-300 font-bold border border-purple-500/40'
                  : 'text-purple-400/70 hover:text-purple-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Pair-Programmer</span>
            </button>
          </div>

          {executionTime !== null && (
            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Latency: {executionTime}ms
            </span>
          )}
        </div>

        {/* Tab Content Display */}
        <div className="flex-1 p-3 overflow-y-auto font-mono text-xs">
          
          {/* 1. Terminal Console */}
          {activeTab === 'console' && (
            <div className="space-y-2">
              {stderr && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 whitespace-pre-wrap">
                  {stderr}
                </div>
              )}
              <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                {stdout}
              </div>
            </div>
          )}

          {/* 2. Test Cases Table */}
          {activeTab === 'tests' && (
            <div className="space-y-2">
              {selectedProblem.testCases.map((tc, idx) => {
                const res = testResults[idx];
                const isPass = res ? res.passed : false;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      res
                        ? isPass
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold block text-white">Test Case #{idx + 1}</span>
                      <span className="text-[11px] text-slate-400">Input: {tc.input}</span>
                      <span className="text-[11px] text-slate-500 block">Expected: {tc.expected}</span>
                    </div>

                    <div>
                      {res ? (
                        isPass ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                            PASSED ✓
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/40">
                            FAILED ✗
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-500">Not run yet</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. AI Pair-Programmer Feedback */}
          {activeTab === 'ai-review' && (
            <div>
              {aiAnalysis ? (
                <div className="space-y-3">
                  {/* Metric Chips */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block">Time Complexity</span>
                      <span className="font-bold text-amber-400 text-sm">{aiAnalysis.time_complexity}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block">Space Complexity</span>
                      <span className="font-bold text-cyan-400 text-sm">{aiAnalysis.space_complexity}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block">Quality Rating</span>
                      <span className="font-bold text-emerald-400 text-sm">{aiAnalysis.quality_score}/10</span>
                    </div>
                  </div>

                  {/* Verbal AI Prompt (What the interviewer will ask) */}
                  {aiAnalysis.interviewer_verbal_prompt && (
                    <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200">
                      <span className="font-bold text-purple-400 block mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> AI Interviewer Follow-Up Question:
                      </span>
                      <p className="italic font-sans">"{aiAnalysis.interviewer_verbal_prompt}"</p>
                    </div>
                  )}

                  {/* Strengths & Edge cases */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                      <span className="text-emerald-400 font-bold block mb-1">Key Strengths:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                        {aiAnalysis.key_strengths?.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                      <span className="text-amber-400 font-bold block mb-1">Edge Cases & Suggestions:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                        {aiAnalysis.edge_cases_analyzed?.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <Sparkles className="w-8 h-8 text-purple-500/40 mb-2 animate-pulse" />
                  <p className="text-xs text-slate-400 font-sans">
                    Click "Ask AI Reviewer" to evaluate Big-O complexity, test edge cases, and simulate an interviewer follow-up question.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
