import { Suspense } from "react";
import { AssistantScreen } from "@/components/chat/AssistantScreen";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AssistantScreen />
    </Suspense>
  );
}
