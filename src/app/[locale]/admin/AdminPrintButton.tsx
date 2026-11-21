"use client";

export default function AdminPrintButton(){
  return <button type="button" className="admin-print-button" onClick={()=>window.print()}>인쇄 / PDF 저장</button>;
}
