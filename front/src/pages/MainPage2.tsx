import { useState } from "react";
import { FiCopy, FiExternalLink } from "react-icons/fi";
import servicesData from "../data/services.json";

// 서비스 타입 정의
interface Service {
  name: string;
  sub: string;
  agentDev?: { url: string; accounts: { id: string; pw: string }[] };
  agentOp?: { url: string; accounts: { id: string; pw: string }[] };
  adminDev?: { url: string; accounts: { id: string; pw: string }[] };
  adminOp?: { url: string; accounts: { id: string; pw: string }[] };
  dbDev?: {
    user: string;
    password: string;
    host?: string;
    port: string;
    database: string;
    project?: string;
  };
  dbOp?: {
    user: string;
    password: string;
    host?: string;
    port: string;
    database: string;
    project?: string;
  };
}

const services: Service[] = servicesData;

// .env 예시:
// VITE_SERVICES_JSON='[
//   {
//     "name": "서비스A",
//     "sub": "서브시명A",
//     "agentDev": {
//       "url": "https://dev-agent-a.com",
//       "accounts": [
//         { "id": "admin", "pw": "1234" },
//         { "id": "subadmin", "pw": "5678" }
//       ]
//     },
//     "agentOp": { "url": "https://op-agent-a.com", "id": "opuser", "pw": "op123" },
//     "adminDev": { "url": "https://dev-admin-a.com", "id": "admindev", "pw": "devpw" },
//     "adminOp": { "url": "https://op-admin-a.com", "id": "adminop", "pw": "oppw" },
//     "dbDev": {
//       "user": "devuser",
//       "password": "devpw",
//       "host": "dev.db.com",
//       "port": "5432",
//       "database": "devdb"
//     },
//     "dbOp": {
//       "user": "opuser",
//       "password": "oppw",
//       "host": "op.db.com",
//       "port": "5432",
//       "database": "opdb"
//     }
//   },
//   ...
// ]'

function UrlCard({
  label,
  data,
}: {
  label: string;
  data?: { url: string; accounts?: { id: string; pw: string }[] };
}) {
  const [copied, setCopied] = useState<{
    type: "id" | "pw";
    idx: number;
  } | null>(null);
  const [showPw, setShowPw] = useState<{ [key: number]: boolean }>({});

  if (!data?.url) return null;
  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-4 shadow-sm border border-gray-200 flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-2 w-full">
        <span className="font-semibold text-gray-700 flex-shrink-0 w-44 whitespace-nowrap overflow-hidden text-ellipsis">
          {label}:
        </span>
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-600 underline hover:text-blue-800 transition whitespace-nowrap min-w-0 flex-1 max-w-[900px]"
        >
          <FiExternalLink className="inline-block w-4 h-4" />
          <span className="inline-block">{data.url}</span>
        </a>
      </div>
      <div className="flex flex-col gap-0.5 ml-2">
        {(data.accounts || []).map((acc, idx) => (
          <div
            key={acc.id + acc.pw + idx}
            className={`flex flex-col py-2 px-2 ${
              idx !== 0 ? "border-t border-gray-200" : ""
            } bg-white rounded`}
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-bold text-gray-500">
                계정 {idx + 1}
              </span>
            </div>
            <div className="flex flex-row flex-wrap items-center gap-4 mb-1">
              <span className="font-semibold text-gray-700 w-10">ID</span>
              <span className="font-mono bg-gray-100 rounded px-2 py-1 text-gray-800 max-w-[180px] truncate flex-1">
                {acc.id}
              </span>
              <button
                className="text-gray-400 hover:text-blue-500 transition"
                onClick={() => {
                  navigator.clipboard.writeText(acc.id);
                  setCopied({ type: "id", idx });
                  setTimeout(() => setCopied(null), 1200);
                }}
                title="ID 복사"
              >
                <FiCopy className="inline-block w-4 h-4" />
                {copied?.type === "id" && copied.idx === idx && (
                  <span className="ml-1 text-xs text-blue-500">복사됨</span>
                )}
              </button>
            </div>
            <div className="flex flex-row flex-wrap items-center gap-4">
              <span className="font-semibold text-gray-700 w-10">PW</span>
              <span className="font-mono bg-gray-100 rounded px-2 py-1 text-gray-800 max-w-[180px] truncate flex-1">
                {showPw[idx] ? acc.pw : "●●●●●●"}
              </span>
              <button
                className="text-gray-400 hover:text-blue-500 transition"
                onClick={() =>
                  setShowPw((prev) => ({ ...prev, [idx]: !prev[idx] }))
                }
                title={showPw[idx] ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                {/* 눈 아이콘 (react-icons/fi) */}
                <svg
                  className="inline-block w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {showPw[idx] ? (
                    <path
                      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <>
                      <path
                        d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-7.94"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="1"
                        y1="1"
                        x2="23"
                        y2="23"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </>
                  )}
                </svg>
              </button>
              <button
                className="text-gray-400 hover:text-blue-500 transition"
                onClick={() => {
                  navigator.clipboard.writeText(acc.pw);
                  setCopied({ type: "pw", idx });
                  setTimeout(() => setCopied(null), 1200);
                }}
                title="PW 복사"
              >
                <FiCopy className="inline-block w-4 h-4" />
                {copied?.type === "pw" && copied.idx === idx && (
                  <span className="ml-1 text-xs text-blue-500">복사됨</span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DbCard({
  db,
  title,
}: {
  db?: {
    user: string;
    password: string;
    host?: string;
    port: string;
    database: string;
    project?: string;
  };
  title: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  if (!db) return null;

  const fields = [
    { label: "USER", value: db.user, key: "user" },
    { label: "PASSWORD", value: db.password, key: "password" },
    ...(db.host ? [{ label: "HOST", value: db.host, key: "host" }] : []),
    ...(db.project
      ? [{ label: "PROJECT", value: db.project, key: "project" }]
      : []),
    { label: "PORT", value: db.port, key: "port" },
    { label: "DATABASE", value: db.database, key: "database" },
  ];

  return (
    <div className="bg-gray-50 rounded-2xl shadow-xl p-6 border border-gray-200 flex flex-col gap-3 min-w-[320px] flex-1">
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      {fields.map((f) => (
        <div key={f.key} className="relative flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-700 w-20">{f.label}:</span>
          <input
            className="bg-white rounded px-2 py-1 border border-gray-200 font-mono break-all flex-1 pr-10 outline-none select-all"
            value={f.value}
            readOnly
            spellCheck={false}
            tabIndex={-1}
          />
          <button
            className="absolute right-2 text-gray-400 hover:text-blue-500 transition"
            style={{ right: 0 }}
            onClick={() => {
              navigator.clipboard.writeText(f.value);
              setCopied(f.key);
              setTimeout(() => setCopied(null), 1200);
            }}
            title={`${f.label} 복사`}
            tabIndex={-1}
            type="button"
          >
            <FiCopy className="inline-block w-4 h-4" />
            {copied === f.key && (
              <span className="ml-1 text-xs text-blue-500">복사됨</span>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

export default function MainPage2() {
  const [selected, setSelected] = useState(0);
  const service = services[selected];

  return (
    <section className="w-full h-full min-h-[calc(100vh-3.5rem)] p-6 flex flex-col items-center justify-start">
      {/* 서비스명 탭 (가로 스크롤) */}
      <div className="w-full flex justify-center mb-8">
        <div className="flex w-full max-w-4xl overflow-x-auto gap-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent px-1">
          {services.map((s: any, idx: number) => (
            <button
              key={s.name}
              className={`flex-shrink-0 min-w-[140px] px-6 py-3 rounded-xl font-bold text-lg transition-all duration-200 border-2 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                selected === idx
                  ? "bg-white border-blue-500 text-blue-700 shadow-lg z-10"
                  : "bg-gray-100 border-transparent text-gray-500 hover:bg-blue-50 hover:text-blue-600"
              }`}
              style={{
                boxShadow:
                  selected === idx
                    ? "0 4px 16px 0 rgba(0,0,0,0.06)"
                    : undefined,
              }}
              onClick={() => setSelected(idx)}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
      {/* 서비스 정보 + DB 정보 2단 그리드 */}
      {service ? (
        <div className="w-full flex flex-col md:flex-row gap-8 justify-center items-stretch max-w-5xl mx-auto">
          {/* 서비스 정보 카드 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex-1 min-w-[340px] max-w-[900px]">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {service.name}
            </h2>
            <div className="mb-6 text-gray-700">
              <span className="font-semibold">서브시명:</span>{" "}
              <span>{service.sub}</span>
            </div>
            <UrlCard label="에이전트 개발 주소" data={service.agentDev} />
            <UrlCard label="에이전트 운영 주소" data={service.agentOp} />
            <UrlCard label="어드민 개발 주소" data={service.adminDev} />
            <UrlCard label="어드민 운영 주소" data={service.adminOp} />
          </div>
          {/* DB 정보 카드 2개 */}
          <div className="flex flex-col gap-6 flex-1 min-w-[320px]">
            <DbCard db={service.dbDev} title="DB 개발 정보" />
            <DbCard db={service.dbOp} title="DB 운영 정보" />
          </div>
        </div>
      ) : (
        <div className="text-red-500">서비스 정보가 없습니다.</div>
      )}
    </section>
  );
}
