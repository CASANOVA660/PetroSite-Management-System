import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Petroconnect login"
        description="This is SignIn Tables for Petroconnect"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
