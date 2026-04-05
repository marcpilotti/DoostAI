import { SignUp } from "@clerk/nextjs";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const redirectUrl = typeof params.redirect_url === "string" ? params.redirect_url : "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--doost-bg-secondary)]">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] rounded-2xl border-0",
          },
        }}
        signInUrl="/sign-in"
        forceRedirectUrl={redirectUrl}
      />
    </div>
  );
}
