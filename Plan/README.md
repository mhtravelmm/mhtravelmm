# MH Travel — Plan Notes

ဒီ folder သည် MH Travel platform အတွက် လုပ်ဆောင်ပြီးသမျှ အလုပ်များ၊ ဆုံးဖြတ်ချက်များ၊ Backend schema နှင့် ဆက်လုပ်ရန်ကျန်သောအချက်များကို မှတ်တမ်းတင်ထားသော note folder ဖြစ်သည်။ Root-level `plan.md` သည် product roadmap ဖြစ်ပြီး `Plan/` folder သည် implementation worklog နှင့် technical handoff notes ဖြစ်သည်။

## Note files

- [`WORKLOG.md`](./WORKLOG.md) — UI pages၊ visual refinements၊ routes၊ authentication၊ Super Admin နှင့် Supabase schema အပါအဝင် ပြီးစီးထားသောအလုပ်များ။
- [`BACKEND-AUTH.md`](./BACKEND-AUTH.md) — Supabase Auth၊ `public.profiles` table၊ roles၊ RLS၊ username logic နှင့် Google/Facebook OAuth setup အခြေအနေ။

## Current implementation status

လက်ရှိ project သည် Vite + React + TypeScript + Tailwind ဖြင့် တည်ဆောက်ထားပြီး dark theme ကို အခြေခံထားသည်။ Burmese/English translation system၊ currency/theme hooks၊ shared listing cards နှင့် responsive mobile sidebar တို့ကို ဆက်လက်အသုံးပြုထားသည်။

Traveler Web နှင့် Admin Portal ကို သီးခြားခွဲထားသည်။ Traveler user များသည် website ၏ pages အားလုံးကို အသုံးပြုနိုင်ပြီး Super Admin သည် dedicated Admin Login နှင့် dashboard ကိုသာ အသုံးပြုသည်။

## Important current limitation

Frontend auth UI သည် local preview session store ကို အသုံးပြုနေသေးသည်။ Supabase `public.profiles` schema နှင့် RLS ကို တကယ်တည်ဆောက်ပြီးဖြစ်သော်လည်း Supabase Auth session၊ username lookup/login၊ Google OAuth နှင့် Facebook OAuth ကို production အဖြစ် ချိတ်ဆက်ရန် ဆက်လုပ်ရမည်။
