-- Core operating setup copied from the school's existing cashbook categories.
-- This seeds structure only; it deliberately does not fabricate opening balances or transactions.

insert into public.finance_periods (name, starts_on, ends_on, is_closed)
values
  ('2026 회계연도', '2026-01-01', '2026-12-31', false),
  ('2027 회계연도', '2027-01-01', '2027-12-31', false)
on conflict (starts_on, ends_on) do update set name = excluded.name;

insert into public.finance_accounts
  (code, name_en, name_ko, name_my, account_type, parent_id, expense_nature)
select v.code, v.name_en, v.name_ko, v.name_my, 'expense'::public.mrpst_account_type,
  (select id from public.finance_accounts where code = v.parent_code), v.expense_nature
from (values
  ('5101','Pastor and Leader Meetings','목회자·리더 모임','သင်းအုပ်နှင့် ခေါင်းဆောင်အစည်းအဝေး','5100','fixed'),
  ('5102','Chapel and Teaching Fees','채플·강사비','ဝတ်ပြုချိန်နှင့် သင်ကြားခ','5100','fixed'),
  ('5103','Electricity Bill','전기요금','လျှပ်စစ်မီတာခ','5100','fixed'),
  ('5104','QT Book','QT 교재','QT စာအုပ်','5100','fixed'),
  ('5105','Vehicle Fuel','차량 유류비','ယာဉ်ဆီဖိုး','5100','fixed'),
  ('5106','Drinking Water','식수','သောက်ရေသန့်','5100','fixed'),
  ('5107','Diesel Fuel','디젤유','ဒီဇယ်ဆီ','5100','fixed'),
  ('5108','Library','도서관','စာကြည့်တိုက်','5100','fixed'),
  ('5109','Student Leader Fees','학생 리더 활동비','ကျောင်းသားခေါင်းဆောင်စရိတ်','5100','fixed'),
  ('5110','Myitta Villa','미타 빌라','မေတ္တာဗီလာ','5100','fixed'),
  ('5111','Kitchen','주방 운영','မီးဖိုချောင်','5100','fixed'),
  ('5112','Internet Fees','인터넷 요금','အင်တာနက်ခ','5100','fixed'),
  ('5113','Medicine','의약품','ဆေးဝါး','5100','fixed'),
  ('5114','Hospitality','접대비','ဧည့်ခံစရိတ်','5100','fixed'),
  ('5201','Water Meter','수도요금','ရေမီတာခ','5200','variable'),
  ('5202','Goods and Supplies','물품·소모품','ပစ္စည်းနှင့် အသုံးအဆောင်','5200','variable'),
  ('5203','Repairs','수리비','ပြုပြင်စရိတ်','5200','variable'),
  ('5204','Temporary Work','임시 인건비','ယာယီလုပ်အားခ','5200','variable'),
  ('5205','Snack Fee','간식비','မုန့်ဖိုး','5200','variable'),
  ('5206','Meetings','회의비','အစည်းအဝေးစရိတ်','5200','variable'),
  ('5207','Student Support','학생 지원','ကျောင်းသားထောက်ပံ့မှု','5200','variable'),
  ('5208','New Student Goods','신입생 물품','ကျောင်းသားသစ်ပစ္စည်း','5200','variable'),
  ('5209','Books','도서 구입','စာအုပ်ဝယ်ယူမှု','5200','variable'),
  ('5210','Other Expenses','기타 지출','အခြားအသုံးစရိတ်','5200','variable'),
  ('5211','Transportation','교통비','သယ်ယူပို့ဆောင်ရေးစရိတ်','5200','variable'),
  ('5212','Academic Opening','학기 개강','ကျောင်းဖွင့်ကာလ','5200','variable'),
  ('5213','MRPST Company','MRPST Company','MRPST ကုမ္ပဏီ','5200','variable'),
  ('5214','Dawn638 Company','Dawn638 Company','Dawn638 ကုမ္ပဏီ','5200','variable'),
  ('5215','Tax','세금','အခွန်','5200','variable')
) as v(code,name_en,name_ko,name_my,parent_code,expense_nature)
on conflict (code) do update set
  name_en = excluded.name_en,
  name_ko = excluded.name_ko,
  name_my = excluded.name_my,
  parent_id = excluded.parent_id,
  expense_nature = excluded.expense_nature;
