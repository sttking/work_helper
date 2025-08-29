import { useState } from "react";
import { FiUpload, FiDownload } from "react-icons/fi";
import * as XLSX from "xlsx";

export default function MainPage5() {
  // 업로드 UI만 유지
  const [csv2jsonFileName, setCsv2jsonFileName] = useState<string>("");
  const [rows, setRows] = useState<
    Array<[number | string, string, string, string]>
  >([]); // [A(index), B(질문), C(결과코드), F(ENTITY)]
  const [error, setError] = useState<string>("");
  const [expectedPairs, setExpectedPairs] = useState<
    Array<{ question: string; intent: string }>
  >([]);
  const [tcPaste, setTcPaste] = useState<string>("");
  const [showCases, setShowCases] = useState<boolean>(false);

  // 간단한 CSV 파서 사용하지 않음 (업로드 UI만 유지)

  // 파일 업로드 및 파싱 (CSV, XLSX 모두 지원)
  const handleCsv2jsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    const file = fileInput.files?.[0];
    if (!file) return;
    setCsv2jsonFileName(file.name);
    setError("");
    setRows([]);

    const lower = file.name.toLowerCase();
    const isCsv = lower.endsWith(".csv");

    const reader = new FileReader();
    reader.onerror = () => setError("파일을 읽는 중 오류가 발생했습니다.");

    if (isCsv) {
      reader.onload = () => {
        try {
          const text = reader.result as string;
          const wb = XLSX.read(text, { type: "string" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
          const extracted = extractColumns(data);
          setRows(extracted);
        } catch (e: any) {
          setError(e?.message || "CSV 파싱 중 오류가 발생했습니다.");
        }
      };
      reader.readAsText(file, "utf-8");
    } else {
      reader.onload = () => {
        try {
          const buffer = reader.result as ArrayBuffer;
          const wb = XLSX.read(buffer, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
          const extracted = extractColumns(data);
          setRows(extracted);
        } catch (e: any) {
          setError(e?.message || "엑셀 파싱 중 오류가 발생했습니다.");
        }
      };
      reader.readAsArrayBuffer(file);
    }
    // 동일 파일을 연속 업로드해도 onChange가 동작하도록 input 값을 초기화
    setTimeout(() => {
      try {
        fileInput.value = "";
      } catch {}
    }, 0);
  };

  // A,B,C,F 열만 추출: A=0, B=1, C=2, F=5
  function extractColumns(
    data: any[][]
  ): Array<[number | string, string, string, string]> {
    // 첫 행이 헤더일 수 있으나, 요구사항은 단순 컬럼 인덱스 기준이므로 모든 행을 그대로 매핑
    // 빈 행은 제외
    const result: Array<[number | string, string, string, string]> = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i] || [];
      const a = row[0];
      const b = row[1];
      const c = row[2];
      const f = row[5];
      // 헤더 자동 감지: 첫 행이 Index/Query/Answer 등의 텍스트면 스킵
      if (
        i === 0 &&
        (String(a || "").toLowerCase() === "index" ||
          String(b || "").toLowerCase() === "query" ||
          String(c || "").toLowerCase() === "answer" ||
          String(b || "").includes("질문"))
      ) {
        continue;
      }
      if (
        a === undefined &&
        b === undefined &&
        c === undefined &&
        f === undefined
      ) {
        continue;
      }
      result.push([
        a ?? "",
        b !== undefined ? String(b) : "",
        c !== undefined ? String(c) : "",
        f !== undefined ? String(f) : "",
      ]);
    }
    return result;
  }

  const handleAddFromPaste = () => {
    const lines = tcPaste
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const next: Array<{ question: string; intent: string }> = [
      ...expectedPairs,
    ];
    for (const line of lines) {
      const parts = line.split(/\t|,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
      if (parts.length >= 2) {
        const q = unquote(parts[0]).trim();
        const intent = unquote(parts[1]).trim();
        if (q) next.push({ question: q, intent });
      }
    }
    setExpectedPairs(next);
    setTcPaste("");
  };

  const unquote = (s: string) => {
    const t = s.trim();
    if (
      (t.startsWith('"') && t.endsWith('"')) ||
      (t.startsWith("'") && t.endsWith("'"))
    ) {
      return t.slice(1, -1);
    }
    return t;
  };

  // C열 원시 텍스트에서 인텐트 코드만 추출 (줄바꿈/앞 공백 고려)
  function extractIntentCode(raw: unknown): string {
    const text = (raw ?? "").toString();
    const lines = text.split(/\r?\n/).map((l) => l.trim());
    const firstNonEmpty = lines.find((l) => l.length > 0) ?? "";
    // 영문으로 시작하는 토큰(영문+숫자+언더스코어) 우선 매칭
    const match = firstNonEmpty.match(/[A-Za-z][A-Za-z0-9_]*/);
    if (match) return match[0];
    // 폴백: 공백 기준 첫 토큰
    const firstToken = firstNonEmpty.split(/\s+/).find(Boolean) ?? "";
    return firstToken;
  }

  // 비교 결과 CSV 다운로드
  function downloadComparisonCsv() {
    if (!rows.length) return;
    const headers = [
      "index",
      "question",
      "actual_intent",
      "expected_intent",
      "match",
    ];
    const esc = (v: unknown) => {
      const s = (v ?? "").toString();
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const lines: string[] = [];
    lines.push(headers.join(","));
    rows.forEach((r, idx) => {
      const indexVal = r[0];
      const question = r[1] || "";
      const actual = extractIntentCode(r[2]);
      const expected = (expectedPairs[idx]?.intent ?? "").toString().trim();
      const match = expected !== "" && actual === expected ? "일치" : "불일치";
      const rowArr = [indexVal, question, actual, expected || "", match];
      lines.push(rowArr.map(esc).join(","));
    });
    const csvStr = lines.join("\r\n");
    const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "comparison.csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  const handleClearTestCases = () => {
    setExpectedPairs([]);
    setTcPaste("");
  };

  return (
    <section className="w-full h-full min-h-[calc(100vh-3.5rem)] p-6 flex flex-col items-center justify-start">
      {/* 테스트 케이스 등록 + 결과 비교 */}
      <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            테스트 케이스 등록 (질문 → 기대 인텐트코드)
          </h3>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                붙여넣기 (한 줄: 질문,인텐트)
              </label>
              <textarea
                className="w-full h-24 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="예) 계좌 잔액 알려줘,ACCT_BALANCE"
                value={tcPaste}
                onChange={(e) => setTcPaste(e.target.value)}
              />
              <div className="mt-2 flex gap-2">
                <button
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm"
                  onClick={handleAddFromPaste}
                >
                  추가
                </button>
                <button
                  className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg text-sm"
                  onClick={handleClearTestCases}
                >
                  초기화
                </button>
              </div>
            </div>
          </div>
          {expectedPairs.length > 0 && (
            <div className="mt-3 text-sm text-gray-700 flex items-center gap-3">
              <span>
                등록된 케이스: {expectedPairs.length.toLocaleString()}건
              </span>
              <button
                className="px-3 py-1 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-800"
                onClick={() => setShowCases((v) => !v)}
              >
                {showCases ? "닫기" : "보기"}
              </button>
            </div>
          )}
          {showCases && expectedPairs.length > 0 && (
            <div className="mt-3 overflow-auto border rounded-xl">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 w-16">
                      #
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">
                      질문
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 w-56">
                      기대 인텐트
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expectedPairs.map((p, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-3 py-2 align-top font-mono text-gray-800">
                        {i}
                      </td>
                      <td className="px-3 py-2 align-top text-gray-800 whitespace-pre-wrap break-words">
                        {p.question}
                      </td>
                      <td className="px-3 py-2 align-top font-mono text-gray-800">
                        {p.intent}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FiUpload className="w-5 h-5 text-blue-500" /> CSV 또는 엑셀 파일
            업로드
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
            파일 선택 (업데이트 가능)
          </label>
          <span className="ml-2 text-gray-600">
            {csv2jsonFileName || "선택된 파일 없음"}
          </span>
          <div className="text-gray-500 text-sm mt-1">
            결과 파일의 B(질문)과 C(결과코드)를 등록된 순서의 테스트
            케이스(질문, 인텐트)와 1:1 순서대로 비교합니다.
          </div>
        </div>
        {error && <div className="text-red-500 text-sm mb-3">{error}</div>}
        {rows.length > 0 && (
          <div className="overflow-auto border rounded-xl">
            <div className="flex justify-end p-3">
              <button
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
                onClick={downloadComparisonCsv}
              >
                <FiDownload className="w-4 h-4" /> 비교 결과 CSV 다운로드
              </button>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700 w-24">
                    A: index
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">
                    B: 질문
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700 w-40">
                    C: 결과코드(실제)
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700 w-60">
                    기대 인텐트 / 일치 여부
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const question = r[1] || "";
                  const actual = extractIntentCode(r[2]);
                  const expected = (expectedPairs[idx]?.intent ?? "")
                    .toString()
                    .trim();
                  const matched = expected !== "" && actual === expected;
                  return (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-3 py-2 align-top font-mono text-gray-800">
                        {r[0]}
                      </td>
                      <td className="px-3 py-2 align-top text-gray-800 whitespace-pre-wrap break-words">
                        {question}
                      </td>
                      <td className="px-3 py-2 align-top font-mono text-gray-800">
                        {actual}
                      </td>
                      <td className="px-3 py-2 align-top text-gray-800">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">
                            {expected || "(미등록)"}
                          </span>
                          {expected !== "" && (
                            <span
                              className={`inline-block px-2 py-0.5 text-xs rounded ${
                                matched
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {matched ? "일치" : "불일치"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
