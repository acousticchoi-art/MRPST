import ForgotPasswordForm from "./ForgotPasswordForm";
export default async function ForgotPasswordPage({params}:{params:Promise<{locale:string}>}){const {locale}=await params;return <ForgotPasswordForm locale={locale}/>;}
