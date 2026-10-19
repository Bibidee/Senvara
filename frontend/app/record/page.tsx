import { Suspense } from "react";
import { RecordClient } from "@/components/RecordClient";
export default function RecordPage(){return <Suspense fallback={<div className="wrap inner-page loading-register">Preparing record viewer…</div>}><RecordClient/></Suspense>}
