import { useState } from "react";
import {
  FiCheckCircle,
  FiMessageSquare,
  FiTrash2,
  FiCopy,
  FiCode,
  FiDownload,
  FiUpload,
} from "react-icons/fi";

interface Field {
  key: string;
  value: string;
}

type Tab = "qa" | "extract" | "csv" | "csv2json";

function parseCsv(text: string): string[][] {
  // 간단한 CSV 파서 (쉼표, 따옴표, 줄바꿈 처리)
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++; // escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else {
      if (c === ",") {
        row.push(cell);
        cell = "";
      } else if (c === "\n" || c === "\r") {
        if (cell || row.length > 0) {
          row.push(cell);
          cell = "";
        }
        if (row.length > 0) {
          rows.push(row);
          row = [];
        }
        // skip \r\n
        if (c === "\r" && text[i + 1] === "\n") i++;
      } else if (c === '"') {
        inQuotes = true;
      } else {
        cell += c;
      }
    }
  }
  if (cell || row.length > 0) {
    row.push(cell);
  }
  if (row.length > 0) {
    rows.push(row);
  }
  return rows;
}

export default function MainPage() {
  // 탭 상태
  const [tab, setTab] = useState<Tab>("qa");

  // Q&A 변환 상태
  const [fields, setFields] = useState<Field[]>([
    { key: "question", value: "" },
    { key: "answer", value: "" },
  ]);
  const [qaResult, setQaResult] = useState<string>("");
  const [qaCopied, setQaCopied] = useState(false);
  const [qaError, setQaError] = useState<string>("");

  // JSON 추출 상태
  const [jsonInput, setJsonInput] = useState<string>("");
  const [extractKey, setExtractKey] = useState<string>("");
  const [extractResult, setExtractResult] = useState<string>("");
  const [extractCopied, setExtractCopied] = useState(false);
  const [extractError, setExtractError] = useState<string>("");

  // CSV 다운로드 상태
  const [csvInput, setCsvInput] = useState<string>("");
  const [csvError, setCsvError] = useState<string>("");

  // CSV 변환 상태
  const [csv2jsonFileName, setCsv2jsonFileName] = useState<string>("");
  const [csv2jsonResult, setCsv2jsonResult] = useState<string>("");
  const [csv2jsonCopied, setCsv2jsonCopied] = useState(false);
  const [csv2jsonError, setCsv2jsonError] = useState<string>("");

  // 필드 추가
  const addField = () => {
    setFields([...fields, { key: "", value: "" }]);
  };

  // 필드 삭제
  const removeField = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  // 필드 값 변경
  const updateField = (idx: number, type: "key" | "value", value: string) => {
    setFields(fields.map((f, i) => (i === idx ? { ...f, [type]: value } : f)));
  };

  // Q&A 변환: 변환하기
  const handleConvert = () => {
    setQaError("");
    const valueRows = fields.map((f) => f.value.split("\n"));
    const lengths = valueRows.map((v) => v.length);
    const maxLen = Math.max(...lengths);
    const minLen = Math.min(...lengths);
    if (maxLen !== minLen) {
      setQaResult("");
      setQaError("모든 필드의 값 목록 줄 수가 동일해야 합니다. (1:1 매칭)");
      return;
    }
    const resultArr = Array.from({ length: maxLen }).map((_, rowIdx) => {
      const obj: Record<string, string> = {};
      fields.forEach((f, colIdx) => {
        obj[f.key || `key${colIdx + 1}`] = valueRows[colIdx][rowIdx] || "";
      });
      return obj;
    });
    setQaResult(JSON.stringify(resultArr, null, 2));
  };

  // Q&A 변환: 결과 복사
  const handleCopy = () => {
    if (qaResult) {
      navigator.clipboard.writeText(qaResult);
      setQaCopied(true);
      setTimeout(() => setQaCopied(false), 1200);
    }
  };

  // JSON 추출: 추출하기
  const handleExtract = () => {
    setExtractError("");
    try {
      const arr = JSON.parse(jsonInput);
      if (!Array.isArray(arr)) throw new Error("JSON 배열만 지원합니다.");
      if (!extractKey) throw new Error("추출할 키를 입력하세요.");
      const values = arr
        .map((item: any) => item[extractKey])
        .filter((v: any) => v !== undefined && v !== null);
      setExtractResult(values.map(String).join("\n"));
    } catch (e: any) {
      setExtractResult("");
      setExtractError(e.message || "JSON 파싱 오류");
    }
  };

  // JSON 추출: 결과 복사
  const handleExtractCopy = () => {
    if (extractResult) {
      navigator.clipboard.writeText(extractResult);
      setExtractCopied(true);
      setTimeout(() => setExtractCopied(false), 1200);
    }
  };

  // CSV 다운로드: 변환 및 다운로드
  const handleCsvDownload = () => {
    setCsvError("");
    try {
      const arr = JSON.parse(csvInput);
      if (!Array.isArray(arr)) throw new Error("JSON 배열만 지원합니다.");
      if (arr.length === 0) throw new Error("빈 배열입니다.");
      // 모든 key 추출(헤더)
      const keys = Array.from(
        new Set(arr.flatMap((item: any) => Object.keys(item)))
      );
      // CSV 문자열 생성
      const csvRows = [keys.join(",")];
      arr.forEach((item: any) => {
        const row = keys.map((k) => {
          const v = item[k] ?? "";
          // 값에 , " \n 등 있으면 "로 감싸고 내부 "는 ""로 escape
          if (typeof v === "string" && /[",\n]/.test(v)) {
            return '"' + v.replace(/"/g, '""') + '"';
          }
          return v;
        });
        csvRows.push(row.join(","));
      });
      const csvStr = csvRows.join("\r\n");
      // 다운로드
      const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "data.csv";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (e: any) {
      setCsvError(e.message || "JSON 파싱 오류");
    }
  };

  // CSV 변환: 파일 업로드 및 변환
  const handleCsv2jsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsv2jsonError("");
    setCsv2jsonResult("");
    const file = e.target.files?.[0];
    if (!file) return;
    setCsv2jsonFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const rows = parseCsv(text);
        if (rows.length < 2) throw new Error("최소 2행(헤더+값)이 필요합니다.");
        const keys = rows[0];
        const resultArr = rows.slice(1).map((row) => {
          const obj: Record<string, string> = {};
          keys.forEach((k, i) => {
            obj[k] = row[i] ?? "";
          });
          return obj;
        });
        setCsv2jsonResult(JSON.stringify(resultArr, null, 2));
      } catch (e: any) {
        setCsv2jsonError(e.message || "CSV 파싱 오류");
      }
    };
    reader.readAsText(file, "utf-8");
  };
  const handleCsv2jsonCopy = () => {
    if (csv2jsonResult) {
      navigator.clipboard.writeText(csv2jsonResult);
      setCsv2jsonCopied(true);
      setTimeout(() => setCsv2jsonCopied(false), 1200);
    }
  };

  return (
    <section className="w-full h-full min-h-[calc(100vh-3.5rem)] p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">JSON 변환</h2>
          <p className="text-gray-600">
            다양한 형식의 데이터를 JSON으로 변환해보세요
          </p>
        </div>
        {/* 탭 */}
        <div className="flex w-full gap-4 mb-6">
          <button
            className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
              tab === "qa"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setTab("qa")}
          >
            Q&A 변환
          </button>
          <button
            className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
              tab === "extract"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setTab("extract")}
          >
            JSON 추출
          </button>
          <button
            className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
              tab === "csv"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setTab("csv")}
          >
            CSV 다운로드
          </button>
          <button
            className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
              tab === "csv2json"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setTab("csv2json")}
          >
            CSV 변환
          </button>
        </div>
        {/* Q&A 변환 탭 */}
        {tab === "qa" && (
          <>
            <div className="flex flex-col gap-6 mb-6">
              {fields.map((field, idx) => (
                <div key={idx} className="flex gap-4 items-start w-full">
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <FiMessageSquare className="w-5 h-5 mr-2 text-blue-500" />
                      키 이름
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="키 이름을 입력하세요"
                      value={field.key}
                      onChange={(e) => updateField(idx, "key", e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <FiCheckCircle className="w-5 h-5 mr-2 text-green-500" />
                      값 목록
                    </label>
                    <textarea
                      className="w-full h-24 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm"
                      placeholder="각 줄에 하나의 값을 입력하세요"
                      value={field.value}
                      onChange={(e) =>
                        updateField(idx, "value", e.target.value)
                      }
                    />
                  </div>
                  {fields.length > 1 && (
                    <button
                      className="mt-10 text-red-500 hover:text-red-700"
                      onClick={() => removeField(idx)}
                      title="필드 삭제"
                    >
                      <FiTrash2 className="w-6 h-6" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold shadow hover:bg-green-700 transition flex items-center gap-2"
              onClick={addField}
            >
              + 필드 추가
            </button>
            <button
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center text-lg font-bold mt-8"
              onClick={handleConvert}
            >
              변환하기
            </button>
            {/* 에러 메시지 */}
            {qaError && (
              <div className="text-red-500 text-sm mt-2">{qaError}</div>
            )}
            {/* 변환 결과 */}
            {qaResult && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mt-10">
                <div className="flex items-center mb-2">
                  <span className="text-lg font-semibold flex items-center gap-2">
                    <FiCopy className="inline-block mr-1" /> 변환 결과
                  </span>
                  <button
                    className="ml-auto flex items-center gap-1 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
                    onClick={handleCopy}
                  >
                    <FiCopy /> {qaCopied ? "복사됨" : "복사"}
                  </button>
                </div>
                <pre className="bg-gray-50 rounded-xl p-4 overflow-x-auto text-sm mt-2 whitespace-pre-wrap">
                  {qaResult}
                </pre>
              </div>
            )}
          </>
        )}
        {/* JSON 추출 탭 */}
        {tab === "extract" && (
          <>
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FiCode className="w-5 h-5 text-blue-500" /> JSON 입력
              </label>
              <textarea
                className="w-full h-40 p-4 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none shadow-sm font-mono"
                placeholder="JSON 배열을 입력하세요"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FiCheckCircle className="w-5 h-5 text-green-500" /> 추출할 키
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: question"
                value={extractKey}
                onChange={(e) => setExtractKey(e.target.value)}
              />
            </div>
            <button
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center text-lg font-bold mb-4"
              onClick={handleExtract}
            >
              추출하기
            </button>
            {/* 에러 메시지 */}
            {extractError && (
              <div className="text-red-500 text-sm mb-2">{extractError}</div>
            )}
            {/* 추출 결과 */}
            {extractResult && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mt-4">
                <div className="flex items-center mb-2">
                  <span className="text-lg font-semibold flex items-center gap-2">
                    <FiCopy className="inline-block mr-1" /> 변환 결과
                  </span>
                  <button
                    className="ml-auto flex items-center gap-1 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
                    onClick={handleExtractCopy}
                  >
                    <FiCopy /> {extractCopied ? "복사됨" : "복사"}
                  </button>
                </div>
                <pre className="bg-gray-50 rounded-xl p-4 overflow-x-auto text-sm mt-2 whitespace-pre-wrap">
                  {extractResult}
                </pre>
              </div>
            )}
          </>
        )}
        {/* CSV 다운로드 탭 */}
        {tab === "csv" && (
          <>
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FiCode className="w-5 h-5 text-blue-500" /> JSON 입력
              </label>
              <textarea
                className="w-full h-40 p-4 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none shadow-sm font-mono"
                placeholder="JSON 배열을 입력하세요"
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
              />
            </div>
            <button
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center text-lg font-bold mb-4 gap-2"
              onClick={handleCsvDownload}
            >
              <FiDownload className="w-5 h-5" /> CSV 다운로드
            </button>
            {/* 에러 메시지 */}
            {csvError && (
              <div className="text-red-500 text-sm mb-2">{csvError}</div>
            )}
          </>
        )}
        {/* CSV 변환 탭 */}
        {tab === "csv2json" && (
          <>
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FiUpload className="w-5 h-5 text-blue-500" /> CSV 또는 엑셀
                파일 업로드
              </label>
              <input
                type="file"
                accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                id="csv2json-file"
                onChange={handleCsv2jsonFile}
              />
              <label
                htmlFor="csv2json-file"
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded-xl cursor-pointer hover:bg-blue-600 transition-all duration-200 shadow-md mb-2"
              >
                파일 선택
              </label>
              <span className="ml-2 text-gray-600">
                {csv2jsonFileName || "선택된 파일 없음"}
              </span>
              <div className="text-gray-500 text-sm mt-1">
                첫 행이 key, 아래 행이 value로 인식되어 JSON으로 변환됩니다.
              </div>
            </div>
            {/* 에러 메시지 */}
            {csv2jsonError && (
              <div className="text-red-500 text-sm mb-2">{csv2jsonError}</div>
            )}
            {/* 변환 결과 */}
            {csv2jsonResult && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mt-4">
                <div className="flex items-center mb-2">
                  <span className="text-lg font-semibold flex items-center gap-2">
                    <FiCopy className="inline-block mr-1" /> 변환 결과
                  </span>
                  <button
                    className="ml-auto flex items-center gap-1 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
                    onClick={handleCsv2jsonCopy}
                  >
                    <FiCopy /> {csv2jsonCopied ? "복사됨" : "복사"}
                  </button>
                </div>
                <pre className="bg-gray-50 rounded-xl p-4 overflow-x-auto text-sm mt-2 whitespace-pre-wrap">
                  {csv2jsonResult}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
