"use client";

import { useState } from "react";
import { AgeGate } from "@/components/AgeGate";
import { Studio } from "@/components/Studio";

export default function HomePage() {
  const [ok, setOk] = useState(false);

  return (
    <main>
      {!ok ? <AgeGate onPass={() => setOk(true)} /> : <Studio />}
    </main>
  );
}
