"use client";

import {usePathname} from "next/navigation";

type ModuleKey="finance"|"students"|"academics"|"facilities"|"library"|"meetings"|"administration"|"website";
type Copy={eyebrow:string;title:string;description:string};

const labels:Record<ModuleKey,{ko:Copy;my:Copy}>={
  finance:{
    ko:{eyebrow:"재정·회계",title:"재정 관리",description:"일반·특별·장학금 재정을 통합 관리합니다."},
    my:{eyebrow:"ဘဏ္ဍာရေးနှင့် စာရင်းကိုင်",title:"ဘဏ္ဍာရေးစီမံခန့်ခွဲမှု",description:"အထွေထွေဘဏ္ဍာရေး၊ အထူးရန်ပုံငွေနှင့် ပညာသင်ဆုရန်ပုံငွေများကို စီမံခန့်ခွဲပါ။"}
  },
  students:{
    ko:{eyebrow:"학생·학적",title:"학생 관리",description:"학생 정보와 학업 이력을 한곳에서 빠르게 확인하고 관리합니다."},
    my:{eyebrow:"ကျောင်းသားရေးရာ",title:"ကျောင်းသားစီမံခန့်ခွဲမှု",description:"ကျောင်းသားအချက်အလက်နှင့် ပညာရေးမှတ်တမ်းများကို တစ်နေရာတည်းတွင် စီမံခန့်ခွဲပါ။"}
  },
  academics:{
    ko:{eyebrow:"학사 운영",title:"학사 관리",description:"학기별 교육과정, 고정 수업 반영, 시간표와 성적을 통합 관리합니다."},
    my:{eyebrow:"ပညာရေးလုပ်ငန်းများ",title:"ပညာရေးစီမံခန့်ခွဲမှု",description:"သင်ရိုးညွှန်းတမ်း၊ စာသင်ချိန်ဇယားနှင့် အမှတ်စာရင်းများကို စီမံခန့်ခွဲပါ။"}
  },
  facilities:{
    ko:{eyebrow:"시설·자산 운영",title:"시설 관리",description:"공간과 비품을 등록하고, 차량 운행과 수리 요청을 순서대로 관리합니다."},
    my:{eyebrow:"အဆောက်အအုံနှင့် ပစ္စည်းများ",title:"အဆောက်အအုံနှင့် ပစ္စည်းများ စီမံခန့်ခွဲမှု",description:"အဆောက်အအုံ၊ ပစ္စည်း၊ ယာဉ်နှင့် ပြုပြင်ထိန်းသိမ်းမှုများကို စီမံခန့်ခွဲပါ။"}
  },
  library:{
    ko:{eyebrow:"도서관 운영",title:"도서관 관리",description:"도서 목록, 이용자, 대출과 반납을 통합 관리합니다."},
    my:{eyebrow:"စာကြည့်တိုက်လုပ်ငန်းများ",title:"စာကြည့်တိုက်စီမံခန့်ခွဲမှု",description:"စာအုပ်စာရင်း၊ စာဖတ်သူများ၊ ငှားရမ်းခြင်းနှင့် ပြန်အပ်ခြင်းများကို စီမံခန့်ခွဲပါ။"}
  },
  meetings:{
    ko:{eyebrow:"회의·의사결정",title:"회의 자료 관리",description:"위원회·교수·직원 회의의 일정, 참석자, 회의록과 후속 조치를 관리합니다."},
    my:{eyebrow:"အစည်းအဝေးနှင့် ဆုံးဖြတ်ချက်များ",title:"အစည်းအဝေးမှတ်တမ်းများ စီမံခန့်ခွဲမှု",description:"အစည်းအဝေးအချိန်ဇယား၊ တက်ရောက်သူများ၊ မှတ်တမ်းနှင့် ဆက်လက်ဆောင်ရွက်ရန်များကို စီမံခန့်ခွဲပါ။"}
  },
  administration:{
    ko:{eyebrow:"시스템·권한",title:"계정·권한 관리",description:"로그인 계정, 소속 및 시스템 접근 권한을 관리합니다."},
    my:{eyebrow:"စနစ်နှင့် ခွင့်ပြုချက်များ",title:"အကောင့်နှင့် ခွင့်ပြုချက် စီမံခန့်ခွဲမှု",description:"အသုံးပြုသူအကောင့်များ၊ ဌာနနှင့် ဝင်ရောက်ခွင့်များကို စီမံခန့်ခွဲပါ။"}
  },
  website:{
    ko:{eyebrow:"홈페이지 운영",title:"홈페이지 관리",description:"공지사항을 먼저 관리하고, 필요한 경우 아래에서 두 언어의 홈페이지 문구를 함께 수정합니다."},
    my:{eyebrow:"ဝဘ်ဆိုက်လုပ်ငန်းများ",title:"ဝဘ်ဆိုက်စီမံခန့်ခွဲမှု",description:"ကြေညာချက်များနှင့် မြန်မာ၊ ကိုရီးယား ဝဘ်ဆိုက်စာသားများကို စီမံခန့်ခွဲပါ။"}
  }
};

export default function AdminModuleHeading({moduleKey}:{moduleKey:ModuleKey}){
  const pathname=usePathname();
  const locale=pathname.startsWith("/my/")?"my":"ko";
  const copy=labels[moduleKey][locale];
  return <>
    <span className="eyebrow admin-module-eyebrow">{copy.eyebrow}</span>
    <h2 className="admin-module-title">{copy.title}</h2>
    <p className="admin-module-description">{copy.description}</p>
  </>;
}
