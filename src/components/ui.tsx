import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { X, Search, Inbox, ArrowUpLeft } from "lucide-react";
import { Link } from "react-router-dom";
import type {
  Database,
  DemoUser,
  ServiceRequest,
  RequestStatus,
} from "../models";
import { statusLabels, mask } from "../services/repository";

export const AppContext = createContext<{
  db: Database;
  user: DemoUser;
  refresh: () => void;
  notify: (text: string) => void;
  run: (fn: () => void, message?: string) => boolean;
}>(null!);

export const useApp = () => useContext(AppContext);

export const date = (value: string) =>
  new Date(value).toLocaleDateString("ar-LY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function Heading({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">الخدمات الإلكترونية / مساحة العمل</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="actions">{children}</div>
    </div>
  );
}

export function Panel({
  title,
  children,
  action,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-heading">
          <h2>{title}</h2>
          {action}
        </div>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function Badge({ status }: { status: RequestStatus }) {
  return (
    <span className={`badge ${status}`}>
      <i />
      {statusLabels[status]}
    </span>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="info">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

export function Empty({ text = "لا توجد نتائج مطابقة" }: { text?: string }) {
  return (
    <div className="empty">
      <Inbox size={36} />
      <h3>{text}</h3>
      <p>يمكنك تغيير عوامل التصفية أو إضافة بيانات جديدة.</p>
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="search">
      <Search size={18} />
      <input
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog ref={ref} onCancel={onClose}>
      <div className="panel-heading">
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="إغلاق">
          <X />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}

export function RequestTable({
  requests,
  compact = false,
}: {
  requests: ServiceRequest[];
  compact?: boolean;
}) {
  const { db } = useApp();
  if (!requests.length) return <Empty />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>رقم الطلب / التاريخ</th>
            <th>الشركة{!compact && " / الحساب"}</th>
            <th>نوع الخدمة</th>
            {!compact && <th>البطاقة / المستفيد</th>}
            <th>الحالة</th>
            {!compact && <th>آخر تحديث</th>}
            <th />
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => {
            const c = db.companies.find((c) => c.id === r.companyId),
            card = db.cards.find((c) => c.id === r.details.cardId);
            
            return (
              <tr key={r.id}>
                <td>
                  <Link className="request-id" to={`/requests/${r.id}`}>
                    {r.id}
                  </Link>
                  <small>{date(r.createdAt)}</small>
                </td>
                <td>
                  <strong>{c?.name}</strong>
                  {!compact && (
                    <small className="latin">
                      {db.accounts.find((a) => a.id === r.accountId)?.number}
                    </small>
                  )}
                </td>
                <td>{db.services.find((s) => s.id === r.serviceId)?.name}</td>
                {!compact && (
                  <td>
                    {card ? (
                      <>
                        <span className="latin">{mask(card.last4)}</span>
                        <small>{card.holder}</small>
                      </>
                    ) : (
                      r.details.printedName
                    )}
                  </td>
                )}
                <td>
                  <Badge status={r.status} />
                </td>
                {!compact && <td className="muted">{date(r.updatedAt)}</td>}
                <td>
                  <Link
                    className="icon-button"
                    aria-label={`فتح ${r.id}`}
                    to={`/requests/${r.id}`}
                  >
                    <ArrowUpLeft size={17} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
