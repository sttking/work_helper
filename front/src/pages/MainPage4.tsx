import React, { useState, useEffect } from "react";
import {
  FiCopy,
  FiArrowRight,
  FiCode,
  FiDatabase,
  FiFileText,
  FiLoader,
  FiEye,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

// API 키 환경변수에서 가져오기
const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

export default function MainPage4() {
  const [question, setQuestion] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [yamlReference, setYamlReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showFewshotExamples, setShowFewshotExamples] = useState(false);
  const [lastPrompt, setLastPrompt] = useState("");
  const [intentResult, setIntentResult] = useState<string>("");
  const [fewshotExamples, setFewshotExamples] = useState<any[]>([]);
  const [balCustomPrompt, setBalCustomPrompt] = useState("");
  const [trscCustomPrompt, setTrscCustomPrompt] = useState("");

  // Load YAML files as reference
  useEffect(() => {
    const loadYamlFiles = async () => {
      try {
        const [balYaml, trscYaml, acctYaml] = await Promise.all([
          fetch("/src/data/bal.yml").then((res) => res.text()),
          fetch("/src/data/trsc.yml").then((res) => res.text()),
          fetch("/src/data/acct.yml").then((res) => res.text()),
        ]);

        setYamlReference(`
=== BAL YAML (잔액 정보) ===
${balYaml}

=== TRSC YAML (거래 내역) ===
${trscYaml}

=== ACCT YAML (계좌 정보) ===
${acctYaml}
`);
      } catch (error) {
        console.error("Failed to load YAML files:", error);
        setYamlReference("YAML 파일을 불러올 수 없습니다.");
      }
    };

    const loadCustomPrompts = async () => {
      try {
        const [balPrompt, trscPrompt] = await Promise.all([
          fetch("/src/data/bal_prompt.txt").then((res) => res.text()),
          fetch("/src/data/trsc_prompt.txt").then((res) => res.text()),
        ]);
        setBalCustomPrompt(balPrompt);
        setTrscCustomPrompt(trscPrompt);
      } catch (error) {
        console.error("Failed to load custom prompts:", error);
      }
    };

    loadYamlFiles();
    loadCustomPrompts();
  }, []);

  // 질문 의도 분석 및 관련 YAML 선택
  const analyzeIntentAndSelectYaml = async (question: string) => {
    if (!openaiApiKey) {
      throw new Error("OpenAI API 키가 설정되지 않았습니다.");
    }

    const intentPrompt = `
다음 질문을 분석하여 어떤 종류의 조회인지 판단해주세요.

질문: ${question}

다음 중 하나로 분류해주세요:
1. "balance" - 잔액/잔고 조회 (예: 잔액, 잔고, 보유금액, 계좌잔액 등)
2. "transaction" - 거래내역 조회 (예: 거래내역, 입출금, 거래, 내역 등)

응답은 "balance" 또는 "transaction" 중 하나만 출력하세요.
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an intent classifier. Respond with only 'balance' or 'transaction' based on the query type.",
          },
          { role: "user", content: intentPrompt },
        ],
        temperature: 0.1,
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      throw new Error(`의도 분석 API 호출 실패: ${response.status}`);
    }

    const data = await response.json();
    const intent = data.choices?.[0]?.message?.content?.trim().toLowerCase();

    if (!intent || (intent !== "balance" && intent !== "transaction")) {
      throw new Error("의도 분석에 실패했습니다.");
    }

    return intent;
  };

  // 관련 YAML 파일만 선택
  const getRelevantYaml = async (intent: string) => {
    try {
      const [balYaml, trscYaml, acctYaml] = await Promise.all([
        fetch("/src/data/bal.yml").then((res) => res.text()),
        fetch("/src/data/trsc.yml").then((res) => res.text()),
        fetch("/src/data/acct.yml").then((res) => res.text()),
      ]);

      if (intent === "balance") {
        return `
=== BAL YAML (잔액 정보) ===
${balYaml}

=== ACCT YAML (계좌 정보) ===
${acctYaml}
`;
      } else {
        return `
=== TRSC YAML (거래 내역) ===
${trscYaml}

=== ACCT YAML (계좌 정보) ===
${acctYaml}
`;
      }
    } catch (error) {
      console.error("Failed to load relevant YAML files:", error);
      return "관련 YAML 파일을 불러올 수 없습니다.";
    }
  };

  // Few-shot 예시 로드
  const loadFewshotExamples = async (intent: string) => {
    try {
      const filename =
        intent === "balance" ? "bal_fewshot.json" : "trsc_fewshot.json";
      const response = await fetch(`/src/data/${filename}`);
      const examples = await response.json();
      setFewshotExamples(examples);
      return examples;
    } catch (error) {
      console.error("Failed to load few-shot examples:", error);
      setFewshotExamples([]);
      return [];
    }
  };

  const convertWithLLM = async (question: string) => {
    // API 키 확인
    if (!openaiApiKey) {
      throw new Error(
        "OpenAI API 키가 설정되지 않았습니다. .env 파일에 VITE_OPENAI_API_KEY를 추가해주세요."
      );
    }

    // 1단계: 질문 의도 분석
    let intent = "balance"; // 기본값
    let relevantYaml = yamlReference; // 기본값 (전체 YAML)
    let examples: any[] = []; // Few-shot 예시

    try {
      intent = await analyzeIntentAndSelectYaml(question);
      relevantYaml = await getRelevantYaml(intent);
      examples = await loadFewshotExamples(intent);

      if (debugMode) {
        console.log(`의도 분석 결과: ${intent}`);
        console.log(
          `선택된 YAML: ${intent === "balance" ? "BAL + ACCT" : "TRSC + ACCT"}`
        );
        console.log(`Few-shot 예시 개수: ${examples.length}`);
        setIntentResult(
          `${intent === "balance" ? "잔액 조회" : "거래내역 조회"} (${
            intent === "balance" ? "BAL + ACCT" : "TRSC + ACCT"
          } YAML 사용, ${examples.length}개 예시)`
        );
      }
    } catch (error) {
      console.warn("의도 분석 실패, 전체 YAML 사용:", error);
      // 의도 분석 실패 시 전체 YAML 사용
      if (debugMode) {
        setIntentResult("의도 분석 실패 - 전체 YAML 사용");
      }
    }

    // 2단계: DSL 변환
    let prompt = `다음은 DSL 스키마 정보입니다 (${
      intent === "balance" ? "잔액 조회용" : "거래내역 조회용"
    }):

${relevantYaml}

`;

    // Few-shot 예시 추가
    if (examples.length > 0) {
      prompt += `다음은 참고할 예시들입니다:

`;
      examples.forEach((example, index) => {
        prompt += `예시 ${index + 1}:
질문: ${example.question}
DSL: ${JSON.stringify(example.dsl, null, 2)}

`;
      });
    }

    prompt += `다음은 변환할 질문입니다:
${question}

`;

    // 의도별 커스텀 프롬프트 추가
    const intentPrompt =
      intent === "balance" ? balCustomPrompt : trscCustomPrompt;
    if (intentPrompt) {
      prompt += `\n=== ${
        intent === "balance" ? "잔액 조회" : "거래내역 조회"
      } 전용 지시사항 ===\n${intentPrompt}\n\n`;
    }

    prompt += `
위 스키마와 예시들을 참고하여 질문을 DSL로 변환해주세요. 
응답은 JSON 형식으로만 출력하고, 다른 설명은 포함하지 마세요.
예시 형식:
{
  "${intent === "balance" ? "bal" : "trsc"}": {
    "metrics": ["total_${intent === "balance" ? "acct_bal_amt" : "trsc_amt"}"],
    "group_by": ["acct__bank_nm", "${
      intent === "balance" ? "bal" : "trsc"
    }__acct_dv"],
    "filters": [
      "{{ TimeDimension('${intent === "balance" ? "bal" : "trsc"}__${
      intent === "balance" ? "reg_dt" : "trsc_dt"
    }') = '2024-01-16' }}",
      "{{ Dimension('acct__view_dv') = '수시' }}"
    ],
    "order_by": ["-total_${
      intent === "balance" ? "acct_bal_amt" : "trsc_amt"
    }"],
    "limit": null
  }
}`;

    // 디버그 모드에서 프롬프트 저장
    if (debugMode) {
      setLastPrompt(prompt);
      setShowPrompt(true);
    }

    // OpenAI API 호출
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a question to DSL converter. Use the provided YAML schema to generate accurate DSL. Always respond with valid JSON only, no additional text.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim();

    if (!aiResponse) {
      throw new Error("AI 응답이 없습니다.");
    }

    // JSON 파싱 확인
    try {
      JSON.parse(aiResponse);
      return aiResponse;
    } catch (parseError) {
      throw new Error("AI 응답이 유효한 JSON이 아닙니다.");
    }
  };

  const handleConvert = async () => {
    if (!question.trim()) {
      setOutput("질문을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await convertWithLLM(question);
      setOutput(result);
    } catch (error: any) {
      setError(error.message);
      setOutput(`오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  const copyPrompt = () => {
    if (lastPrompt) {
      navigator.clipboard.writeText(lastPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <section className="w-full h-full min-h-[calc(100vh-3.5rem)] p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-blue-700 mb-2">
            SQL → DSL 변환 (AI 기반)
          </h2>
          <p className="text-gray-600">
            YAML 스키마를 참고하여 LLM이 SQL을 DSL로 변환합니다.
          </p>
        </div>

        {/* 디버그 모드 토글 */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <FiEye className="w-4 h-4" />
            디버그 모드 (LLM 프롬프트 로그 보기)
          </label>
        </div>

        {/* 질문 입력 */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FiDatabase className="w-5 h-5 text-blue-500" />
            질문 입력
          </label>
          <textarea
            className="w-full h-32 p-4 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none shadow-sm font-mono"
            placeholder="예: 수시입출계좌 잔액은? 외화 예적금 거래내역을 보여줘. 대출잔액 조회"
            value={question}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setQuestion(e.target.value)
            }
          />
        </div>

        <button
          className={`w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center text-lg font-bold mb-4 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={handleConvert}
          disabled={loading}
        >
          {loading ? (
            <>
              <FiLoader className="mr-2 animate-spin" />
              AI 변환 중...
            </>
          ) : (
            <>
              <FiArrowRight className="mr-2" />
              AI로 변환하기
            </>
          )}
        </button>

        {/* 에러 메시지 */}
        {error && (
          <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg">
            {error}
          </div>
        )}

        {/* LLM 프롬프트 로그 (디버그 모드) */}
        {debugMode && lastPrompt && (
          <div className="bg-yellow-50 rounded-2xl shadow-xl p-6 mb-4 border border-yellow-200">
            <div className="flex items-center mb-2">
              <span className="text-lg font-semibold flex items-center gap-2 text-yellow-800">
                <FiEye className="inline-block mr-1" /> LLM에 전송된 프롬프트
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  className="flex items-center gap-1 px-3 py-1 rounded bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-sm"
                  onClick={copyPrompt}
                >
                  <FiCopy /> {copied ? "복사됨" : "복사"}
                </button>
                <button
                  className="flex items-center gap-1 px-3 py-1 rounded bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-sm"
                  onClick={() => setShowPrompt(!showPrompt)}
                >
                  {showPrompt ? <FiChevronUp /> : <FiChevronDown />}
                  {showPrompt ? "접기" : "펼치기"}
                </button>
              </div>
            </div>

            {/* 의도 분석 결과 표시 */}
            {intentResult && (
              <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-semibold text-blue-800">
                  의도 분석 결과:{" "}
                </span>
                <span className="text-sm text-blue-700">{intentResult}</span>
              </div>
            )}

            {showPrompt && (
              <pre className="bg-white rounded-xl p-4 overflow-x-auto text-sm mt-2 whitespace-pre-wrap border border-yellow-300 max-h-96 overflow-y-auto">
                {lastPrompt}
              </pre>
            )}
          </div>
        )}

        {output && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-4">
            <div className="flex items-center mb-2">
              <span className="text-lg font-semibold flex items-center gap-2">
                <FiCopy className="inline-block mr-1" /> DSL 결과 (AI 생성)
              </span>
              <button
                className="ml-auto flex items-center gap-1 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
                onClick={handleCopy}
              >
                <FiCopy /> {copied ? "복사됨" : "복사"}
              </button>
            </div>
            <pre className="bg-gray-50 rounded-xl p-4 overflow-x-auto text-sm mt-2 whitespace-pre-wrap">
              {output}
            </pre>
          </div>
        )}

        {debugMode && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-400 mb-2">
              디버그 정보
            </h4>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-gray-400">의도 분석:</span>{" "}
                <span className="text-green-400">{intentResult}</span>
              </div>
              <div>
                <span className="text-gray-400">Few-shot 예시:</span>{" "}
                <span className="text-yellow-400">
                  {fewshotExamples.length}개 로드됨
                </span>
                <button
                  onClick={() => setShowFewshotExamples(!showFewshotExamples)}
                  className="ml-2 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                >
                  {showFewshotExamples ? "숨기기" : "보기"}
                </button>
              </div>
              <div>
                <span className="text-gray-400">커스텀 프롬프트:</span>{" "}
                <span className="text-cyan-400">
                  {balCustomPrompt
                    ? "잔액 프롬프트 로드됨"
                    : "잔액 프롬프트 없음"}
                  ,{" "}
                  {trscCustomPrompt
                    ? "거래내역 프롬프트 로드됨"
                    : "거래내역 프롬프트 없음"}
                </span>
              </div>
              {showFewshotExamples && fewshotExamples.length > 0 && (
                <div className="mt-3 p-3 bg-gray-700 rounded">
                  <h5 className="text-xs font-semibold text-purple-400 mb-2">
                    Few-shot 예시들:
                  </h5>
                  <div className="space-y-3">
                    {fewshotExamples.map((example, index) => (
                      <div
                        key={index}
                        className="border-l-2 border-purple-500 pl-3"
                      >
                        <div className="text-purple-300 font-semibold">
                          예시 {index + 1}: {example.question}
                        </div>
                        <div className="text-gray-300 mt-1">
                          <div className="text-xs text-gray-400">DSL:</div>
                          <div className="text-xs bg-gray-800 p-2 rounded mt-1 font-mono">
                            {JSON.stringify(example.dsl, null, 2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(lastPrompt);
                    alert("프롬프트가 클립보드에 복사되었습니다.");
                  }}
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  전체 프롬프트 복사
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
