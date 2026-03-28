import LoginForm from "@/components/LoginForm";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
