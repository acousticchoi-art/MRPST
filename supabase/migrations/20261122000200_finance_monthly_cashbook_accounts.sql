-- Bring the working cashbook categories into the finance chart of accounts.
-- Existing journals remain untouched; only account metadata and selectable accounts are added.

alter table public.finance_accounts
  add column if not exists expense_nature text
  check (expense_nature is null or expense_nature in ('fixed','variable'));

update public.finance_accounts
set name_en = 'Fixed Expenses', name_ko = '고정 지출', expense_nature = 'fixed'
where code = '5100';

update public.finance_accounts
set name_en = 'Variable Expenses', name_ko = '변동 지출', expense_nature = 'variable'
where code = '5200';

update public.finance_accounts
set expense_nature = 'variable'
where code = '5300';

insert into public.finance_accounts
  (code, name_en, name_ko, name_my, account_type, parent_id, expense_nature)
select v.code, v.name_en, v.name_ko, v.name_my, v.account_type::public.mrpst_account_type,
  (select id from public.finance_accounts where code = v.parent_code), v.expense_nature
from (values
  ('1010','Cash on Hand','현금','ငွေသား','asset','1000',null),
  ('1020','Bank and Point Balance','은행 및 포인트 잔액','ဘဏ်နှင့် ပွိုင့်လက်ကျန်','asset','1000',null),
  ('4010','Church and Donor Support','교회·후원금','အသင်းတော်နှင့် အလှူရှင်ထောက်ပံ့ငွေ','income','4000',null),
  ('4020','Tuition and Student Fees','등록금·학생 납부금','ကျောင်းလခနှင့် ကျောင်းသားပေးသွင်းငွေ','income','4100',null),
  ('4030','Other Income','기타 수입','အခြားဝင်ငွေ','income','4000',null),
  ('5101','Pastor and Leader Meetings','목회자·리더 모임','သင်းအုပ်နှင့် ခေါင်းဆောင်အစည်းအဝေး','expense','5100','fixed'),
  ('5102','Chapel and Teaching Fees','채플·강사비','ဝတ်ပြုချိန်နှင့် သင်ကြားခ','expense','5100','fixed'),
  ('5103','Utilities','전기·수도·인터넷','လျှပ်စစ်၊ ရေနှင့် အင်တာနက်','expense','5100','fixed'),
  ('5104','Housing and Kitchen','숙소·주방 운영','နေထိုင်ရေးနှင့် မီးဖိုချောင်','expense','5100','fixed'),
  ('5105','Library and Learning Materials','도서관·학습 자료','စာကြည့်တိုက်နှင့် သင်ယူရေးပစ္စည်း','expense','5100','fixed'),
  ('5106','Vehicle Fuel and Maintenance','차량 유류·유지비','ယာဉ်ဆီနှင့် ပြုပြင်ထိန်းသိမ်းမှု','expense','5100','fixed'),
  ('5107','Medical and Hospitality','의료·접대비','ဆေးဝါးနှင့် ဧည့်ခံစရိတ်','expense','5100','fixed'),
  ('5201','Water and Supplies','수도·소모품','ရေနှင့် အသုံးအဆောင်ပစ္စည်း','expense','5200','variable'),
  ('5202','Repairs and Temporary Work','수리·임시 인건비','ပြုပြင်မှုနှင့် ယာယီလုပ်အားခ','expense','5200','variable'),
  ('5203','Meetings and Snacks','회의·간식비','အစည်းအဝေးနှင့် မုန့်ဖိုး','expense','5200','variable'),
  ('5204','Student Support and New Student Goods','학생 지원·신입생 물품','ကျောင်းသားထောက်ပံ့မှုနှင့် ကျောင်းသားသစ်ပစ္စည်း','expense','5200','variable'),
  ('5205','Books and Transportation','도서·교통비','စာအုပ်နှင့် သယ်ယူပို့ဆောင်ရေး','expense','5200','variable'),
  ('5206','Tax and Other Expenses','세금·기타 지출','အခွန်နှင့် အခြားအသုံးစရိတ်','expense','5200','variable')
) as v(code,name_en,name_ko,name_my,account_type,parent_code,expense_nature)
on conflict (code) do update set
  name_en = excluded.name_en,
  name_ko = excluded.name_ko,
  name_my = excluded.name_my,
  parent_id = excluded.parent_id,
  expense_nature = excluded.expense_nature;

create index if not exists finance_accounts_expense_nature_idx
  on public.finance_accounts(expense_nature)
  where expense_nature is not null;
