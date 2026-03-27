// ===== 비유니드 앱 설정 =====
const LOGO_SRC = './logo.png';

// ===== SUPABASE =====
// ===== 관리자 이메일 목록 =====


const SUPA_URL = 'https://yofftztuejltroiivhjm.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZmZ0enR1ZWpsdHJvaWl2aGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1Nzk3ODUsImV4cCI6MjA5MDE1NTc4NX0.TvmDWrqwWhF5-RjAXtosa8JmS5b-aSfYl_tno0ego18';
const SAMPLE_PRODUCTS = [
  {brand:'HP',category:'데스크탑',name:'Pro Tower 280 G9',spec_summary:'CPU: Intel i3,i5,i7 14세대 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 350w~500w',base_price:1200000,feature:'',is_active:true},
  {brand:'HP',category:'데스크탑',name:'Pro Tower 400 G9',spec_summary:'CPU: Intel i3,i5,i7 14세대 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 350w~500w',base_price:1200000,feature:'',is_active:true},
  {brand:'HP',category:'데스크탑',name:'Elite Tower 800 G9',spec_summary:'CPU: Intel i5,i7,i9 14세대 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 550w',base_price:1200000,feature:'',is_active:true},
  {brand:'HP',category:'데스크탑',name:'ProDesk 4 G1i Tower',spec_summary:'CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 400w',base_price:1200000,feature:'',is_active:true},
  {brand:'HP',category:'데스크탑',name:'ProDesk 8 G1i Tower',spec_summary:'CPU: Intel Ultra 2, U5,U7,U9 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 500w',base_price:1200000,feature:'',is_active:true},
  {brand:'HP',category:'워크스테이션',name:'Z1 G1i Tower',spec_summary:'CPU: Intel Ultra 2, U5,U7,U9 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 500w',base_price:2500000,feature:'',is_active:true},
  {brand:'HP',category:'워크스테이션',name:'Z2 G1i Tower',spec_summary:'CPU: Intel Ultra 2, U5,U7,U9 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 500w~1200w',base_price:3000000,feature:'',is_active:true},
  {brand:'HP',category:'워크스테이션',name:'Z2 G9 Tower',spec_summary:'CPU: Intel i7,i9 14세대 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 500w~700w',base_price:3000000,feature:'',is_active:true},
  {brand:'HP',category:'워크스테이션',name:'Z4 G5 Tower',spec_summary:'CPU: Intel Xeon W3,W5,W7 / RAM: DDR5 ECC 16GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows 11 Pro 64 for Workstations / POWER: 525w~1125w',base_price:5000000,feature:'',is_active:true},
  {brand:'HP',category:'워크스테이션',name:'Z6 G5 Tower',spec_summary:'CPU: Intel Xeon W3,W5,W7 / RAM: DDR5 ECC 16GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows 11 Pro 64 for Workstations / POWER: 775w~1450w',base_price:7000000,feature:'',is_active:true},
  {brand:'HP',category:'워크스테이션',name:'Z8 G5 Tower',spec_summary:'CPU: Intel Xeon 4410Y~ / RAM: DDR5 ECC 16GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows 11 Pro 64 for Workstations / POWER: 1125w~1700w',base_price:12000000,feature:'',is_active:true},
  {brand:'HP',category:'워크스테이션',name:'Z8 Fury G5 Tower',spec_summary:'CPU: Intel Xeon W5,W7,W9 / RAM: DDR5 ECC 16GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows 11 Pro 64 for Workstations / POWER: 1125w~2250w',base_price:12000000,feature:'',is_active:true},
  {brand:'HP',category:'모바일워크스테이션',name:'ZBook 8 G1i 16',spec_summary:'크기: 14/16 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home',base_price:2800000,feature:'',is_active:true},
  {brand:'HP',category:'모바일워크스테이션',name:'ZBook X G1i 16',spec_summary:'크기: 14/16 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home',base_price:2800000,feature:'',is_active:true},
  {brand:'HP',category:'모바일워크스테이션',name:'ZBook Fury G1i 16',spec_summary:'크기: 14/16 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home',base_price:2800000,feature:'',is_active:true},
  {brand:'HP',category:'노트북',name:'ProBook 4 G1i',spec_summary:'크기: 14/16 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home',base_price:1500000,feature:'',is_active:true},
  {brand:'HP',category:'노트북',name:'ProBook 8 G1i',spec_summary:'크기: 14/16 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 16GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro&Home',base_price:1500000,feature:'',is_active:true},
  {brand:'HP',category:'노트북',name:'EliteBook X G1i',spec_summary:'크기: 14 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 16GB,32GB (On BD) / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro&Home',base_price:1500000,feature:'',is_active:true},
  {brand:'HP',category:'노트북',name:'EliteBook Ultra G1i AI',spec_summary:'크기: 14 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 16GB,32GB (On BD) / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro&Home',base_price:1500000,feature:'',is_active:true},
  {brand:'HP',category:'모니터',name:'324pe',spec_summary:'크기: 24 inch / 해상도: FHD / 1920*1080 / 패널: IPS / 밝기: 250nits / 연결단자: HDMI(1), DP(1), VGA(1)',base_price:350000,feature:'',is_active:true},
  {brand:'HP',category:'모니터',name:'524pf',spec_summary:'크기: 24 inch / 해상도: FHD / 1920*1080 / 패널: IPS / 밝기: 350nits / 연결단자: DP(1), HDMI(1)',base_price:350000,feature:'',is_active:true},
  {brand:'HP',category:'모니터',name:'327pf',spec_summary:'크기: 27 inch / 해상도: FHD / 1920*1080 / 패널: IPS / 밝기: 250nits / 연결단자: HDMI(1), DP(1), VGA(1)',base_price:350000,feature:'',is_active:true},
  {brand:'HP',category:'모니터',name:'327ph',spec_summary:'크기: 27 inch / 해상도: FHD / 1920*1080 / 패널: IPS / 밝기: 250nits / 연결단자: HDMI(1), DP(1), VGA(1)',base_price:350000,feature:'',is_active:true},
  {brand:'HP',category:'모니터',name:'527pq',spec_summary:'크기: 27 inch / 해상도: QHD / 2560*1440 / 패널: IPS / 밝기: 350nits / 연결단자: DP(1), HDMI(1)',base_price:350000,feature:'',is_active:true},
  {brand:'Samsung',category:'데스크탑',name:'DM501THA',spec_summary:'CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro / POWER: 500w',base_price:1300000,feature:'',is_active:true},
  {brand:'Samsung',category:'노트북',name:'NT751XHD',spec_summary:'크기: 15.6 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 16GB (On BD) / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro',base_price:1600000,feature:'',is_active:true},
  {brand:'Samsung',category:'노트북',name:'NT751XGK',spec_summary:'크기: 15.6 inch / CPU: Intel Ultra 1, U5,U7 / RAM: DDR5 16GB (On BD) / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro',base_price:1600000,feature:'',is_active:true},
  {brand:'Samsung',category:'노트북',name:'NT941XHA',spec_summary:'크기: 16 inch / CPU: Intel Ultra 2 - U5 / RAM: DDR5 16GB (On BD) / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro',base_price:1600000,feature:'',is_active:true},
  {brand:'Samsung',category:'노트북',name:'NT961XHA',spec_summary:'크기: 16 inch / CPU: Intel Ultra 2 - U5 / RAM: DDR5 16GB (On BD) / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro',base_price:1600000,feature:'',is_active:true},
  {brand:'Samsung',category:'모니터',name:'LS24D408GAKXKR',spec_summary:'크기: 24 inch / 해상도: FHD / 1920*1080 / 패널: IPS / 밝기: 250nits / 연결단자: HDMI(2), DP(1)',base_price:300000,feature:'',is_active:true},
  {brand:'Samsung',category:'모니터',name:'LS27D304GAKXKR',spec_summary:'크기: 27 inch / 해상도: FHD / 1920*1080 / 패널: IPS / 밝기: 250nits / 연결단자: HDMI(1), VGA(1)',base_price:300000,feature:'',is_active:true},
  {brand:'Lenovo',category:'데스크탑',name:'ThinkCentre neo 50t',spec_summary:'CPU: Intel Ultra 2, U3,U5,U7 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 200w~400w',base_price:1100000,feature:'',is_active:true},
  {brand:'Lenovo',category:'데스크탑',name:'ThinkCentre M70t',spec_summary:'CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 260w~400w',base_price:1100000,feature:'',is_active:true},
  {brand:'Lenovo',category:'데스크탑',name:'ThinkCentre M90t',spec_summary:'CPU: Intel Ultra 2, U5,U7,U9 / RAM: DDR5 16GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 310w~500w',base_price:1100000,feature:'',is_active:true},
  {brand:'Lenovo',category:'노트북',name:'ThinkPad E16 Gen 3',spec_summary:'크기: 14/16 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home',base_price:1400000,feature:'',is_active:true},
  {brand:'Lenovo',category:'노트북',name:'ThinkPad T16 Gen 4',spec_summary:'크기: 14/16 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 16GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro&Home',base_price:1400000,feature:'',is_active:true},
  {brand:'LG',category:'노트북',name:'15U55T-GAP50ML',spec_summary:'크기: 15.6 inch / CPU: Intel Ultra 2, U5 / RAM: DDR5 16GB / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro',base_price:1600000,feature:'',is_active:true},
  {brand:'LG',category:'노트북',name:'15Z90T-GAP5AL',spec_summary:'크기: 15.6 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 16GB (On BD) / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro',base_price:1600000,feature:'',is_active:true},
  {brand:'LG',category:'노트북',name:'15Z90T-GAP7HL',spec_summary:'크기: 15.6 inch / CPU: Intel Ultra 2 - U7 / RAM: DDR5 32GB (On BD) / SSD: NVMe DDS 512GB / VGA: 기본 내장그래픽 / OS: Windows11pro',base_price:1600000,feature:'',is_active:true},
  {brand:'LG',category:'모니터',name:'24BA450',spec_summary:'크기: 24 inch / 해상도: FHD / 1920*1080 / 패널: IPS / 밝기: 250nits / 연결단자: HDMI(2), DP(1)',base_price:280000,feature:'',is_active:true},
  {brand:'LG',category:'모니터',name:'27BA450',spec_summary:'크기: 27 inch / 해상도: FHD / 1920*1080 / 패널: IPS / 밝기: 250nits / 연결단자: HDMI(1), VGA(1)',base_price:280000,feature:'',is_active:true}
];
const RENTAL_SAMPLE_PRODUCTS = [
  {brand:'HP',category:'데스크탑',name:'Pro Tower 280 G9',spec:'CPU: Intel i3,i5,i7 14세대 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 350w~500w',daily_price:3000,monthly_price:60000,is_active:true},
  {brand:'HP',category:'데스크탑',name:'Pro Tower 400 G9',spec:'CPU: Intel i3,i5,i7 14세대 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 350w~500w',daily_price:3000,monthly_price:60000,is_active:true},
  {brand:'HP',category:'데스크탑',name:'Elite Tower 800 G9',spec:'CPU: Intel i5,i7,i9 14세대 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 550w',daily_price:3000,monthly_price:60000,is_active:true},
  {brand:'HP',category:'데스크탑',name:'ProDesk 4 G1i Tower',spec:'CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 400w',daily_price:3000,monthly_price:60000,is_active:true},
  {brand:'HP',category:'데스크탑',name:'ProDesk 8 G1i Tower',spec:'CPU: Intel Ultra 2, U5,U7,U9 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 500w',daily_price:3000,monthly_price:60000,is_active:true},
  {brand:'HP',category:'워크스테이션',name:'Z1 G1i Tower',spec:'CPU: Intel Ultra 2, U5,U7,U9 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 500w',daily_price:8000,monthly_price:160000,is_active:true},
  {brand:'HP',category:'워크스테이션',name:'Z2 G1i Tower',spec:'CPU: Intel Ultra 2, U5,U7,U9 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 500w~1200w',daily_price:8000,monthly_price:160000,is_active:true},
  {brand:'HP',category:'워크스테이션',name:'Z2 G9 Tower',spec:'CPU: Intel i7,i9 14세대 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 500w~700w',daily_price:8000,monthly_price:160000,is_active:true},
  {brand:'HP',category:'워크스테이션',name:'Z4 G5 Tower',spec:'CPU: Intel Xeon W3,W5,W7 / RAM: DDR5 ECC 16GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows 11 Pro 64 for Workstations / POWER: 525w~1125w',daily_price:8000,monthly_price:160000,is_active:true},
  {brand:'HP',category:'워크스테이션',name:'Z6 G5 Tower',spec:'CPU: Intel Xeon W3,W5,W7 / RAM: DDR5 ECC 16GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows 11 Pro 64 for Workstations / POWER: 775w~1450w',daily_price:8000,monthly_price:160000,is_active:true},
  {brand:'HP',category:'워크스테이션',name:'Z8 G5 Tower',spec:'CPU: Intel Xeon 4410Y~ / RAM: DDR5 ECC 16GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows 11 Pro 64 for Workstations / POWER: 1125w~1700w',daily_price:8000,monthly_price:160000,is_active:true},
  {brand:'HP',category:'워크스테이션',name:'Z8 Fury G5 Tower',spec:'CPU: Intel Xeon W5,W7,W9 / RAM: DDR5 ECC 16GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows 11 Pro 64 for Workstations / POWER: 1125w~2250w',daily_price:8000,monthly_price:160000,is_active:true},
  {brand:'HP',category:'모바일워크스테이션',name:'ZBook 8 G1i 16',spec:'크기: 14/16 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home',daily_price:7000,monthly_price:140000,is_active:true},
  {brand:'HP',category:'모바일워크스테이션',name:'ZBook X G1i 16',spec:'크기: 14/16 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home',daily_price:7000,monthly_price:140000,is_active:true},
  {brand:'HP',category:'모바일워크스테이션',name:'ZBook Fury G1i 16',spec:'크기: 14/16 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home',daily_price:7000,monthly_price:140000,is_active:true},
  {brand:'HP',category:'노트북',name:'ProBook 4 G1i',spec:'크기: 14/16 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home',daily_price:4000,monthly_price:80000,is_active:true},
  {brand:'HP',category:'노트북',name:'ProBook 8 G1i',spec:'크기: 14/16 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 16GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro&Home',daily_price:4000,monthly_price:80000,is_active:true},
  {brand:'HP',category:'노트북',name:'EliteBook X G1i',spec:'크기: 14 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 16GB,32GB (On BD) / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro&Home',daily_price:4000,monthly_price:80000,is_active:true},
  {brand:'HP',category:'노트북',name:'EliteBook Ultra G1i AI',spec:'크기: 14 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 16GB,32GB (On BD) / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro&Home',daily_price:4000,monthly_price:80000,is_active:true},
  {brand:'HP',category:'모니터',name:'324pe',spec:'크기: 24 inch / 해상도: FHD / 1920*1080 / 패널: IPS / 밝기: 250nits / 연결단자: HDMI(1), DP(1), VGA(1)',daily_price:1500,monthly_price:30000,is_active:true},
  {brand:'HP',category:'모니터',name:'524pf',spec:'크기: 24 inch / 해상도: FHD / 1920*1080 / 패널: IPS / 밝기: 350nits / 연결단자: DP(1), HDMI(1)',daily_price:1500,monthly_price:30000,is_active:true},
  {brand:'HP',category:'모니터',name:'327pf',spec:'크기: 27 inch / 해상도: FHD / 1920*1080 / 패널: IPS / 밝기: 250nits / 연결단자: HDMI(1), DP(1), VGA(1)',daily_price:1500,monthly_price:30000,is_active:true},
  {brand:'HP',category:'모니터',name:'327ph',spec:'크기: 27 inch / 해상도: FHD / 1920*1080 / 패널: IPS / 밝기: 250nits / 연결단자: HDMI(1), DP(1), VGA(1)',daily_price:1500,monthly_price:30000,is_active:true},
  {brand:'HP',category:'모니터',name:'527pq',spec:'크기: 27 inch / 해상도: QHD / 2560*1440 / 패널: IPS / 밝기: 350nits / 연결단자: DP(1), HDMI(1)',daily_price:1500,monthly_price:30000,is_active:true},
  {brand:'Samsung',category:'데스크탑',name:'DM501THA',spec:'CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro / POWER: 500w',daily_price:3000,monthly_price:60000,is_active:true},
  {brand:'Samsung',category:'노트북',name:'NT751XHD',spec:'크기: 15.6 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 16GB (On BD) / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro',daily_price:4000,monthly_price:80000,is_active:true},
  {brand:'Samsung',category:'노트북',name:'NT751XGK',spec:'크기: 15.6 inch / CPU: Intel Ultra 1, U5,U7 / RAM: DDR5 16GB (On BD) / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro',daily_price:4000,monthly_price:80000,is_active:true},
  {brand:'Samsung',category:'노트북',name:'NT941XHA',spec:'크기: 16 inch / CPU: Intel Ultra 2 - U5 / RAM: DDR5 16GB (On BD) / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro',daily_price:4000,monthly_price:80000,is_active:true},
  {brand:'Samsung',category:'노트북',name:'NT961XHA',spec:'크기: 16 inch / CPU: Intel Ultra 2 - U5 / RAM: DDR5 16GB (On BD) / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro',daily_price:4000,monthly_price:80000,is_active:true},
  {brand:'Samsung',category:'모니터',name:'LS24D408GAKXKR',spec:'크기: 24 inch / 해상도: FHD / 1920*1080 / 패널: IPS / 밝기: 250nits / 연결단자: HDMI(2), DP(1)',daily_price:1500,monthly_price:30000,is_active:true},
  {brand:'Samsung',category:'모니터',name:'LS27D304GAKXKR',spec:'크기: 27 inch / 해상도: FHD / 1920*1080 / 패널: IPS / 밝기: 250nits / 연결단자: HDMI(1), VGA(1)',daily_price:1500,monthly_price:30000,is_active:true},
  {brand:'Lenovo',category:'데스크탑',name:'ThinkCentre neo 50t',spec:'CPU: Intel Ultra 2, U3,U5,U7 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 200w~400w',daily_price:3000,monthly_price:60000,is_active:true},
  {brand:'Lenovo',category:'데스크탑',name:'ThinkCentre M70t',spec:'CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 260w~400w',daily_price:3000,monthly_price:60000,is_active:true},
  {brand:'Lenovo',category:'데스크탑',name:'ThinkCentre M90t',spec:'CPU: Intel Ultra 2, U5,U7,U9 / RAM: DDR5 16GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home / POWER: 310w~500w',daily_price:3000,monthly_price:60000,is_active:true},
  {brand:'Lenovo',category:'노트북',name:'ThinkPad E16 Gen 3',spec:'크기: 14/16 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 8GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 (추가가능) / OS: Windows11pro&Home',daily_price:4000,monthly_price:80000,is_active:true},
  {brand:'Lenovo',category:'노트북',name:'ThinkPad T16 Gen 4',spec:'크기: 14/16 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 16GB ~ / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro&Home',daily_price:4000,monthly_price:80000,is_active:true},
  {brand:'LG',category:'노트북',name:'15U55T-GAP50ML',spec:'크기: 15.6 inch / CPU: Intel Ultra 2, U5 / RAM: DDR5 16GB / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro',daily_price:4000,monthly_price:80000,is_active:true},
  {brand:'LG',category:'노트북',name:'15Z90T-GAP5AL',spec:'크기: 15.6 inch / CPU: Intel Ultra 2, U5,U7 / RAM: DDR5 16GB (On BD) / SSD: NVMe DDS 256GB~ / VGA: 기본 내장그래픽 / OS: Windows11pro',daily_price:4000,monthly_price:80000,is_active:true},
  {brand:'LG',category:'노트북',name:'15Z90T-GAP7HL',spec:'크기: 15.6 inch / CPU: Intel Ultra 2 - U7 / RAM: DDR5 32GB (On BD) / SSD: NVMe DDS 512GB / VGA: 기본 내장그래픽 / OS: Windows11pro',daily_price:4000,monthly_price:80000,is_active:true},
  {brand:'LG',category:'모니터',name:'24BA450',spec:'크기: 24 inch / 해상도: FHD / 1920*1080 / 패널: IPS / 밝기: 250nits / 연결단자: HDMI(2), DP(1)',daily_price:1500,monthly_price:30000,is_active:true},
  {brand:'LG',category:'모니터',name:'27BA450',spec:'크기: 27 inch / 해상도: FHD / 1920*1080 / 패널: IPS / 밝기: 250nits / 연결단자: HDMI(1), VGA(1)',daily_price:1500,monthly_price:30000,is_active:true}
];

// ===== 유틸리티 함수 =====

// ===== 공통/인증/UI 함수 =====

function fmt(n) { return Math.round(n || 0).toLocaleString('ko-KR'); }

// ===== Supabase 클라이언트 초기화 =====
const db = supabase.createClient(SUPA_URL, SUPA_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
});
let appInitialized = false; // 중복 showApp 방지

// ===== 앱 시작: 기존 세션 확인 =====
window.addEventListener('DOMContentLoaded', async () => {
  // 공유 링크 파라미터 먼저 체크 → 있으면 로그인 없이 바로 견적 표시
  if (await checkShareParam()) return;

  // ── onAuthStateChange 를 먼저 등록 ──────────────────────────────
  // Supabase는 세션 복원 시 INITIAL_SESSION, 로그인 시 SIGNED_IN 이벤트를 발생시킴.
  // getSession()만 쓰면 세션 복원 타이밍에 따라 null이 반환돼 흰 화면이 생기므로
  // 이벤트 기반으로 처리하는 것이 더 안정적임.
  db.auth.onAuthStateChange(async (event, session) => {
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
      if (session && !appInitialized) {
        appInitialized = true;
        await showApp(session.user.email);
      } else if (!session && event === 'INITIAL_SESSION') {
        showLoginScreen();
      }
    }
    if (event === 'SIGNED_OUT') {
      appInitialized = false;
      showLoginScreen();
    }
    if (event === 'TOKEN_REFRESHED' && session) {
      const el = document.getElementById('user-email-display');
      if (el) el.textContent = session.user.email;
    }
  });

  // ── getSession() 으로 이미 세션이 있으면 즉시 표시 (빠른 경로) ──
  try {
    const { data: { session } } = await db.auth.getSession();
    if (session && !appInitialized) {
      appInitialized = true;
      await showApp(session.user.email);
    }
  } catch(e) {
    // getSession 실패 시 onAuthStateChange 이벤트로 처리됨
  }
});

// ===== 초기화 (하위 호환) =====

// ===== 공유 링크 뷰 처리 =====
async function checkShareParam() {
  const params = new URLSearchParams(location.search);
  const shareToken = params.get('share');
  const type = params.get('type') || 'buy';
  if (!shareToken) return false;
  
  // 로그인/앱 화면 숨기고 공유 뷰 표시
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'none';
  
  // 공유 뷰 컨테이너 생성
  let shareDiv = document.getElementById('share-view');
  if (!shareDiv) {
    shareDiv = document.createElement('div');
    shareDiv.id = 'share-view';
    shareDiv.style.cssText = 'min-height:100vh;background:#f0f4ff;display:flex;align-items:center;justify-content:center;padding:20px;';
    document.body.appendChild(shareDiv);
  }
  shareDiv.innerHTML = '<div style="background:#fff;border-radius:12px;padding:32px;max-width:600px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(27,58,107,.12);"><div style="font-size:36px;margin-bottom:12px;">📄</div><h2 style="color:#1B3A6B;margin-bottom:8px;">견적서 불러오는 중...</h2><p style="color:#64748b;font-size:14px;">잠시만 기다려주세요.</p></div>';
  
  try {
    const table = type === 'rental' ? 'rental_quotes' : 'quotes';
    const { data, error } = await db.from(table).select('*').eq('share_token', shareToken).single();
    
    if (error || !data) {
      shareDiv.innerHTML = '<div style="background:#fff;border-radius:12px;padding:32px;max-width:600px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(27,58,107,.12);"><div style="font-size:36px;margin-bottom:12px;">❌</div><h2 style="color:#ef4444;margin-bottom:8px;">견적서를 찾을 수 없습니다</h2><p style="color:#64748b;font-size:14px;">링크가 만료되었거나 존재하지 않는 견적서입니다.</p></div>';
      return true;
    }
    
    // 견적 데이터 표시
    const items = data.items || [];
    const sub = items.reduce((s,i)=>s+(i.total_price||0),0);
    const discAmt = data.discount_amt || 0;
    const supply = sub - discAmt;
    const vat = Math.round(supply * 0.1);
    const total = supply + vat;
    const today = new Date(data.created_at).toLocaleDateString('ko-KR');
    const typeLabel = type === 'rental' ? '렌탈 견적서' : '구매 견적서';
    const thColor = type === 'rental' ? '#1565c0' : '#1B3A6B';
    
    const itemsHtml = items.map((it,idx)=>`
      <tr>
        <td style="text-align:center;color:#64748b;font-size:11px;">${idx+1}</td>
        <td style="font-size:10.5px;font-weight:700;color:${thColor};">${it.brand||''}</td>
        <td style="font-weight:700;">${it.product_name||it.name||''}</td>
        <td style="text-align:right;white-space:nowrap;">${fmt(it.unit_price||0)}원</td>
        <td style="text-align:center;">${it.qty||it.quantity||1}</td>
        <td style="text-align:right;font-weight:700;color:${thColor};">${fmt(it.total_price||0)}원</td>
      </tr>`).join('');
    
    // 추가 데이터 추출
    const svCompany = data.company_name || '';
    const svContact = data.contact_name || '';
    const svPhone = data.contact_tel || '';
    const svEmail = data.contact_email || '';
    const svSalesName = data.sales_name || '';
    const svSalesPhone = data.sales_phone || '031.8028.0464';
    const svSalesEmail = data.sales_email || 'sales@buneed.co.kr';
    const svDelivery = data.delivery_date || '';
    const svValidity = data.valid_until || '견적일로부터 30일';
    const svMemo = data.memo || '';
    // 수신=연파랑, 공급=진파랑
    const susinColor = '#0E76BB';
    const gonggeupColor = '#1B3A6B';

    shareDiv.innerHTML = `
    <style>
      .sv-wrap{background:#fff;border-radius:12px;padding:24px 28px;max-width:860px;width:100%;box-shadow:0 4px 24px rgba(27,58,107,.12);}
      .sv-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;border-bottom:2px solid ${thColor};padding-bottom:12px;}
      .sv-title{color:${thColor};font-size:22px;font-weight:800;margin:0 0 4px 0;}
      .sv-meta{font-size:11px;color:#64748b;}
      .sv-co{text-align:right;font-size:11px;color:#64748b;}
      .sv-party-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}
      .sv-party-box{border:1px solid #b8cde8;border-radius:8px;overflow:hidden;}
      .sv-party-hd{padding:7px 14px;display:flex;align-items:center;}
      .sv-party-hd span{font-size:12px;font-weight:700;color:#fff;letter-spacing:0.1em;}
      .sv-party-body{background:#fff;padding:10px 12px;}
      .sv-party-body table{font-size:12px;width:100%;border-collapse:collapse;}
      .sv-party-body td{color:#64748b;padding:3px 0;font-size:11px;}
      .sv-party-body td:last-child{color:#1e293b;font-weight:600;}
      .sv-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}
      .sv-info-box{border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;}
      .sv-info-hd{background:#f1f5f9;padding:5px 10px;font-size:11px;font-weight:700;color:#1B3A6B;}
      .sv-info-body{padding:8px 12px;background:#fff;font-size:12px;min-height:40px;}
      .sv-info-row{display:flex;align-items:center;gap:8px;margin-bottom:4px;}
      .sv-info-lbl{font-size:11px;color:#64748b;min-width:72px;}
      .sv-info-val{font-size:12px;font-weight:600;color:#1e293b;}
      .sv-tbl-wrap{overflow-x:auto;margin-bottom:14px;}
      .sv-tbl{width:100%;border-collapse:collapse;font-size:12px;min-width:480px;}
      .sv-tbl th{background:${thColor};color:#fff;padding:8px 8px;font-weight:700;text-align:left;}
      .sv-tbl td{padding:7px 8px;border-bottom:1px solid #e8edf5;vertical-align:middle;}
      .sv-summary{display:flex;justify-content:flex-end;}
      .sv-sum-tbl{width:100%;max-width:280px;font-size:12px;border-collapse:collapse;}
      .sv-sum-tbl td{padding:5px 6px;}
      .sv-sum-tbl td:last-child{text-align:right;}
      .sv-sum-total td{font-weight:800;font-size:14px;color:${thColor};border-top:2px solid ${thColor};padding-top:8px;}
      .sv-footer{margin-top:16px;text-align:center;border-top:1px solid #e2e8f0;padding-top:10px;font-size:10px;color:#94a3b8;line-height:1.7;}
      @media(max-width:600px){
        .sv-wrap{padding:14px 12px;border-radius:0;}
        .sv-party-grid{grid-template-columns:1fr;}
        .sv-info-grid{grid-template-columns:1fr;}
        .sv-title{font-size:18px;}
        .sv-header{flex-direction:column;gap:6px;}
        .sv-co{text-align:left;}
        .sv-tbl{min-width:360px;}
      }
    </style>
    <div class="sv-wrap">
      <div class="sv-header">
        <div>
          <div class="sv-title">${typeLabel}</div>
          <div class="sv-meta">견적번호: ${data.quote_number||'-'} | 작성일: ${today}</div>
        </div>
        <div class="sv-co" style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;"><img src="${LOGO_SRC}" style="height:48px;"><a href="https://buneed-estimate.vercel.app/Buneed.pdf" target="_blank" style="display:inline-block;padding:2px 10px;border:1.5px solid #1B3A6B;border-radius:99px;font-size:10px;color:#1B3A6B;font-weight:600;text-decoration:none;background:#fff;">회사소개서</a></div>
      </div>
      <div class="sv-party-grid">
        <div class="sv-party-box">
          <div class="sv-party-hd" style="background:${susinColor};">
            <span>수 신</span>
          </div>
          <div class="sv-party-body">
            <table>
              <tr><td>업체명</td><td style="font-weight:700;color:#1e293b;">${svCompany||'-'}</td></tr>
              <tr><td>담당자</td><td>${svContact||'-'}</td></tr>
              <tr><td>연락처</td><td>${svPhone||'-'}</td></tr>
              <tr><td>이메일</td><td>${svEmail||'-'}</td></tr>
            </table>
          </div>
        </div>
        <div class="sv-party-box">
          <div class="sv-party-hd" style="background:${gonggeupColor};">
            <span>공 급</span>
          </div>
          <div class="sv-party-body">
            <table>
              <tr><td>업체명</td><td style="font-weight:700;color:#1e293b;">(주)비유니드</td></tr>
              <tr><td>담당자</td><td>${svSalesName||'-'}</td></tr>
              <tr><td>연락처</td><td>${svSalesPhone}</td></tr>
              <tr><td>이메일</td><td>${svSalesEmail}</td></tr>
            </table>
          </div>
        </div>
      </div>
      ${(svDelivery||svValidity||svMemo)?`
      <div class="sv-info-grid">
        <div class="sv-info-box">
          <div class="sv-info-hd">납품 / 유효 기간</div>
          <div class="sv-info-body">
            ${svDelivery?`<div class="sv-info-row"><span class="sv-info-lbl">납품희망일</span><span class="sv-info-val">${svDelivery}</span></div>`:''}
            <div class="sv-info-row"><span class="sv-info-lbl">견적유효기간</span><span class="sv-info-val">${svValidity}</span></div>
          </div>
        </div>
        ${svMemo?`<div class="sv-info-box">
          <div class="sv-info-hd">특이사항</div>
          <div class="sv-info-body" style="color:#374151;line-height:1.6;">${svMemo}</div>
        </div>`:'<div></div>'}
      </div>`:''}
      <div class="sv-tbl-wrap">
        <table class="sv-tbl">
          <thead><tr>
            <th style="text-align:center;width:28px;">No</th>
            <th style="text-align:center;width:70px;">브랜드</th>
            <th style="text-align:left;">제품명</th>
            <th style="text-align:right;white-space:nowrap;width:90px;">단가</th>
            <th style="text-align:center;width:40px;">수량</th>
            <th style="text-align:right;white-space:nowrap;width:90px;">금액</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>
      <div class="sv-summary">
        <table class="sv-sum-tbl">
          ${discAmt>0?`<tr><td style="color:#ef4444;">할인</td><td style="color:#ef4444;">- ${fmt(discAmt)} 원</td></tr>`:''}
          <tr><td style="color:#64748b;">공급가액</td><td style="font-weight:600;">${fmt(supply)} 원</td></tr>
          <tr><td style="color:#64748b;">부가세(10%)</td><td>${fmt(vat)} 원</td></tr>
          <tr class="sv-sum-total"><td>합 계</td><td>${fmt(total)} 원</td></tr>
        </table>
      </div>
      <div class="sv-footer">
        주식회사 비유니드 | 경기도 하남시 미사강변한강로 135 다동 4층 445호 | 031.8028.0464 | www.buneed.co.kr
      </div>
    </div>`;
  } catch(e) {
    shareDiv.innerHTML = '<div style="background:#fff;border-radius:12px;padding:32px;max-width:600px;width:100%;text-align:center;"><div style="font-size:36px;">⚠️</div><h2 style="color:#f59e0b;">오류가 발생했습니다</h2><p style="color:#64748b;font-size:13px;">'+e.message+'</p></div>';
  }
  return true;
}
async function initApp() {
  // share 파라미터 체크 먼저
  if (await checkShareParam()) return;
  // 세션 체크는 DOMContentLoaded에서 처리
  try {
    const { data: { session } } = await db.auth.getSession();
    if (session) await showApp(session.user.email);
    else showLoginScreen();
  } catch(e) { showLoginScreen(); }
}


// ===== 로그인 =====
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pw    = document.getElementById('login-pw').value.trim();
  const btn   = document.getElementById('btn-login');
  const err   = document.getElementById('login-err');

  // 입력값 검증
  if (!email || !pw) {
    err.style.display = 'block';
    err.textContent   = '이메일과 비밀번호를 입력하세요.';
    return;
  }
  // db 연결 확인
  if (!db) {
    err.style.display = 'block';
    err.textContent   = '⚠️ 서버 연결 중입니다. 잠시 후 다시 시도해주세요.';
    return;
  }

  err.style.display   = 'none';
  btn.textContent     = '로그인 중...';
  btn.disabled        = true;

  try {
    const { data, error } = await db.auth.signInWithPassword({ email, password: pw });
    if (error) throw error;
    // SIGNED_IN 이벤트 대기 없이 직접 실행 → 흰 화면 없음
    if (!appInitialized) {
      appInitialized = true;
      await showApp(data.user.email);
    }
  } catch (e) {
    err.style.display = 'block';
    err.textContent   = e.message || '로그인 중 오류가 발생했습니다.';
  } finally {
    // 항상 버튼 복구 (로그인 성공 시 화면이 전환되므로 실질적으로 실패 시만 보임)
    btn.textContent = '로그인';
    btn.disabled    = false;
  }
}

// ===== 로그아웃 =====
async function doLogout() {
  await db.auth.signOut();
  showLoginScreen();
}

// ===== 화면 전환 =====
function showLoginScreen() {
  const loginScreen = document.getElementById('login-screen');
  const app = document.getElementById('app');
  if (loginScreen) {
    loginScreen.classList.remove('hidden');
    loginScreen.style.display = 'flex';
  }
  if (app) {
    app.classList.add('hidden');
    app.style.display = 'none';
  }
}

async function showApp(email) {
  const loginScreen = document.getElementById('login-screen');
  const app = document.getElementById('app');
  if (loginScreen) { loginScreen.style.display = 'none'; loginScreen.classList.add('hidden'); }
  if (app) app.style.display = 'flex';

  // 초기 패널: CSS 클래스만 사용 (inline style 제거해야 switchTopTab이 동작함)
  document.querySelectorAll('.top-panel').forEach(p => {
    p.style.display = '';
    p.classList.remove('active');
  });
  const initPanel = document.getElementById('panel-purchase');
  if (initPanel) {
    initPanel.style.display = '';
    initPanel.classList.add('active');
  }

  // 이메일 표시
  const emailEl = document.getElementById('user-email-display');
  if (emailEl) emailEl.textContent = email;

  // ── 관리자 권한 체크 ──────────────────────────────────────────
  // 로그인된 모든 사용자에게 관리자 기능 제공
  const adminTab  = document.getElementById('ttab-admin');
  const adminBadge = document.querySelector('.h-badge.admin-badge');
  if (adminTab)  { adminTab.style.display  = ''; }
  if (adminBadge){ adminBadge.style.display = 'inline-flex'; }
  // ─────────────────────────────────────────────────────────────

  // ── 1단계: 카탈로그 우선 로드 (사용자가 즉시 보는 영역) ──
  // loadAllData 내부의 loadProducts()가 완료되면 renderProducts() 자동 호출
  // rLoadRentalProducts() 완료 후 rRenderProductList() 수동 호출
  await Promise.allSettled([
    loadAllData(),
    rLoadRentalProducts()
  ]);
  try { rRenderProductList(); } catch(e) {}
  try { rInitQuoteNum(); } catch(e) {}
  try { initQuoteNum(); } catch(e) {}
  try { loadCompanySettings(); } catch(e) {}
  // 관리자 제품 목록: 이미 로드된 전역 변수 재사용 (DB 재조회 없음)
  try { renderAdminProducts(); } catch(e) { console.warn('renderAdminProducts 오류:', e); }
  try { rRenderAdminProducts(); } catch(e) { console.warn('rRenderAdminProducts 오류:', e); }

  // ── 2단계: 이력은 카탈로그 블로킹 없이 백그라운드 로드 ──
  // await 없이 실행 → 카탈로그가 먼저 표시된 후 이력이 채워짐
  Promise.allSettled([loadHistory(), rLoadHistory()]);
}


// ===== 탭 전환 =====

function switchSubTab(prefix, tab, el) {
  // prefix: 'p'(구매) or 'r'(렌탈)
  // tab: 'quote' or 'history'
  const panelId = prefix + '-sub-' + tab;

  // 같은 prefix의 sub-panel 모두 숨기기
  document.querySelectorAll('#panel-' + (prefix==='p'?'purchase':'rental') + ' .sub-panel').forEach(p => {
    p.style.display = '';
    p.classList.remove('active');
  });

  // 선택 패널 표시
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.style.display = '';
    panel.classList.add('active');
  }

  // 버튼 active 처리
  const parentTabs = el ? el.closest('.sub-tabs') : null;
  if (parentTabs) {
    parentTabs.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
  }
  if (el) el.classList.add('active');

  // 이력 탭으로 전환 시 데이터 새로고침
  if (tab === 'history') {
    if (prefix === 'p' && typeof loadHistory === 'function') loadHistory();
    if (prefix === 'r' && typeof rLoadHistory === 'function') rLoadHistory();
  }
}
function switchTopTab(tab, el) {
  // 모든 top-panel: inline style 제거 후 class 방식으로 숨기기
  document.querySelectorAll('.top-panel').forEach(p=>{
    p.style.display = '';  // inline style 완전 제거
    p.classList.remove('active');
  });
  // 선택된 panel 표시 (CSS .top-panel.active{display:flex} 적용됨)
  const panel = document.getElementById('panel-'+tab);
  if (panel) {
    panel.style.display = '';  // inline style 완전 제거
    panel.classList.add('active');
  }
  // h-nav-tab 활성화
  document.querySelectorAll('.h-nav-tab').forEach(t=>t.classList.remove('active'));
  const activeTab = document.getElementById('ttab-' + tab);
  if (activeTab) activeTab.classList.add('active');
  // 관리자 탭으로 전환 시 데이터 로드 (권한 있는 경우만)
  if (tab === 'admin') {
    try { if (typeof renderAdminProducts === 'function') renderAdminProducts(); } catch(e){}
    try { if (typeof rRenderAdminProducts === 'function') rRenderAdminProducts(); } catch(e){}
  }
}

function switchAdminTab(tab, el) {
  // 모든 admin-sub-panel 숨기기
  document.querySelectorAll('.admin-sub-panel').forEach(p => p.classList.remove('active'));
  // 선택된 패널 표시
  const panel = document.getElementById('admin-panel-' + tab);
  if (panel) panel.classList.add('active');
  // 탭 버튼 활성화
  document.querySelectorAll('.admin-sub-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
}
function showToast(msg, type='info') {
  const t = document.getElementById('toast');
  const el = document.createElement('div');
  el.className = 'toast-item '+type;
  el.textContent = msg;
  t.appendChild(el);
  setTimeout(()=>el.remove(), 5000);
}
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function loadCompanySettings() {
  try {
    const s = JSON.parse(localStorage.getItem('buneed_company_settings')||'{}');
    if (s.companyIntroLink) document.getElementById('company-intro-link').value = s.companyIntroLink;
  } catch(e) {}
}
function saveCompanySettings() {
  const s = { companyIntroLink: document.getElementById('company-intro-link').value };
  localStorage.setItem('buneed_company_settings', JSON.stringify(s));
  showToast('저장되었습니다', 'success');
}

function setRentalType(type, btn) {
  rCurrentType = type;
  document.getElementById('r-type-toggle').querySelectorAll('.rtt-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('r-duration-label').textContent = type==='일' ? '렌탈 기간 (일)' : '렌탈 기간 (개월)';
}


function copyRentalQuoteLink(token) {
  if (!token) { showToast('저장된 견적만 링크 복사가 가능합니다','error'); return; }
  const url = `${location.origin}${location.pathname}?share=${token}&type=rental`;
  navigator.clipboard.writeText(url).then(()=>showToast('링크가 복사되었습니다!','success')).catch(()=>showToast('복사 실패','error'));
}





// 로고 이미지 src 설정 (중복 base64 제거용)
document.addEventListener('DOMContentLoaded', function() {
  const loginLogo = document.getElementById('logo-login');
  const headerLogo = document.getElementById('logo-header');
  if (loginLogo) loginLogo.src = LOGO_SRC;
  if (headerLogo) headerLogo.src = LOGO_SRC;
});
