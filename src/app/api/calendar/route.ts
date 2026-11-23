import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month") ?? "";
  if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Calendar unavailable" }, { status: 503 });
  }

  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const start = `${month}-01`;
  const end = `${month}-${lastDay}`;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.from("academic_calendar_events")
    .select("id,title,description,event_type,start_date,end_date,start_time,end_time,location,is_published")
    .eq("is_published", true)
    .lte("start_date", end)
    .or(`end_date.gte.${start},and(end_date.is.null,start_date.gte.${start})`)
    .order("start_date");

  if (error) return NextResponse.json({ error: "Calendar unavailable" }, { status: 502 });
  return NextResponse.json(data);
}
