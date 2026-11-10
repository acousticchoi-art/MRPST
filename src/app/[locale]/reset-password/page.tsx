import ResetPasswordForm from "./ResetPasswordForm";
export default async function ResetPasswordPage({params}:{params:Promise<{locale:string}>}){const {locale}=await params;return <ResetPasswordForm locale={locale}/>;}
