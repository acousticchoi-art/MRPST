"use client";
export default function CertificatePrintButton({label}:{label:string}){
  return <button type="button" className="student-cert-print-button" onClick={()=>window.print()}>{label}</button>;
}
