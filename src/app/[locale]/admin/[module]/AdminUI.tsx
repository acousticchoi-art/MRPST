import { useMemo, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

type AdminButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function AdminButton({ className = "", type = "button", ...props }: AdminButtonProps) {
  return <button {...props} type={type} className={["admin-button", className].filter(Boolean).join(" ")} />;
}

export function FormField({ label, children, full = false, className = "" }: {label:string;children:ReactNode;full?:boolean;className?:string}) {
  return <label className={[full ? "full" : "", className].filter(Boolean).join(" ")}>{label}{children}</label>;
}

export type SearchSelectOption = { value:string; label:string; keywords?:string };
export function SearchSelect({value,onChange,options,placeholder="선택하세요",searchPlaceholder="검색어를 입력하세요",disabled=false,emptyText="검색 결과가 없습니다.",clearLabel="선택 해제"}:{
  value:string;onChange:(value:string)=>void;options:SearchSelectOption[];placeholder?:string;searchPlaceholder?:string;disabled?:boolean;emptyText?:string;clearLabel?:string;
}) {
  const [open,setOpen]=useState(false),[query,setQuery]=useState("");
  const selected=options.find(o=>o.value===value);
  const filtered=useMemo(()=>{const q=query.trim().toLocaleLowerCase();return q?options.filter(o=>(o.label+" "+(o.keywords||"")).toLocaleLowerCase().includes(q)):options;},[options,query]);
  return <div className="admin-search-select">
    <button type="button" className="admin-search-select-trigger" disabled={disabled} aria-expanded={open} onClick={()=>{setOpen(v=>!v);setQuery("");}}>
      <span className={selected?"selected":"placeholder"}>{selected?.label||placeholder}</span><span className="admin-search-select-chevron">⌄</span>
    </button>
    {open&&<div className="admin-search-select-popover">
      <input className="admin-search-select-input" autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder={searchPlaceholder}/>
      {value&&<button type="button" className="admin-search-select-clear" onClick={()=>{onChange("");setOpen(false);}}>{clearLabel}</button>}
      <div className="admin-search-select-results" role="listbox">
        {filtered.length?filtered.map(o=><button type="button" key={o.value} className={o.value===value?"active":""} onClick={()=>{onChange(o.value);setOpen(false);setQuery("");}}>{o.label}</button>):<div className="admin-search-select-empty">{emptyText}</div>}
      </div>
    </div>}
  </div>;
}

/** Shared modal form footer; callers provide their existing module classes and handlers. */
export function AdminFormActions({close,saving,disabled=false,submit,className="",primaryClassName="",cancelLabel="취소",submitLabel="저장",savingLabel="저장 중…"}:{
  close:()=>void;saving:boolean;disabled?:boolean;submit:()=>void;className?:string;primaryClassName?:string;cancelLabel?:string;submitLabel?:string;savingLabel?:string;
}) {
  return <div className={["admin-form-actions",className].filter(Boolean).join(" ")}><AdminButton onClick={close}>{cancelLabel}</AdminButton><AdminButton className={primaryClassName} disabled={saving||disabled} onClick={submit}>{saving?savingLabel:submitLabel}</AdminButton></div>;
}
