"use client";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
export function RoleChoiceGate() {
  const router = useRouter(); const [open,setOpen]=useState(false); const [busy,setBusy]=useState(false);
  useEffect(()=>{fetch("/api/auth/me",{cache:"no-store"}).then(r=>r.json()).then(d=>setOpen(Boolean(d.user&&!d.user.roleChosen))).catch(()=>{});},[]);
  async function choose(role:"customer"|"driver"){setBusy(true);const r=await fetch("/api/auth/role",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({role})});if(r.ok){setOpen(false);router.push(role==="driver"?"/account":"/");router.refresh();}setBusy(false);}
  if(!open)return null;
  return <div className="fixed inset-0 z-[200] grid place-items-center bg-black/70 p-4"><div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl"><h2 className="text-xl font-bold">请选择身份</h2><p className="mt-2 text-sm text-muted-foreground">身份只能选择一次，确认后无法更改。</p><div className="mt-5 grid grid-cols-2 gap-3"><button disabled={busy} onClick={()=>choose("customer")} className="rounded-xl border p-5 font-semibold">乘客</button><button disabled={busy} onClick={()=>choose("driver")} className="rounded-xl border p-5 font-semibold">司机</button></div></div></div>;
}
