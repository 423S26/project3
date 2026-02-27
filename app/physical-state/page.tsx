/**
 * Route: /physical-state
 * Physical wellbeing tracking page – Recovery, Training, and Fueling.
 * Athletes log data; psychologists view assigned athletes' data.
 */

import { Suspense } from "react";
import { PhysicalStateClient } from "./physical-state-client";

export default function PhysicalStatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading Physical State...</div>}>
      <PhysicalStateClient />
    </Suspense>
  );
}
