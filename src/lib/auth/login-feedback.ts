const messages = {
  credentials: ["이메일 또는 비밀번호가 일치하지 않습니다.", "အီးမေးလ် သို့မဟုတ် စကားဝှက် မကိုက်ညီပါ။"],
  unconfirmed: ["이메일 인증이 완료되지 않았습니다.", "အီးမေးလ် အတည်ပြုခြင်း မပြီးသေးပါ။"],
  blocked: ["사용이 제한된 계정입니다.", "ဤအကောင့်ကို အသုံးပြုခွင့် ကန့်သတ်ထားပါသည်။"],
  rate: ["로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.", "ဝင်ရောက်ရန် ကြိုးစားမှု များလွန်းပါသည်။ ခဏစောင့်ပြီး ထပ်စမ်းပါ။"],
  network: ["로그인 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.", "အကောင့်ဝင်ရန် ဆာဗာနှင့် ချိတ်ဆက်၍ မရပါ။ ခဏစောင့်ပြီး ထပ်စမ်းပါ။"],
  failed: ["로그인 요청을 처리하지 못했습니다.", "အကောင့်ဝင်ရန် တောင်းဆိုချက်ကို ဆောင်ရွက်၍ မရပါ။"],
  access: ["계정 상태 또는 역할을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.", "အကောင့်အခြေအနေ သို့မဟုတ် တာဝန်ကို စစ်ဆေး၍ မရပါ။ ခဏစောင့်ပြီး ထပ်စမ်းပါ။"],
  inactive: ["비활성화된 계정입니다.", "ဤအကောင့်ကို ပိတ်ထားပါသည်။"],
  noProfile: ["계정 프로필이 등록되어 있지 않습니다.", "အကောင့် ကိုယ်ရေးအချက်အလက် မမှတ်ပုံတင်ရသေးပါ။"],
  noRole: ["이 계정에 로그인 역할이 지정되어 있지 않습니다.", "ဤအကောင့်အတွက် ဝင်ရောက်ခွင့်တာဝန် မသတ်မှတ်ရသေးပါ။"],
  noStudent: ["이 계정에 연결된 학생 정보가 없습니다.", "ဤအကောင့်နှင့် ချိတ်ဆက်ထားသော ကျောင်းသားအချက်အလက် မရှိပါ။"],
  studentLookup: ["학생 정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.", "ကျောင်းသားအချက်အလက်ကို စစ်ဆေး၍ မရပါ။ ခဏစောင့်ပြီး ထပ်စမ်းပါ။"],
} as const;

export function loginFeedback(key: keyof typeof messages, locale: string) {
  if(locale==="en")return {"credentials":"Email or password is incorrect.","unconfirmed":"Email verification is incomplete.","blocked":"This account is restricted.","rate":"Too many login attempts. Try again later.","network":"Unable to connect to the login server. Try again later.","failed":"Unable to process the login request.","access":"Unable to verify account status or role. Try again.","inactive":"This account is inactive.","noProfile":"No account profile is registered.","noRole":"No login role is assigned to this account.","noStudent":"No student record is linked to this account.","studentLookup":"Unable to verify student information. Try again."}[key];
  return messages[key][locale === "my" ? 1 : 0];
}

export function authFailure(error: { code?: string; status?: number; name?: string }, locale: string) {
  if (error.code === "invalid_credentials") return loginFeedback("credentials", locale);
  if (error.code === "email_not_confirmed") return loginFeedback("unconfirmed", locale);
  if (error.code === "user_banned") return loginFeedback("blocked", locale);
  if (error.status === 429) return loginFeedback("rate", locale);
  if (error.name === "AuthRetryableFetchError" || (error.status ?? 0) >= 500) {
    return loginFeedback("network", locale);
  }
  return loginFeedback("failed", locale);
}
